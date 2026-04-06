import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { createPersonalizedCalculator } from '../lib/personalizedNutritionCalculator'

export interface NutritionalStandard {
  nutrient_key: string
  label: string
  unit: string
  category: string
  min_survival_value: number
  min_optimal_value: number
  max_optimal_value: number | null
  description: string
}

export interface PersonalizedTarget {
  min: number
  optimal: number
}

export function useNutritionalStandards() {
  const { user } = useAuth()
  const [standards, setStandards] = useState<Map<string, NutritionalStandard>>(new Map())
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        const [standardsResult, profileResult] = await Promise.all([
          supabase.from('nutritional_standards').select('*'),
          user ? supabase.from('profiles').select('*').eq('id', user.id).single() : Promise.resolve({ data: null, error: null })
        ])

        if (standardsResult.error) throw standardsResult.error

        if (standardsResult.data) {
          const standardsMap = new Map<string, NutritionalStandard>()
          standardsResult.data.forEach((standard: any) => {
            standardsMap.set(standard.nutrient_key, {
              nutrient_key: standard.nutrient_key,
              label: standard.label,
              unit: standard.unit,
              category: standard.category,
              min_survival_value: Number(standard.min_survival_value),
              min_optimal_value: Number(standard.min_optimal_value),
              max_optimal_value: standard.max_optimal_value ? Number(standard.max_optimal_value) : null,
              description: standard.description,
            })
          })
          setStandards(standardsMap)
        }

        if (profileResult.data) {
          setUserProfile(profileResult.data)
        }
      } catch (err) {
        console.error('Error fetching nutritional data:', err)
        setError(err instanceof Error ? err.message : 'Error loading data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const getStandard = (nutrientKey: string): NutritionalStandard | undefined => {
    return standards.get(nutrientKey)
  }

  const getPersonalizedTarget = (nutrientKey: string): PersonalizedTarget => {
    const standard = standards.get(nutrientKey)

    if (!standard) {
      return { min: 0, optimal: 0 }
    }

    if (!userProfile) {
      return {
        min: standard.min_survival_value,
        optimal: standard.min_optimal_value,
      }
    }

    const calculator = createPersonalizedCalculator({
      age: userProfile.age,
      gender: userProfile.gender,
      height_cm: userProfile.height_cm,
      weight_kg: userProfile.weight_kg,
      activity_level: userProfile.activity_level,
      goal: userProfile.goal,
    })

    const personalizedTargets = calculator.calculateMicronutrients(
      nutrientKey,
      standard.min_survival_value,
      standard.min_optimal_value
    )

    return personalizedTargets
  }

  const getOptimalTarget = (nutrientKey: string): number => {
    return getPersonalizedTarget(nutrientKey).optimal
  }

  const getMinimalTarget = (nutrientKey: string): number => {
    return getPersonalizedTarget(nutrientKey).min
  }

  const getPersonalizedMacros = () => {
    if (!userProfile) {
      return {
        calories: { min: 1500, optimal: 2000 },
        protein_g: { min: 50, optimal: 150 },
        carbs_g: { min: 100, optimal: 250 },
        fat_g: { min: 40, optimal: 65 },
        fiber_g: { min: 25, optimal: 35 },
      }
    }

    const calculator = createPersonalizedCalculator({
      age: userProfile.age,
      gender: userProfile.gender,
      height_cm: userProfile.height_cm,
      weight_kg: userProfile.weight_kg,
      activity_level: userProfile.activity_level,
      goal: userProfile.goal,
    })

    return calculator.calculateMacros()
  }

  return {
    standards,
    userProfile,
    loading,
    error,
    getStandard,
    getPersonalizedTarget,
    getOptimalTarget,
    getMinimalTarget,
    getPersonalizedMacros,
  }
}
