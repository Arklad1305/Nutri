/**
 * Mapa Nutriente → Alimentos
 *
 * Base de conocimiento local que relaciona nutrientes con sus mejores fuentes alimentarias.
 * Datos basados en USDA FoodData Central por 100g de porcion comestible.
 *
 * Usado para:
 * - Sugerir alimentos anti-deficit
 * - Autocompletado inteligente en despensa
 * - Enriquecer prompt de recetas con alimentos prioritarios
 * - Calcular cobertura nutricional de la despensa
 */

export interface FoodSource {
  name: string
  amount: number        // cantidad del nutriente por 100g
  category: FoodCategory
  commonPortionG: number // porcion tipica en gramos
  tags?: string[]
}

export type FoodCategory =
  | 'proteinas'
  | 'vegetales'
  | 'frutas'
  | 'granos'
  | 'lacteos'
  | 'frutos_secos'
  | 'pescados'
  | 'legumbres'
  | 'aceites'
  | 'otros'

export interface NutrientFoodEntry {
  nutrientKey: string
  label: string
  unit: string
  foods: FoodSource[]
}

// Categorias con metadata para UI
export const FOOD_CATEGORIES: Record<FoodCategory, { label: string; emoji: string; color: string }> = {
  proteinas:    { label: 'Proteinas',     emoji: '🥩', color: 'rose' },
  pescados:     { label: 'Pescados',      emoji: '🐟', color: 'blue' },
  vegetales:    { label: 'Vegetales',     emoji: '🥦', color: 'green' },
  frutas:       { label: 'Frutas',        emoji: '🍎', color: 'red' },
  granos:       { label: 'Granos',        emoji: '🌾', color: 'amber' },
  lacteos:      { label: 'Lacteos',       emoji: '🥛', color: 'sky' },
  frutos_secos: { label: 'Frutos Secos',  emoji: '🥜', color: 'yellow' },
  legumbres:    { label: 'Legumbres',     emoji: '🫘', color: 'orange' },
  aceites:      { label: 'Aceites',       emoji: '🫒', color: 'lime' },
  otros:        { label: 'Otros',         emoji: '🧂', color: 'gray' },
}

/**
 * Mapa principal: nutrient_key → top alimentos fuente
 * Cada entrada tiene los 4-8 mejores alimentos para ese nutriente
 */
export const NUTRIENT_FOOD_MAP: NutrientFoodEntry[] = [
  // ═══ MACROS ═══
  {
    nutrientKey: 'protein_g',
    label: 'Proteina',
    unit: 'g',
    foods: [
      { name: 'Pechuga de pollo',   amount: 31,   category: 'proteinas', commonPortionG: 150 },
      { name: 'Atun',               amount: 29,   category: 'pescados',  commonPortionG: 100 },
      { name: 'Carne de res magra', amount: 26,   category: 'proteinas', commonPortionG: 150 },
      { name: 'Lentejas cocidas',   amount: 9,    category: 'legumbres', commonPortionG: 200 },
      { name: 'Huevos',             amount: 13,   category: 'proteinas', commonPortionG: 50 },
      { name: 'Queso cottage',      amount: 11,   category: 'lacteos',   commonPortionG: 150 },
      { name: 'Tofu firme',         amount: 17,   category: 'proteinas', commonPortionG: 150 },
      { name: 'Garbanzos cocidos',  amount: 8.9,  category: 'legumbres', commonPortionG: 200 },
    ],
  },
  {
    nutrientKey: 'fiber_g',
    label: 'Fibra',
    unit: 'g',
    foods: [
      { name: 'Chia',                amount: 34,   category: 'frutos_secos', commonPortionG: 15 },
      { name: 'Lentejas cocidas',    amount: 7.9,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Frijoles negros',     amount: 8.7,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Avena',               amount: 10.6, category: 'granos',       commonPortionG: 40 },
      { name: 'Brocoli',             amount: 2.6,  category: 'vegetales',    commonPortionG: 150 },
      { name: 'Palta/Aguacate',      amount: 6.7,  category: 'frutas',       commonPortionG: 70 },
      { name: 'Almendras',           amount: 12.5, category: 'frutos_secos', commonPortionG: 30 },
    ],
  },

  // ═══ MINERALES ═══
  {
    nutrientKey: 'magnesium_mg',
    label: 'Magnesio',
    unit: 'mg',
    foods: [
      { name: 'Semillas de zapallo',  amount: 550,  category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Almendras',            amount: 270,  category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Espinaca cocida',      amount: 87,   category: 'vegetales',    commonPortionG: 150 },
      { name: 'Chocolate negro 85%',  amount: 228,  category: 'otros',        commonPortionG: 30 },
      { name: 'Frijoles negros',      amount: 70,   category: 'legumbres',    commonPortionG: 200 },
      { name: 'Banana',               amount: 27,   category: 'frutas',       commonPortionG: 120 },
      { name: 'Palta/Aguacate',       amount: 29,   category: 'frutas',       commonPortionG: 70 },
    ],
  },
  {
    nutrientKey: 'zinc_mg',
    label: 'Zinc',
    unit: 'mg',
    foods: [
      { name: 'Carne de res',         amount: 6.3,  category: 'proteinas',    commonPortionG: 150 },
      { name: 'Semillas de zapallo',   amount: 7.8,  category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Lentejas cocidas',      amount: 1.3,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Garbanzos cocidos',     amount: 1.5,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Huevos',                amount: 1.3,  category: 'proteinas',    commonPortionG: 50 },
      { name: 'Avena',                 amount: 3.6,  category: 'granos',       commonPortionG: 40 },
    ],
  },
  {
    nutrientKey: 'iron_mg',
    label: 'Hierro',
    unit: 'mg',
    foods: [
      { name: 'Higado de res',        amount: 6.5,  category: 'proteinas',    commonPortionG: 100 },
      { name: 'Lentejas cocidas',      amount: 3.3,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Espinaca cocida',       amount: 3.6,  category: 'vegetales',    commonPortionG: 150 },
      { name: 'Garbanzos cocidos',     amount: 2.9,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Tofu firme',            amount: 5.4,  category: 'proteinas',    commonPortionG: 150 },
      { name: 'Semillas de zapallo',   amount: 8.8,  category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Quinoa cocida',         amount: 1.5,  category: 'granos',       commonPortionG: 185 },
    ],
  },
  {
    nutrientKey: 'calcium_mg',
    label: 'Calcio',
    unit: 'mg',
    foods: [
      { name: 'Yogur natural',        amount: 110,  category: 'lacteos',      commonPortionG: 200 },
      { name: 'Queso parmesano',      amount: 1184, category: 'lacteos',      commonPortionG: 30 },
      { name: 'Sardinas en lata',     amount: 382,  category: 'pescados',     commonPortionG: 100 },
      { name: 'Espinaca cocida',      amount: 136,  category: 'vegetales',    commonPortionG: 150 },
      { name: 'Brocoli',              amount: 47,   category: 'vegetales',    commonPortionG: 150 },
      { name: 'Almendras',            amount: 269,  category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Tofu firme',           amount: 350,  category: 'proteinas',    commonPortionG: 150 },
    ],
  },
  {
    nutrientKey: 'potassium_mg',
    label: 'Potasio',
    unit: 'mg',
    foods: [
      { name: 'Banana',               amount: 358,  category: 'frutas',       commonPortionG: 120 },
      { name: 'Papa/Patata',          amount: 421,  category: 'vegetales',    commonPortionG: 200 },
      { name: 'Espinaca cocida',      amount: 466,  category: 'vegetales',    commonPortionG: 150 },
      { name: 'Palta/Aguacate',       amount: 485,  category: 'frutas',       commonPortionG: 70 },
      { name: 'Frijoles blancos',     amount: 561,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Salmon',               amount: 363,  category: 'pescados',     commonPortionG: 150 },
      { name: 'Camote/Batata',        amount: 337,  category: 'vegetales',    commonPortionG: 200 },
    ],
  },
  {
    nutrientKey: 'selenium_mcg',
    label: 'Selenio',
    unit: 'mcg',
    foods: [
      { name: 'Nuez de Brasil',       amount: 1917, category: 'frutos_secos', commonPortionG: 5, tags: ['1-2 unidades al dia'] },
      { name: 'Atun',                 amount: 80,   category: 'pescados',     commonPortionG: 100 },
      { name: 'Huevos',               amount: 30,   category: 'proteinas',    commonPortionG: 50 },
      { name: 'Pechuga de pollo',     amount: 27,   category: 'proteinas',    commonPortionG: 150 },
      { name: 'Arroz integral',       amount: 12,   category: 'granos',       commonPortionG: 195 },
    ],
  },
  {
    nutrientKey: 'phosphorus_mg',
    label: 'Fosforo',
    unit: 'mg',
    foods: [
      { name: 'Semillas de zapallo',  amount: 1233, category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Queso parmesano',      amount: 694,  category: 'lacteos',      commonPortionG: 30 },
      { name: 'Salmon',               amount: 252,  category: 'pescados',     commonPortionG: 150 },
      { name: 'Lentejas cocidas',     amount: 180,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Pechuga de pollo',     amount: 228,  category: 'proteinas',    commonPortionG: 150 },
    ],
  },
  {
    nutrientKey: 'copper_mg',
    label: 'Cobre',
    unit: 'mg',
    foods: [
      { name: 'Higado de res',        amount: 14.6, category: 'proteinas',    commonPortionG: 100 },
      { name: 'Chocolate negro 85%',  amount: 1.8,  category: 'otros',        commonPortionG: 30 },
      { name: 'Semillas de girasol',  amount: 1.8,  category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Lentejas cocidas',     amount: 0.25, category: 'legumbres',    commonPortionG: 200 },
      { name: 'Almendras',            amount: 1.0,  category: 'frutos_secos', commonPortionG: 30 },
    ],
  },
  {
    nutrientKey: 'manganese_mg',
    label: 'Manganeso',
    unit: 'mg',
    foods: [
      { name: 'Avena',                amount: 4.9,  category: 'granos',       commonPortionG: 40 },
      { name: 'Arroz integral',       amount: 1.1,  category: 'granos',       commonPortionG: 195 },
      { name: 'Espinaca cocida',      amount: 0.9,  category: 'vegetales',    commonPortionG: 150 },
      { name: 'Almendras',            amount: 2.2,  category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Pina/Anana',           amount: 0.9,  category: 'frutas',       commonPortionG: 150 },
    ],
  },
  {
    nutrientKey: 'chromium_mcg',
    label: 'Cromo',
    unit: 'mcg',
    foods: [
      { name: 'Brocoli',              amount: 11,   category: 'vegetales',    commonPortionG: 150 },
      { name: 'Avena',                amount: 5.4,  category: 'granos',       commonPortionG: 40 },
      { name: 'Papa/Patata',          amount: 3,    category: 'vegetales',    commonPortionG: 200 },
      { name: 'Pechuga de pollo',     amount: 2,    category: 'proteinas',    commonPortionG: 150 },
    ],
  },
  {
    nutrientKey: 'iodine_mcg',
    label: 'Yodo',
    unit: 'mcg',
    foods: [
      { name: 'Alga nori',            amount: 232,  category: 'vegetales',    commonPortionG: 5 },
      { name: 'Bacalao',              amount: 170,  category: 'pescados',     commonPortionG: 150 },
      { name: 'Yogur natural',        amount: 63,   category: 'lacteos',      commonPortionG: 200 },
      { name: 'Huevos',               amount: 24,   category: 'proteinas',    commonPortionG: 50 },
      { name: 'Sal yodada',           amount: 7700, category: 'otros',        commonPortionG: 1, tags: ['con moderacion'] },
    ],
  },

  // ═══ VITAMINAS LIPOSOLUBLES ═══
  {
    nutrientKey: 'vit_d3_iu',
    label: 'Vitamina D3',
    unit: 'IU',
    foods: [
      { name: 'Salmon',               amount: 526,  category: 'pescados',     commonPortionG: 150 },
      { name: 'Sardinas en lata',     amount: 272,  category: 'pescados',     commonPortionG: 100 },
      { name: 'Huevos',               amount: 82,   category: 'proteinas',    commonPortionG: 50 },
      { name: 'Atun',                 amount: 236,  category: 'pescados',     commonPortionG: 100 },
      { name: 'Hongos expuestos UV',  amount: 1136, category: 'vegetales',    commonPortionG: 80, tags: ['expuestos al sol'] },
    ],
  },
  {
    nutrientKey: 'vit_a_iu',
    label: 'Vitamina A',
    unit: 'IU',
    foods: [
      { name: 'Higado de res',        amount: 31718, category: 'proteinas',   commonPortionG: 100 },
      { name: 'Camote/Batata',        amount: 14187, category: 'vegetales',   commonPortionG: 200 },
      { name: 'Zanahoria',            amount: 16706, category: 'vegetales',   commonPortionG: 80 },
      { name: 'Espinaca cocida',      amount: 10481, category: 'vegetales',   commonPortionG: 150 },
      { name: 'Huevos',               amount: 520,   category: 'proteinas',   commonPortionG: 50 },
    ],
  },
  {
    nutrientKey: 'vit_e_iu',
    label: 'Vitamina E',
    unit: 'IU',
    foods: [
      { name: 'Semillas de girasol',  amount: 52,   category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Almendras',            amount: 39,   category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Palta/Aguacate',       amount: 3.1,  category: 'frutas',       commonPortionG: 70 },
      { name: 'Espinaca cocida',      amount: 3.0,  category: 'vegetales',    commonPortionG: 150 },
      { name: 'Aceite de oliva',      amount: 21,   category: 'aceites',      commonPortionG: 15 },
    ],
  },
  {
    nutrientKey: 'vit_k_mcg',
    label: 'Vitamina K',
    unit: 'mcg',
    foods: [
      { name: 'Kale/Col rizada',      amount: 817,  category: 'vegetales',    commonPortionG: 100 },
      { name: 'Espinaca cruda',       amount: 483,  category: 'vegetales',    commonPortionG: 50 },
      { name: 'Brocoli',              amount: 102,  category: 'vegetales',    commonPortionG: 150 },
      { name: 'Repollo',              amount: 76,   category: 'vegetales',    commonPortionG: 100 },
      { name: 'Aceite de oliva',      amount: 60,   category: 'aceites',      commonPortionG: 15 },
    ],
  },

  // ═══ VITAMINAS HIDROSOLUBLES ═══
  {
    nutrientKey: 'vit_c_mg',
    label: 'Vitamina C',
    unit: 'mg',
    foods: [
      { name: 'Pimiento rojo',        amount: 128,  category: 'vegetales',    commonPortionG: 120 },
      { name: 'Kiwi',                 amount: 93,   category: 'frutas',       commonPortionG: 75 },
      { name: 'Naranja',              amount: 53,   category: 'frutas',       commonPortionG: 150 },
      { name: 'Brocoli',              amount: 89,   category: 'vegetales',    commonPortionG: 150 },
      { name: 'Frutilla/Fresa',       amount: 59,   category: 'frutas',       commonPortionG: 150 },
      { name: 'Limon',                amount: 53,   category: 'frutas',       commonPortionG: 60 },
    ],
  },
  {
    nutrientKey: 'b12_mcg',
    label: 'Vitamina B12',
    unit: 'mcg',
    foods: [
      { name: 'Higado de res',        amount: 70.6, category: 'proteinas',    commonPortionG: 100 },
      { name: 'Sardinas en lata',     amount: 8.9,  category: 'pescados',     commonPortionG: 100 },
      { name: 'Salmon',               amount: 3.2,  category: 'pescados',     commonPortionG: 150 },
      { name: 'Atun',                 amount: 2.9,  category: 'pescados',     commonPortionG: 100 },
      { name: 'Huevos',               amount: 1.1,  category: 'proteinas',    commonPortionG: 50 },
      { name: 'Carne de res',         amount: 2.6,  category: 'proteinas',    commonPortionG: 150 },
    ],
  },
  {
    nutrientKey: 'folate_mcg',
    label: 'Folato (B9)',
    unit: 'mcg',
    foods: [
      { name: 'Higado de res',        amount: 290,  category: 'proteinas',    commonPortionG: 100 },
      { name: 'Lentejas cocidas',     amount: 181,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Espinaca cocida',      amount: 146,  category: 'vegetales',    commonPortionG: 150 },
      { name: 'Garbanzos cocidos',    amount: 172,  category: 'legumbres',    commonPortionG: 200 },
      { name: 'Palta/Aguacate',       amount: 81,   category: 'frutas',       commonPortionG: 70 },
      { name: 'Brocoli',              amount: 63,   category: 'vegetales',    commonPortionG: 150 },
    ],
  },
  {
    nutrientKey: 'vitamin_b1_thiamin_mg',
    label: 'Tiamina (B1)',
    unit: 'mg',
    foods: [
      { name: 'Semillas de girasol',  amount: 1.48, category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Cerdo magro',          amount: 0.87, category: 'proteinas',    commonPortionG: 150 },
      { name: 'Lentejas cocidas',     amount: 0.17, category: 'legumbres',    commonPortionG: 200 },
      { name: 'Avena',                amount: 0.76, category: 'granos',       commonPortionG: 40 },
    ],
  },
  {
    nutrientKey: 'vitamin_b2_riboflavin_mg',
    label: 'Riboflavina (B2)',
    unit: 'mg',
    foods: [
      { name: 'Higado de res',        amount: 2.76, category: 'proteinas',    commonPortionG: 100 },
      { name: 'Almendras',            amount: 1.14, category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Huevos',               amount: 0.46, category: 'proteinas',    commonPortionG: 50 },
      { name: 'Espinaca cocida',      amount: 0.24, category: 'vegetales',    commonPortionG: 150 },
      { name: 'Yogur natural',        amount: 0.14, category: 'lacteos',      commonPortionG: 200 },
    ],
  },
  {
    nutrientKey: 'vitamin_b3_niacin_mg',
    label: 'Niacina (B3)',
    unit: 'mg',
    foods: [
      { name: 'Pechuga de pollo',     amount: 13.7, category: 'proteinas',    commonPortionG: 150 },
      { name: 'Atun',                 amount: 18.5, category: 'pescados',     commonPortionG: 100 },
      { name: 'Salmon',               amount: 8.0,  category: 'pescados',     commonPortionG: 150 },
      { name: 'Mani/Cacahuate',       amount: 12.1, category: 'frutos_secos', commonPortionG: 30 },
    ],
  },
  {
    nutrientKey: 'vitamin_b5_pantothenic_mg',
    label: 'Acido Pantotenico (B5)',
    unit: 'mg',
    foods: [
      { name: 'Higado de res',        amount: 7.2,  category: 'proteinas',    commonPortionG: 100 },
      { name: 'Palta/Aguacate',       amount: 1.4,  category: 'frutas',       commonPortionG: 70 },
      { name: 'Huevos',               amount: 1.5,  category: 'proteinas',    commonPortionG: 50 },
      { name: 'Semillas de girasol',  amount: 7.1,  category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Brocoli',              amount: 0.57, category: 'vegetales',    commonPortionG: 150 },
    ],
  },
  {
    nutrientKey: 'vitamin_b6_pyridoxine_mg',
    label: 'Piridoxina (B6)',
    unit: 'mg',
    foods: [
      { name: 'Pechuga de pollo',     amount: 0.85, category: 'proteinas',    commonPortionG: 150 },
      { name: 'Salmon',               amount: 0.64, category: 'pescados',     commonPortionG: 150 },
      { name: 'Banana',               amount: 0.37, category: 'frutas',       commonPortionG: 120 },
      { name: 'Papa/Patata',          amount: 0.30, category: 'vegetales',    commonPortionG: 200 },
      { name: 'Garbanzos cocidos',    amount: 0.14, category: 'legumbres',    commonPortionG: 200 },
    ],
  },
  {
    nutrientKey: 'vitamin_b7_biotin_mcg',
    label: 'Biotina (B7)',
    unit: 'mcg',
    foods: [
      { name: 'Huevos',               amount: 20,   category: 'proteinas',    commonPortionG: 50 },
      { name: 'Almendras',            amount: 14.7, category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Camote/Batata',        amount: 4.6,  category: 'vegetales',    commonPortionG: 200 },
      { name: 'Salmon',               amount: 5.0,  category: 'pescados',     commonPortionG: 150 },
    ],
  },
  {
    nutrientKey: 'choline_mg',
    label: 'Colina',
    unit: 'mg',
    foods: [
      { name: 'Huevos',               amount: 294,  category: 'proteinas',    commonPortionG: 50 },
      { name: 'Higado de res',        amount: 418,  category: 'proteinas',    commonPortionG: 100 },
      { name: 'Salmon',               amount: 91,   category: 'pescados',     commonPortionG: 150 },
      { name: 'Pechuga de pollo',     amount: 85,   category: 'proteinas',    commonPortionG: 150 },
      { name: 'Brocoli',              amount: 40,   category: 'vegetales',    commonPortionG: 150 },
    ],
  },

  // ═══ LIPIDOS ═══
  {
    nutrientKey: 'omega_3_total_g',
    label: 'Omega-3 Total',
    unit: 'g',
    foods: [
      { name: 'Salmon',               amount: 2.3,  category: 'pescados',     commonPortionG: 150 },
      { name: 'Sardinas en lata',     amount: 1.5,  category: 'pescados',     commonPortionG: 100 },
      { name: 'Chia',                 amount: 17.8, category: 'frutos_secos', commonPortionG: 15 },
      { name: 'Linaza/Semilla lino',  amount: 22.8, category: 'frutos_secos', commonPortionG: 10 },
      { name: 'Nueces',               amount: 9.1,  category: 'frutos_secos', commonPortionG: 30 },
      { name: 'Atun',                 amount: 1.3,  category: 'pescados',     commonPortionG: 100 },
    ],
  },
  {
    nutrientKey: 'omega_3_epa_dha_g',
    label: 'Omega-3 EPA+DHA',
    unit: 'g',
    foods: [
      { name: 'Salmon',               amount: 1.8,  category: 'pescados',     commonPortionG: 150 },
      { name: 'Sardinas en lata',     amount: 1.1,  category: 'pescados',     commonPortionG: 100 },
      { name: 'Atun',                 amount: 0.9,  category: 'pescados',     commonPortionG: 100 },
      { name: 'Caballa',              amount: 1.6,  category: 'pescados',     commonPortionG: 100 },
    ],
  },

  // ═══ AMINOACIDOS ═══
  {
    nutrientKey: 'leucine_g',
    label: 'Leucina',
    unit: 'g',
    foods: [
      { name: 'Pechuga de pollo',     amount: 2.4,  category: 'proteinas',    commonPortionG: 150 },
      { name: 'Carne de res',         amount: 2.1,  category: 'proteinas',    commonPortionG: 150 },
      { name: 'Atun',                 amount: 2.2,  category: 'pescados',     commonPortionG: 100 },
      { name: 'Huevos',               amount: 1.1,  category: 'proteinas',    commonPortionG: 50 },
      { name: 'Lentejas cocidas',     amount: 0.65, category: 'legumbres',    commonPortionG: 200 },
      { name: 'Queso parmesano',      amount: 3.5,  category: 'lacteos',      commonPortionG: 30 },
    ],
  },

  // ═══ BIOACTIVOS ═══
  {
    nutrientKey: 'polyphenols_total_mg',
    label: 'Polifenoles',
    unit: 'mg',
    foods: [
      { name: 'Arandanos',            amount: 560,  category: 'frutas',       commonPortionG: 100 },
      { name: 'Chocolate negro 85%',  amount: 1664, category: 'otros',        commonPortionG: 30 },
      { name: 'Te verde',             amount: 89,   category: 'otros',        commonPortionG: 240, tags: ['por taza'] },
      { name: 'Aceite de oliva EV',   amount: 62,   category: 'aceites',      commonPortionG: 15 },
      { name: 'Frutilla/Fresa',       amount: 235,  category: 'frutas',       commonPortionG: 150 },
      { name: 'Nueces',               amount: 1576, category: 'frutos_secos', commonPortionG: 30 },
    ],
  },
  {
    nutrientKey: 'anthocyanins_mg',
    label: 'Antocianinas',
    unit: 'mg',
    foods: [
      { name: 'Arandanos',            amount: 163,  category: 'frutas',       commonPortionG: 100 },
      { name: 'Cereza',               amount: 122,  category: 'frutas',       commonPortionG: 100 },
      { name: 'Uva negra',            amount: 120,  category: 'frutas',       commonPortionG: 100 },
      { name: 'Repollo morado',       amount: 36,   category: 'vegetales',    commonPortionG: 100 },
      { name: 'Frutilla/Fresa',       amount: 33,   category: 'frutas',       commonPortionG: 150 },
    ],
  },

  // ═══ HIDRATACION ═══
  {
    nutrientKey: 'water_ml',
    label: 'Agua',
    unit: 'ml',
    foods: [
      { name: 'Pepino',               amount: 95,   category: 'vegetales',    commonPortionG: 200 },
      { name: 'Sandia',               amount: 91,   category: 'frutas',       commonPortionG: 300 },
      { name: 'Tomate',               amount: 94,   category: 'vegetales',    commonPortionG: 150 },
      { name: 'Lechuga',              amount: 96,   category: 'vegetales',    commonPortionG: 100 },
      { name: 'Naranja',              amount: 87,   category: 'frutas',       commonPortionG: 150 },
    ],
  },
]

// ═══ FUNCIONES DE CONSULTA ═══

/** Obtener alimentos recomendados para un nutriente especifico */
export function getFoodsForNutrient(nutrientKey: string): FoodSource[] {
  const entry = NUTRIENT_FOOD_MAP.find(e => e.nutrientKey === nutrientKey)
  return entry?.foods || []
}

/** Obtener alimentos anti-deficit: cruza deficits con mejores fuentes */
export function getAntiDeficitFoods(
  deficits: Array<{ nutrient: string; status: string; current: number; target: number; unit?: string }>
): Array<{
  food: FoodSource
  coversNutrients: Array<{ nutrientKey: string; label: string; amountPerPortion: number; unit: string }>
  score: number
}> {
  // Mapear nombres de nutrientes a nutrient keys (fuzzy match)
  const nutrientKeyMap = new Map<string, { key: string; deficit: typeof deficits[0] }>()
  for (const d of deficits) {
    const entry = NUTRIENT_FOOD_MAP.find(e =>
      e.label.toLowerCase() === d.nutrient.toLowerCase() ||
      e.nutrientKey === d.nutrient
    )
    if (entry) {
      nutrientKeyMap.set(entry.nutrientKey, { key: entry.nutrientKey, deficit: d })
    }
  }

  // Puntuar cada alimento por cuantos deficits cubre y con que intensidad
  const foodScores = new Map<string, {
    food: FoodSource
    coversNutrients: Array<{ nutrientKey: string; label: string; amountPerPortion: number; unit: string }>
    score: number
  }>()

  for (const entry of NUTRIENT_FOOD_MAP) {
    const matched = nutrientKeyMap.get(entry.nutrientKey)
    if (!matched) continue

    const deficit = matched.deficit
    const severityMultiplier = deficit.status === 'critical' ? 3 : deficit.status === 'survival' ? 2 : 1

    for (const food of entry.foods) {
      const portionAmount = (food.amount / 100) * food.commonPortionG
      const percentOfTarget = deficit.target > 0 ? (portionAmount / deficit.target) * 100 : 0

      const existing = foodScores.get(food.name)
      const nutrientCoverage = {
        nutrientKey: entry.nutrientKey,
        label: entry.label,
        amountPerPortion: Math.round(portionAmount * 10) / 10,
        unit: entry.unit,
      }

      if (existing) {
        existing.coversNutrients.push(nutrientCoverage)
        existing.score += percentOfTarget * severityMultiplier
      } else {
        foodScores.set(food.name, {
          food,
          coversNutrients: [nutrientCoverage],
          score: percentOfTarget * severityMultiplier,
        })
      }
    }
  }

  // Ordenar por score (alimentos que cubren mas deficits y mas severamente primero)
  return Array.from(foodScores.values())
    .sort((a, b) => b.score - a.score)
}

/** Obtener todos los nombres de alimentos unicos (para autocompletado) */
export function getAllFoodNames(): string[] {
  const names = new Set<string>()
  for (const entry of NUTRIENT_FOOD_MAP) {
    for (const food of entry.foods) {
      names.add(food.name)
    }
  }
  return Array.from(names).sort()
}

/** Buscar alimentos por nombre (fuzzy, para autocompletado) */
export function searchFoods(query: string): FoodSource[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  const seen = new Set<string>()
  const results: FoodSource[] = []

  for (const entry of NUTRIENT_FOOD_MAP) {
    for (const food of entry.foods) {
      if (!seen.has(food.name) && food.name.toLowerCase().includes(q)) {
        seen.add(food.name)
        results.push(food)
      }
    }
  }
  return results
}

/** Calcular que nutrientes aporta un alimento especifico */
export function getNutrientsForFood(foodName: string): Array<{
  nutrientKey: string
  label: string
  unit: string
  amountPer100g: number
}> {
  const results: Array<{ nutrientKey: string; label: string; unit: string; amountPer100g: number }> = []
  const nameLower = foodName.toLowerCase()

  for (const entry of NUTRIENT_FOOD_MAP) {
    for (const food of entry.foods) {
      if (food.name.toLowerCase() === nameLower) {
        results.push({
          nutrientKey: entry.nutrientKey,
          label: entry.label,
          unit: entry.unit,
          amountPer100g: food.amount,
        })
        break
      }
    }
  }
  return results
}
