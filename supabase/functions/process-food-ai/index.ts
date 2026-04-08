import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

const SYSTEM_PROMPT = `Eres un Motor de Cálculo Nutricional de Precisión Biohacker.

TU OBJETIVO: Analizar el texto del usuario sobre alimentos consumidos y extraer data bioquímica precisa organizada en 4 grupos funcionales.

REGLAS CRÍTICAS:
1. INFERENCIA INTELIGENTE: Si no hay peso explícito, usa porciones estándar. Estima micros basándote en la composición típica del alimento.
2. UNIDADES EXACTAS:
   - Macros en gramos (g)
   - Micros en miligramos (mg) o microgramos (mcg)
   - Vitaminas liposolubles en IU
   - Agua en mililitros (ml)
3. CALIDAD DE DATOS: Prioriza precisión sobre completitud. Si no conoces un valor con certeza, usa 0.

LOS 4 GRUPOS FUNCIONALES BIOQUÍMICOS:

GRUPO 1 - MOTOR (Energía, Rendimiento Físico, Anabolismo):
- Macros: calorías, proteína, carbohidratos, grasas, fibra, azúcares
- Hidratación: agua
- Electrolitos: sodio, potasio, cloruro
- Aminoácidos Estructurales: leucina, isoleucina, valina, lisina, metionina, treonina

GRUPO 2 - COGNITIVO (Neurotransmisores, Energía Mental, Memoria):
- Aminoácidos Neuro: triptófano, fenilalanina, tirosina, histidina
- Neuronutrientes: taurina, colina, creatina
- Vitaminas B (Energía): B1 (tiamina), B2 (riboflavina), B3 (niacina), B5 (pantoténico), B6, B7 (biotina), B9 (folato), B12
- Vitamina C

GRUPO 3 - HORMONAL (Testosterona, Insulina, Tiroides, Estructura Ósea):
- Tiroides/Insulina: zinc, magnesio, selenio, cromo, yodo, manganeso
- Vitaminas Liposolubles: A, D3, E, K1, K2
- Estructura Ósea: calcio, fósforo, cobre, hierro

GRUPO 4 - INFLAMACIÓN (Balance Omega, Antioxidantes):
- Perfil Lipídico: grasas saturadas, monoinsaturadas, poliinsaturadas, omega-3 total, omega-6, grasas trans, colesterol
- Antiinflamatorios: EPA, DHA, ALA, vitamina E
- Bioactivos: polifenoles, antocianinas, quercetina, resveratrol, curcumina

FORMATO JSON DE RESPUESTA OBLIGATORIO:
{
  "reply_text": "Resumen breve y motivador para el usuario (1-2 frases)",
  "food_data": {
    "food_name": "Nombre descriptivo del alimento",
    "quantity_g": 0,
    "group_1_motor": {
      "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "sugar_g": 0, "water_ml": 0,
      "electrolytes": { "sodium_mg": 0, "potassium_mg": 0, "chloride_mg": 0 },
      "aminos_muscle": { "leucine_mg": 0, "isoleucine_mg": 0, "valine_mg": 0, "lysine_mg": 0, "methionine_mg": 0, "threonine_mg": 0 },
      "structure_minerals": { "iron_mg": 0, "zinc_mg": 0, "magnesium_mg": 0 }
    },
    "group_2_cognitive": {
      "aminos_brain": { "tryptophan_mg": 0, "phenylalanine_mg": 0, "tyrosine_mg": 0, "histidine_mg": 0 },
      "neuro_others": { "taurine_mg": 0, "choline_mg": 0, "creatine_mg": 0 },
      "energy_vitamins": { "vit_b1_thiamin_mg": 0, "vit_b2_riboflavin_mg": 0, "vit_b3_niacin_mg": 0, "vit_b5_pantothenic_mg": 0, "vit_b6_mg": 0, "vit_b7_biotin_mcg": 0, "folate_mcg": 0, "vit_b12_mcg": 0, "vit_c_mg": 0 },
      "trace_minerals": { "selenium_mcg": 0, "chromium_mcg": 0 },
      "electrolytes": { "sodium_mg": 0, "potassium_mg": 0 }
    },
    "group_3_hormonal": {
      "thyroid_insulin": { "zinc_mg": 0, "magnesium_mg": 0, "selenium_mcg": 0, "chromium_mcg": 0, "iodine_mcg": 0, "manganese_mg": 0 },
      "liposolubles": { "vit_a_mcg": 0, "vit_d3_iu": 0, "vit_e_iu": 0, "vit_k1_mcg": 0, "vit_k2_mcg": 0 },
      "structure": { "calcium_mg": 0, "phosphorus_mg": 0, "copper_mg": 0, "iron_mg": 0 }
    },
    "group_4_inflammation": {
      "omega": { "omega_3_total_mg": 0, "epa_dha_mg": 0, "omega_6_mg": 0 },
      "sat_fats": { "saturated_g": 0, "monounsaturated_g": 0, "polyunsaturated_g": 0, "trans_fat_g": 0, "cholesterol_mg": 0 },
      "bioactives": { "polyphenols_total_mg": 0, "anthocyanins_mg": 0, "quercetin_mg": 0, "resveratrol_mg": 0, "curcumin_mg": 0 }
    }
  }
}

IMPORTANTE: Devuelve SOLO el JSON limpio, sin markdown, sin backticks, sin explicaciones adicionales.`;

const IDENTIFY_PROMPT = `Eres un identificador de alimentos. El usuario describe lo que comió.
Extrae SOLO la identificación del alimento. Responde ÚNICAMENTE con JSON:
{
  "food_name_es": "nombre en español (singular, genérico)",
  "food_name_en": "English name (singular, generic, for USDA database)",
  "quantity_g": número estimado en gramos,
  "cooking_method": "raw/cooked/fried/baked/boiled/steamed/none",
  "is_complex_dish": false
}
Reglas:
- Si es un plato compuesto (ej: "cazuela", "pastel de choclo"), pon is_complex_dish: true
- Si no hay cantidad explícita, estima por porción estándar
- Responde SOLO JSON, sin backticks ni explicaciones`;

interface FoodData {
  food_name: string;
  quantity_g?: number;
  reply_text?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  water_ml?: number;
  leucine_g?: number;
  sodium_mg?: number;
  choline_mg?: number;
  zinc_mg?: number;
  magnesium_mg?: number;
  vit_d3_iu?: number;
  omega_3_total_g?: number;
  polyphenols_total_mg?: number;
  nutritional_matrix?: {
    motor?: any;
    cognitive?: any;
    hormonal?: any;
    inflammation?: any;
  };
}

async function tryCascadeLookup(
  message: string,
  authHeader: string | null,
  geminiKey: string
): Promise<{ hit: boolean; foodData?: FoodData; source?: string; confidence?: number }> {
  try {
    const identifyResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${IDENTIFY_PROMPT}\n\nINPUT: "${message}"` }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.1 },
        }),
      }
    );
    if (!identifyResp.ok) return { hit: false };

    const identifyData = await identifyResp.json();
    const identifyText = identifyData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const idStart = identifyText.indexOf("{");
    const idEnd = identifyText.lastIndexOf("}");
    if (idStart === -1 || idEnd === -1) return { hit: false };

    const identified = JSON.parse(identifyText.substring(idStart, idEnd + 1));
    console.log("[cascade] Identified:", identified);

    if (identified.is_complex_dish || !identified.food_name_en) return { hit: false };

    const lookupResp = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/nutrition-lookup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader || "",
          apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
        },
        body: JSON.stringify({
          food_name_es: identified.food_name_es,
          food_name_en: identified.food_name_en,
          quantity_g: identified.quantity_g || 100,
        }),
      }
    );
    if (!lookupResp.ok) return { hit: false };

    const lookupData = await lookupResp.json();
    if (!lookupData.success || lookupData.source === "none") return { hit: false };

    console.log("[cascade] HIT from:", lookupData.source, "confidence:", lookupData.confidence);
    const s = lookupData.scaled;
    const v = (val: any) => Number(val) || 0;
    const srcLabel = lookupData.source === "usda" ? "USDA" : lookupData.source === "openfoodfacts" ? "OpenFoodFacts" : lookupData.original_source || lookupData.source;

    return {
      hit: true,
      source: lookupData.source,
      confidence: lookupData.confidence,
      foodData: {
        food_name: identified.food_name_es || lookupData.food_name,
        quantity_g: identified.quantity_g || lookupData.quantity_g,
        reply_text: `✅ ${identified.food_name_es} registrado (${lookupData.quantity_g}g) — Datos verificados de ${srcLabel} (confianza: ${Math.round((lookupData.confidence || 0.8) * 100)}%)`,
        calories: v(s.calories), protein_g: v(s.protein_g), carbs_g: v(s.carbs_g), fat_g: v(s.fat_g),
        water_ml: v(s.water_ml), sodium_mg: v(s.sodium_mg), leucine_g: v(s.leucine_mg) / 1000,
        choline_mg: v(s.choline_mg), zinc_mg: v(s.zinc_mg), magnesium_mg: v(s.magnesium_mg), vit_d3_iu: v(s.vit_d3_iu),
        omega_3_total_g: (v(s.epa_mg) + v(s.dha_mg) + v(s.ala_mg)) / 1000,
        polyphenols_total_mg: v(s.polyphenols_total_mg),
        nutritional_matrix: lookupData.nutritional_matrix,
      },
    };
  } catch (err) {
    console.warn("[cascade] Error (non-fatal):", err);
    return { hit: false };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("[process-food-ai] Request received");

    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("[process-food-ai] Auth failed:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Autenticación fallida. Por favor, cierra sesión e inicia nuevamente.", details: authError?.message || "User not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[process-food-ai] User OK:", user.id);

    const { message, audioBase64, imageBase64, mimeType } = await req.json();

    if (message && message.length > 5000) {
      return new Response(JSON.stringify({ success: false, error: "El mensaje es demasiado largo (máximo 5000 caracteres)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const ALLOWED_AUDIO_TYPES = ["audio/webm", "audio/wav", "audio/mpeg", "audio/ogg", "audio/mp4"];
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (mimeType && !ALLOWED_AUDIO_TYPES.includes(mimeType) && !ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return new Response(JSON.stringify({ success: false, error: `Tipo de archivo no permitido: ${mimeType}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const MAX_BASE64_SIZE = 10 * 1024 * 1024;
    if (audioBase64 && audioBase64.length > MAX_BASE64_SIZE) {
      return new Response(JSON.stringify({ success: false, error: "El archivo de audio es demasiado grande (máximo 10MB)" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (imageBase64 && imageBase64.length > MAX_BASE64_SIZE) {
      return new Response(JSON.stringify({ success: false, error: "La imagen es demasiado grande (máximo 10MB)" }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!message && !audioBase64 && !imageBase64) {
      return new Response(JSON.stringify({ success: false, error: "message, audioBase64, or imageBase64 is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "GEMINI_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ─── CASCADE: texto sin imagen/audio ───────────────────
    if (message && !audioBase64 && !imageBase64) {
      const cascade = await tryCascadeLookup(message, authHeader, GEMINI_API_KEY);
      if (cascade.hit && cascade.foodData) {
        const fd = cascade.foodData;
        const { data, error } = await supabaseClient.from("food_logs").insert({
          user_id: user.id, food_name: fd.food_name, quantity_g: fd.quantity_g || null, reply_text: fd.reply_text || null,
          calories: fd.calories || 0, protein_g: fd.protein_g || 0, carbs_g: fd.carbs_g || 0, fat_g: fd.fat_g || 0,
          water_ml: fd.water_ml || 0, leucine_g: fd.leucine_g || 0, sodium_mg: fd.sodium_mg || 0, choline_mg: fd.choline_mg || 0,
          zinc_mg: fd.zinc_mg || 0, magnesium_mg: fd.magnesium_mg || 0, vit_d3_iu: fd.vit_d3_iu || 0,
          omega_3_total_g: fd.omega_3_total_g || 0, polyphenols_total_mg: fd.polyphenols_total_mg || 0,
          nutritional_matrix: fd.nutritional_matrix, logged_at: new Date(),
        }).select().single();
        if (!error) {
          return new Response(JSON.stringify({ success: true, data, source: cascade.source, confidence: cascade.confidence, message: `Food logged via ${cascade.source} (cascade).` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        console.error("[process-food-ai] CASCADE insert error:", error.message);
      }
    }

    // ─── GEMINI FULL ANALYSIS (fallback / image / audio) ──
    console.log("[process-food-ai] Calling Gemini full analysis");
    const parts: any[] = [];
    if (message) { parts.push({ text: `${SYSTEM_PROMPT}\n\nINPUT DEL USUARIO: "${message}"` }); }
    else if (audioBase64) { parts.push({ text: `${SYSTEM_PROMPT}\n\nINPUT DEL USUARIO: [Audio describiendo alimentos consumidos]` }); }
    else if (imageBase64) { parts.push({ text: `${SYSTEM_PROMPT}\n\nINPUT DEL USUARIO: [Imagen de alimentos]` }); }
    if (audioBase64) { parts.push({ inlineData: { mimeType: mimeType || "audio/webm", data: audioBase64 } }); }
    if (imageBase64) { parts.push({ inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } }); }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts }] }) }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return new Response(JSON.stringify({ success: false, error: `Gemini API error: ${geminiResponse.status}`, details: errorText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return new Response(JSON.stringify({ success: false, error: "Gemini returned no response" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      food_name: fd.food_name, quantity_g: fd.quantity_g, reply_text: parsed.reply_text,
      calories: val(g1.calories), protein_g: val(g1.protein_g), carbs_g: val(g1.carbs_g), fat_g: val(g1.fat_g),
      water_ml: val(g1.water_ml), sodium_mg: val(g1.electrolytes?.sodium_mg), leucine_g: val(g1.aminos_muscle?.leucine_mg) / 1000,
      choline_mg: val(g2.neuro_others?.choline_mg),
      zinc_mg: val(g3.thyroid_insulin?.zinc_mg) || val(g1.structure_minerals?.zinc_mg),
      magnesium_mg: val(g3.thyroid_insulin?.magnesium_mg) || val(g1.structure_minerals?.magnesium_mg),
      vit_d3_iu: val(g3.liposolubles?.vit_d3_iu),
      omega_3_total_g: val(g4.omega?.omega_3_total_mg) / 1000,
      polyphenols_total_mg: val(g4.bioactives?.polyphenols_total_mg),
      nutritional_matrix: { motor: g1, cognitive: g2, hormonal: g3, inflammation: g4 },
    };

    const { data, error } = await supabaseClient.from("food_logs").insert({
      user_id: user.id, food_name: foodData.food_name, quantity_g: foodData.quantity_g || null, reply_text: foodData.reply_text || null,
      calories: foodData.calories || 0, protein_g: foodData.protein_g || 0, carbs_g: foodData.carbs_g || 0, fat_g: foodData.fat_g || 0,
      water_ml: foodData.water_ml || 0, leucine_g: foodData.leucine_g || 0, sodium_mg: foodData.sodium_mg || 0, choline_mg: foodData.choline_mg || 0,
      zinc_mg: foodData.zinc_mg || 0, magnesium_mg: foodData.magnesium_mg || 0, vit_d3_iu: foodData.vit_d3_iu || 0,
      omega_3_total_g: foodData.omega_3_total_g || 0, polyphenols_total_mg: foodData.polyphenols_total_mg || 0,
      nutritional_matrix: foodData.nutritional_matrix, logged_at: new Date(),
    }).select().single();

    if (error) { console.error("[process-food-ai] DB insert error:", error.message); throw error; }

    return new Response(JSON.stringify({ success: true, data, message: "Food logged successfully" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
