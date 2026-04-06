export interface UserProfile {
  weight_kg: number
  height_cm: number
  age: number
  gender: 'male' | 'female'
  body_fat_percent?: number // Opcional: Si disponible, se usa Katch-McArdle
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'lose_weight' | 'maintain' | 'gain_muscle'
  last_night_sleep_hours?: number
  is_training_day?: boolean
}

export interface NutritionTargets {
  dia_tipo: 'DÍA ALTO (Anabólico)' | 'DÍA BAJO (Quema Grasa)'
  meta_calorias: number
  macros: {
    proteina_g: number
    grasas_g: number
    carbos_g: number
  }
  micros_objetivo: {
    vit_d3_iu: number
    magnesium_mg: number
    water_ml: number
    calcium_mg: number
    potassium_mg: number
    zinc_mg: number
    iron_mg: number
    vitamin_c_mg: number
    folate_mcg: number
    vitamin_b12_mcg: number
  }
  diagnostico: string
  bmi: number
  adjusted_weight_kg: number
  sleep_status?: {
    hours: number
    protocol: 'CRITICAL' | 'ACTIVE' | 'NORMAL'
    adjustments_applied: string
  }
  matador_protocol?: {
    is_training_day: boolean
    tdee_base: number
    deficit_applied: string
    nota_cientifica: string
  }
}

/**
 * MOTOR BIOQUÍMICO ODI PERSONALIZADO V5.0
 *
 * FILOSOFÍA:
 * - Base: ODI (Optimal Daily Intake) de Lieberman - valores realistas y científicos
 * - Personalización: Ajustes ligeros basados en características individuales
 *
 * ESTÁNDARES:
 * - Base ODI: Proteína 140g, Calorías 2500-3500, Carbos 150-300g, Grasas 70-120g
 * - Ajustes: ±15% según peso, actividad, objetivo y contexto (sueño, entrenamiento)
 * - BMR: Mifflin-St Jeor para cálculo de TDEE personalizado
 * - Protocolo MATADOR: Ciclado calórico en días de entrenamiento vs descanso
 */
export function calculateNutritionTargets(user: UserProfile): NutritionTargets {
  const sleepHours = user.last_night_sleep_hours ?? 7.5
  const isSleepDeprived = sleepHours < 6.5
  const isSevereDeprivation = sleepHours < 5.0
  const isTrainingDay = user.is_training_day ?? false

  let sleepProtocol: 'CRITICAL' | 'ACTIVE' | 'NORMAL' = 'NORMAL'
  let sleepAdjustments: string[] = []

  if (isSevereDeprivation) {
    sleepProtocol = 'CRITICAL'
  } else if (isSleepDeprived) {
    sleepProtocol = 'ACTIVE'
  }

  // ==========================================
  // 1. ANÁLISIS ANTROPOMÉTRICO
  // ==========================================
  const heightM = user.height_cm / 100
  const bmi = user.weight_kg / (heightM * heightM)
  const isObese = bmi > 30

  let adjustedWeight = user.weight_kg
  let diagnostico = `Motor ODI V5.0 (Personalizado Lieberman). BMI: ${bmi.toFixed(1)}.`

  // Ajuste Willett para obesidad (reduce sobreestimación de requerimientos)
  if (isObese) {
    const idealWeight = heightM * heightM * 22
    const excessWeight = user.weight_kg - idealWeight
    adjustedWeight = idealWeight + 0.25 * excessWeight
    diagnostico += ` Peso ajustado a ${adjustedWeight.toFixed(1)}kg (Willett).`
  }

  // ==========================================
  // 2. CÁLCULO BMR (Tasa Metabólica Basal)
  // ==========================================
  let bmr = 0

  // Use adjustedWeight for BMR (accounts for Willett adjustment in obese users)
  const bmrWeight = adjustedWeight

  if (user.body_fat_percent && user.body_fat_percent > 0) {
    // Katch-McArdle: Más precisa para composición corporal conocida
    const leanMassKg = bmrWeight * (1 - user.body_fat_percent / 100)
    bmr = 370 + (21.6 * leanMassKg)
    diagnostico += ` BMR calculado con Katch-McArdle (${user.body_fat_percent}% grasa).`
  } else {
    // Mifflin-St Jeor: Estándar clínico general (uses adjusted weight for obese)
    if (user.gender === 'male') {
      bmr = 10 * bmrWeight + 6.25 * user.height_cm - 5 * user.age + 5
    } else {
      bmr = 10 * bmrWeight + 6.25 * user.height_cm - 5 * user.age - 161
    }
    diagnostico += ` BMR: ${Math.round(bmr)} kcal (Mifflin-St Jeor).`
  }

  // ==========================================
  // 3. FACTOR PAL (Physical Activity Level)
  // FAO/WHO Standards
  // ==========================================
  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }

  let baseFactor = activityFactors[user.activity_level] || 1.55
  let dailyFactor = baseFactor

  // Ajuste dinámico por día de entrenamiento
  if (isTrainingDay) {
    // En día de entreno, aumentamos el factor (refleja gasto energético extra)
    // Cap at 2.4 to allow effect even for very_active users
    dailyFactor = Math.min(baseFactor + 0.25, 2.4)
  } else {
    // En día de descanso, bajamos ligeramente (NEAT puro sin ejercicio estructurado)
    dailyFactor = Math.max(baseFactor - 0.15, 1.2)
  }

  const tdeeBase = Math.round(bmr * dailyFactor)
  diagnostico += ` TDEE base: ${tdeeBase} kcal (PAL ${dailyFactor.toFixed(2)}).`

  // ==========================================
  // 4. AJUSTE CALÓRICO SEGÚN OBJETIVO
  // ==========================================
  let targetCalories = tdeeBase
  let caloricAdjustment = 0 // Porcentaje de ajuste
  let deficitApplied = ''
  let notaCientifica = ''

  if (user.goal === 'lose_weight') {
    // Protocolo MATADOR: Ciclado calórico no lineal
    if (isTrainingDay) {
      caloricAdjustment = -0.10 // -10% para retención muscular
      deficitApplied = '-10% (Día Alto - Retención Muscular)'
      notaCientifica = 'Protocolo Longland: Proteína alta + Energía para síntesis muscular.'
    } else {
      caloricAdjustment = -0.25 // -25% para máxima oxidación grasa
      deficitApplied = '-25% (Día Bajo - Oxidación Grasa)'
      notaCientifica = 'Protocolo MATADOR: Déficit profundo evita adaptación metabólica.'
    }
  } else if (user.goal === 'gain_muscle') {
    // Superávit para anabolismo
    if (isTrainingDay) {
      caloricAdjustment = 0.15 // +15% para síntesis muscular
      deficitApplied = '+15% (Día Alto - Anabolismo)'
      notaCientifica = 'Superávit calculado para maximizar síntesis proteica sin acumulación grasa.'
    } else {
      caloricAdjustment = 0.05 // +5% mantenimiento ligero
      deficitApplied = '+5% (Día Bajo - Mantenimiento)'
      notaCientifica = 'Superávit mínimo para recuperación sin exceso calórico.'
    }
  } else {
    // Mantenimiento (0% ajuste)
    deficitApplied = '0% (Mantenimiento)'
    notaCientifica = 'Calorías de mantenimiento según PAL establecido.'
  }

  targetCalories = Math.round(tdeeBase * (1 + caloricAdjustment))

  // ==========================================
  // 5. DISTRIBUCIÓN DE MACRONUTRIENTES (ODI PERSONALIZADO)
  // ==========================================

  // VALORES BASE ODI (Lieberman)
  const ODI_BASE = {
    protein_g: 140,
    fat_g: 70,
    carbs_g: 150,
    calories: 2500
  }

  // Factor de ajuste personalizado basado en características individuales
  let personalizationFactor = 1.0

  // Ajuste por peso (referencia: 80kg promedio)
  const weightFactor = adjustedWeight / 80
  if (weightFactor > 1.0) {
    // Si pesas más, ajustamos ligeramente hacia arriba (máximo +20%)
    personalizationFactor *= Math.min(1.0 + (weightFactor - 1.0) * 0.3, 1.2)
  } else if (weightFactor < 1.0) {
    // Si pesas menos, ajustamos ligeramente hacia abajo (máximo -15%)
    personalizationFactor *= Math.max(1.0 + (weightFactor - 1.0) * 0.3, 0.85)
  }

  // Ajuste por nivel de actividad
  const activityAdjustments: Record<string, number> = {
    sedentary: 0.90,
    light: 0.95,
    moderate: 1.00,
    active: 1.10,
    very_active: 1.20
  }
  personalizationFactor *= activityAdjustments[user.activity_level] || 1.0

  // A. PROTEÍNA - Base ODI con ajustes moderados
  let proteinTarget = ODI_BASE.protein_g * personalizationFactor

  // Ajuste por objetivo (ligero)
  if (user.goal === 'lose_weight') {
    proteinTarget *= 1.15 // +15% para proteger músculo en déficit
  } else if (user.goal === 'gain_muscle') {
    proteinTarget *= 1.10 // +10% para anabolismo
  }

  // Ajuste por sueño (moderado)
  if (isSevereDeprivation) {
    proteinTarget *= 1.15
    sleepAdjustments.push(`Proteína +15% (privación severa)`)
  } else if (isSleepDeprived) {
    proteinTarget *= 1.08
    sleepAdjustments.push(`Proteína +8% (privación moderada)`)
  }

  proteinTarget = Math.round(proteinTarget)
  diagnostico += ` Proteína ODI personalizada: ${proteinTarget}g.`

  // B. GRASAS - Base ODI con ajustes
  let fatTarget = ODI_BASE.fat_g * personalizationFactor

  // Ajuste por sueño (cerebro necesita más grasas)
  if (isSleepDeprived) {
    fatTarget *= 1.15
    sleepAdjustments.push('Grasas +15% (soporte cerebral)')
  }

  fatTarget = Math.round(fatTarget)

  // C. CARBOHIDRATOS - Ajustado por calorías objetivo y día de entrenamiento
  let carbsTarget = ODI_BASE.carbs_g * personalizationFactor

  // Ajuste por tipo de día (Protocolo MATADOR)
  if (user.goal === 'lose_weight') {
    if (isTrainingDay) {
      carbsTarget *= 1.2 // Más carbos en día de entreno (energía)
    } else {
      carbsTarget *= 0.7 // Menos carbos en día de descanso (quema grasa)
    }
  } else if (user.goal === 'gain_muscle') {
    if (isTrainingDay) {
      carbsTarget *= 1.4 // Más carbos para anabolismo
    }
  }

  // Derive carbs from remaining calories to ensure macros sum to target
  const proteinCalories = proteinTarget * 4
  const fatCalories = fatTarget * 9
  const remainingCalories = Math.max(targetCalories - proteinCalories - fatCalories, 0)
  carbsTarget = Math.round(remainingCalories / 4)

  // Safeguard cerebral: Mínimo 80g glucosa
  const MIN_CARBS_SAFETY = 80
  if (carbsTarget < MIN_CARBS_SAFETY) {
    carbsTarget = MIN_CARBS_SAFETY
    diagnostico += ' Carbos mínimos 80g (protección cerebral).'
  }

  // ==========================================
  // 6. MICRONUTRIENTES PERSONALIZADOS
  // ==========================================

  // Vitamina D3: Escalada por peso (tejido adiposo secuestra Vit D)
  let vitaminD3 = 2000
  if (user.weight_kg > 80) {
    const extraWeight = user.weight_kg - 80
    vitaminD3 = Math.min(2000 + extraWeight * 40, 10000)
  }

  // Magnesio: Aumentado en actividad alta o privación sueño (cortisol consume Mg)
  let magnesium = 400
  if (user.activity_level === 'moderate' || user.activity_level === 'active' || user.activity_level === 'very_active') {
    magnesium = user.gender === 'male' ? 600 : 500
  }
  if (isSleepDeprived) {
    magnesium = 600
    sleepAdjustments.push('Magnesio 600mg (anti-cortisol)')
  }

  // Vitamina C: Soporte adrenal en privación sueño
  let vitaminC = 90
  if (isSevereDeprivation) {
    vitaminC = 1000
    sleepAdjustments.push('Vit C 1000mg (soporte adrenal crítico)')
  } else if (isSleepDeprived) {
    vitaminC = 500
    sleepAdjustments.push('Vit C 500mg (soporte adrenal)')
  }

  const waterMl = user.weight_kg * 35
  const zinc = user.gender === 'male' ? 11 : 8  // IOM RDA
  const iron = user.gender === 'male' ? 8 : 18   // IOM RDA (men 8mg, premenopausal women 18mg)
  const calcium = user.age > 50 ? 1200 : 1000
  const potassium = 3500
  const folate = 400
  const vitaminB12 = 2.4

  // ==========================================
  // 7. DIAGNÓSTICO FINAL
  // ==========================================
  if (sleepAdjustments.length > 0) {
    diagnostico += ` ⚠️ ${sleepProtocol}: ${sleepHours}h sueño. ${sleepAdjustments.join('. ')}.`
  }

  const diaTipo = isTrainingDay ? 'DÍA ALTO (Anabólico)' : 'DÍA BAJO (Quema Grasa)'

  return {
    dia_tipo: diaTipo,
    meta_calorias: Math.round(targetCalories),
    macros: {
      proteina_g: Math.round(proteinTarget),
      grasas_g: Math.round(fatTarget),
      carbos_g: Math.round(carbsTarget),
    },
    micros_objetivo: {
      vit_d3_iu: Math.round(vitaminD3),
      magnesium_mg: Math.round(magnesium),
      water_ml: Math.round(waterMl),
      calcium_mg: calcium,
      potassium_mg: potassium,
      zinc_mg: zinc,
      iron_mg: iron,
      vitamin_c_mg: vitaminC,
      folate_mcg: folate,
      vitamin_b12_mcg: vitaminB12,
    },
    diagnostico,
    bmi: parseFloat(bmi.toFixed(1)),
    adjusted_weight_kg: parseFloat(adjustedWeight.toFixed(1)),
    sleep_status: {
      hours: sleepHours,
      protocol: sleepProtocol,
      adjustments_applied: sleepAdjustments.join('; ') || 'Ninguno (sueño óptimo)'
    },
    matador_protocol: {
      is_training_day: isTrainingDay,
      tdee_base: tdeeBase,
      deficit_applied: deficitApplied,
      nota_cientifica: notaCientifica
    }
  }
}

export function formatNutritionTargetsSummary(targets: NutritionTargets): string {
  const { dia_tipo, meta_calorias, macros, micros_objetivo, diagnostico, bmi, adjusted_weight_kg, matador_protocol } = targets

  return `
📊 METAS ODI PERSONALIZADAS - ${dia_tipo}

🎯 BMI: ${bmi} | Peso: ${adjusted_weight_kg}kg

⚡ CALORÍAS: ${meta_calorias} kcal ${matador_protocol ? `(${matador_protocol.deficit_applied})` : ''}

🥩 MACROS (Base ODI + Ajustes Individuales):
• Proteína: ${macros.proteina_g}g (${Math.round((macros.proteina_g * 4 / meta_calorias) * 100)}%)
• Grasas: ${macros.grasas_g}g (${Math.round((macros.grasas_g * 9 / meta_calorias) * 100)}%)
• Carbos: ${macros.carbos_g}g (${Math.round((macros.carbos_g * 4 / meta_calorias) * 100)}%)

💊 MICROS PERSONALIZADOS:
• Vitamina D3: ${micros_objetivo.vit_d3_iu} IU
• Magnesio: ${micros_objetivo.magnesium_mg} mg
• Agua: ${(micros_objetivo.water_ml / 1000).toFixed(1)}L
• Calcio: ${micros_objetivo.calcium_mg} mg
• Potasio: ${micros_objetivo.potassium_mg} mg

📝 DIAGNÓSTICO:
${diagnostico}

${matador_protocol ? `🔬 ${matador_protocol.nota_cientifica}` : ''}
`.trim()
}
