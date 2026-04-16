import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    // Auth: verificar usuario
    const sbUrl = Deno.env.get("SUPABASE_URL");
    const sbKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!sbUrl || !sbKey) throw new Error("Supabase no configurado");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization requerido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(sbUrl, sbKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { barcode } = await req.json();
    const clean = String(barcode || "").replace(/\D/g, "");

    if (clean.length < 8 || clean.length > 14) {
      return new Response(
        JSON.stringify({ success: false, error: "Código de barras inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Consultar OpenFoodFacts server-side (sin CORS, con User-Agent)
    let product: any = null;

    const urls = [
      `https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=product_name,brands,nutriments,serving_size,product_quantity,image_front_url,image_front_small_url`,
      `https://world.openfoodfacts.net/api/v2/product/${clean}.json?fields=product_name,brands,nutriments,serving_size,product_quantity,image_front_url,image_front_small_url`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "NutriTrackPro/1.0 (nutritrack@app.com)",
            "Accept": "application/json",
          },
        });

        if (!res.ok) continue;

        const data = await res.json();
        if (data.status === 1 && data.product) {
          product = data.product;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!product) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Producto no encontrado en OpenFoodFacts. Regístralo manualmente.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mapear nutrientes (per 100g → porción)
    const n = product.nutriments || {};
    const servingG = parseServing(product.serving_size) || 100;
    const f = servingG / 100;

    const foodName = [product.product_name, product.brands].filter(Boolean).join(" — ") || `Producto ${clean}`;
    const calories = r(n["energy-kcal_100g"] * f) || r(n["energy-kcal"] * f) || 0;
    const protein_g = r(n.proteins_100g * f) || 0;
    const carbs_g = r(n.carbohydrates_100g * f) || 0;
    const fat_g = r(n.fat_100g * f) || 0;

    // Guardar en food_logs
    const { error: dbError } = await supabase.from("food_logs").insert({
      user_id: user.id,
      food_name: foodName,
      quantity_g: servingG,
      calories,
      protein_g,
      carbs_g,
      fat_g,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          food_name: foodName,
          quantity_g: servingG,
          calories,
          protein_g,
          carbs_g,
          fat_g,
          fiber_g: r(n.fiber_100g * f) || 0,
          sugar_g: r(n.sugars_100g * f) || 0,
          sodium_mg: r((n.sodium_100g || 0) * 1000 * f),
          reply_text: `${foodName} (${servingG}g): ${calories} kcal, ${protein_g}g prot, ${carbs_g}g carbs, ${fat_g}g grasa`,
          source: "openfoodfacts-barcode",
          barcode: clean,
          brand: product.brands || "",
          image_url: product.image_front_small_url || product.image_front_url || null,
          saved: !dbError,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function r(val: number | undefined): number {
  if (!val || isNaN(val)) return 0;
  return Math.round(val * 10) / 10;
}

function parseServing(s?: string): number | null {
  if (!s) return null;
  const g = s.match(/(\d+(?:[.,]\d+)?)\s*g/i);
  if (g) return parseFloat(g[1].replace(",", "."));
  const ml = s.match(/(\d+(?:[.,]\d+)?)\s*ml/i);
  if (ml) return parseFloat(ml[1].replace(",", "."));
  return null;
}
