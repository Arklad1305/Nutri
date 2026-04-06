interface UserMetrics {
  age: number
  gender: 'male' | 'female' | 'other'
  height_cm: number
  weight_kg: number
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'lose' | 'maintain' | 'gain'
}

interface NutritionTargets {
  calories: { min: number; optimal: number }
  protein_g: { min: number; optimal: number }
  carbs_g: { min: number; optimal: number }
  fat_g: { min: number; optimal: number }
  fiber_g: { min: number; optimal: number }
}

export class PersonalizedNutritionCalculator {
  private metrics: UserMetrics

  constructor(metrics: UserMetrics) {
    this.metrics = metrics
  }

  calculateBMR(): number {
    const { age, gender, height_cm, weight_kg } = this.metrics

    if (gender === 'male') {
      return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    } else if (gender === 'female') {
      return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    } else {
      return 10 * weight_kg + 6.25 * height_cm - 5 * age - 78
    }
  }

  private getActivityMultiplier(): number {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    }
    return multipliers[this.metrics.activity_level] || 1.55
  }

  calculateTDEE(): number {
    return Math.round(this.calculateBMR() * this.getActivityMultiplier())
  }

  private adjustCaloriesForGoal(tdee: number): number {
    const { goal } = this.metrics

    if (goal === 'lose') {
      return Math.round(tdee * 0.8)
    } else if (goal === 'gain') {
      return Math.round(tdee * 1.15)
    }
    return tdee
  }

  calculateMacros(): NutritionTargets {
    const bmr = this.calculateBMR()
    const tdee = this.calculateTDEE()
    const targetCalories = this.adjustCaloriesForGoal(tdee)
    const { weight_kg, activity_level, goal } = this.metrics

    const minProteinPerKg = 0.8
    const optimalProteinPerKg = activity_level === 'sedentary' ? 1.6 :
                               activity_level === 'light' ? 1.8 :
                               activity_level === 'moderate' ? 2.0 :
                               activity_level === 'active' ? 2.2 : 2.4

    const proteinMin = Math.round(weight_kg * minProteinPerKg)
    const proteinOptimal = Math.round(weight_kg * optimalProteinPerKg)

    const proteinCalories = proteinOptimal * 4

    const fatMinPerKg = 0.5
    const fatOptimalPerKg = 1.0
    const fatMin = Math.round(weight_kg * fatMinPerKg)
    const fatOptimal = Math.round(weight_kg * fatOptimalPerKg)
    const fatCalories = fatOptimal * 9

    const remainingCalories = targetCalories - proteinCalories - fatCalories
    const carbsOptimal = Math.round(remainingCalories / 4)

    const carbsMin = goal === 'lose' ? 50 : 100

    const fiberMin = 25
    const fiberOptimal = Math.round(targetCalories / 1000 * 14)

    return {
      calories: {
        min: Math.round(bmr),
        optimal: targetCalories,
      },
      protein_g: {
        min: proteinMin,
        optimal: proteinOptimal,
      },
      carbs_g: {
        min: carbsMin,
        optimal: Math.max(carbsOptimal, carbsMin),
      },
      fat_g: {
        min: fatMin,
        optimal: fatOptimal,
      },
      fiber_g: {
        min: fiberMin,
        optimal: fiberOptimal,
      },
    }
  }

  calculateMicronutrients(nutrientKey: string, baseMinimal: number, baseOptimal: number): { min: number; optimal: number } {
    const { weight_kg, activity_level, gender, age } = this.metrics

    const weightBasedNutrients = [
      'vitamin_d_mcg',
      'vitamin_e_iu',
      'magnesium_mg',
      'zinc_mg',
      'omega_3_total_g',
      'choline_mg',
    ]

    if (weightBasedNutrients.includes(nutrientKey)) {
      const multiplier = weight_kg / 70
      return {
        min: Math.round(baseMinimal * multiplier),
        optimal: Math.round(baseOptimal * multiplier),
      }
    }

    if (nutrientKey === 'iron_mg') {
      if (gender === 'female' && age >= 19 && age <= 50) {
        return { min: 18, optimal: 25 }
      }
      return { min: 8, optimal: 15 }
    }

    if (nutrientKey === 'calcium_mg') {
      if (age >= 50) {
        return { min: 1200, optimal: 1500 }
      }
      return { min: 1000, optimal: 1200 }
    }

    if (activity_level === 'active' || activity_level === 'very_active') {
      return {
        min: Math.round(baseMinimal * 1.2),
        optimal: Math.round(baseOptimal * 1.3),
      }
    }

    return {
      min: baseMinimal,
      optimal: baseOptimal,
    }
  }

  calculateWaterIntake(): { min: number; optimal: number } {
    const { weight_kg, activity_level } = this.metrics

    const baseWater = weight_kg * 30

    const activityBonus =
      activity_level === 'very_active' ? 1000 :
      activity_level === 'active' ? 750 :
      activity_level === 'moderate' ? 500 : 250

    return {
      min: Math.round(baseWater),
      optimal: Math.round(baseWater + activityBonus),
    }
  }

  calculateProteinQuality(): {
    leucine_mg: { min: number; optimal: number }
    totalEAA_g: { min: number; optimal: number }
  } {
    const { weight_kg } = this.metrics

    const leucinePerKg = 39
    const leucineOptimalPerKg = 55

    return {
      leucine_mg: {
        min: Math.round(weight_kg * leucinePerKg),
        optimal: Math.round(weight_kg * leucineOptimalPerKg),
      },
      totalEAA_g: {
        min: Math.round(weight_kg * 0.3),
        optimal: Math.round(weight_kg * 0.5),
      },
    }
  }
}

export function createPersonalizedCalculator(userMetrics: Partial<UserMetrics>): PersonalizedNutritionCalculator {
  const defaults: UserMetrics = {
    age: userMetrics.age || 30,
    gender: (userMetrics.gender as 'male' | 'female' | 'other') || 'other',
    height_cm: userMetrics.height_cm || 170,
    weight_kg: userMetrics.weight_kg || 70,
    activity_level: (userMetrics.activity_level as any) || 'moderate',
    goal: (userMetrics.goal as any) || 'maintain',
  }

  return new PersonalizedNutritionCalculator(defaults)
}
