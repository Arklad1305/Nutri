import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, startOfDay, endOfDay } from 'date-fns'
import { ClipboardList } from 'lucide-react'
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
  const dashRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

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
        // Use direct VIP columns first (hybrid schema)
        if (log.omega_3_total_g) omega3Total += Number(log.omega_3_total_g)
        if (log.sodium_mg) sodiumTotal += Number(log.sodium_mg)
        if (log.polyphenols_total_mg) polyphenolsTotal += Number(log.polyphenols_total_mg)
        if (log.leucine_mg) leucineTotal += Number(log.leucine_mg) / 1000 // convert to grams
        if (log.zinc_mg) zincTotal += Number(log.zinc_mg)
        if (log.magnesium_mg) magnesiumTotal += Number(log.magnesium_mg)
        if (log.choline_mg) // choline handled separately if needed

        if (log.nutritional_matrix) {
          const matrix = log.nutritional_matrix as any

          // NEW FORMAT: motor, cognitive, hormonal, inflammation

          // INFLAMMATION - Lipid profile and bioactives (REAL SCHEMA)
          if (matrix.inflammation?.omega) {
            const omega = matrix.inflammation.omega
            if (omega.omega_3_total_mg) omega3Total += Number(omega.omega_3_total_mg) / 1000 // convert to grams
            if (omega.epa_dha_mg) omega3EpaDha += Number(omega.epa_dha_mg) / 1000
            if (omega.omega_6_mg) omega6Total += Number(omega.omega_6_mg) / 1000
          }

          if (matrix.inflammation?.sat_fats) {
            const satFats = matrix.inflammation.sat_fats
            if (satFats.saturated_g) satFatTotal += Number(satFats.saturated_g)
            if (satFats.cholesterol_mg) cholesterolTotal += Number(satFats.cholesterol_mg)
          }

          if (matrix.inflammation?.bioactives) {
            const bioactives = matrix.inflammation.bioactives
            if (bioactives.polyphenols_total_mg) polyphenolsTotal += Number(bioactives.polyphenols_total_mg)
          }

          // MOTOR - Electrolytes and muscle amino acids
          if (matrix.motor?.electrolytes) {
            const electrolytes = matrix.motor.electrolytes
            if (electrolytes.sodium_mg) sodiumTotal += Number(electrolytes.sodium_mg)
            if (electrolytes.potassium_mg) potassiumTotal += Number(electrolytes.potassium_mg)
          }

          if (matrix.motor?.aminos_muscle) {
            const aminos = matrix.motor.aminos_muscle
            if (aminos.leucine_mg) leucineTotal += Number(aminos.leucine_mg) / 1000
            if (aminos.isoleucine_mg) isoleucineTotal += Number(aminos.isoleucine_mg) / 1000
            if (aminos.valine_mg) valineTotal += Number(aminos.valine_mg) / 1000
            if (aminos.lysine_mg) lysineTotal += Number(aminos.lysine_mg) / 1000
            if (aminos.methionine_mg) methionineTotal += Number(aminos.methionine_mg) / 1000
            if (aminos.threonine_mg) threonineTotal += Number(aminos.threonine_mg) / 1000
          }

          if (matrix.motor?.structure_minerals) {
            const minerals = matrix.motor.structure_minerals
            if (minerals.zinc_mg) zincTotal += Number(minerals.zinc_mg)
            if (minerals.magnesium_mg) magnesiumTotal += Number(minerals.magnesium_mg)
            if (minerals.iron_mg) ironTotal += Number(minerals.iron_mg)
          }

          // NOTE: Glycine is not in nutritional_matrix schema - needs to be added later

          // COGNITIVE - Neuro amino acids and vitamins (REAL SCHEMA)
          if (matrix.cognitive?.aminos_brain) {
            const aminosBrain = matrix.cognitive.aminos_brain
            if (aminosBrain.tryptophan_mg) tryptophanTotal += Number(aminosBrain.tryptophan_mg) / 1000
            if (aminosBrain.phenylalanine_mg) phenylalanineTotal += Number(aminosBrain.phenylalanine_mg) / 1000
            if (aminosBrain.tyrosine_mg) tyrosineTotal += Number(aminosBrain.tyrosine_mg) / 1000
            if (aminosBrain.histidine_mg) histidineTotal += Number(aminosBrain.histidine_mg) / 1000
          }

          if (matrix.cognitive?.neuro_others) {
            const neuroOthers = matrix.cognitive.neuro_others
            if (neuroOthers.choline_mg) // already tracked via VIP column
            if (neuroOthers.taurine_mg) taurineTotal += Number(neuroOthers.taurine_mg)
            if (neuroOthers.creatine_mg) creatineTotal += Number(neuroOthers.creatine_mg)
          }

          if (matrix.cognitive?.electrolytes) {
            const electrolytes = matrix.cognitive.electrolytes
            if (electrolytes.sodium_mg) sodiumTotal += Number(electrolytes.sodium_mg)
            if (electrolytes.potassium_mg) potassiumTotal += Number(electrolytes.potassium_mg)
          }

          if (matrix.cognitive?.energy_vitamins) {
            const vitamins = matrix.cognitive.energy_vitamins
            if (vitamins.vit_b1_thiamin_mg) vitB1Total += Number(vitamins.vit_b1_thiamin_mg)
            if (vitamins.vit_b2_riboflavin_mg) vitB2Total += Number(vitamins.vit_b2_riboflavin_mg)
            if (vitamins.vit_b3_niacin_mg) vitB3Total += Number(vitamins.vit_b3_niacin_mg)
            if (vitamins.vit_b5_pantothenic_mg) vitB5Total += Number(vitamins.vit_b5_pantothenic_mg)
            if (vitamins.vit_b6_mg) vitB6Total += Number(vitamins.vit_b6_mg)
            if (vitamins.vit_b7_biotin_mcg) vitB7Total += Number(vitamins.vit_b7_biotin_mcg)
            if (vitamins.folate_mcg) folateTotal += Number(vitamins.folate_mcg)
            if (vitamins.vit_b12_mcg) vitB12Total += Number(vitamins.vit_b12_mcg)
            if (vitamins.vit_c_mg) vitCTotal += Number(vitamins.vit_c_mg)
          }

          if (matrix.cognitive?.trace_minerals) {
            const traceMinerals = matrix.cognitive.trace_minerals
            if (traceMinerals.selenium_mcg) seleniumTotal += Number(traceMinerals.selenium_mcg)
            if (traceMinerals.chromium_mcg) chromiumTotal += Number(traceMinerals.chromium_mcg)
          }

          // HORMONAL - Thyroid/insulin minerals and fat-soluble vitamins
          if (matrix.hormonal?.thyroid_insulin) {
            const minerals = matrix.hormonal.thyroid_insulin
            if (minerals.selenium_mcg) seleniumTotal += Number(minerals.selenium_mcg)
            if (minerals.chromium_mcg) chromiumTotal += Number(minerals.chromium_mcg)
            if (minerals.zinc_mg) zincTotal += Number(minerals.zinc_mg)
            if (minerals.magnesium_mg) magnesiumTotal += Number(minerals.magnesium_mg)
            if (minerals.iodine_mcg) iodineTotal += Number(minerals.iodine_mcg)
            if (minerals.manganese_mg) manganeseTotal += Number(minerals.manganese_mg)
          }

          if (matrix.hormonal?.structure) {
            const structure = matrix.hormonal.structure
            if (structure.calcium_mg) calciumTotal += Number(structure.calcium_mg)
            if (structure.phosphorus_mg) phosphorusTotal += Number(structure.phosphorus_mg)
            if (structure.copper_mg) copperTotal += Number(structure.copper_mg)
            if (structure.iron_mg) ironTotal += Number(structure.iron_mg)
          }

          if (matrix.hormonal?.liposolubles) {
            const vitamins = matrix.hormonal.liposolubles
            if (vitamins.vitamin_a_mcg) vitATotal += Number(vitamins.vitamin_a_mcg)
            if (vitamins.vit_d3_iu) vitDTotal += Number(vitamins.vit_d3_iu)
            if (vitamins.vitamin_e_iu) vitETotal += Number(vitamins.vitamin_e_iu)
            if (vitamins.vitamin_k1_mcg) vitKTotal += Number(vitamins.vitamin_k1_mcg)
            if (vitamins.vitamin_k2_mcg) vitKTotal += Number(vitamins.vitamin_k2_mcg)
          }
        }
      })

      // VIP columns are tracked directly
      const directZinc = data.reduce((acc, log) => acc + (Number(log.zinc_mg) || 0), 0)
      const directMagnesium = data.reduce((acc, log) => acc + (Number(log.magnesium_mg) || 0), 0)

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
        vit_a_iu: vitATotal,
        vit_c_mg: vitCTotal,
        vit_d3_iu: data.reduce((acc, log) => acc + (Number(log.vit_d3_iu) || 0), 0) + vitDTotal,
        vit_e_iu: vitETotal,
        vit_k2_mcg: vitKTotal,
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
        magnesium_mg: directMagnesium + magnesiumTotal,
        zinc_mg: directZinc + zincTotal,
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
          const directWater = Number(log.water_ml) || 0
          const matrix = log.nutritional_matrix as any
          const matrixWater = matrix?.motor?.water_ml || 0
          return acc + directWater + Number(matrixWater)
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
        const directWater = Number(log.water_ml) || 0
        const matrix = log.nutritional_matrix as any
        const matrixWater = matrix?.motor?.water_ml || 0
        return acc + directWater + Number(matrixWater)
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

  return (
    <div ref={dashRef} className="min-h-screen bg-dark-bg pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Hero Header */}
        <div className="dash-section mb-8">
          <HeroHeader
            userName={user?.user_metadata?.first_name || 'Usuario'}
            totalCalories={totals.calories}
            goalCalories={goals.calories}
            metabolicState={isTrainingDay ? 'mTOR_ACTIVE' : 'NEUTRAL'}
          />
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* MacroRing - Large (2x1) */}
          <div className="dash-section md:col-span-2">
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

          {/* Metabolic State - Tall (1x2) */}
          <div className="dash-section md:row-span-2">
            <MetabolicStateCard />
          </div>

          {/* Water Tracker */}
          <div className="dash-section">
            <WaterTracker
              current={waterIntake}
              goal={goals.water_ml}
              onWaterAdded={handleWaterAdded}
            />
          </div>

          {/* Quick Sleep Editor */}
          <div className="dash-section">
            {sleepHours !== null && (
              <QuickSleepEditor
                sleepHours={sleepHours}
                onSleepUpdated={handleSleepUpdated}
              />
            )}
          </div>

          {/* Food Log List - Large (full width) */}
          <div className="dash-section col-span-full lg:col-span-3">
            <div className="bg-dark-card/40 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6">
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

        {/* Activity & Training Day Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="dash-section">
            <DayTypeSelector isTrainingDay={isTrainingDay} onChange={updateDailyActivity} />
          </div>
          <div className="dash-section">
            <ActivityTracker
              activities={activities}
              onActivityAdded={handleActivityAdded}
            />
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
