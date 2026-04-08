import type { FoodData } from "./prompt.ts";

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

interface CascadeResult {
  hit: boolean;
  foodData?: FoodData;
  source?: string;
  confidence?: number;
}

export async function tryCascadeLookup(
  message: string,
  authHeader: string | null
): Promise<CascadeResult> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) return { hit: false };

  // Step 1: Cheap Gemini call to identify the food
  const identifyResp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${IDENTIFY_PROMPT}\n\nINPUT: "${message}"` }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.1 },
      }),
    }
  );

  if (!identifyResp.ok) {
    console.warn("[cascade] Gemini identify failed:", identifyResp.status);
    return { hit: false };
  }

  const identifyData = await identifyResp.json();
  const identifyText = identifyData.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const idStart = identifyText.indexOf("{");
  const idEnd = identifyText.lastIndexOf("}");

  if (idStart === -1 || idEnd === -1) return { hit: false };

  const identified = JSON.parse(identifyText.substring(idStart, idEnd + 1));
  console.log("[cascade] Identified:", identified);

  // Skip complex dishes — Gemini full analysis is better
  if (identified.is_complex_dish || !identified.food_name_en) {
    console.log("[cascade] Complex dish or no EN name, skipping");
    return { hit: false };
  }

  // Step 2: Call nutrition-lookup edge function
  const lookupUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/nutrition-lookup`;
  const lookupResp = await fetch(lookupUrl, {
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
  });

  if (!lookupResp.ok) return { hit: false };

  const lookupData = await lookupResp.json();

  if (!lookupData.success || lookupData.source === "none") {
    console.log("[cascade] Lookup miss, falling through to Gemini");
    return { hit: false };
  }

  console.log("[cascade] HIT from:", lookupData.source, "confidence:", lookupData.confidence);

  const s = lookupData.scaled;
  const v = (val: any) => Number(val) || 0;
  const srcLabel =
    lookupData.source === "usda"
      ? "USDA"
      : lookupData.source === "openfoodfacts"
        ? "OpenFoodFacts"
        : lookupData.original_source || lookupData.source;

  const foodData: FoodData = {
    food_name: identified.food_name_es || lookupData.food_name,
    quantity_g: identified.quantity_g || lookupData.quantity_g,
    reply_text: `✅ ${identified.food_name_es} registrado (${lookupData.quantity_g}g) — Datos verificados de ${srcLabel} (confianza: ${Math.round((lookupData.confidence || 0.8) * 100)}%)`,
    calories: v(s.calories),
    protein_g: v(s.protein_g),
    carbs_g: v(s.carbs_g),
    fat_g: v(s.fat_g),
    water_ml: v(s.water_ml),
    sodium_mg: v(s.sodium_mg),
    leucine_g: v(s.leucine_mg) / 1000,
    choline_mg: v(s.choline_mg),
    zinc_mg: v(s.zinc_mg),
    magnesium_mg: v(s.magnesium_mg),
    vit_d3_iu: v(s.vit_d3_iu),
    omega_3_total_g: (v(s.epa_mg) + v(s.dha_mg) + v(s.ala_mg)) / 1000,
    polyphenols_total_mg: v(s.polyphenols_total_mg),
    nutritional_matrix: lookupData.nutritional_matrix,
  };

  return {
    hit: true,
    foodData,
    source: lookupData.source,
    confidence: lookupData.confidence,
  };
}
