import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SYSTEM_PROMPT, type FoodData } from "./prompt.ts";
import { tryCascadeLookup } from "./cascade.ts";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("[process-food-ai] Request received", { method: req.method, url: req.url });

    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("[process-food-ai] Auth failed", { error: authError?.message });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Autenticación fallida. Por favor, cierra sesión e inicia nuevamente.",
          details: authError?.message || "User not found",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[process-food-ai] User OK", { userId: user.id });

    const { message, audioBase64, imageBase64, mimeType } = await req.json();

    // ─── Input validation ───────────────────────────────
    if (message && message.length > 5000) {
      return new Response(
        JSON.stringify({ success: false, error: "El mensaje es demasiado largo (máximo 5000 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/wav", "audio/mpeg", "audio/ogg", "audio/mp4"];
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (mimeType && !ALLOWED_AUDIO_TYPES.includes(mimeType) && !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return new Response(
        JSON.stringify({ success: false, error: `Tipo de archivo no permitido: ${mimeType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAX_BASE64_SIZE = 10 * 1024 * 1024;
    if (audioBase64 && audioBase64.length > MAX_BASE64_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: "El archivo de audio es demasiado grande (máximo 10MB)" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (imageBase64 && imageBase64.length > MAX_BASE64_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: "La imagen es demasiado grande (máximo 10MB)" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!message && !audioBase64 && !imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "message, audioBase64, or imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── CASCADE: Try cached/API data (text-only) ───────
    if (message && !audioBase64 && !imageBase64) {
      try {
        console.log("[process-food-ai] CASCADE: Attempting lookup");
        const cascade = await tryCascadeLookup(message, authHeader);

        if (cascade.hit && cascade.foodData) {
          const fd = cascade.foodData;
          const { data, error } = await supabaseClient
            .from("food_logs")
            .insert({
              user_id: user.id,
              food_name: fd.food_name,
              quantity_g: fd.quantity_g || null,
              reply_text: fd.reply_text || null,
              calories: fd.calories || 0,
              protein_g: fd.protein_g || 0,
              carbs_g: fd.carbs_g || 0,
              fat_g: fd.fat_g || 0,
              water_ml: fd.water_ml || 0,
              leucine_g: fd.leucine_g || 0,
              sodium_mg: fd.sodium_mg || 0,
              choline_mg: fd.choline_mg || 0,
              zinc_mg: fd.zinc_mg || 0,
              magnesium_mg: fd.magnesium_mg || 0,
              vit_d3_iu: fd.vit_d3_iu || 0,
              omega_3_total_g: fd.omega_3_total_g || 0,
              polyphenols_total_mg: fd.polyphenols_total_mg || 0,
              nutritional_matrix: fd.nutritional_matrix,
              logged_at: new Date(),
            })
            .select()
            .single();

          if (!error) {
            console.log("[process-food-ai] CASCADE: Logged via", cascade.source);
            return new Response(
              JSON.stringify({
                success: true,
                data,
                source: cascade.source,
                confidence: cascade.confidence,
                message: `Food logged via ${cascade.source} (cascade). Gemini full analysis skipped.`,
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          console.error("[process-food-ai] CASCADE insert error:", error.message);
        }
      } catch (cascadeErr) {
        console.warn("[process-food-ai] CASCADE error (non-fatal):", cascadeErr);
      }
    }

    // ─── FULL GEMINI ANALYSIS (fallback / image / audio) ─
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[process-food-ai] Calling Gemini full analysis");

    const parts: any[] = [];
    if (message) {
      parts.push({ text: `${SYSTEM_PROMPT}\n\nINPUT DEL USUARIO: "${message}"` });
    } else if (audioBase64) {
      parts.push({ text: `${SYSTEM_PROMPT}\n\nINPUT DEL USUARIO: [Audio describiendo alimentos consumidos]` });
    } else if (imageBase64) {
      parts.push({ text: `${SYSTEM_PROMPT}\n\nINPUT DEL USUARIO: [Imagen de alimentos]` });
    }

    if (audioBase64) {
      parts.push({ inlineData: { mimeType: mimeType || "audio/webm", data: audioBase64 } });
    }
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[process-food-ai] Gemini error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Gemini API error: ${geminiResponse.status}`, details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(
        JSON.stringify({ success: false, error: "Gemini returned no response", geminiData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found in Gemini response");

    const parsed = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
    const fd = parsed.food_data;
    if (!fd || !fd.food_name) throw new Error("Invalid response structure from Gemini");

    const g1 = fd.group_1_motor || {};
    const g2 = fd.group_2_cognitive || {};
    const g3 = fd.group_3_hormonal || {};
    const g4 = fd.group_4_inflammation || {};
    const val = (v: any) => Number(v) || 0;

    const foodData: FoodData = {
      food_name: fd.food_name,
      quantity_g: fd.quantity_g,
      reply_text: parsed.reply_text,
      calories: val(g1.calories),
      protein_g: val(g1.protein_g),
      carbs_g: val(g1.carbs_g),
      fat_g: val(g1.fat_g),
      water_ml: val(g1.water_ml),
      sodium_mg: val(g1.electrolytes?.sodium_mg),
      leucine_g: val(g1.aminos_muscle?.leucine_mg) / 1000,
      choline_mg: val(g2.neuro_others?.choline_mg),
      zinc_mg: val(g3.thyroid_insulin?.zinc_mg) || val(g1.structure_minerals?.zinc_mg),
      magnesium_mg: val(g3.thyroid_insulin?.magnesium_mg) || val(g1.structure_minerals?.magnesium_mg),
      vit_d3_iu: val(g3.liposolubles?.vit_d3_iu),
      omega_3_total_g: val(g4.omega?.omega_3_total_mg) / 1000,
      polyphenols_total_mg: val(g4.bioactives?.polyphenols_total_mg),
      nutritional_matrix: { motor: g1, cognitive: g2, hormonal: g3, inflammation: g4 },
    };

    const { data, error } = await supabaseClient
      .from("food_logs")
      .insert({
        user_id: user.id,
        food_name: foodData.food_name,
        quantity_g: foodData.quantity_g || null,
        reply_text: foodData.reply_text || null,
        calories: foodData.calories || 0,
        protein_g: foodData.protein_g || 0,
        carbs_g: foodData.carbs_g || 0,
        fat_g: foodData.fat_g || 0,
        water_ml: foodData.water_ml || 0,
        leucine_g: foodData.leucine_g || 0,
        sodium_mg: foodData.sodium_mg || 0,
        choline_mg: foodData.choline_mg || 0,
        zinc_mg: foodData.zinc_mg || 0,
        magnesium_mg: foodData.magnesium_mg || 0,
        vit_d3_iu: foodData.vit_d3_iu || 0,
        omega_3_total_g: foodData.omega_3_total_g || 0,
        polyphenols_total_mg: foodData.polyphenols_total_mg || 0,
        nutritional_matrix: foodData.nutritional_matrix,
        logged_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error("[process-food-ai] DB insert error", { error: error.message });
      throw error;
    }

    console.log("[process-food-ai] Logged via Gemini full:", data?.food_name);

    return new Response(
      JSON.stringify({ success: true, data, message: "Food logged successfully with hybrid schema (VIP + JSONB)" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
