import { supabase } from './supabase'

export interface NutritionalStandard {
  id: number
  nutrient_key: string
  label: string
  unit: string
  min_survival_value: number
  min_optimal_value: number | null
  max_optimal_value: number | null
  category: 'energy' | 'macro' | 'vitamin' | 'mineral' | 'lipid' | 'amino' | 'bioactive'
  color_code: string
  description: string | null
}

export interface NutrientStatus {
  nutrient_key: string
  label: string
  unit: string
  current: number
  min_survival: number
  min_optimal: number | null
  max_optimal: number | null
  level: 'critical' | 'survival' | 'functional' | 'optimal'
  percentage: number
  color: string
  message: string
  description: string | null
}

let cachedStandards: NutritionalStandard[] | null = null

export async function getNutritionalStandards(): Promise<NutritionalStandard[]> {
  if (cachedStandards) {
    return cachedStandards
  }

  const { data, error } = await supabase
    .from('nutritional_standards')
    .select('*')
    .order('category', { ascending: true })

  if (error) {
    console.error('Error fetching nutritional standards:', error)
    return []
  }

  cachedStandards = data as NutritionalStandard[]
  return cachedStandards
}

export function analyzeNutrient(
  nutrientKey: string,
  currentValue: number,
  standard: NutritionalStandard
): NutrientStatus {
  const { label, unit, min_survival_value, min_optimal_value, max_optimal_value, description } = standard

  let level: NutrientStatus['level']
  let color: string
  let message: string
  let percentage: number

  const optimalTarget = min_optimal_value || min_survival_value

  // Inverted nutrients: lower is better (sugar, methionine, omega-6)
  if (nutrientKey === 'sugar_g' || nutrientKey === 'methionine_g' || nutrientKey === 'omega_6_g') {
    if (currentValue === 0) {
      level = 'optimal'
      color = '#10b981'
      message = nutrientKey === 'sugar_g'
        ? 'Cero azúcar añadido. Nivel ideal.'
        : 'Nivel mínimo alcanzado.'
      percentage = 0
    } else if (min_optimal_value && min_optimal_value > 0 && currentValue <= min_optimal_value) {
      level = 'functional'
      color = '#fbbf24'
      message = nutrientKey === 'sugar_g'
        ? 'Nivel bueno. Puedes reducir un poco más.'
        : 'Nivel aceptable. Ideal mantenerlo bajo.'
      percentage = (currentValue / (max_optimal_value || min_survival_value)) * 100
    } else if (currentValue <= min_survival_value) {
      level = 'survival'
      color = '#f59e0b'
      message = 'Consumo moderado-alto. Intenta reducir.'
      percentage = (currentValue / min_survival_value) * 100
    } else {
      level = 'critical'
      color = '#ef4444' // Red for excess (was amber — visually indistinguishable from deficiency)
      message = nutrientKey === 'sugar_g'
        ? 'Exceso alto. Reducir azúcar mejorará tu metabolismo.'
        : 'Exceso. Reducir ayudará a disminuir inflamación.'
      percentage = Math.min((currentValue / min_survival_value) * 100, 150)
    }
  } else {
    // Normal nutrients: higher is better (up to max)
    if (currentValue < min_survival_value * 0.5) {
      level = 'critical'
      color = '#ef4444'
      message = 'Nivel bajo. Considera añadir alimentos ricos en este nutriente.'
      percentage = (currentValue / min_survival_value) * 100
    } else if (currentValue < min_survival_value) {
      level = 'survival'
      color = '#f59e0b'
      message = 'Podrías beneficiarte de más de este nutriente.'
      percentage = (currentValue / min_survival_value) * 100
    } else if (min_optimal_value && currentValue < min_optimal_value) {
      level = 'functional'
      color = '#fbbf24'
      message = 'Vas bien. Un poco más te llevará al óptimo.'
      percentage = (currentValue / min_optimal_value) * 100
    } else {
      level = 'optimal'
      color = '#10b981'
      message = 'Nivel óptimo alcanzado.'
      percentage = Math.min((currentValue / optimalTarget) * 100, 150)
    }

    if (max_optimal_value && currentValue > max_optimal_value) {
      level = 'critical'
      color = '#ef4444'
      message = 'Has superado el rango óptimo. Considera moderar este nutriente.'
      percentage = 150
    }
  }

  return {
    nutrient_key: nutrientKey,
    label,
    unit,
    current: currentValue,
    min_survival: min_survival_value,
    min_optimal: min_optimal_value,
    max_optimal: max_optimal_value,
    level,
    percentage,
    color,
    message,
    description,
  }
}

export async function analyzeAllNutrients(
  dailyTotals: Record<string, number>,
  personalizedTargets?: {
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
    fiber_g?: number
  }
): Promise<NutrientStatus[]> {
  const standards = await getNutritionalStandards()
  const results: NutrientStatus[] = []

  for (const standard of standards) {
    const currentValue = dailyTotals[standard.nutrient_key] || 0

    let adjustedStandard = standard
    if (personalizedTargets) {
      const targetValue = personalizedTargets[standard.nutrient_key as keyof typeof personalizedTargets]
      if (targetValue !== undefined) {
        adjustedStandard = {
          ...standard,
          min_optimal_value: targetValue,
          min_survival_value: Math.round(targetValue * 0.8) // 80% of target = minimum acceptable
        }
      }
    }

    const status = analyzeNutrient(standard.nutrient_key, currentValue, adjustedStandard)
    results.push(status)
  }

  return results
}

export function getNutrientMapping(): Record<string, string> {
  return {
    'calories': 'calories',
    'protein_g': 'protein_g',
    'carbs_g': 'carbs_g',
    'fat_g': 'fat_g',
    'fiber_g': 'fiber_g',
    'sugar_g': 'sugar_g',
    'water_ml': 'water_ml',
    'leucine_g': 'leucine_g',
    'glycine_g': 'glycine_g',
    'methionine_g': 'methionine_g',
    'taurine_mg': 'taurine_mg',
    'tryptophan_g': 'tryptophan_g',
    'isoleucine_mg': 'isoleucine_mg',
    'valine_mg': 'valine_mg',
    'lysine_mg': 'lysine_mg',
    'phenylalanine_mg': 'phenylalanine_mg',
    'threonine_mg': 'threonine_mg',
    'histidine_mg': 'histidine_mg',
    'omega_3_total_g': 'omega_3_total_g',
    'omega_3_epa_dha_g': 'omega_3_epa_dha_g',
    'omega_6_g': 'omega_6_g',
    'sat_fat_g': 'sat_fat_g',
    'cholesterol_mg': 'cholesterol_mg',
    'vit_a_iu': 'vit_a_iu',
    'vit_c_mg': 'vitamin_c_mg',
    'vit_d3_iu': 'vit_d3_iu',
    'vit_e_iu': 'vit_e_iu',
    'vit_k_mcg': 'vitamin_k_mcg',
    'vitamin_k1_mcg': 'vitamin_k1_mcg',
    'b12_mcg': 'vitamin_b12_mcg',
    'folate_mcg': 'folate_mcg',
    'vitamin_b1_thiamin_mg': 'vitamin_b1_thiamin_mg',
    'vitamin_b2_riboflavin_mg': 'vitamin_b2_riboflavin_mg',
    'vitamin_b3_niacin_mg': 'vitamin_b3_niacin_mg',
    'vitamin_b5_pantothenic_mg': 'vitamin_b5_pantothenic_mg',
    'vitamin_b6_pyridoxine_mg': 'vitamin_b6_pyridoxine_mg',
    'vitamin_b7_biotin_mcg': 'vitamin_b7_biotin_mcg',
    'calcium_mg': 'calcium_mg',
    'magnesium_mg': 'magnesium_mg',
    'zinc_mg': 'zinc_mg',
    'potassium_mg': 'potassium_mg',
    'sodium_mg': 'sodium_mg',
    'selenium_mcg': 'selenium_mcg',
    'iron_mg': 'iron_mg',
    'chromium_mcg': 'chromium_mcg',
    'copper_mg': 'copper_mg',
    'manganese_mg': 'manganese_mg',
    'phosphorus_mg': 'phosphorus_mg',
    'iodine_mcg': 'iodine_mcg',
    'choline_mg': 'choline_mg',
    'anthocyanins_mg': 'anthocyanins_mg',
    'polyphenols_total_mg': 'polyphenols_total_mg',
  }
}
