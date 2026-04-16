import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

// Prompt del sistema que define el comportamiento y formato de respuesta del chef IA
const RECIPE_SYSTEM_PROMPT = `Eres un Chef profesional con formacion en nutricion. Creas recetas REALES que la gente cocina en casa.

PRINCIPIO FUNDAMENTAL: Cada receta debe ser UN PLATO COHERENTE con una identidad culinaria clara.

REGLAS DE COHERENCIA CULINARIA (NO NEGOCIABLES):
1. UN PLATO, UNA IDENTIDAD: Cada receta pertenece a UNA tradicion culinaria. No mezcles cocina japonesa con mexicana salvo fusion intencional.
2. ARMONIA DE SABORES: Los ingredientes deben complementarse. Dulce con dulce (frutas+yogur+miel), salado con salado (pollo+papas+vegetales). NUNCA mezcles salsa de arandanos con papas asadas a menos que sea un glaseado tipico.
3. COMPONENTES LOGICOS: Un plato tiene maximo 3 componentes: base (proteina/grano) + acompanamiento + salsa/aderezo. No pongas 6 cosas sin relacion.
4. RESPETAR EL TIPO DE COMIDA:
   - Desayuno: huevos, avena, tostadas, smoothies, frutas. NO platos elaborados de cena.
   - Almuerzo: ensaladas completas, bowls, wraps, platos con proteina + acompanamiento.
   - Cena: platos mas ligeros o reconfortantes. Sopas, salteados, pescado a la plancha.
   - Snack: porciones pequenas. Frutos secos, fruta con mantequilla de mani, hummus, yogur.
5. INGREDIENTES REALES: Usa cantidades que alguien tendria en casa. No pongas "200g de higado de res" en un desayuno.
6. TECNICAS APROPIADAS: Si es un plato de 15 min, no incluyas tecnicas de 2 horas.

COMO CUBRIR DEFICITS SIN ARRUINAR EL PLATO:
- Integra ingredientes ricos en nutrientes de forma NATURAL al plato.
- Ejemplo BUENO: Deficit de hierro → Ensalada de lentejas con espinacas y limon (la vitamina C mejora absorcion)
- Ejemplo MALO: Deficit de hierro → Higado con yogur de fresa y arroz con chocolate
- Si un nutriente es dificil de cubrir en una receta, mencionalo en los tips como suplemento.
- NO fuerces ingredientes incompatibles solo para cubrir numeros.

FORMATO JSON DE RESPUESTA OBLIGATORIO:
{
  "recipe": {
    "title": "Nombre claro y apetecible",
    "description": "1-2 frases. Por que este plato es ideal para los deficits.",
    "prepTime": 15,
    "cookTime": 20,
    "totalTime": 35,
    "difficulty": "Facil | Media | Avanzada",
    "servings": 2,
    "cuisine": "Tipo de cocina real (Mediterranea, Mexicana, Asiatica, Casera, etc)",
    "mealType": "Desayuno | Almuerzo | Cena | Snack",
    "dietType": "Omnivora | Vegetariana | Vegana | Keto | etc",
    "ingredients": [
      { "name": "Ingrediente", "amount": 100, "unit": "g", "notes": "opcional" }
    ],
    "instructions": [
      { "step": 1, "instruction": "Paso claro y especifico", "time": 5 }
    ],
    "nutrition": {
      "perServing": {
        "calories": 450, "protein_g": 35, "carbs_g": 40, "fat_g": 18,
        "fiber_g": 8, "sugar_g": 5, "sodium_mg": 450, "calcium_mg": 200,
        "iron_mg": 6, "magnesium_mg": 150, "zinc_mg": 4, "omega_3_mg": 1200,
        "vit_d3_iu": 400, "vit_b12_mcg": 2.5, "folate_mcg": 180
      },
      "deficitsCovered": [
        { "nutrient": "Nombre", "amount": "cantidad", "percentOfTarget": 35 }
      ]
    },
    "tips": ["Tip culinario real", "Sustitucion o variacion practica"],
    "tags": ["alto-en-proteina", "rapido", "economico"]
  }
}

IMPORTANTE:
- Devuelve SOLO JSON limpio, sin markdown, sin backticks.
- Cantidades nutricionales precisas para UNA PORCION.
- Si el usuario da ingredientes especificos, USARLOS como base del plato.
- Prefiere recetas de cocina latinoamericana/casera cuando no se especifique.`;

interface RecipeDeficit {
  nutrient: string;
  status: string;
  current: number;
  target: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const sbUrl = Deno.env.get("SUPABASE_URL");
    const sbKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!sbUrl || !sbKey) {
        throw new Error("SUPABASE_URL o SUPABASE_ANON_KEY no configuradas");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        return new Response(
            JSON.stringify({ success: false, error: "Authorization header requerido" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const supabaseClient = createClient(
      sbUrl,
      sbKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
        return new Response(
            JSON.stringify({ success: false, error: "Token inválido" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const requestBody = await req.json();

    const { deficits, dietType, customRequest, userContext } = requestBody;

    // Validar tamaño del array de déficits
    if (deficits && deficits.length > 50) {
      return new Response(
        JSON.stringify({ success: false, error: "Demasiados déficits en la solicitud (máximo 50)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!deficits || !Array.isArray(deficits)) {
      console.error("[generate-recipes] Invalid deficits", {
        deficits: deficits,
        type: typeof deficits
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "deficits array is required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Multi-provider AI call: Gemini -> DeepSeek ---
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");

    if (!GEMINI_API_KEY && !DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No hay API keys configuradas. Configura GEMINI_API_KEY o DEEPSEEK_API_KEY en Supabase Secrets."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI providers configured

    // Construir prompt personalizado con déficits, perfil del usuario y preferencias
    let userPrompt = `DEFICITS NUTRICIONALES A CUBRIR:\n`;
    deficits.forEach((d: RecipeDeficit) => {
      userPrompt += `- ${d.nutrient}: Actual ${d.current.toFixed(1)}, Objetivo ${d.target.toFixed(1)} (${d.status})\n`;
    });

    if (userContext) {
      userPrompt += `\nPERFIL DEL USUARIO:\n`;
      if (userContext.age) userPrompt += `- Edad: ${userContext.age}\n`;
      if (userContext.gender) userPrompt += `- Genero: ${userContext.gender}\n`;
      if (userContext.weight_kg) userPrompt += `- Peso: ${userContext.weight_kg} kg\n`;
      if (userContext.height_cm) userPrompt += `- Altura: ${userContext.height_cm} cm\n`;
      if (userContext.activity_level) userPrompt += `- Actividad: ${userContext.activity_level}\n`;
      if (userContext.target_calories) userPrompt += `- Calorias objetivo: ${userContext.target_calories} kcal\n`;
      if (userContext.target_protein) userPrompt += `- Proteina objetivo: ${userContext.target_protein}g\n`;
      if (userContext.target_carbs) userPrompt += `- Carbohidratos objetivo: ${userContext.target_carbs}g\n`;
      if (userContext.target_fat) userPrompt += `- Grasas objetivo: ${userContext.target_fat}g\n`;
    }

    if (dietType && dietType !== 'standard') {
      userPrompt += `\nTIPO DE DIETA: ${dietType}`;
    }

    if (customRequest) {
      const sanitizedRequest = String(customRequest)
        .replace(/\bignore\b.*\binstructions?\b/gi, "[filtrado]")
        .replace(/\bsystem\b.*\bprompt\b/gi, "[filtrado]")
        .substring(0, 500);
      userPrompt += `\nREQUERIMIENTO ESPECIAL: ${sanitizedRequest}`;
    }

    userPrompt += `\n\nGenera UNA receta coherente y apetecible que integre naturalmente ingredientes ricos en los nutrientes deficitarios. Recuerda: un plato real, con identidad culinaria clara.`;

    // Helper: call Gemini
    async function callGemini(model: string): Promise<string | null> {
      if (!GEMINI_API_KEY) return null;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: RECIPE_SYSTEM_PROMPT + "\n\n" + userPrompt }] }],
            generationConfig: { temperature: 0.6, topK: 40, topP: 0.9, maxOutputTokens: 4096 }
          })
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[generate-recipes] Gemini ${model} => ${res.status}: ${errText.substring(0, 150)}`);
        return null;
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    // Helper: call DeepSeek (OpenAI-compatible)
    async function callDeepSeek(): Promise<string | null> {
      if (!DEEPSEEK_API_KEY) return null;
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: RECIPE_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.6,
          max_tokens: 4096,
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[generate-recipes] DeepSeek => ${res.status}: ${errText.substring(0, 150)}`);
        return null;
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    }

    // Cadena de fallback: Gemini flash -> flash-lite -> 1.5-flash -> DeepSeek
    let rawText: string | null = null;
    let usedProvider = "";

    const providers: Array<[string, () => Promise<string | null>]> = [
      ["gemini-2.0-flash", () => callGemini("gemini-2.0-flash")],
      ["gemini-2.0-flash-lite", () => callGemini("gemini-2.0-flash-lite")],
      ["gemini-1.5-flash", () => callGemini("gemini-1.5-flash")],
      ["deepseek-chat", () => callDeepSeek()],
    ];

    for (const [name, fn] of providers) {
      try {
        rawText = await fn();
        if (rawText) {
          usedProvider = name;
          // Provider succeeded
          break;
        }
      } catch (err) {
        console.warn(`[generate-recipes] ${name} error:`, err);
      }
    }

    if (!rawText) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Todos los modelos de IA estan temporalmente saturados. Intenta de nuevo en unos minutos."
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limpiar y parsear JSON de la respuesta (remover markdown si existe)
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON found in Gemini response");
    }

    const cleanJson = rawText.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(cleanJson);

    if (!parsed.recipe || !parsed.recipe.title) {
      throw new Error("Invalid recipe structure from Gemini");
    }

    const recipe = parsed.recipe;

    // Recipe parsed successfully

    // Guardar receta en la base de datos con todos los datos nutricionales
    const nutrition = recipe.nutrition?.perServing || {};

    const { data: savedRecipe, error: dbError } = await supabaseClient
      .from("meal_recommendations")
      .insert({
        user_id: user.id,
        title: recipe.title,
        description: recipe.description,
        meal_type: recipe.mealType || "Almuerzo",
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prep_time_minutes: recipe.prepTime || 0,
        cook_time_minutes: recipe.cookTime || 0,
        servings: recipe.servings || 1,
        difficulty_level: recipe.difficulty || "Fácil",
        cuisine_type: recipe.cuisine || "Internacional",
        diet_classification: recipe.dietType || dietType || "Omnívora",
        calories_per_serving: nutrition.calories || 0,
        protein_g: nutrition.protein_g || 0,
        carbs_g: nutrition.carbs_g || 0,
        fat_g: nutrition.fat_g || 0,
        fiber_g: nutrition.fiber_g || 0,
        sugar_g: nutrition.sugar_g || 0,
        sodium_mg: nutrition.sodium_mg || 0,
        calcium_mg: nutrition.calcium_mg || 0,
        iron_mg: nutrition.iron_mg || 0,
        magnesium_mg: nutrition.magnesium_mg || 0,
        zinc_mg: nutrition.zinc_mg || 0,
        potassium_mg: nutrition.potassium_mg || 0,
        omega_3_mg: nutrition.omega_3_mg || 0,
        vit_d3_iu: nutrition.vit_d3_iu || 0,
        vit_b12_mcg: nutrition.vit_b12_mcg || 0,
        folate_mcg: nutrition.folate_mcg || 0,
        tags: recipe.tags || [],
        nutritional_highlights: recipe.nutrition?.deficitsCovered || [],
        recipe_image_url: null,
        recipe_source: `${usedProvider}-ai-generated`,
        user_rating: null,
        times_cooked: 0,
        is_favorite: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[generate-recipes] Database insert error", {
        error: dbError.message,
        code: dbError.code
      });
      // Continue anyway, the recipe was generated successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          recipe: recipe,
          savedToDatabase: !dbError,
          recipeId: savedRecipe?.id
        },
        message: `Receta "${recipe.title}" generada exitosamente`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[generate-recipes] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
