import { supabase } from './supabase'
import { getNutritionalStandards, analyzeNutrient } from './nutritionStandards'
import { calculateNutritionTargets, type UserProfile } from './nutritionTargetCalculator'

export interface RecipeDeficit {
  nutrient: string
  status: 'critical' | 'survival' | 'functional' | string
  current: number
  target: number
  unit?: string
  percentCovered?: number
}

export interface UserContext {
  weight_kg?: number
  height_cm?: number
  age?: number
  gender?: string
  activity_level?: string
  target_calories?: number
  target_protein?: number
  target_carbs?: number
  target_fat?: number
}

export interface GenerateRecipeParams {
  deficits: RecipeDeficit[]
  dietType?: string
  customRequest?: string
  userContext?: UserContext
}

// Genera una receta personalizada usando IA basada en déficits nutricionales del usuario
export async function generateRecipeWithAI(
  params: GenerateRecipeParams
): Promise<{ success: boolean; data?: any; error?: string; details?: string }> {
  try {
    // Obtener sesión actual (autoRefreshToken se encarga del refresh si es necesario)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('[recipeService] Failed to get session:', sessionError)
      return {
        success: false,
        error: 'No hay sesión activa. Por favor, inicia sesión nuevamente.',
        details: sessionError?.message
      }
    }

    if (!session.access_token) {
      console.error('[recipeService] Session exists but no access_token')
      return { success: false, error: 'Sesión inválida: sin token de acceso' }
    }

    if (!session.user?.id) {
      console.error('[recipeService] No user ID in session')
      return { success: false, error: 'Sesión inválida: sin ID de usuario' }
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recipes`

    // Preparar headers con autenticación del usuario y API key (case-sensitive)
    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    }

    // Limpiar userContext: solo enviar propiedades con valores reales
    const cleanUserContext = params.userContext ?
      Object.fromEntries(
        Object.entries(params.userContext).filter(([_, v]) => v !== undefined && v !== null)
      ) : {}

    // Construir payload limpio (sin undefined ni strings vacías)
    const requestBody: Record<string, any> = {
      deficits: params.deficits,
      dietType: params.dietType || 'standard',
    }

    // Solo agregar customRequest si tiene contenido
    if (params.customRequest && params.customRequest.trim()) {
      requestBody.customRequest = params.customRequest.trim()
    }

    // Solo agregar userContext si tiene propiedades
    if (Object.keys(cleanUserContext).length > 0) {
      requestBody.userContext = cleanUserContext
    }

    // Llamar a edge function para generar receta con IA
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `Error del servidor: ${response.status}`,
        details: errorData.details
      }
    }

    const result = await response.json()

    if (result.success) {
      return {
        success: true,
        data: result.data || { message: result.message },
      }
    }

    return {
      success: false,
      error: result.error || 'Formato de respuesta inválido',
      details: result.details
    }
  } catch (error) {
    console.error('[recipeService] Error calling Recipe AI:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Aggregate food_logs into nutrient totals using VIP-first pattern (same as Dashboard)
function aggregateFoodLogs(foodLogs: any[]): Record<string, number> {
  const totals: Record<string, number> = {}
  const add = (key: string, val: any) => {
    const n = Number(val)
    if (n && !isNaN(n)) totals[key] = (totals[key] || 0) + n
  }

  foodLogs.forEach(log => {
    const m = log.nutritional_matrix as any
    const has = !!m

    // Macros (VIP columns)
    add('calories', log.calories)
    add('protein_g', log.protein_g)
    add('carbs_g', log.carbs_g)
    add('fat_g', log.fat_g)

    // Fiber: matrix only
    if (has) add('fiber_g', m.motor?.fiber_g)

    // Sugar: matrix only
    if (has) add('sugar_g', m.motor?.sugar_g)

    // Water
    add('water_ml', log.water_ml)

    // Electrolytes (motor subsystem is primary)
    if (log.sodium_mg) add('sodium_mg', log.sodium_mg)
    else if (has) add('sodium_mg', m.motor?.electrolytes?.sodium_mg)

    if (has) add('potassium_mg', m.motor?.electrolytes?.potassium_mg)

    // Minerals - VIP first, then matrix
    if (log.zinc_mg) add('zinc_mg', log.zinc_mg)
    else if (has) add('zinc_mg', m.motor?.structure_minerals?.zinc_mg || m.hormonal?.thyroid_insulin?.zinc_mg)

    if (log.magnesium_mg) add('magnesium_mg', log.magnesium_mg)
    else if (has) add('magnesium_mg', m.motor?.structure_minerals?.magnesium_mg || m.hormonal?.thyroid_insulin?.magnesium_mg)

    if (has) {
      add('iron_mg', m.motor?.structure_minerals?.iron_mg || m.hormonal?.structure?.iron_mg)
      add('calcium_mg', m.hormonal?.structure?.calcium_mg)
      add('phosphorus_mg', m.hormonal?.structure?.phosphorus_mg)
      add('copper_mg', m.hormonal?.structure?.copper_mg)
      add('manganese_mg', m.hormonal?.thyroid_insulin?.manganese_mg)
      add('selenium_mcg', m.cognitive?.trace_minerals?.selenium_mcg || m.hormonal?.thyroid_insulin?.selenium_mcg)
      add('chromium_mcg', m.cognitive?.trace_minerals?.chromium_mcg || m.hormonal?.thyroid_insulin?.chromium_mcg)
      add('iodine_mcg', m.hormonal?.thyroid_insulin?.iodine_mcg)
    }

    // Vitamins
    if (has) {
      // B vitamins (cognitive subsystem)
      add('vitamin_b1_thiamin_mg', m.cognitive?.energy_vitamins?.vit_b1_thiamin_mg)
      add('vitamin_b2_riboflavin_mg', m.cognitive?.energy_vitamins?.vit_b2_riboflavin_mg)
      add('vitamin_b3_niacin_mg', m.cognitive?.energy_vitamins?.vit_b3_niacin_mg)
      add('vitamin_b5_pantothenic_mg', m.cognitive?.energy_vitamins?.vit_b5_pantothenic_mg)
      add('vitamin_b6_pyridoxine_mg', m.cognitive?.energy_vitamins?.vit_b6_mg)
      add('vitamin_b7_biotin_mcg', m.cognitive?.energy_vitamins?.vit_b7_biotin_mcg)
      add('folate_mcg', m.cognitive?.energy_vitamins?.folate_mcg)
      add('vitamin_b12_mcg', m.cognitive?.energy_vitamins?.vit_b12_mcg)
      add('vit_c_mg', m.cognitive?.energy_vitamins?.vit_c_mg)

      // Fat-soluble vitamins (hormonal subsystem)
      add('vit_a_iu', m.hormonal?.liposolubles?.vit_a_mcg)
      add('vit_d3_iu', m.hormonal?.liposolubles?.vit_d3_iu)
      add('vit_e_iu', m.hormonal?.liposolubles?.vit_e_iu)
      add('vit_k_mcg', m.hormonal?.liposolubles?.vit_k1_mcg)
    }

    // Choline
    if (log.choline_mg) add('choline_mg', log.choline_mg)
    else if (has) add('choline_mg', m.cognitive?.neuro_others?.choline_mg)

    // Omega & lipids (inflammation subsystem)
    if (log.omega_3_total_g) add('omega_3_total_g', log.omega_3_total_g)
    else if (has && m.inflammation?.omega?.omega_3_total_mg) add('omega_3_total_g', Number(m.inflammation.omega.omega_3_total_mg) / 1000)

    if (has) {
      if (m.inflammation?.omega?.epa_dha_mg) add('omega_3_epa_dha_g', Number(m.inflammation.omega.epa_dha_mg) / 1000)
      if (m.inflammation?.omega?.omega_6_mg) add('omega_6_g', Number(m.inflammation.omega.omega_6_mg) / 1000)
      add('sat_fat_g', m.inflammation?.sat_fats?.saturated_g)
      add('cholesterol_mg', m.inflammation?.sat_fats?.cholesterol_mg)
    }

    // Polyphenols
    if (log.polyphenols_total_mg) add('polyphenols_total_mg', log.polyphenols_total_mg)
    else if (has) add('polyphenols_total_mg', m.inflammation?.bioactives?.polyphenols_total_mg)

    // Amino acids (motor subsystem)
    if (has) {
      if (m.motor?.aminos_muscle?.leucine_mg) add('leucine_g', Number(m.motor.aminos_muscle.leucine_mg) / 1000)
    }
    if (log.leucine_g) add('leucine_g', log.leucine_g)
  })

  return totals
}

export async function getUserNutrientDeficits(
  userId: string,
  days: number = 7
): Promise<{ success: boolean; deficits?: RecipeDeficit[]; dailyAvg?: Record<string, number>; error?: string }> {
  try {
    // 1. Fetch food_logs for the time window
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const { data: foodLogs, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startDate.toISOString())

    if (error) {
      console.error('[recipeService] Error fetching food logs:', error)
      return { success: false, error: error.message }
    }

    if (!foodLogs || foodLogs.length === 0) {
      return { success: true, deficits: [] }
    }

    // 2. Aggregate all nutrients
    const totals = aggregateFoodLogs(foodLogs)

    // 3. Calculate daily averages
    const dailyAvg: Record<string, number> = {}
    for (const [key, val] of Object.entries(totals)) {
      dailyAvg[key] = val / days
    }

    // 4. Load standards from DB
    const standards = await getNutritionalStandards()
    if (!standards.length) {
      return { success: false, error: 'No se pudieron cargar los estándares nutricionales' }
    }

    // 5. Load personalized targets from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('weight_kg, height_cm, age, gender, activity_level, goal, body_fat_percent')
      .eq('id', userId)
      .single()

    // Map personalized macro targets to override standards
    const personalizedOverrides: Record<string, number> = {}
    if (profile?.weight_kg && profile?.height_cm && profile?.age) {
      const targets = calculateNutritionTargets({
        weight_kg: profile.weight_kg,
        height_cm: profile.height_cm,
        age: profile.age,
        gender: profile.gender || 'male',
        activity_level: profile.activity_level || 'moderate',
        goal: profile.goal || 'maintain',
        body_fat_percent: profile.body_fat_percent || undefined,
      } as UserProfile)

      personalizedOverrides['calories'] = targets.meta_calorias
      personalizedOverrides['protein_g'] = targets.macros.proteina_g
      personalizedOverrides['carbs_g'] = targets.macros.carbos_g
      personalizedOverrides['fat_g'] = targets.macros.grasas_g
      personalizedOverrides['vit_d3_iu'] = targets.micros_objetivo.vit_d3_iu
      personalizedOverrides['magnesium_mg'] = targets.micros_objetivo.magnesium_mg
      personalizedOverrides['zinc_mg'] = targets.micros_objetivo.zinc_mg
      personalizedOverrides['iron_mg'] = targets.micros_objetivo.iron_mg
      personalizedOverrides['calcium_mg'] = targets.micros_objetivo.calcium_mg
      personalizedOverrides['potassium_mg'] = targets.micros_objetivo.potassium_mg
      personalizedOverrides['vit_c_mg'] = targets.micros_objetivo.vitamin_c_mg
      personalizedOverrides['folate_mcg'] = targets.micros_objetivo.folate_mcg
      personalizedOverrides['vitamin_b12_mcg'] = targets.micros_objetivo.vitamin_b12_mcg
      personalizedOverrides['water_ml'] = targets.micros_objetivo.water_ml
    }

    // 6. Analyze each nutrient and find deficits
    // Skip inverted nutrients (sugar, methionine, omega-6) — lower is better for those
    const invertedNutrients = new Set(['sugar_g', 'methionine_g', 'omega_6_g'])
    const deficits: RecipeDeficit[] = []

    for (const standard of standards) {
      if (invertedNutrients.has(standard.nutrient_key)) continue

      const current = dailyAvg[standard.nutrient_key] || 0

      // Use personalized target if available, else standard
      let adjustedStandard = standard
      const override = personalizedOverrides[standard.nutrient_key]
      if (override) {
        adjustedStandard = {
          ...standard,
          min_optimal_value: override,
          min_survival_value: Math.round(override * 0.7),
        }
      }

      const status = analyzeNutrient(standard.nutrient_key, current, adjustedStandard)

      if (status.level === 'critical' || status.level === 'survival' || status.level === 'functional') {
        const target = override || standard.min_optimal_value || standard.min_survival_value
        deficits.push({
          nutrient: standard.label,
          status: status.level,
          current: Math.round(current * 10) / 10,
          target,
          unit: standard.unit,
          percentCovered: target > 0 ? Math.round((current / target) * 100) : 0,
        })
      }
    }

    // 7. Sort by severity (critical > survival > functional), then by % covered (lowest first)
    const severityOrder: Record<string, number> = { critical: 0, survival: 1, functional: 2 }
    deficits.sort((a, b) => {
      const sev = (severityOrder[a.status] ?? 3) - (severityOrder[b.status] ?? 3)
      if (sev !== 0) return sev
      return (a.percentCovered || 0) - (b.percentCovered || 0)
    })

    return { success: true, deficits: deficits.slice(0, 15), dailyAvg }
  } catch (error) {
    console.error('[recipeService] Error analyzing deficits:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
