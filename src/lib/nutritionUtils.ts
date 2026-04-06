import { NutritionalMatrix } from './database.types';

export const getNutrientValue = (
  matrix: NutritionalMatrix | null | undefined,
  category: keyof NutritionalMatrix,
  subCategory: string,
  nutrient: string
): number => {
  if (!matrix || !matrix[category]) return 0;
  const categoryData = matrix[category] as any;
  if (subCategory && categoryData[subCategory]) {
    return categoryData[subCategory][nutrient] || 0;
  }
  return categoryData[nutrient] || 0;
};

export const getMacros = (matrix: NutritionalMatrix | null | undefined) => {
  if (!matrix?.motor) {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
    };
  }

  return {
    calories: matrix.motor.calories || 0,
    protein: matrix.motor.protein_g || 0,
    carbs: matrix.motor.carbs_g || 0,
    fat: matrix.motor.fat_g || 0,
    fiber: matrix.motor.fiber_g || 0,
    sugar: matrix.motor.sugar_g || 0,
  };
};

export const getMotorNutrients = (matrix: NutritionalMatrix | null | undefined) => {
  if (!matrix?.motor) return {};
  return matrix.motor;
};

export const getCognitiveNutrients = (matrix: NutritionalMatrix | null | undefined) => {
  if (!matrix?.cognitive) return {};
  return matrix.cognitive;
};

export const getHormonalNutrients = (matrix: NutritionalMatrix | null | undefined) => {
  if (!matrix?.hormonal) return {};
  return matrix.hormonal;
};

export const getInflammationNutrients = (matrix: NutritionalMatrix | null | undefined) => {
  if (!matrix?.inflammation) return {};
  return matrix.inflammation;
};

export const createNutritionalMatrix = (data: {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  water_ml?: number;
  [key: string]: number | undefined;
}): NutritionalMatrix => {
  return {
    motor: {
      calories: data.calories || 0,
      protein_g: data.protein_g || 0,
      carbs_g: data.carbs_g || 0,
      fat_g: data.fat_g || 0,
      fiber_g: data.fiber_g || 0,
      sugar_g: data.sugar_g || 0,
      water_ml: data.water_ml || 0,
      electrolytes: {
        sodium_mg: data.sodium_mg || 0,
        potassium_mg: data.potassium_mg || 0,
        chloride_mg: data.chloride_mg || 0,
      },
      aminos_muscle: {
        leucine_mg: data.leucine_mg || 0,
        isoleucine_mg: data.isoleucine_mg || 0,
        valine_mg: data.valine_mg || 0,
        lysine_mg: data.lysine_mg || 0,
        methionine_mg: data.methionine_mg || 0,
        threonine_mg: data.threonine_mg || 0,
      },
      structure_minerals: {
        calcium_mg: data.calcium_mg || 0,
        phosphorus_mg: data.phosphorus_mg || 0,
        zinc_mg: data.zinc_mg || 0,
        magnesium_mg: data.magnesium_mg || 0,
        iron_mg: data.iron_mg || 0,
        copper_mg: data.copper_mg || 0,
      },
    },
    cognitive: {
      aminos_brain: {
        tryptophan_mg: data.tryptophan_mg || 0,
        phenylalanine_mg: data.phenylalanine_mg || 0,
        tyrosine_mg: data.tyrosine_mg || 0,
        histidine_mg: data.histidine_mg || 0,
      },
      neuro_others: {
        choline_mg: data.choline_mg || 0,
        taurine_mg: data.taurine_mg || 0,
        creatine_mg: data.creatine_mg || 0,
      },
      energy_vitamins: {
        vit_b1_thiamin_mg: data.vit_b1_thiamin_mg || 0,
        vit_b2_riboflavin_mg: data.vit_b2_riboflavin_mg || 0,
        vit_b3_niacin_mg: data.vit_b3_niacin_mg || 0,
        vit_b5_pantothenic_mg: data.vit_b5_pantothenic_mg || 0,
        vit_b6_mg: data.vit_b6_mg || 0,
        vit_b7_biotin_mcg: data.vit_b7_biotin_mcg || 0,
        vit_b12_mcg: data.vit_b12_mcg || 0,
        folate_mcg: data.folate_mcg || 0,
        vit_c_mg: data.vit_c_mg || 0,
      },
      electrolytes: {
        sodium_mg: data.sodium_mg || 0,
        potassium_mg: data.potassium_mg || 0,
      },
      trace_minerals: {
        selenium_mcg: data.selenium_mcg || 0,
        chromium_mcg: data.chromium_mcg || 0,
      },
    },
    hormonal: {
      thyroid_insulin: {
        iodine_mcg: data.iodine_mcg || 0,
        manganese_mg: data.manganese_mg || 0,
      },
      liposolubles: {
        vit_a_mcg: data.vit_a_mcg || 0,
        vit_d3_iu: data.vit_d3_iu || 0,
        vit_e_iu: data.vit_e_iu || 0,
        vit_k1_mcg: data.vit_k1_mcg || 0,
        vit_k2_mcg: data.vit_k2_mcg || 0,
      },
    },
    inflammation: {
      omega: {
        omega_3_total_mg: data.omega_3_total_mg || 0,
        epa_dha_mg: data.epa_dha_mg || 0,
        omega_6_mg: data.omega_6_mg || 0,
      },
      sat_fats: {
        saturated_g: data.saturated_g || 0,
        cholesterol_mg: data.cholesterol_mg || 0,
      },
      bioactives: {
        polyphenols_total_mg: data.polyphenols_total_mg || 0,
        anthocyanins_mg: data.anthocyanins_mg || 0,
      },
    },
    other: {
      caffeine_mg: data.caffeine_mg || 0,
      alcohol_g: data.alcohol_g || 0,
      probiotics_cfu: data.probiotics_cfu || 0,
    },
  };
};

export const sumNutritionalMatrices = (
  matrices: (NutritionalMatrix | null | undefined)[]
): NutritionalMatrix => {
  const result: NutritionalMatrix = {
    motor: {
      electrolytes: {},
      aminos_muscle: {},
      structure_minerals: {},
    },
    cognitive: {
      aminos_brain: {},
      neuro_others: {},
      energy_vitamins: {},
      electrolytes: {},
      trace_minerals: {},
    },
    hormonal: {
      thyroid_insulin: {},
      liposolubles: {},
    },
    inflammation: {
      omega: {},
      sat_fats: {},
      bioactives: {},
    },
    other: {},
  };

  const sumDeep = (target: any, source: any) => {
    if (!source) return;
    Object.entries(source).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (!target[key]) target[key] = {};
        sumDeep(target[key], value);
      } else if (typeof value === 'number') {
        target[key] = (target[key] || 0) + value;
      }
    });
  };

  matrices.forEach((matrix) => {
    if (matrix) {
      sumDeep(result, matrix);
    }
  });

  return result;
};

export const calculateNutrientPercentage = (
  current: number,
  target: number
): number => {
  if (target === 0) return 0;
  return Math.round((current / target) * 100);
};

export const formatNutrientValue = (
  value: number | undefined,
  unit: string
): string => {
  if (value === undefined || value === null) return `0${unit}`;
  return `${Math.round(value)}${unit}`;
};

export const getNutrientColor = (percentage: number): string => {
  if (percentage < 50) return 'text-danger';
  if (percentage < 80) return 'text-warning';
  if (percentage < 120) return 'text-neon-500';
  return 'text-primary-500';
};
