import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
      "calories": 0,
      "protein_g": 0,
      "carbs_g": 0,
      "fat_g": 0,
      "fiber_g": 0,
      "sugar_g": 0,
      "water_ml": 0,
      "electrolytes": {
        "sodium_mg": 0,
        "potassium_mg": 0,
        "chloride_mg": 0
      },
      "aminos_muscle": {
        "leucine_mg": 0,
        "isoleucine_mg": 0,
        "valine_mg": 0,
        "lysine_mg": 0,
        "methionine_mg": 0,
        "threonine_mg": 0
      },
      "structure_minerals": {
        "iron_mg": 0,
        "zinc_mg": 0,
        "magnesium_mg": 0
      }
    },
    "group_2_cognitive": {
      "aminos_brain": {
        "tryptophan_mg": 0,
        "phenylalanine_mg": 0,
        "tyrosine_mg": 0,
        "histidine_mg": 0
      },
      "neuro_others": {
        "taurine_mg": 0,
        "choline_mg": 0,
        "creatine_mg": 0
      },
      "energy_vitamins": {
        "vit_b1_thiamin_mg": 0,
        "vit_b2_riboflavin_mg": 0,
        "vit_b3_niacin_mg": 0,
        "vit_b5_pantothenic_mg": 0,
        "vit_b6_mg": 0,
        "vit_b7_biotin_mcg": 0,
        "folate_mcg": 0,
        "vit_b12_mcg": 0,
        "vit_c_mg": 0
      },
      "trace_minerals": {
        "selenium_mcg": 0,
        "chromium_mcg": 0
      },
      "electrolytes": {
        "sodium_mg": 0,
        "potassium_mg": 0
      }
    },
    "group_3_hormonal": {
      "thyroid_insulin": {
        "zinc_mg": 0,
        "magnesium_mg": 0,
        "selenium_mcg": 0,
        "chromium_mcg": 0,
        "iodine_mcg": 0,
        "manganese_mg": 0
      },
      "liposolubles": {
        "vit_a_mcg": 0,
        "vit_d3_iu": 0,
        "vit_e_iu": 0,
        "vit_k1_mcg": 0,
        "vit_k2_mcg": 0
      },
      "structure": {
        "calcium_mg": 0,
        "phosphorus_mg": 0,
        "copper_mg": 0,
        "iron_mg": 0
      }
    },
    "group_4_inflammation": {
      "omega": {
        "omega_3_total_mg": 0,
        "epa_dha_mg": 0,
        "omega_6_mg": 0
      },
      "sat_fats": {
        "saturated_g": 0,
        "monounsaturated_g": 0,
        "polyunsaturated_g": 0,
        "trans_fat_g": 0,
        "cholesterol_mg": 0
      },
      "bioactives": {
        "polyphenols_total_mg": 0,
        "anthocyanins_mg": 0,
        "quercetin_mg": 0,
        "resveratrol_mg": 0,
        "curcumin_mg": 0
      }
    }
  }
}

IMPORTANTE: Devuelve SOLO el JSON limpio, sin markdown, sin backticks, sin explicaciones adicionales.`;

interface FoodData {
  food_name: string;
  quantity_g?: number;
  reply_text?: string;

  // VIP Columns - MOTOR
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  water_ml?: number;
  leucine_g?: number;
  sodium_mg?: number;

  // VIP Columns - COGNITIVE
  choline_mg?: number;

  // VIP Columns - HORMONAL
  zinc_mg?: number;
  magnesium_mg?: number;
  vit_d3_iu?: number;

  // VIP Columns - INFLAMMATION
  omega_3_total_g?: number;
  polyphenols_total_mg?: number;

  // Optional: Complete nutritional matrix (new format)
  nutritional_matrix?: {
    motor?: any;
    cognitive?: any;
    hormonal?: any;
    inflammation?: any;
    other?: any;
  };

  // Optional timestamp
  logged_at?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("[process-food-ai] Request received", {
      method: req.method,
      url: req.url,
    });

    const authHeader = req.headers.get("Authorization");
    console.log("[process-food-ai] Auth header check", {
      hasAuth: !!authHeader,
      authPreview: authHeader ? authHeader.substring(0, 30) + "..." : "none"
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("[process-food-ai] Auth failed", {
        error: authError?.message,
        hasUser: !!user
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Autenticación fallida. Por favor, cierra sesión e inicia nuevamente.",
          details: authError?.message || "User not found"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[process-food-ai] User OK", {
      userId: user.id,
      email: user.email
    });

    const { message, audioBase64, imageBase64, mimeType } = await req.json();

    if (!message && !audioBase64 && !imageBase64) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "message, audioBase64, or imageBase64 is required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call Gemini API
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY not configured. Please set it in Supabase Dashboard > Edge Functions > Secrets"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[process-food-ai] Calling Gemini API", {
      hasMessage: !!message,
      hasAudio: !!audioBase64,
      hasImage: !!imageBase64,
      messagePreview: message ? message.substring(0, 50) + "..." : "N/A"
    });

    // Build parts array for multimodal input
    const parts: any[] = [];

    // Add text prompt
    if (message) {
      parts.push({ text: `${SYSTEM_PROMPT}\n\nINPUT DEL USUARIO: "${message}"` });
    } else if (audioBase64) {
      parts.push({ text: `${SYSTEM_PROMPT}\n\nINPUT DEL USUARIO: [Audio describiendo alimentos consumidos]` });
    } else if (imageBase64) {
      parts.push({ text: `${SYSTEM_PROMPT}\n\nINPUT DEL USUARIO: [Imagen de alimentos]` });
    }

    // Add audio if present
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audioBase64
        }
      });
    }

    // Add image if present
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64
        }
      });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts
          }]
        })
      }
    );

    console.log("[process-food-ai] Gemini API responded", {
      status: geminiResponse.status,
      ok: geminiResponse.ok
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[process-food-ai] Gemini API error:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Gemini API error: ${geminiResponse.status}`,
          details: errorText
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("Gemini returned empty response:", geminiData);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Gemini returned no response",
          geminiData
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clean and parse JSON
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON found in Gemini response");
    }

    const cleanJson = rawText.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(cleanJson);
    const fd = parsed.food_data;

    if (!fd || !fd.food_name) {
      throw new Error("Invalid response structure from Gemini");
    }

    // Extract groups
    const g1 = fd.group_1_motor || {};
    const g2 = fd.group_2_cognitive || {};
    const g3 = fd.group_3_hormonal || {};
    const g4 = fd.group_4_inflammation || {};

    // Helper to safely get numeric values
    const val = (v: any) => Number(v) || 0;

    // Prepare VIP columns
    const foodData: FoodData = {
      food_name: fd.food_name,
      quantity_g: fd.quantity_g,
      reply_text: parsed.reply_text,

      // MOTOR VIPs
      calories: val(g1.calories),
      protein_g: val(g1.protein_g),
      carbs_g: val(g1.carbs_g),
      fat_g: val(g1.fat_g),
      water_ml: val(g1.water_ml),
      sodium_mg: val(g1.electrolytes?.sodium_mg),
      leucine_g: val(g1.aminos_muscle?.leucine_mg) / 1000,

      // COGNITIVE VIPs
      choline_mg: val(g2.neuro_others?.choline_mg),

      // HORMONAL VIPs
      zinc_mg: val(g3.thyroid_insulin?.zinc_mg) || val(g1.structure_minerals?.zinc_mg),
      magnesium_mg: val(g3.thyroid_insulin?.magnesium_mg) || val(g1.structure_minerals?.magnesium_mg),
      vit_d3_iu: val(g3.liposolubles?.vit_d3_iu),

      // INFLAMMATION VIPs
      omega_3_total_g: val(g4.omega?.omega_3_total_mg) / 1000,
      polyphenols_total_mg: val(g4.bioactives?.polyphenols_total_mg),

      // Complete nutritional matrix
      nutritional_matrix: {
        motor: g1,
        cognitive: g2,
        hormonal: g3,
        inflammation: g4
      }
    };

    console.log("[process-food-ai] Inserting food log to database", {
      userId: user.id,
      foodName: foodData.food_name,
      calories: foodData.calories
    });

    // Insert food log with HYBRID schema (VIP columns + JSONB)
    const { data, error } = await supabaseClient
      .from("food_logs")
      .insert({
        user_id: user.id,
        food_name: foodData.food_name,
        quantity_g: foodData.quantity_g || null,
        reply_text: foodData.reply_text || null,

        // VIP COLUMNS - MOTOR
        calories: foodData.calories || 0,
        protein_g: foodData.protein_g || 0,
        carbs_g: foodData.carbs_g || 0,
        fat_g: foodData.fat_g || 0,
        water_ml: foodData.water_ml || 0,
        leucine_g: foodData.leucine_g || 0,
        sodium_mg: foodData.sodium_mg || 0,

        // VIP COLUMNS - COGNITIVE
        choline_mg: foodData.choline_mg || 0,

        // VIP COLUMNS - HORMONAL
        zinc_mg: foodData.zinc_mg || 0,
        magnesium_mg: foodData.magnesium_mg || 0,
        vit_d3_iu: foodData.vit_d3_iu || 0,

        // VIP COLUMNS - INFLAMMATION
        omega_3_total_g: foodData.omega_3_total_g || 0,
        polyphenols_total_mg: foodData.polyphenols_total_mg || 0,

        // JSONB FIELD - Complete nutritional matrix
        nutritional_matrix: foodData.nutritional_matrix,

        logged_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      console.error("[process-food-ai] Database insert error", {
        error: error.message,
        code: error.code
      });
      throw error;
    }

    console.log("[process-food-ai] Food log inserted successfully", {
      logId: data?.id,
      foodName: data?.food_name
    });

    return new Response(
      JSON.stringify({
        success: true,
        data,
        message: "Food logged successfully with hybrid schema (VIP + JSONB)"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
