/**
 * Pantry Service v2
 *
 * Servicio dedicado para gestion de despensa con inteligencia nutricional.
 * Conecta despensa del usuario con deficits y alimentos recomendados.
 */

import { supabase } from './supabase'
import {
  getAntiDeficitFoods,
  searchFoods,
  getNutrientsForFood,
  type FoodSource,
  type FoodCategory,
} from './nutrientFoodMap'
import type { RecipeDeficit } from './recipeService'

// ═══ TIPOS ═══

export interface PantryItem {
  id: number
  user_id: string
  name: string
  quantity: number | null
  unit: string | null
  category: FoodCategory | string | null
  created_at: string
  updated_at: string
}

export interface AntiDeficitFood {
  food: FoodSource
  coversNutrients: Array<{
    nutrientKey: string
    label: string
    amountPerPortion: number
    unit: string
  }>
  score: number
  inPantry: boolean
  pantryItemId?: number
}

export interface PantryNutrientCoverage {
  nutrientKey: string
  label: string
  unit: string
  coveredByPantry: number
  target: number
  percentCovered: number
  contributingItems: Array<{ name: string; amount: number }>
}

// ═══ CRUD MEJORADO ═══

export async function fetchPantryItems(userId: string): Promise<PantryItem[]> {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching pantry:', error)
    return []
  }
  return data || []
}

export async function addPantryItem(
  userId: string,
  name: string,
  quantity?: number,
  unit?: string,
  category?: string
): Promise<PantryItem | null> {
  // Intentar auto-detectar categoria desde el mapa de alimentos
  let detectedCategory = category
  if (!detectedCategory) {
    const nutrients = getNutrientsForFood(name)
    if (nutrients.length > 0) {
      const foodMatch = searchFoods(name).find(f => f.name.toLowerCase() === name.toLowerCase())
      if (foodMatch) {
        detectedCategory = foodMatch.category
      }
    }
  }

  const { data, error } = await supabase
    .from('pantry_items')
    .insert([{
      user_id: userId,
      name: name.trim(),
      quantity: quantity ?? null,
      unit: unit ?? null,
      category: detectedCategory ?? null,
    }])
    .select()
    .single()

  if (error) {
    console.error('Error adding pantry item:', error)
    return null
  }
  return data
}

export async function updatePantryItem(
  userId: string,
  itemId: number,
  updates: { name?: string; quantity?: number | null; unit?: string | null; category?: string | null }
): Promise<boolean> {
  const { error } = await supabase
    .from('pantry_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating pantry item:', error)
    return false
  }
  return true
}

export async function deletePantryItem(userId: string, itemId: number): Promise<boolean> {
  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting pantry item:', error)
    return false
  }
  return true
}

// ═══ INTELIGENCIA NUTRICIONAL ═══

/**
 * Obtener alimentos anti-deficit cruzados con la despensa del usuario.
 * Marca cuales ya tiene el usuario en su despensa.
 */
export function getAntiDeficitFoodsWithPantry(
  deficits: RecipeDeficit[],
  pantryItems: PantryItem[]
): AntiDeficitFood[] {
  const antiDeficitFoods = getAntiDeficitFoods(deficits)

  return antiDeficitFoods.map(item => {
    // Buscar si el usuario ya tiene este alimento (fuzzy match)
    const pantryMatch = pantryItems.find(p =>
      p.name.toLowerCase() === item.food.name.toLowerCase() ||
      item.food.name.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(item.food.name.toLowerCase())
    )

    return {
      ...item,
      inPantry: !!pantryMatch,
      pantryItemId: pantryMatch?.id,
    }
  })
}

/**
 * Calcular cobertura nutricional de la despensa actual.
 * Estima cuanto de cada deficit puede cubrir lo que el usuario ya tiene.
 */
export function calculatePantryCoverage(
  deficits: RecipeDeficit[],
  pantryItems: PantryItem[]
): PantryNutrientCoverage[] {
  const coverage: PantryNutrientCoverage[] = []

  for (const deficit of deficits) {
    const contributingItems: Array<{ name: string; amount: number }> = []
    let totalCovered = 0

    for (const item of pantryItems) {
      const nutrients = getNutrientsForFood(item.name)
      const match = nutrients.find(n =>
        n.label.toLowerCase() === deficit.nutrient.toLowerCase() ||
        n.nutrientKey === deficit.nutrient
      )
      if (match) {
        // Si tiene cantidad, calcular exacto. Si no, asumir 1 porcion tipica
        const foodMatch = searchFoods(item.name).find(f =>
          f.name.toLowerCase() === item.name.toLowerCase()
        )
        const portionG = foodMatch?.commonPortionG || 100
        const amountFromItem = (match.amountPer100g / 100) * portionG
        totalCovered += amountFromItem
        contributingItems.push({ name: item.name, amount: Math.round(amountFromItem * 10) / 10 })
      }
    }

    coverage.push({
      nutrientKey: deficit.nutrient,
      label: deficit.nutrient,
      unit: deficit.unit || '',
      coveredByPantry: Math.round(totalCovered * 10) / 10,
      target: deficit.target,
      percentCovered: deficit.target > 0 ? Math.round((totalCovered / deficit.target) * 100) : 0,
      contributingItems,
    })
  }

  return coverage.sort((a, b) => a.percentCovered - b.percentCovered)
}

/**
 * Autocompletar nombre de ingrediente.
 * Busca en el mapa de alimentos + items existentes del usuario.
 */
export function autocompletePantryInput(
  query: string,
  existingItems: PantryItem[]
): Array<{ name: string; category: FoodCategory | null; isInPantry: boolean }> {
  if (!query || query.length < 2) return []

  const q = query.toLowerCase()
  const results = new Map<string, { name: string; category: FoodCategory | null; isInPantry: boolean }>()

  // Buscar en mapa de alimentos
  const foodMatches = searchFoods(query)
  for (const food of foodMatches) {
    const inPantry = existingItems.some(p =>
      p.name.toLowerCase() === food.name.toLowerCase()
    )
    results.set(food.name.toLowerCase(), {
      name: food.name,
      category: food.category,
      isInPantry: inPantry,
    })
  }

  // Buscar en items existentes del usuario (por si tiene algo custom)
  for (const item of existingItems) {
    if (item.name.toLowerCase().includes(q) && !results.has(item.name.toLowerCase())) {
      results.set(item.name.toLowerCase(), {
        name: item.name,
        category: (item.category as FoodCategory) || null,
        isInPantry: true,
      })
    }
  }

  return Array.from(results.values())
    .sort((a, b) => {
      // Items ya en despensa al final (evitar duplicados)
      if (a.isInPantry !== b.isInPantry) return a.isInPantry ? 1 : -1
      return a.name.localeCompare(b.name)
    })
    .slice(0, 10)
}

/**
 * Importar alimentos desde food_logs recientes.
 * Sugiere alimentos que el usuario ya registro para agregar a despensa.
 */
export async function suggestFromFoodLogs(
  userId: string,
  existingItems: PantryItem[],
  days: number = 14
): Promise<Array<{ name: string; frequency: number }>> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('food_logs')
    .select('food_name')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  if (error || !data) return []

  // Contar frecuencia de cada alimento
  const freq = new Map<string, number>()
  for (const log of data) {
    const name = (log.food_name || '').trim()
    if (!name) continue
    freq.set(name, (freq.get(name) || 0) + 1)
  }

  // Filtrar los que ya estan en despensa
  const existingNames = new Set(existingItems.map(p => p.name.toLowerCase()))

  return Array.from(freq.entries())
    .filter(([name]) => !existingNames.has(name.toLowerCase()))
    .map(([name, frequency]) => ({ name, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 15)
}

/**
 * Construir contexto enriquecido para el prompt de recetas.
 * En vez de pasar solo nombres, pasa alimentos con su aporte nutricional.
 */
export function buildRecipeContext(
  selectedItems: PantryItem[],
  deficits: RecipeDeficit[]
): string {
  if (selectedItems.length === 0) return ''

  let context = 'INGREDIENTES DISPONIBLES DEL USUARIO:\n'
  for (const item of selectedItems) {
    const nutrients = getNutrientsForFood(item.name)
    const qty = item.quantity && item.unit ? ` (${item.quantity} ${item.unit})` : ''
    if (nutrients.length > 0) {
      const nutrientStr = nutrients
        .slice(0, 3)
        .map(n => `${n.label}: ${n.amountPer100g}${n.unit}/100g`)
        .join(', ')
      context += `- ${item.name}${qty} [${nutrientStr}]\n`
    } else {
      context += `- ${item.name}${qty}\n`
    }
  }

  // Identificar que deficits cubren los ingredientes seleccionados
  const deficitNames = new Set(deficits.map(d => d.nutrient.toLowerCase()))
  const coveredBySelection: string[] = []

  for (const item of selectedItems) {
    const nutrients = getNutrientsForFood(item.name)
    for (const n of nutrients) {
      if (deficitNames.has(n.label.toLowerCase())) {
        coveredBySelection.push(`${item.name} aporta ${n.label}`)
      }
    }
  }

  if (coveredBySelection.length > 0) {
    context += '\nINGREDIENTES QUE CUBREN DEFICITS:\n'
    for (const c of coveredBySelection) {
      context += `- ${c}\n`
    }
  }

  return context
}
