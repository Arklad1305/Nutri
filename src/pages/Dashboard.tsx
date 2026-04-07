import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ClipboardList, Moon, Zap, Dumbbell, ChevronRight, Activity } from 'lucide-react'
import { FoodLogList } from '../components/FoodLogList'
import { WaterTracker } from '../components/WaterTracker'
import { MetabolicStateCard } from '../components/MetabolicStateCard'
import { QuickSleepEditor } from '../components/QuickSleepEditor'
import { ActivityTracker } from '../components/ActivityTracker'
import DayTypeSelector from '../components/DayTypeSelector'
import { HeroHeader } from '../components/HeroHeader'
import { MacroRing } from '../components/MacroRing'
import { QuickActionsBar } from '../components/QuickActionsBar'
import { AddFoodModal } from '../components/AddFoodModal'
import { analyzeAllNutrients } from '../lib/nutritionStandards'
import { calculateNutritionTargets } from '../lib/nutritionTargetCalculator'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface DailyGoals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  water_ml: number
}

interface DailyTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
}

export function Dashboard() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<DailyGoals | null>(null)
  const [totals, setTotals] = useState<DailyTotals>({
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
  })
  const [waterIntake, setWaterIntake] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [sleepHours, setSleepHours] = useState<number | null>(null)
  const [isTrainingDay, setIsTrainingDay] = useState<boolean>(false)
  const [activities, setActivities] = useState<any[]>([])
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [profileName, setProfileName] = useState<string>('')
  const dashRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  const toggleCard = (id: string) => setExpandedCard(prev => prev === id ? null : id)

  useGSAP(() => {
    if (reducedMotion || !dashRef.current || !goals) return

    const sections = dashRef.current.querySelectorAll('.dash-section')
    if (sections.length === 0) return

    gsap.from(sections, {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.6,
      ease: 'power3.out',
    })
  }, { scope: dashRef, dependencies: [goals, reducedMotion], revertOnUpdate: true })

  useEffect(() => {
    if (user) {
      loadDailyActivity()
      loadSleepData()
      loadActivities()
    }
  }, [user])

  useEffect(() => {
    if (user && sleepHours !== null) {
      loadGoals()
      loadTodayTotals()
      loadWaterIntake()
    }
  }, [user, refreshKey, isTrainingDay, sleepHours])

  const loadDailyActivity = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('daily_activity')
      .select('is_training_day')
      .eq('user_id', user!.id)
      .eq('date', today)
      .maybeSingle()

    if (data) {
      setIsTrainingDay(data.is_training_day)
    }
  }

  const updateDailyActivity = async (isTraining: boolean) => {
    const today = format(new Date(), 'yyyy-MM-dd')

    const { error } = await supabase
      .from('daily_activity')
      .upsert({
        user_id: user!.id,
        date: today,
        is_training_day: isTraining,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date'
      })

    if (!error) {
      setIsTrainingDay(isTraining)
    }
  }

  const loadGoals = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .maybeSingle()

    if (profileData?.full_name) {
      setProfileName(profileData.full_name.split(' ')[0])
    }

    if (profileData && profileData.weight_kg && profileData.height_cm && profileData.age) {
      const goalMapping: Record<string, 'lose_weight' | 'maintain' | 'gain_muscle'> = {
        'lose_weight': 'lose_weight',
        'lose_fat': 'lose_weight',
        'maintain': 'maintain',
        'gain_muscle': 'gain_muscle',
        'build_muscle': 'gain_muscle',
        'biohacking_focus': 'maintain'
      }

      const userGoal = profileData.goal || 'maintain'

      const targets = calculateNutritionTargets({
        weight_kg: profileData.weight_kg,
        height_cm: profileData.height_cm,
        age: profileData.age,
        gender: (profileData.gender || 'male') as 'male' | 'female',
        activity_level: (profileData.activity_level || 'moderate') as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
        goal: goalMapping[userGoal] || 'maintain',
        last_night_sleep_hours: sleepHours ?? undefined,
        is_training_day: isTrainingDay
      })

      setGoals({
        calories: targets.meta_calorias,
        protein_g: targets.macros.proteina_g,
        carbs_g: targets.macros.carbos_g,
        fat_g: targets.macros.grasas_g,
        fiber_g: 30,
        water_ml: targets.micros_objetivo.water_ml,
      })
      return
    }

    setGoals({
      calories: 2000,
      protein_g: 150,
      carbs_g: 250,
      fat_g: 65,
      fiber_g: 30,
      water_ml: 2000,
    })
  }

  const loadTodayTotals = async () => {
    const today = new Date()
    const start = startOfDay(today).toISOString()
    const end = endOfDay(today).toISOString()

    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', start)
      .lte('logged_at', end)

    if (data) {
      const totals = data.reduce(
        (acc, log) => {
          // Use VIP columns directly
          const calories = Number(log.calories) || 0;
          const protein = Number(log.protein_g) || 0;
          const carbs = Number(log.carbs_g) || 0;
          const fat = Number(log.fat_g) || 0;

          // Fiber is now in nutritional_matrix only
          const matrix = log.nutritional_matrix as any;
          const fiber = matrix?.motor?.fiber_g || 0;

          return {
            calories: acc.calories + calories,
            protein_g: acc.protein_g + protein,
            carbs_g: acc.carbs_g + carbs,
            fat_g: acc.fat_g + fat,
            fiber_g: acc.fiber_g + fiber,
          };
        },
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
      )
      setTotals(totals)

      // Analyze nutrients against standards (including from nutritional_matrix)
      // STRATEGY: For each nutrient, prefer VIP column if present; fallback to matrix.
      // Within matrix, each nutrient is counted from ONE subsystem only (no cross-subsystem sums).

      // Initialize accumulators for nutritional_matrix nutrients
      let omega3Total = 0
      let omega3EpaDha = 0
      let omega6Total = 0
      let satFatTotal = 0
      let cholesterolTotal = 0
      let seleniumTotal = 0
      let chromiumTotal = 0
      let sodiumTotal = 0
      let polyphenolsTotal = 0
      let leucineTotal = 0
      let glycineTotal = 0
      let methionineTotal = 0
      let taurineTotal = 0
      let tryptophanTotal = 0
      let vitETotal = 0
      let folateTotal = 0
      let zincTotal = 0
      let magnesiumTotal = 0
      let potassiumTotal = 0
      let ironTotal = 0
      let isoleucineTotal = 0
      let valineTotal = 0
      let lysineTotal = 0
      let threonineTotal = 0
      let phenylalanineTotal = 0
      let tyrosineTotal = 0
      let histidineTotal = 0
      let creatineTotal = 0
      let calciumTotal = 0
      let phosphorusTotal = 0
      let copperTotal = 0
      let manganeseTotal = 0
      let iodineTotal = 0
      let vitB1Total = 0
      let vitB2Total = 0
      let vitB3Total = 0
      let vitB5Total = 0
      let vitB6Total = 0
      let vitB7Total = 0
      let vitB12Total = 0
      let vitATotal = 0
      let vitCTotal = 0
      let vitDTotal = 0
      let vitKTotal = 0

      data.forEach(log => {
        const matrix = log.nutritional_matrix as any
        const hasMatrix = !!matrix

        // === VIP-first pattern: use VIP column if present, else fallback to matrix ===

        // Omega-3: VIP is in grams, matrix is in mg
        if (log.omega_3_total_g) {
          omega3Total += Number(log.omega_3_total_g)
        } else if (hasMatrix && matrix.inflammation?.omega?.omega_3_total_mg) {
          omega3Total += Number(matrix.inflammation.omega.omega_3_total_mg) / 1000
        }

        // EPA+DHA: only in matrix
        if (hasMatrix && matrix.inflammation?.omega?.epa_dha_mg) {
          omega3EpaDha += Number(matrix.inflammation.omega.epa_dha_mg) / 1000
        }

        // Omega-6: only in matrix
        if (hasMatrix && matrix.inflammation?.omega?.omega_6_mg) {
          omega6Total += Number(matrix.inflammation.omega.omega_6_mg) / 1000
        }

        // Sodium: VIP or matrix (motor.electrolytes is primary, NOT cognitive which duplicates)
        if (log.sodium_mg) {
          sodiumTotal += Number(log.sodium_mg)
        } else if (hasMatrix && matrix.motor?.electrolytes?.sodium_mg) {
          sodiumTotal += Number(matrix.motor.electrolytes.sodium_mg)
        }

        // Polyphenols: VIP or matrix
        if (log.polyphenols_total_mg) {
          polyphenolsTotal += Number(log.polyphenols_total_mg)
        } else if (hasMatrix && matrix.inflammation?.bioactives?.polyphenols_total_mg) {
          polyphenolsTotal += Number(matrix.inflammation.bioactives.polyphenols_total_mg)
        }

        // Leucine: VIP or matrix
        if (log.leucine_mg) {
          leucineTotal += Number(log.leucine_mg) / 1000
        } else if (hasMatrix && matrix.motor?.aminos_muscle?.leucine_mg) {
          leucineTotal += Number(matrix.motor.aminos_muscle.leucine_mg) / 1000
        }

        // Zinc: VIP or matrix (motor.structure_minerals is primary)
        if (log.zinc_mg) {
          zincTotal += Number(log.zinc_mg)
        } else if (hasMatrix) {
          zincTotal += Number(matrix.motor?.structure_minerals?.zinc_mg || 0)
        }

        // Magnesium: VIP or matrix (motor.structure_minerals is primary)
        if (log.magnesium_mg) {
          magnesiumTotal += Number(log.magnesium_mg)
        } else if (hasMatrix) {
          magnesiumTotal += Number(matrix.motor?.structure_minerals?.magnesium_mg || 0)
        }

        // Choline: VIP column only (tracked separately if needed)

        // === Matrix-only nutrients (no VIP column) ===
        if (hasMatrix) {
          // Sat fats & cholesterol
          if (matrix.inflammation?.sat_fats) {
            satFatTotal += Number(matrix.inflammation.sat_fats.saturated_g || 0)
            cholesterolTotal += Number(matrix.inflammation.sat_fats.cholesterol_mg || 0)
          }

          // Potassium: use motor.electrolytes only (avoid cognitive duplicate)
          potassiumTotal += Number(matrix.motor?.electrolytes?.potassium_mg || 0)

          // Muscle amino acids (except leucine handled above)
          if (matrix.motor?.aminos_muscle) {
            const aminos = matrix.motor.aminos_muscle
            isoleucineTotal += Number(aminos.isoleucine_mg || 0) / 1000
            valineTotal += Number(aminos.valine_mg || 0) / 1000
            lysineTotal += Number(aminos.lysine_mg || 0) / 1000
            methionineTotal += Number(aminos.methionine_mg || 0) / 1000
            threonineTotal += Number(aminos.threonine_mg || 0) / 1000
          }

          // Iron: use motor.structure_minerals only (avoid hormonal.structure duplicate)
          ironTotal += Number(matrix.motor?.structure_minerals?.iron_mg || 0)

          // Brain amino acids
          if (matrix.cognitive?.aminos_brain) {
            const aminosBrain = matrix.cognitive.aminos_brain
            tryptophanTotal += Number(aminosBrain.tryptophan_mg || 0) / 1000
            phenylalanineTotal += Number(aminosBrain.phenylalanine_mg || 0) / 1000
            tyrosineTotal += Number(aminosBrain.tyrosine_mg || 0) / 1000
            histidineTotal += Number(aminosBrain.histidine_mg || 0) / 1000
          }

          // Neuro others
          if (matrix.cognitive?.neuro_others) {
            taurineTotal += Number(matrix.cognitive.neuro_others.taurine_mg || 0)
            creatineTotal += Number(matrix.cognitive.neuro_others.creatine_mg || 0)
          }

          // B vitamins + vitamin C (cognitive.energy_vitamins)
          if (matrix.cognitive?.energy_vitamins) {
            const vitamins = matrix.cognitive.energy_vitamins
            vitB1Total += Number(vitamins.vit_b1_thiamin_mg || 0)
            vitB2Total += Number(vitamins.vit_b2_riboflavin_mg || 0)
            vitB3Total += Number(vitamins.vit_b3_niacin_mg || 0)
            vitB5Total += Number(vitamins.vit_b5_pantothenic_mg || 0)
            vitB6Total += Number(vitamins.vit_b6_mg || 0)
            vitB7Total += Number(vitamins.vit_b7_biotin_mcg || 0)
            folateTotal += Number(vitamins.folate_mcg || 0)
            vitB12Total += Number(vitamins.vit_b12_mcg || 0)
            vitCTotal += Number(vitamins.vit_c_mg || 0)
          }

          // Selenium: use cognitive.trace_minerals only (avoid hormonal duplicate)
          seleniumTotal += Number(matrix.cognitive?.trace_minerals?.selenium_mcg || 0)
          chromiumTotal += Number(matrix.cognitive?.trace_minerals?.chromium_mcg || 0)

          // Hormonal-specific minerals (only those NOT already counted from motor/cognitive)
          if (matrix.hormonal?.thyroid_insulin) {
            iodineTotal += Number(matrix.hormonal.thyroid_insulin.iodine_mcg || 0)
            manganeseTotal += Number(matrix.hormonal.thyroid_insulin.manganese_mg || 0)
          }

          // Hormonal structure minerals (calcium, phosphorus, copper — unique to this subsystem)
          if (matrix.hormonal?.structure) {
            calciumTotal += Number(matrix.hormonal.structure.calcium_mg || 0)
            phosphorusTotal += Number(matrix.hormonal.structure.phosphorus_mg || 0)
            copperTotal += Number(matrix.hormonal.structure.copper_mg || 0)
          }

          // Fat-soluble vitamins (only in hormonal.liposolubles)
          if (matrix.hormonal?.liposolubles) {
            const vitamins = matrix.hormonal.liposolubles
            vitATotal += Number(vitamins.vitamin_a_mcg || 0)
            vitDTotal += Number(vitamins.vit_d3_iu || 0)
            vitETotal += Number(vitamins.vitamin_e_iu || 0)
            vitKTotal += Number(vitamins.vitamin_k1_mcg || 0) + Number(vitamins.vitamin_k2_mcg || 0)
          }
        }
      })

      const allNutrients: Record<string, number> = {
        calories: totals.calories,
        protein_g: totals.protein_g,
        carbs_g: totals.carbs_g,
        fat_g: totals.fat_g,
        fiber_g: totals.fiber_g,
        sugar_g: data.reduce((acc, log) => {
          const matrix = log.nutritional_matrix as any;
          return acc + (matrix?.motor?.sugar_g || 0);
        }, 0),
        omega_3_total_g: omega3Total,
        omega_3_epa_dha_g: omega3EpaDha,
        omega_6_g: omega6Total,
        sat_fat_g: satFatTotal,
        cholesterol_mg: cholesterolTotal,
        vit_a_iu: vitATotal, // Note: stored as mcg in matrix, needs conversion if standards are IU
        vit_c_mg: vitCTotal,
        vit_d3_iu: vitDTotal, // VIP column already included in matrix read
        vit_e_iu: vitETotal,
        vit_k_mcg: vitKTotal,
        b1_mg: vitB1Total,
        b2_mg: vitB2Total,
        b3_mg: vitB3Total,
        b5_mg: vitB5Total,
        b6_mg: vitB6Total,
        b7_mcg: vitB7Total,
        b12_mcg: vitB12Total,
        folate_mcg: folateTotal,
        calcium_mg: calciumTotal,
        phosphorus_mg: phosphorusTotal,
        magnesium_mg: magnesiumTotal,
        zinc_mg: zincTotal,
        potassium_mg: potassiumTotal,
        sodium_mg: sodiumTotal,
        selenium_mcg: seleniumTotal,
        iron_mg: ironTotal,
        copper_mg: copperTotal,
        manganese_mg: manganeseTotal,
        iodine_mcg: iodineTotal,
        chromium_mcg: chromiumTotal,
        leucine_g: leucineTotal,
        isoleucine_g: isoleucineTotal,
        valine_g: valineTotal,
        lysine_g: lysineTotal,
        glycine_g: glycineTotal,
        methionine_g: methionineTotal,
        threonine_g: threonineTotal,
        phenylalanine_g: phenylalanineTotal,
        tyrosine_g: tyrosineTotal,
        histidine_g: histidineTotal,
        taurine_mg: taurineTotal,
        tryptophan_g: tryptophanTotal,
        creatine_mg: creatineTotal,
        polyphenols_total_mg: polyphenolsTotal,
        water_ml: data.reduce((acc, log) => {
          // Water: VIP or matrix, not both
          const directWater = Number(log.water_ml) || 0
          if (directWater > 0) return acc + directWater
          const matrix = log.nutritional_matrix as any
          return acc + Number(matrix?.motor?.water_ml || 0)
        }, 0),
      }

      await analyzeAllNutrients(allNutrients, {
        calories: goals?.calories,
        protein_g: goals?.protein_g,
        carbs_g: goals?.carbs_g,
        fat_g: goals?.fat_g,
        fiber_g: goals?.fiber_g
      })
    }
  }

  const loadWaterIntake = async () => {
    const today = new Date()
    const start = startOfDay(today).toISOString()
    const end = endOfDay(today).toISOString()

    const { data: waterData } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', user!.id)
      .gte('logged_at', start)
      .lte('logged_at', end)

    const { data: foodData } = await supabase
      .from('food_logs')
      .select('water_ml, nutritional_matrix')
      .eq('user_id', user!.id)
      .gte('logged_at', start)
      .lte('logged_at', end)

    let waterTotal = 0

    if (waterData) {
      waterTotal += waterData.reduce((acc, log) => acc + log.amount_ml, 0)
    }

    if (foodData) {
      waterTotal += foodData.reduce((acc, log) => {
        // VIP-first: use direct water_ml if present, else fallback to matrix
        const directWater = Number(log.water_ml) || 0
        if (directWater > 0) return acc + directWater
        const matrix = log.nutritional_matrix as any
        return acc + Number(matrix?.motor?.water_ml || 0)
      }, 0)
    }

    setWaterIntake(waterTotal)
  }

  const loadSleepData = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('last_night_sleep_hours')
      .eq('id', user!.id)
      .maybeSingle()

    if (data && data.last_night_sleep_hours) {
      setSleepHours(data.last_night_sleep_hours)
    }
  }

  const loadActivities = async () => {
    const today = new Date()
    const start = startOfDay(today).toISOString()
    const end = endOfDay(today).toISOString()

    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', start)
      .lte('logged_at', end)
      .order('logged_at', { ascending: false })

    if (data) {
      setActivities(data)
    }
  }

  const handleSleepUpdated = (hours: number) => {
    setSleepHours(hours)
  }

  const handleActivityAdded = () => {
    loadActivities()
  }

  const handleWaterAdded = () => {
    loadWaterIntake()
  }

  const handleFoodDeleted = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (!goals) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-dark-muted">Cargando...</div>
      </div>
    )
  }

  const waterPercentage = goals.water_ml > 0 ? Math.round((waterIntake / goals.water_ml) * 100) : 0
  const waterLiters = (waterIntake / 1000).toFixed(1)
  const waterGoalLiters = (goals.water_ml / 1000).toFixed(1)

  const totalBurned = activities.reduce((acc, a) => acc + (a.calories_burned || 0), 0)

  return (
    <div ref={dashRef} className="min-h-screen bg-dark-bg pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Hero Header */}
        <div className="dash-section mb-6">
          <HeroHeader
            userName={profileName || user?.user_metadata?.first_name || 'Usuario'}
            totalCalories={totals.calories}
            goalCalories={goals.calories}
            metabolicState={isTrainingDay ? 'mTOR_ACTIVE' : 'NEUTRAL'}
          />
        </div>

        {/* MacroRing — central piece */}
        <div className="dash-section mb-5">
          <MacroRing
            calories={totals.calories}
            calorieGoal={goals.calories}
            protein={totals.protein_g}
            proteinGoal={goals.protein_g}
            carbs={totals.carbs_g}
            carbsGoal={goals.carbs_g}
            fat={totals.fat_g}
            fatGoal={goals.fat_g}
          />
        </div>

        {/* ── Quick Access Cards ── */}
        <div className="space-y-3 mb-5">

          {/* Hydration */}
          <div className="dash-section">
            <button
              onClick={() => toggleCard('water')}
              className="w-full text-left rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-r from-cyan-950/40 via-dark-card/50 to-dark-card/30 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-cyan-500/25 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 p-4 relative">
                {/* Decorative image */}
                <img src="/weather-icons/humidity.svg" alt="" className="absolute right-3 top-1/2 -translate-y-1/2 w-16 h-16 opacity-[0.12] group-hover:opacity-20 transition-opacity duration-500" />

                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <img src="/weather-icons/humidity.svg" alt="" className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative">
                  <h3 className="text-sm font-bold text-cyan-400">Hidratación</h3>
                  <p className="text-xs text-dark-muted truncate">{waterLiters}L / {waterGoalLiters}L consumidos</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative">
                  <span className="text-lg font-black text-white">{waterPercentage}%</span>
                  <ChevronRight className={`w-4 h-4 text-dark-muted transition-transform duration-300 ${expandedCard === 'water' ? 'rotate-90' : ''}`} />
                </div>
              </div>
              <div className="h-0.5 bg-dark-border/20">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700" style={{ width: `${Math.min(waterPercentage, 100)}%` }} />
              </div>
            </button>
            {expandedCard === 'water' && (
              <div className="mt-2">
                <WaterTracker current={waterIntake} goal={goals.water_ml} onWaterAdded={handleWaterAdded} />
              </div>
            )}
          </div>

          {/* Sleep */}
          {sleepHours !== null && (
            <div className="dash-section">
              <button
                onClick={() => toggleCard('sleep')}
                className="w-full text-left rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-r from-indigo-950/40 via-dark-card/50 to-dark-card/30 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-indigo-500/25 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 p-4 relative">
                  <img src="/weather-icons/moon-waxing-gibbous.svg" alt="" className="absolute right-3 top-1/2 -translate-y-1/2 w-16 h-16 opacity-[0.12] group-hover:opacity-20 transition-opacity duration-500" />

                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <Moon className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 relative">
                    <h3 className="text-sm font-bold text-indigo-400">Sueño</h3>
                    <p className="text-xs text-dark-muted truncate">
                      {sleepHours < 6 ? 'Descanso insuficiente' : sleepHours < 7.5 ? 'Descanso moderado' : 'Buen descanso'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 relative">
                    <span className="text-lg font-black text-white">{sleepHours}h</span>
                    <ChevronRight className={`w-4 h-4 text-dark-muted transition-transform duration-300 ${expandedCard === 'sleep' ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                <div className="h-0.5 bg-dark-border/20">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${Math.min((sleepHours / 9) * 100, 100)}%` }} />
                </div>
              </button>
              {expandedCard === 'sleep' && (
                <div className="mt-2">
                  <QuickSleepEditor sleepHours={sleepHours} onSleepUpdated={handleSleepUpdated} />
                </div>
              )}
            </div>
          )}

          {/* Metabolic State */}
          <div className="dash-section">
            <button
              onClick={() => toggleCard('metabolic')}
              className="w-full text-left rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-r from-emerald-950/40 via-dark-card/50 to-dark-card/30 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-emerald-500/25 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 p-4 relative">
                <img src="/weather-icons/thermometer-raindrop.svg" alt="" className="absolute right-3 top-1/2 -translate-y-1/2 w-16 h-16 opacity-[0.12] group-hover:opacity-20 transition-opacity duration-500" />

                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative">
                  <h3 className="text-sm font-bold text-emerald-400">Estado Metabólico</h3>
                  <p className="text-xs text-dark-muted truncate">Monitor de vía mTOR / autofagia</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 relative">
                  <ChevronRight className={`w-4 h-4 text-dark-muted transition-transform duration-300 ${expandedCard === 'metabolic' ? 'rotate-90' : ''}`} />
                </div>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30" />
            </button>
            {expandedCard === 'metabolic' && (
              <div className="mt-2">
                <MetabolicStateCard />
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="dash-section">
            <button
              onClick={() => toggleCard('activity')}
              className="w-full text-left rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-r from-amber-950/40 via-dark-card/50 to-dark-card/30 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-amber-500/25 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 p-4 relative">
                <img src="/weather-icons/lightning-bolt.svg" alt="" className="absolute right-3 top-1/2 -translate-y-1/2 w-16 h-16 opacity-[0.12] group-hover:opacity-20 transition-opacity duration-500" />

                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <Dumbbell className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative">
                  <h3 className="text-sm font-bold text-amber-400">Actividad Física</h3>
                  <p className="text-xs text-dark-muted truncate">
                    {activities.length > 0 ? `${activities.length} actividad${activities.length > 1 ? 'es' : ''} registrada${activities.length > 1 ? 's' : ''}` : 'Sin actividad registrada'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative">
                  {totalBurned > 0 && <span className="text-lg font-black text-white">{totalBurned} kcal</span>}
                  <ChevronRight className={`w-4 h-4 text-dark-muted transition-transform duration-300 ${expandedCard === 'activity' ? 'rotate-90' : ''}`} />
                </div>
              </div>
              <div className="h-0.5 bg-dark-border/20">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700" style={{ width: `${Math.min((totalBurned / 500) * 100, 100)}%` }} />
              </div>
            </button>
            {expandedCard === 'activity' && (
              <div className="mt-2">
                <ActivityTracker activities={activities} onActivityAdded={handleActivityAdded} />
              </div>
            )}
          </div>

          {/* Day Type */}
          <div className="dash-section">
            <button
              onClick={() => toggleCard('daytype')}
              className="w-full text-left rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-r from-slate-900/40 via-dark-card/50 to-dark-card/30 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(148,163,184,0.1),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-slate-400/20 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 p-4 relative">
                <img src={isTrainingDay ? '/weather-icons/thermometer-sun.svg' : '/weather-icons/wind.svg'} alt="" className="absolute right-3 top-1/2 -translate-y-1/2 w-16 h-16 opacity-[0.12] group-hover:opacity-20 transition-opacity duration-500" />

                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <Zap className={`w-5 h-5 ${isTrainingDay ? 'text-red-400' : 'text-slate-400'}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative">
                  <h3 className={`text-sm font-bold ${isTrainingDay ? 'text-red-400' : 'text-slate-400'}`}>Tipo de Día</h3>
                  <p className="text-xs text-dark-muted truncate">{isTrainingDay ? 'Día de entrenamiento' : 'Día de descanso'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isTrainingDay ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/15 text-slate-400'}`}>
                    {isTrainingDay ? 'Training' : 'Rest'}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-dark-muted transition-transform duration-300 ${expandedCard === 'daytype' ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </button>
            {expandedCard === 'daytype' && (
              <div className="mt-2">
                <DayTypeSelector isTrainingDay={isTrainingDay} onChange={updateDailyActivity} />
              </div>
            )}
          </div>
        </div>

        {/* ── Food Log ── */}
        <div className="dash-section">
          <div className="bg-dark-card/40 backdrop-blur-xl border border-dark-border/50 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <ClipboardList className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-white">Registro de Alimentos</h3>
            </div>
            <FoodLogList refreshKey={refreshKey} onFoodDeleted={handleFoodDeleted} limit={5} />
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <QuickActionsBar
        onOpenAddFood={() => setIsAddFoodOpen(true)}
        onWaterAdded={handleWaterAdded}
        onFoodAdded={() => setRefreshKey(prev => prev + 1)}
      />

      {/* Add Food Modal */}
      <AddFoodModal
        isOpen={isAddFoodOpen}
        onClose={() => setIsAddFoodOpen(false)}
        onSuccess={() => {
          setIsAddFoodOpen(false)
          setRefreshKey(prev => prev + 1)
        }}
      />
    </div>
  )
}
