import { supabase } from './supabase'

export interface BarcodeLookupResult {
  success: boolean
  data?: {
    food_name: string
    quantity_g: number
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    reply_text: string
    source: string
    barcode: string
    brand?: string
    image_url?: string
  }
  error?: string
}

// Consulta barcode via edge function (server-side → OpenFoodFacts)
// Evita problemas de CORS y permite User-Agent + headers correctos
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  try {
    const clean = barcode.replace(/\D/g, '')
    if (clean.length < 8 || clean.length > 14) {
      return { success: false, error: 'Código de barras inválido' }
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return { success: false, error: 'Sesión expirada. Inicia sesión de nuevo.' }
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lookup-barcode`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ barcode: clean }),
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || `Error del servidor: ${response.status}`,
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('[barcodeService] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al buscar producto',
    }
  }
}

// Wrapper para QuickActionsBar: lookup + save ya se hace server-side
export async function scanAndSaveBarcode(
  barcode: string,
  _userId: string
): Promise<BarcodeLookupResult> {
  // La edge function ya guarda en food_logs, solo hacemos el lookup
  return lookupBarcode(barcode)
}
