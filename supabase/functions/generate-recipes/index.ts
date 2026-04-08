import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

// Prompt del sistema que define el comportamiento y formato de respuesta del chef IA
const RECIPE_SYSTEM_PROMPT = `Eres un Chef IA Nutricional especializado en crear recetas personalizadas basadas en déficits nutricionales específicos.

TU OBJETIVO: Generar una receta deliciosa, práctica y altamente nutritiva que ayude a cubrir los déficits nutricionales del usuario.

REGLAS CRÍTICAS:
1. PERSONALIZACIÓN: La receta DEBE enfocarse en cubrir los déficits nutricionales específicos proporcionados.
2. PRACTICIDAD: Recetas simples, con ingredientes accesibles y tiempos de preparación razonables (15-45 min).
3. SABOR: Las recetas deben ser deliciosas y apetecibles, no solo nutritivas.
4. PRECISIÓN: Todas las cantidades deben ser exactas y realistas.
5. DIVERSIDAD: Varía los tipos de platos (desayuno, almuerzo, cena, snacks).

ESTRUCTURA DE LA RECETA:

1. TÍTULO: Nombre atractivo y descriptivo
2. DESCRIPCIÓN: 1-2 frases explicando por qué esta receta es ideal para los déficits
3. TIEMPO: Preparación y cocción en minutos
4. DIFICULTAD: Fácil, Media, o Avanzada
5. PORCIONES: Número de porciones que produce
6. INGREDIENTES: Lista detallada con cantidades exactas
7. INSTRUCCIONES: Pasos numerados y claros
8. INFORMACIÓN NUTRICIONAL: Macros y micros por porción
9. TIPS: 1-2 consejos útiles

FORMATO JSON DE RESPUESTA OBLIGATORIO:
{
  "recipe": {
    "title": "Nombre de la Receta",
    "description": "Descripción breve y motivadora",
    "prepTime": 15,
    "cookTime": 20,
    "totalTime": 35,
    "difficulty": "Fácil",
    "servings": 2,
    "cuisine": "Tipo de cocina (ej: Mediterránea, Mexicana, Asiática)",
    "mealType": "Tipo de comida (ej: Desayuno, Almuerzo, Cena, Snack)",
    "dietType": "Tipo de dieta compatible (ej: Omnívora, Vegetariana, Vegana, Keto, etc)",
    "ingredients": [
      {
        "name": "Nombre del ingrediente",
        "amount": 100,
        "unit": "g",
        "notes": "opcional: preparación especial"
      }
    ],
    "instructions": [
      {
        "step": 1,
        "instruction": "Instrucción detallada del paso 1",
        "time": 5
      }
    ],
    "nutrition": {
      "perServing": {
        "calories": 450,
        "protein_g": 35,
        "carbs_g": 40,
        "fat_g": 18,
        "fiber_g": 8,
        "sugar_g": 5,
        "sodium_mg": 450,
        "calcium_mg": 200,
        "iron_mg": 6,
        "magnesium_mg": 150,
        "zinc_mg": 4,
        "omega_3_mg": 1200,
        "vit_d3_iu": 400,
        "vit_b12_mcg": 2.5,
        "folate_mcg": 180
      },
      "deficitsCovered": [
        {
          "nutrient": "Nombre del nutriente",
          "amount": "cantidad",
          "percentOfTarget": 35
        }
      ]
    },
    "tips": [
      "Tip 1: Consejo útil",
      "Tip 2: Variación o sustitución"
    ],
    "tags": ["alto-en-proteina", "rico-en-omega3", "antiinflamatorio"]
  }
}

IMPORTANTE:
- Devuelve SOLO el JSON limpio, sin markdown, sin backticks, sin explicaciones adicionales.
- Las cantidades nutricionales deben ser precisas y calculadas para UNA PORCIÓN.
- Si el usuario especifica un tipo de dieta, RESPÉTALO estrictamente.
- Sé creativo pero realista con los ingredientes y preparación.`;

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

    console.log("[generate-recipes] User:", user.id);

    const requestBody = await req.json();
    console.log("[generate-recipes] Request body received", {
      hasDeficits: !!requestBody.deficits,
      deficitsIsArray: Array.isArray(requestBody.deficits),
      deficitsCount: requestBody.deficits?.length,
      hasDietType: !!requestBody.dietType,
      hasCustomRequest: !!requestBody.customRequest,
      hasUserContext: !!requestBody.userContext,
      requestBodyKeys: Object.keys(requestBody)
    });

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

    console.log("[generate-recipes] AI providers available:", {
      gemini: !!GEMINI_API_KEY,
      deepseek: !!DEEPSEEK_API_KEY,
      deficitCount: deficits.length,
    });

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

    userPrompt += `\n\nGenera UNA receta que ayude a cubrir estos deficits. Se creativo, practico y asegurate de que sea deliciosa.`;

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
            generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 4096 }
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
          temperature: 0.8,
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
          console.log(`[generate-recipes] Success with ${name}`);
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

    console.log("[generate-recipes] Recipe generated successfully", {
      title: recipe.title,
      servings: recipe.servings,
      totalTime: recipe.totalTime
    });

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
    } else {
      console.log("[generate-recipes] Recipe saved to database", {
        recipeId: savedRecipe?.id
      });
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
