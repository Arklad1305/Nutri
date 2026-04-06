import { supabase } from './supabase'

export interface RecipeDeficit {
  nutrient: string
  status: string
  current: number
  target: number
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

    console.log('[recipeService] Generating recipe with AI', {
      deficitCount: params.deficits.length,
      dietType: params.dietType,
      hasToken: !!session.access_token,
      userId: session.user.id,
      tokenExpires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    })

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recipes`

    // Preparar headers con autenticación del usuario y API key (case-sensitive)
    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    }

    console.log('[recipeService] Request headers prepared', {
      hasAuth: !!headers.Authorization,
      hasContentType: !!headers['Content-Type'],
      hasApikey: !!headers.apikey,
      authPreview: headers.Authorization ? headers.Authorization.substring(0, 20) + '...' : 'MISSING',
      apikeyPreview: headers.apikey ? headers.apikey.substring(0, 20) + '...' : 'MISSING',
    })

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

    console.log('[recipeService] Sending request:', {
      deficitsCount: requestBody.deficits.length,
      dietType: requestBody.dietType,
      hasCustomRequest: !!requestBody.customRequest,
      hasUserContext: !!requestBody.userContext,
      userContextKeys: requestBody.userContext ? Object.keys(requestBody.userContext) : []
    })

    // Llamar a edge function para generar receta con IA
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    console.log('[recipeService] Response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[recipeService] API Error Response:', errorData)
      return {
        success: false,
        error: errorData.error || `Error del servidor: ${response.status}`,
        details: errorData.details
      }
    }

    const result = await response.json()
    console.log('[recipeService] API Success Response:', result)

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

export async function getUserNutrientDeficits(
  userId: string
): Promise<{ success: boolean; deficits?: RecipeDeficit[]; error?: string }> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: foodLogs, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', today.toISOString())

    if (error) {
      console.error('[recipeService] Error fetching food logs:', error)
      return { success: false, error: error.message }
    }

    if (!foodLogs || foodLogs.length === 0) {
      return { success: true, deficits: [] }
    }

    const totals: Record<string, number> = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      omega_3_total_g: 0,
      magnesium_mg: 0,
      zinc_mg: 0,
      vit_d3_iu: 0,
    }

    foodLogs.forEach((log: any) => {
      totals.calories += Number(log.calories) || 0
      totals.protein_g += Number(log.protein_g) || 0
      totals.carbs_g += Number(log.carbs_g) || 0
      totals.fat_g += Number(log.fat_g) || 0

      if (log.zinc_mg) totals.zinc_mg += Number(log.zinc_mg)
      if (log.magnesium_mg) totals.magnesium_mg += Number(log.magnesium_mg)

      const matrix = log.nutritional_matrix as any
      if (matrix) {
        if (matrix.motor?.fiber_g) totals.fiber_g += Number(matrix.motor.fiber_g)

        if (matrix.inflammation?.omega?.omega_3_total_mg) {
          totals.omega_3_total_g += Number(matrix.inflammation.omega.omega_3_total_mg) / 1000
        }

        if (matrix.hormonal?.liposolubles?.vit_d3_iu) {
          totals.vit_d3_iu += Number(matrix.hormonal.liposolubles.vit_d3_iu)
        }
      }
    })

    const deficits: RecipeDeficit[] = []

    if (totals.protein_g < 120) {
      deficits.push({
        nutrient: 'Proteína',
        status: totals.protein_g < 80 ? 'critical' : 'low',
        current: totals.protein_g,
        target: 150,
      })
    }

    if (totals.omega_3_total_g < 1.5) {
      deficits.push({
        nutrient: 'Omega-3',
        status: totals.omega_3_total_g < 1 ? 'critical' : 'low',
        current: totals.omega_3_total_g,
        target: 2.5,
      })
    }

    if (totals.magnesium_mg < 300) {
      deficits.push({
        nutrient: 'Magnesio',
        status: totals.magnesium_mg < 200 ? 'critical' : 'low',
        current: totals.magnesium_mg,
        target: 420,
      })
    }

    if (totals.zinc_mg < 8) {
      deficits.push({
        nutrient: 'Zinc',
        status: totals.zinc_mg < 5 ? 'critical' : 'low',
        current: totals.zinc_mg,
        target: 11,
      })
    }

    if (totals.vit_d3_iu < 1000) {
      deficits.push({
        nutrient: 'Vitamina D3',
        status: totals.vit_d3_iu < 400 ? 'critical' : 'low',
        current: totals.vit_d3_iu,
        target: 2000,
      })
    }

    return { success: true, deficits }
  } catch (error) {
    console.error('[recipeService] Error analyzing deficits:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
