import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, apikey",
};

// ============================================================
// USDA FoodData Central API helpers
// ============================================================

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
  dataType?: string;
  score?: number;
}

// USDA nutrient IDs → our field names
const USDA_NUTRIENT_MAP: Record<number, { key: string; unit: string }> = {
  1008: { key: "calories", unit: "kcal" },
  1003: { key: "protein_g", unit: "g" },
  1005: { key: "carbs_g", unit: "g" },
  1004: { key: "fat_g", unit: "g" },
  1079: { key: "fiber_g", unit: "g" },
  2000: { key: "sugar_g", unit: "g" },
  1051: { key: "water_ml", unit: "g" }, // g ≈ ml for water
  1093: { key: "sodium_mg", unit: "mg" },
  1092: { key: "potassium_mg", unit: "mg" },
  // Amino acids
  1213: { key: "leucine_mg", unit: "mg" },
  1212: { key: "isoleucine_mg", unit: "mg" },
  1219: { key: "valine_mg", unit: "mg" },
  1214: { key: "lysine_mg", unit: "mg" },
  1215: { key: "methionine_mg", unit: "mg" },
  1211: { key: "threonine_mg", unit: "mg" },
  1210: { key: "tryptophan_mg", unit: "mg" },
  1217: { key: "phenylalanine_mg", unit: "mg" },
  1218: { key: "tyrosine_mg", unit: "mg" },
  1221: { key: "histidine_mg", unit: "mg" },
  // Vitamins B complex
  1165: { key: "b1_thiamine_mg", unit: "mg" },
  1166: { key: "b2_riboflavin_mg", unit: "mg" },
  1167: { key: "b3_niacin_mg", unit: "mg" },
  1170: { key: "b5_pantothenic_mg", unit: "mg" },
  1175: { key: "b6_mg", unit: "mg" },
  1177: { key: "b9_folate_mcg", unit: "µg" },
  1178: { key: "b12_mcg", unit: "µg" },
  1176: { key: "b7_biotin_mcg", unit: "µg" },
  // Other vitamins
  1162: { key: "vit_c_mg", unit: "mg" },
  1106: { key: "vit_a_iu", unit: "IU" },
  1114: { key: "vit_d3_iu", unit: "IU" },
  1109: { key: "vit_e_mg", unit: "mg" },
  1185: { key: "vit_k1_mcg", unit: "µg" },
  // Minerals
  1095: { key: "zinc_mg", unit: "mg" },
  1090: { key: "magnesium_mg", unit: "mg" },
  1103: { key: "selenium_mcg", unit: "µg" },
  1096: { key: "chromium_mcg", unit: "µg" },
  1100: { key: "iodine_mcg", unit: "µg" },
  1101: { key: "manganese_mg", unit: "mg" },
  1087: { key: "calcium_mg", unit: "mg" },
  1091: { key: "phosphorus_mg", unit: "mg" },
  1098: { key: "copper_mg", unit: "mg" },
  1089: { key: "iron_mg", unit: "mg" },
  // Fats detail
  1258: { key: "saturated_fat_g", unit: "g" },
  1292: { key: "monounsaturated_fat_g", unit: "g" },
  1293: { key: "polyunsaturated_fat_g", unit: "g" },
  1404: { key: "trans_fat_g", unit: "g" },
  1253: { key: "cholesterol_mg", unit: "mg" },
  // Omega-3
  1278: { key: "epa_mg", unit: "mg" },     // EPA 20:5 n-3
  1272: { key: "dha_mg", unit: "mg" },     // DHA 22:6 n-3
  1270: { key: "ala_mg", unit: "mg" },     // ALA 18:3 n-3
  // Choline
  1180: { key: "choline_mg", unit: "mg" },
};

async function searchUSDA(
  foodNameEn: string
): Promise<{ food: USDAFood | null; raw: Record<string, number> }> {
  const apiKey = Deno.env.get("USDA_API_KEY");
  if (!apiKey) {
    console.warn("[nutrition-lookup] USDA_API_KEY not set");
    return { food: null, raw: {} };
  }

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodNameEn)}&pageSize=5&dataType=SR%20Legacy,Foundation&api_key=${apiKey}`;
    const resp = await fetch(url);

    if (!resp.ok) {
      console.error("[nutrition-lookup] USDA API error:", resp.status);
      return { food: null, raw: {} };
    }

    const data = await resp.json();
    const foods: USDAFood[] = data.foods || [];

    if (foods.length === 0) return { food: null, raw: {} };

    // Pick best match (first result from SR Legacy or Foundation)
    const best = foods[0];
    const raw: Record<string, number> = {};

    for (const nutrient of best.foodNutrients) {
      const mapping = USDA_NUTRIENT_MAP[nutrient.nutrientId];
      if (mapping) {
        raw[mapping.key] = nutrient.value || 0;
      }
    }

    return { food: best, raw };
  } catch (err) {
    console.error("[nutrition-lookup] USDA fetch error:", err);
    return { food: null, raw: {} };
  }
}

// ============================================================
// OpenFoodFacts API helpers
// ============================================================

interface OFFProduct {
  code: string;
  product_name: string;
  nutriments: Record<string, number>;
}

async function searchOpenFoodFacts(
  foodName: string
): Promise<{ product: OFFProduct | null; raw: Record<string, number> }> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&search_simple=1&action=process&json=1&page_size=5&cc=cl&lc=es`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "NutriTrackPro/1.0 (contact@nutritrack.cl)" },
    });

    if (!resp.ok) {
      console.error("[nutrition-lookup] OFF API error:", resp.status);
      return { product: null, raw: {} };
    }

    const data = await resp.json();
    const products = data.products || [];

    if (products.length === 0) return { product: null, raw: {} };

    // Pick first product with nutriments
    const best = products.find(
      (p: any) => p.nutriments && Object.keys(p.nutriments).length > 5
    );
    if (!best) return { product: null, raw: {} };

    const n = best.nutriments;
    const raw: Record<string, number> = {
      calories: n["energy-kcal_100g"] || 0,
      protein_g: n["proteins_100g"] || 0,
      carbs_g: n["carbohydrates_100g"] || 0,
      fat_g: n["fat_100g"] || 0,
      fiber_g: n["fiber_100g"] || 0,
      sugar_g: n["sugars_100g"] || 0,
      sodium_mg: (n["sodium_100g"] || 0) * 1000, // OFF gives g, we want mg
      saturated_fat_g: n["saturated-fat_100g"] || 0,
      trans_fat_g: n["trans-fat_100g"] || 0,
      cholesterol_mg: (n["cholesterol_100g"] || 0) * 1000,
      potassium_mg: (n["potassium_100g"] || 0) * 1000,
      calcium_mg: (n["calcium_100g"] || 0) * 1000,
      iron_mg: (n["iron_100g"] || 0) * 1000,
      vit_c_mg: (n["vitamin-c_100g"] || 0) * 1000,
      vit_a_iu: n["vitamin-a_100g"] || 0,
    };

    return {
      product: {
        code: best.code,
        product_name: best.product_name,
        nutriments: n,
      },
      raw,
    };
  } catch (err) {
    console.error("[nutrition-lookup] OFF fetch error:", err);
    return { product: null, raw: {} };
  }
}

// ============================================================
// Map flat nutrients → 4-group biohacker matrix
// ============================================================

function buildNutritionalMatrix(raw: Record<string, number>) {
  const v = (key: string) => raw[key] || 0;

  return {
    motor: {
      calories: v("calories"),
      protein_g: v("protein_g"),
      carbs_g: v("carbs_g"),
      fat_g: v("fat_g"),
      fiber_g: v("fiber_g"),
      sugar_g: v("sugar_g"),
      water_ml: v("water_ml"),
      electrolytes: {
        sodium_mg: v("sodium_mg"),
        potassium_mg: v("potassium_mg"),
        chloride_mg: v("chloride_mg"),
      },
      aminos_muscle: {
        leucine_mg: v("leucine_mg"),
        isoleucine_mg: v("isoleucine_mg"),
        valine_mg: v("valine_mg"),
        lysine_mg: v("lysine_mg"),
        methionine_mg: v("methionine_mg"),
        threonine_mg: v("threonine_mg"),
      },
    },
    cognitive: {
      aminos_neuro: {
        tryptophan_mg: v("tryptophan_mg"),
        phenylalanine_mg: v("phenylalanine_mg"),
        tyrosine_mg: v("tyrosine_mg"),
        histidine_mg: v("histidine_mg"),
      },
      neuro_others: {
        taurine_mg: v("taurine_mg"),
        choline_mg: v("choline_mg"),
        creatine_mg: v("creatine_mg"),
      },
      vitamins_b: {
        b1_thiamine_mg: v("b1_thiamine_mg"),
        b2_riboflavin_mg: v("b2_riboflavin_mg"),
        b3_niacin_mg: v("b3_niacin_mg"),
        b5_pantothenic_mg: v("b5_pantothenic_mg"),
        b6_mg: v("b6_mg"),
        b7_biotin_mcg: v("b7_biotin_mcg"),
        b9_folate_mcg: v("b9_folate_mcg"),
        b12_mcg: v("b12_mcg"),
      },
      vit_c_mg: v("vit_c_mg"),
    },
    hormonal: {
      thyroid_insulin: {
        zinc_mg: v("zinc_mg"),
        magnesium_mg: v("magnesium_mg"),
        selenium_mcg: v("selenium_mcg"),
        chromium_mcg: v("chromium_mcg"),
        iodine_mcg: v("iodine_mcg"),
        manganese_mg: v("manganese_mg"),
      },
      liposolubles: {
        vit_a_iu: v("vit_a_iu"),
        vit_d3_iu: v("vit_d3_iu"),
        vit_e_mg: v("vit_e_mg"),
        vit_k1_mcg: v("vit_k1_mcg"),
        vit_k2_mcg: v("vit_k2_mcg"),
      },
      structure: {
        calcium_mg: v("calcium_mg"),
        phosphorus_mg: v("phosphorus_mg"),
        copper_mg: v("copper_mg"),
        iron_mg: v("iron_mg"),
      },
    },
    inflammation: {
      omega: {
        saturated_fat_g: v("saturated_fat_g"),
        monounsaturated_fat_g: v("monounsaturated_fat_g"),
        polyunsaturated_fat_g: v("polyunsaturated_fat_g"),
        omega_3_total_mg: v("epa_mg") + v("dha_mg") + v("ala_mg"),
        omega_6_mg: v("omega_6_mg"),
        trans_fat_g: v("trans_fat_g"),
        cholesterol_mg: v("cholesterol_mg"),
      },
      anti_inflammatory: {
        epa_mg: v("epa_mg"),
        dha_mg: v("dha_mg"),
        ala_mg: v("ala_mg"),
        vit_e_mg: v("vit_e_mg"),
      },
      bioactives: {
        polyphenols_total_mg: v("polyphenols_total_mg"),
        anthocyanins_mg: v("anthocyanins_mg"),
        quercetin_mg: v("quercetin_mg"),
        resveratrol_mg: v("resveratrol_mg"),
        curcumin_mg: v("curcumin_mg"),
      },
    },
  };
}

// ============================================================
// Scale per_100g data to actual quantity
// ============================================================

function scaleToQuantity(
  per100g: Record<string, number>,
  quantityG: number
): Record<string, number> {
  const factor = quantityG / 100;
  const scaled: Record<string, number> = {};
  for (const [key, val] of Object.entries(per100g)) {
    scaled[key] = Math.round(val * factor * 100) / 100;
  }
  return scaled;
}

// ============================================================
// Normalize food key for cache lookups
// ============================================================

function normalizeFoodKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

// ============================================================
// Main handler
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
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
      return new Response(
        JSON.stringify({ success: false, error: "Autenticación fallida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { food_name_es, food_name_en, quantity_g = 100 } = await req.json();

    if (!food_name_es && !food_name_en) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Se requiere food_name_es o food_name_en",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const foodKey = normalizeFoodKey(food_name_es || food_name_en);
    console.log("[nutrition-lookup] Lookup started:", { foodKey, food_name_es, food_name_en, quantity_g });

    // ─── STEP 1: Check cache ──────────────────────────────
    const { data: cached } = await supabaseClient
      .from("nutrition_cache")
      .select("*")
      .eq("food_key", foodKey)
      .maybeSingle();

    if (cached) {
      console.log("[nutrition-lookup] Cache HIT:", cached.food_name_es);
      const scaled = scaleToQuantity(cached.per_100g, quantity_g);
      const matrix = buildNutritionalMatrix(scaled);

      return new Response(
        JSON.stringify({
          success: true,
          source: "cache",
          original_source: cached.source,
          confidence: cached.confidence,
          food_name: cached.food_name_es,
          quantity_g,
          per_100g: cached.per_100g,
          scaled,
          nutritional_matrix: matrix,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Also try fuzzy match on Spanish name
    if (food_name_es) {
      const { data: fuzzyResults } = await supabaseClient
        .from("nutrition_cache")
        .select("*")
        .textSearch("food_name_es", food_name_es.split(" ").join(" & "), { type: "plain" })
        .limit(1);

      if (fuzzyResults && fuzzyResults.length > 0) {
        const match = fuzzyResults[0];
        // Verify similarity is good enough (trigram similarity via basic check)
        const matchKey = normalizeFoodKey(match.food_name_es);
        if (matchKey === foodKey || match.food_name_es.toLowerCase().includes(food_name_es.toLowerCase())) {
          console.log("[nutrition-lookup] Fuzzy cache HIT:", match.food_name_es);
          const scaled = scaleToQuantity(match.per_100g, quantity_g);
          const matrix = buildNutritionalMatrix(scaled);

          return new Response(
            JSON.stringify({
              success: true,
              source: "cache_fuzzy",
              original_source: match.source,
              confidence: match.confidence * 0.9, // Slightly lower confidence for fuzzy
              food_name: match.food_name_es,
              quantity_g,
              per_100g: match.per_100g,
              scaled,
              nutritional_matrix: matrix,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log("[nutrition-lookup] Cache MISS, trying external APIs...");

    // ─── STEP 2: Try USDA ─────────────────────────────────
    let per100g: Record<string, number> = {};
    let source = "";
    let confidence = 0;
    let usdaFdcId: number | null = null;
    let offBarcode: string | null = null;

    if (food_name_en) {
      const usda = await searchUSDA(food_name_en);
      if (usda.food && Object.keys(usda.raw).length >= 5) {
        per100g = usda.raw;
        source = "usda";
        confidence = 0.95;
        usdaFdcId = usda.food.fdcId;
        console.log("[nutrition-lookup] USDA HIT:", usda.food.description, "fdcId:", usdaFdcId);
      }
    }

    // ─── STEP 3: Try OpenFoodFacts (if USDA missed) ──────
    if (!source) {
      const searchTerm = food_name_es || food_name_en || "";
      const off = await searchOpenFoodFacts(searchTerm);
      if (off.product && Object.keys(off.raw).length >= 4) {
        per100g = off.raw;
        source = "openfoodfacts";
        confidence = 0.82;
        offBarcode = off.product.code;
        console.log("[nutrition-lookup] OFF HIT:", off.product.product_name);
      }
    }

    // ─── STEP 4: No external data found ──────────────────
    if (!source) {
      console.log("[nutrition-lookup] No external data found, returning miss");
      return new Response(
        JSON.stringify({
          success: false,
          source: "none",
          message: "Alimento no encontrado en USDA ni OpenFoodFacts. Se usará Gemini como fallback.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── STEP 5: Cache the result ────────────────────────
    const matrixPer100g = buildNutritionalMatrix(per100g);

    const { error: cacheError } = await supabaseClient
      .from("nutrition_cache")
      .upsert(
        {
          food_key: foodKey,
          food_name_es: food_name_es || food_name_en,
          food_name_en: food_name_en || null,
          source,
          usda_fdc_id: usdaFdcId,
          off_barcode: offBarcode,
          per_100g: per100g,
          nutritional_matrix: matrixPer100g,
          confidence,
          data_quality: confidence >= 0.9 ? "verified" : "standard",
          last_verified_at: new Date().toISOString(),
        },
        { onConflict: "food_key" }
      );

    if (cacheError) {
      console.error("[nutrition-lookup] Cache upsert error:", cacheError.message);
      // Non-fatal: continue with response
    } else {
      console.log("[nutrition-lookup] Cached:", foodKey, "from", source);
    }

    // ─── STEP 6: Return scaled result ────────────────────
    const scaled = scaleToQuantity(per100g, quantity_g);
    const matrix = buildNutritionalMatrix(scaled);

    return new Response(
      JSON.stringify({
        success: true,
        source,
        confidence,
        food_name: food_name_es || food_name_en,
        quantity_g,
        per_100g: per100g,
        scaled,
        nutritional_matrix: matrix,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[nutrition-lookup] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
