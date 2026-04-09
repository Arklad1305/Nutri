import { supabase } from './supabase'

export interface BarcodeProduct {
  barcode: string
  food_name: string
  brand: string
  quantity_g: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  sodium_mg: number
  fat_saturated_g: number
  image_url?: string
}

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

// Consulta OpenFoodFacts por código de barras EAN/UPC
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  try {
    const cleanBarcode = barcode.replace(/\D/g, '')
    if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
      return { success: false, error: 'Código de barras inválido' }
    }

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json?fields=product_name,brands,nutriments,serving_size,product_quantity,image_front_url,image_front_small_url`
    )

    if (!response.ok) {
      return { success: false, error: `Error al consultar OpenFoodFacts: ${response.status}` }
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return {
        success: false,
        error: 'Producto no encontrado. Intenta registrarlo manualmente.',
      }
    }

    const p = data.product
    const n = p.nutriments || {}

    // OpenFoodFacts reporta per 100g por defecto
    const servingG = parseServingSize(p.serving_size) || 100
    const factor = servingG / 100

    const foodName = [p.product_name, p.brands].filter(Boolean).join(' — ')

    const product: BarcodeProduct = {
      barcode: cleanBarcode,
      food_name: foodName || `Producto ${cleanBarcode}`,
      brand: p.brands || '',
      quantity_g: servingG,
      calories: round(n['energy-kcal_100g'] * factor) || round(n['energy-kcal'] * factor) || 0,
      protein_g: round(n.proteins_100g * factor) || 0,
      carbs_g: round(n.carbohydrates_100g * factor) || 0,
      fat_g: round(n.fat_100g * factor) || 0,
      fiber_g: round(n.fiber_100g * factor) || 0,
      sugar_g: round(n.sugars_100g * factor) || 0,
      sodium_mg: round((n.sodium_100g || 0) * 1000 * factor),
      fat_saturated_g: round(n['saturated-fat_100g'] * factor) || 0,
      image_url: p.image_front_small_url || p.image_front_url,
    }

    return {
      success: true,
      data: {
        food_name: product.food_name,
        quantity_g: product.quantity_g,
        calories: product.calories,
        protein_g: product.protein_g,
        carbs_g: product.carbs_g,
        fat_g: product.fat_g,
        reply_text: `${product.food_name} (${product.quantity_g}g): ${product.calories} kcal, ${product.protein_g}g proteína, ${product.carbs_g}g carbos, ${product.fat_g}g grasa`,
        source: 'openfoodfacts-barcode',
        barcode: cleanBarcode,
        brand: product.brand,
        image_url: product.image_url,
      },
    }
  } catch (error) {
    console.error('[barcodeService] Lookup error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al buscar producto',
    }
  }
}

// Busca el producto por barcode y lo guarda en food_logs
export async function scanAndSaveBarcode(
  barcode: string,
  userId: string
): Promise<BarcodeLookupResult> {
  const result = await lookupBarcode(barcode)
  if (!result.success || !result.data) return result

  try {
    const { error: dbError } = await supabase.from('food_logs').insert({
      user_id: userId,
      food_name: result.data.food_name,
      quantity_g: result.data.quantity_g,
      calories: result.data.calories,
      protein_g: result.data.protein_g,
      carbs_g: result.data.carbs_g,
      fat_g: result.data.fat_g,
    })

    if (dbError) {
      console.error('[barcodeService] DB insert error:', dbError.message)
      return { success: false, error: 'Producto encontrado pero error al guardar' }
    }

    return result
  } catch (error) {
    console.error('[barcodeService] Save error:', error)
    return { success: false, error: 'Error al guardar el alimento' }
  }
}

function round(val: number | undefined): number {
  if (!val || isNaN(val)) return 0
  return Math.round(val * 10) / 10
}

// Parsea "30g", "250 ml", "1 barra (25g)" → número en gramos
function parseServingSize(serving?: string): number | null {
  if (!serving) return null
  const match = serving.match(/(\d+(?:[.,]\d+)?)\s*g/i)
  if (match) return parseFloat(match[1].replace(',', '.'))

  const mlMatch = serving.match(/(\d+(?:[.,]\d+)?)\s*ml/i)
  if (mlMatch) return parseFloat(mlMatch[1].replace(',', '.'))

  return null
}
