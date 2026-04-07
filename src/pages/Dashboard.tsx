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

          {/* Hydration — Ocean */}
          <div className="dash-section">
            <button
              onClick={() => toggleCard('water')}
              className="relative w-full text-left rounded-2xl overflow-hidden border border-cyan-500/15 bg-[#060d18] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(6,182,212,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-cyan-400/30 hover:-translate-y-0.5 transition-all duration-300 group"
              style={{
                backgroundImage: 'url(https://gdoquewussvvkmwgdgxp.supabase.co/storage/v1/object/public/imagenes/aguita.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Water fill */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {/* Water body */}
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
                  style={{ height: `${Math.max(Math.min(waterPercentage, 100), 15)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-600/55 via-cyan-500/35 to-cyan-400/15" />
                </div>

                {/* Wave 1 */}
                <div
                  className="absolute left-0 right-0 h-12 animate-[wave-move-1_6s_ease-in-out_infinite]"
                  style={{ bottom: `${Math.max(Math.min(waterPercentage, 100), 15) - 14}%` }}
                >
                  <div className="absolute inset-0 w-[200%]" style={{ background: 'repeating-linear-gradient(90deg, transparent, rgba(6,182,212,0.5) 25%, transparent 50%)', borderRadius: '40%' }} />
                </div>
                {/* Wave 2 */}
                <div
                  className="absolute left-0 right-0 h-10 animate-[wave-move-2_5s_ease-in-out_infinite]"
                  style={{ bottom: `${Math.max(Math.min(waterPercentage, 100), 15) - 12}%` }}
                >
                  <div className="absolute inset-0 w-[200%]" style={{ background: 'repeating-linear-gradient(90deg, transparent, rgba(34,211,238,0.35) 25%, transparent 50%)', borderRadius: '45%' }} />
                </div>
                {/* Wave 3 */}
                <div
                  className="absolute left-0 right-0 h-8 animate-[wave-move-3_4s_ease-in-out_infinite]"
                  style={{ bottom: `${Math.max(Math.min(waterPercentage, 100), 15) - 10}%` }}
                >
                  <div className="absolute inset-0 w-[200%]" style={{ background: 'repeating-linear-gradient(90deg, transparent, rgba(165,243,252,0.25) 25%, transparent 50%)', borderRadius: '42%' }} />
                </div>

                {/* Floating bubbles */}
                <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300/40 animate-[bubble-rise_4s_ease-in-out_infinite]" style={{ bottom: '5%', left: '18%' }} />
                <div className="absolute w-1 h-1 rounded-full bg-cyan-200/30 animate-[bubble-rise_5s_ease-in-out_infinite_1.2s]" style={{ bottom: '8%', left: '40%' }} />
                <div className="absolute w-2 h-2 rounded-full bg-cyan-300/25 animate-[bubble-rise_6s_ease-in-out_infinite_2.5s]" style={{ bottom: '3%', left: '65%' }} />
                <div className="absolute w-1 h-1 rounded-full bg-cyan-200/35 animate-[bubble-rise_4.5s_ease-in-out_infinite_0.8s]" style={{ bottom: '10%', left: '82%' }} />

                {/* Surface shimmer */}
                <div
                  className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent animate-[shimmer-sweep_5s_ease-in-out_infinite]"
                  style={{ bottom: `${Math.max(Math.min(waterPercentage, 100), 15)}%` }}
                />
              </div>

              <div className="flex items-center gap-4 p-4 relative z-10">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/60 backdrop-blur-sm border border-cyan-500/20 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(6,182,212,0.1)]">
                    <img src="/weather-icons/humidity.svg" alt="" className="w-8 h-8 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative">
                  <h3 className="text-sm font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]">Hidratación</h3>
                  <p className="text-xs text-cyan-100/50 truncate">{waterLiters}L / {waterGoalLiters}L consumidos</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative">
                  <span className="text-lg font-black text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">{waterPercentage}%</span>
                  <ChevronRight className={`w-4 h-4 text-cyan-400/60 transition-transform duration-300 ${expandedCard === 'water' ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </button>
            {expandedCard === 'water' && (
              <div className="mt-2">
                <WaterTracker current={waterIntake} goal={goals.water_ml} onWaterAdded={handleWaterAdded} />
              </div>
            )}
          </div>

          {/* Sleep — Aurora + Stars */}
          {sleepHours !== null && (
            <div className="dash-section">
              <button
                onClick={() => toggleCard('sleep')}
                className="relative w-full text-left rounded-2xl overflow-hidden border border-indigo-500/15 bg-[#080c1a] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(99,102,241,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-indigo-400/30 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                {/* Animated night sky */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  {/* Stars */}
                  <div className="absolute w-1 h-1 rounded-full bg-white/60 animate-[star-twinkle_3s_ease-in-out_infinite]" style={{ top: '20%', left: '15%' }} />
                  <div className="absolute w-0.5 h-0.5 rounded-full bg-white/40 animate-[star-twinkle_4s_ease-in-out_infinite_1s]" style={{ top: '35%', left: '45%' }} />
                  <div className="absolute w-1 h-1 rounded-full bg-indigo-300/50 animate-[star-twinkle_3.5s_ease-in-out_infinite_0.5s]" style={{ top: '15%', left: '70%' }} />
                  <div className="absolute w-0.5 h-0.5 rounded-full bg-white/50 animate-[star-twinkle_5s_ease-in-out_infinite_2s]" style={{ top: '60%', left: '85%' }} />
                  <div className="absolute w-1 h-1 rounded-full bg-violet-300/40 animate-[star-twinkle_4.5s_ease-in-out_infinite_1.5s]" style={{ top: '50%', left: '30%' }} />
                  <div className="absolute w-0.5 h-0.5 rounded-full bg-white/30 animate-[star-twinkle_3s_ease-in-out_infinite_2.5s]" style={{ top: '25%', left: '55%' }} />

                  {/* Aurora band */}
                  <div className="absolute bottom-0 left-0 right-0 h-full animate-[aurora-drift_8s_ease-in-out_infinite]">
                    <div className="absolute inset-0 w-[200%]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.15) 20%, rgba(139,92,246,0.1) 40%, rgba(99,102,241,0.12) 60%, transparent 80%)', filter: 'blur(8px)' }} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-3/4 animate-[aurora-drift-2_6s_ease-in-out_infinite]">
                    <div className="absolute inset-0 w-[200%]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.1) 30%, rgba(196,181,253,0.08) 50%, transparent 70%)', filter: 'blur(12px)' }} />
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 relative z-10">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-950/60 backdrop-blur-sm border border-indigo-500/20 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(99,102,241,0.1)]">
                      <Moon className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 relative">
                    <h3 className="text-sm font-bold text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]">Sueño</h3>
                    <p className="text-xs text-indigo-100/50 truncate">
                      {sleepHours < 6 ? 'Descanso insuficiente' : sleepHours < 7.5 ? 'Descanso moderado' : 'Buen descanso'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 relative">
                    <span className="text-lg font-black text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">{sleepHours}h</span>
                    <ChevronRight className={`w-4 h-4 text-indigo-400/60 transition-transform duration-300 ${expandedCard === 'sleep' ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </button>
              {expandedCard === 'sleep' && (
                <div className="mt-2">
                  <QuickSleepEditor sleepHours={sleepHours} onSleepUpdated={handleSleepUpdated} />
                </div>
              )}
            </div>
          )}

          {/* Metabolic State — Pulse waves */}
          <div className="dash-section">
            <button
              onClick={() => toggleCard('metabolic')}
              className="relative w-full text-left rounded-2xl overflow-hidden border border-emerald-500/15 bg-[#081210] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-emerald-400/30 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              {/* Animated pulse rings */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {/* Expanding pulse rings from center-left */}
                <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/20 animate-[pulse-ring_4s_ease-out_infinite]" />
                <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-500/15 animate-[pulse-ring_4s_ease-out_infinite_1.3s]" />
                <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-20 h-20 rounded-full border border-teal-400/10 animate-[pulse-ring_4s_ease-out_infinite_2.6s]" />

                {/* Horizontal scan line */}
                <div className="absolute top-0 left-0 w-full h-full animate-[scan-line_5s_linear_infinite]">
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                </div>

                {/* Ambient glow */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-emerald-500/8 to-transparent" />
              </div>

              <div className="flex items-center gap-4 p-4 relative z-10">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-950/60 backdrop-blur-sm border border-emerald-500/20 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(16,185,129,0.1)]">
                    <Activity className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative">
                  <h3 className="text-sm font-bold text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">Estado Metabólico</h3>
                  <p className="text-xs text-emerald-100/50 truncate">Monitor de vía mTOR / autofagia</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 relative">
                  <ChevronRight className={`w-4 h-4 text-emerald-400/60 transition-transform duration-300 ${expandedCard === 'metabolic' ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </button>
            {expandedCard === 'metabolic' && (
              <div className="mt-2">
                <MetabolicStateCard />
              </div>
            )}
          </div>

          {/* Activity — Fire/Flames */}
          <div className="dash-section">
            <button
              onClick={() => toggleCard('activity')}
              className="relative w-full text-left rounded-2xl overflow-hidden border border-amber-500/15 bg-[#140c06] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(245,158,11,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-amber-400/30 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              {/* Animated flames */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {/* Flame layer 1 — tall, slow */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-3/4 animate-[flame-flicker-1_3s_ease-in-out_infinite]"
                >
                  <div
                    className="absolute inset-0 w-[200%]"
                    style={{
                      background: 'repeating-linear-gradient(90deg, transparent, rgba(245,158,11,0.2) 20%, transparent 40%)',
                      borderRadius: '50% 50% 0 0',
                      filter: 'blur(4px)',
                    }}
                  />
                </div>

                {/* Flame layer 2 — medium, offset */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1/2 animate-[flame-flicker-2_2.5s_ease-in-out_infinite]"
                >
                  <div
                    className="absolute inset-0 w-[200%]"
                    style={{
                      background: 'repeating-linear-gradient(90deg, transparent, rgba(251,191,36,0.15) 25%, transparent 50%)',
                      borderRadius: '45% 55% 0 0',
                      filter: 'blur(3px)',
                    }}
                  />
                </div>

                {/* Flame layer 3 — core glow */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1/3 animate-[flame-flicker-3_2s_ease-in-out_infinite]"
                >
                  <div
                    className="absolute inset-0 w-[200%]"
                    style={{
                      background: 'repeating-linear-gradient(90deg, transparent, rgba(249,115,22,0.18) 20%, transparent 40%)',
                      borderRadius: '40% 60% 0 0',
                      filter: 'blur(2px)',
                    }}
                  />
                </div>

                {/* Heat shimmer at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-orange-500/15 via-amber-500/8 to-transparent" />
              </div>

              <div className="flex items-center gap-4 p-4 relative z-10">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/60 backdrop-blur-sm border border-amber-500/20 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(245,158,11,0.1)]">
                    <Dumbbell className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative">
                  <h3 className="text-sm font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">Actividad Física</h3>
                  <p className="text-xs text-amber-100/50 truncate">
                    {activities.length > 0 ? `${activities.length} actividad${activities.length > 1 ? 'es' : ''} registrada${activities.length > 1 ? 's' : ''}` : 'Sin actividad registrada'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative">
                  {totalBurned > 0 && <span className="text-lg font-black text-white drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">{totalBurned} kcal</span>}
                  <ChevronRight className={`w-4 h-4 text-amber-400/60 transition-transform duration-300 ${expandedCard === 'activity' ? 'rotate-90' : ''}`} />
                </div>
              </div>
            </button>
            {expandedCard === 'activity' && (
              <div className="mt-2">
                <ActivityTracker activities={activities} onActivityAdded={handleActivityAdded} />
              </div>
            )}
          </div>

          {/* Day Type — Energy / Zen */}
          <div className="dash-section">
            <button
              onClick={() => toggleCard('daytype')}
              className={`relative w-full text-left rounded-2xl overflow-hidden border shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),0_2px_6px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 transition-all duration-300 group ${isTrainingDay ? 'border-red-500/20 bg-[#140606] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(239,68,68,0.25)] hover:border-red-400/35' : 'border-blue-500/15 bg-[#060810] hover:shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6),0_4px_12px_-2px_rgba(96,165,250,0.15)] hover:border-blue-400/25'}`}
            >
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                {isTrainingDay ? (
                  <>
                    {/* Core glow — pulsing */}
                    <div className="absolute top-1/2 right-[8%] -translate-y-1/2 w-16 h-16 rounded-full bg-red-500/20 animate-[pulse-glow_3s_ease-in-out_infinite]" style={{ filter: 'blur(14px)' }} />
                    {/* Embers rising */}
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-red-400/50 animate-[float-up_3s_ease-out_infinite]" style={{ bottom: '5%', left: '20%' }} />
                    <div className="absolute w-1 h-1 rounded-full bg-orange-400/45 animate-[float-up_4s_ease-out_infinite_0.8s]" style={{ bottom: '10%', left: '40%' }} />
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-red-300/40 animate-[float-up_3.5s_ease-out_infinite_1.6s]" style={{ bottom: '3%', left: '60%' }} />
                    <div className="absolute w-1 h-1 rounded-full bg-orange-300/35 animate-[float-up_5s_ease-out_infinite_2.4s]" style={{ bottom: '8%', left: '78%' }} />
                    {/* Bottom heat glow */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-red-500/15 via-orange-500/5 to-transparent" />
                  </>
                ) : (
                  <>
                    {/* Moon glow */}
                    <div className="absolute top-1/2 right-[12%] -translate-y-1/2 w-16 h-16 rounded-full bg-blue-400/10 animate-[pulse-glow_5s_ease-in-out_infinite]" style={{ filter: 'blur(12px)' }} />
                    {/* Mist layers — thicker */}
                    <div className="absolute inset-0 animate-[mist-drift-1_8s_ease-in-out_infinite]">
                      <div className="absolute inset-0 w-[200%]" style={{ background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.08) 25%, rgba(147,197,253,0.06) 50%, transparent 75%)', filter: 'blur(8px)' }} />
                    </div>
                    <div className="absolute inset-0 animate-[mist-drift-2_6s_ease-in-out_infinite]">
                      <div className="absolute inset-0 w-[200%]" style={{ background: 'linear-gradient(90deg, transparent 15%, rgba(96,165,250,0.06) 35%, rgba(147,197,253,0.04) 55%, transparent 75%)', filter: 'blur(12px)' }} />
                    </div>
                    {/* Zen particles */}
                    <div className="absolute w-1 h-1 rounded-full bg-blue-400/25 animate-[star-twinkle_5s_ease-in-out_infinite]" style={{ top: '25%', left: '15%' }} />
                    <div className="absolute w-0.5 h-0.5 rounded-full bg-blue-300/20 animate-[star-twinkle_4s_ease-in-out_infinite_1.5s]" style={{ top: '55%', left: '45%' }} />
                    <div className="absolute w-1 h-1 rounded-full bg-blue-400/15 animate-[star-twinkle_6s_ease-in-out_infinite_3s]" style={{ top: '35%', left: '75%' }} />
                    {/* Bottom cool glow */}
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-blue-500/8 to-transparent" />
                  </>
                )}
              </div>

              <div className="flex items-center gap-4 p-4 relative z-10">
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-xl backdrop-blur-sm flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)] ${isTrainingDay ? 'bg-red-950/60 border border-red-500/25' : 'bg-blue-950/60 border border-blue-500/20'}`} style={{ boxShadow: isTrainingDay ? 'inset 0 1px 0 rgba(239,68,68,0.15)' : 'inset 0 1px 0 rgba(96,165,250,0.1)' }}>
                    <Zap className={`w-5 h-5 ${isTrainingDay ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.4)]'}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative">
                  <h3 className={`text-sm font-bold ${isTrainingDay ? 'text-red-300 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'text-blue-300 drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]'}`}>Tipo de Día</h3>
                  <p className={`text-xs truncate ${isTrainingDay ? 'text-red-100/50' : 'text-blue-100/40'}`}>{isTrainingDay ? 'Día de entrenamiento' : 'Día de descanso'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isTrainingDay ? 'bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 'bg-blue-500/15 text-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.15)]'}`}>
                    {isTrainingDay ? 'Training' : 'Rest'}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${isTrainingDay ? 'text-red-400/60' : 'text-blue-400/60'} transition-transform duration-300 ${expandedCard === 'daytype' ? 'rotate-90' : ''}`} />
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
          <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-[#060a0a] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
            {/* Subtle animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
              <div className="absolute top-1/2 left-[50%] -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-primary/5 animate-[pulse-glow_6s_ease-in-out_infinite]" style={{ filter: 'blur(30px)' }} />
            </div>

            <div className="relative z-10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(13,148,136,0.1)]">
                  <ClipboardList className="w-5 h-5 text-primary drop-shadow-[0_0_6px_rgba(13,148,136,0.5)]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white drop-shadow-[0_0_8px_rgba(13,148,136,0.3)]">Registro de Alimentos</h3>
                  <p className="text-[10px] text-dark-muted">Comidas de hoy</p>
                </div>
              </div>
              <FoodLogList refreshKey={refreshKey} onFoodDeleted={handleFoodDeleted} limit={5} />
            </div>
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
