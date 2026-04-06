import { supabase } from './supabase'

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''

export interface N8NRequestPayload {
  user_id: string
  mensaje: string
  fecha: string
  contexto: {
    edad?: number
    genero?: string
    altura_cm?: number
    peso_kg?: number
    nivel_actividad?: string
    objetivo?: string
    nombre?: string
  }
}

export interface N8NResponseData {
  response?: string
  reply?: string
  message?: string
  name?: string
  calories?: number
  macros?: {
    protein_g?: number
    carbs_g?: number
    fat_g?: number
    fiber_g?: number
    sugar_g?: number
  }
  micros?: {
    vitamin_a_iu?: number
    vitamin_a_mcg?: number
    vitamin_c_mg?: number
    vitamin_d_mcg?: number
    calcium_mg?: number
    iron_mg?: number
    magnesium_mg?: number
    potassium_mg?: number
    sodium_mg?: number
    zinc_mg?: number
  }
}

export interface N8NResponse {
  success: boolean
  data?: N8NResponseData
  message?: string
}

export async function submitHealthData(
  mensaje: string
): Promise<N8NResponse> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error al obtener perfil:', profileError)
    }

    const payload: N8NRequestPayload = {
      user_id: user.id,
      mensaje: mensaje,
      fecha: new Date().toISOString(),
      contexto: {
        edad: profile?.age || undefined,
        genero: profile?.gender || undefined,
        altura_cm: profile?.height_cm || undefined,
        peso_kg: profile?.weight_kg ? Number(profile.weight_kg) : undefined,
        nivel_actividad: profile?.activity_level || undefined,
        objetivo: profile?.goal || undefined,
        nombre: profile?.full_name || undefined,
      }
    }

    if (!N8N_WEBHOOK_URL) {
      throw new Error('URL de webhook de n8n no configurada. Agrega VITE_N8N_WEBHOOK_URL en .env')
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Error en la llamada a n8n: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: data,
      message: 'Datos enviados exitosamente a n8n'
    }
  } catch (error) {
    console.error('Error en submitHealthData:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido al enviar datos'
    }
  }
}
