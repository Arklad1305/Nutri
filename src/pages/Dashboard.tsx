import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  TrendingUp,
  Activity,
  Flame,
  Apple,
  Sparkles,
  Target
} from 'lucide-react'
import { MacroCard } from '../components/MacroCard'
import { FoodLogList } from '../components/FoodLogList'
import { WaterTracker } from '../components/WaterTracker'
import { NutrientStatusCard } from '../components/NutrientStatusCard'
import { MetabolicStateCard } from '../components/MetabolicStateCard'
import { QuickSleepEditor } from '../components/QuickSleepEditor'
import { ActivityTracker } from '../components/ActivityTracker'
import DayTypeSelector from '../components/DayTypeSelector'
import { Ripple } from '../components/Ripple'
import { analyzeAllNutrients, NutrientStatus } from '../lib/nutritionStandards'
import { calculateNutritionTargets } from '../lib/nutritionTargetCalculator'

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
  const [mainTab, setMainTab] = useState<'resumen' | 'biohacking' | 'acciones'>('resumen')
  const [activeTab, setActiveTab] = useState<'macros' | 'vitamins' | 'minerals' | 'aminos' | 'lipids' | 'bioactive'>('macros')
  const [nutrientStatuses, setNutrientStatuses] = useState<NutrientStatus[]>([])
  const [isLoadingStandards, setIsLoadingStandards] = useState(true)
  const [sleepHours, setSleepHours] = useState<number | null>(null)
  const [isTrainingDay, setIsTrainingDay] = useState<boolean>(false)
  const [diaTipo, setDiaTipo] = useState<string>('')
  const [activities, setActivities] = useState<any[]>([])

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

      setDiaTipo(targets.dia_tipo)
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
      setIsLoadingStandards(true)

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

      const statuses = await analyzeAllNutrients(allNutrients, {
        calories: goals?.calories,
        protein_g: goals?.protein_g,
        carbs_g: goals?.carbs_g,
        fat_g: goals?.fat_g,
        fiber_g: goals?.fiber_g
      })
      setNutrientStatuses(statuses)
      setIsLoadingStandards(false)
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

  const caloriePercentage = (totals.calories / goals.calories) * 100
  const proteinPercentage = (totals.protein_g / goals.protein_g) * 100
  const carbsPercentage = (totals.carbs_g / goals.carbs_g) * 100
  const fatPercentage = (totals.fat_g / goals.fat_g) * 100

  const leucineStatus = nutrientStatuses.find(s => s.nutrient_key === 'leucine_g')

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-dark-muted">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto mobile-scroll-hide scroll-smooth-mobile snap-x snap-mandatory">
          <button
            onClick={() => setMainTab('resumen')}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap snap-start group overflow-hidden ${
              mainTab === 'resumen'
                ? 'bg-gradient-to-br from-cyan-500 via-blue-500 to-cyan-600 text-white shadow-xl shadow-cyan-500/40'
                : 'bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border text-dark-muted hover:text-white hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20'
            }`}
          >
            {mainTab === 'resumen' && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent animate-shimmer"></div>
            )}
            <div className={`p-1.5 rounded-lg transition-all ${
              mainTab === 'resumen'
                ? 'bg-white/20'
                : 'bg-dark-hover group-hover:bg-cyan-500/10'
            }`}>
              <Target className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                mainTab === 'resumen' ? 'text-white' : 'text-cyan-400'
              }`} />
            </div>
            <span className="relative z-10">Resumen</span>
          </button>
          <button
            onClick={() => setMainTab('biohacking')}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap snap-start group overflow-hidden ${
              mainTab === 'biohacking'
                ? 'bg-gradient-to-br from-purple-500 via-fuchsia-500 to-purple-600 text-white shadow-xl shadow-purple-500/40'
                : 'bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border text-dark-muted hover:text-white hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20'
            }`}
          >
            {mainTab === 'biohacking' && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent animate-shimmer"></div>
            )}
            <div className={`p-1.5 rounded-lg transition-all ${
              mainTab === 'biohacking'
                ? 'bg-white/20'
                : 'bg-dark-hover group-hover:bg-purple-500/10'
            }`}>
              <Sparkles className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                mainTab === 'biohacking' ? 'text-white' : 'text-purple-400'
              }`} />
            </div>
            <span className="relative z-10">Biohacking</span>
          </button>
        </div>

        {mainTab === 'resumen' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <DayTypeSelector isTrainingDay={isTrainingDay} onChange={updateDailyActivity} />
              {diaTipo && (
                <div className={`p-4 rounded-xl border ${
                  isTrainingDay
                    ? 'bg-red-500/5 border-red-500/30'
                    : 'bg-blue-500/5 border-blue-500/30'
                }`}>
                  <p className={`text-sm font-semibold ${
                    isTrainingDay ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {diaTipo}
                  </p>
                </div>
              )}
              <MetabolicStateCard />
              {sleepHours !== null && (
                <QuickSleepEditor
                  sleepHours={sleepHours}
                  onSleepUpdated={handleSleepUpdated}
                />
              )}
              <ActivityTracker
                activities={activities}
                onActivityAdded={handleActivityAdded}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Macros Vitales</h2>
              <div className="w-layout-grid">
                <MacroCard
                  title="Calorías"
                  current={totals.calories}
                  goal={goals.calories}
                  unit="kcal"
                  icon={Flame}
                  color="text-orange-500"
                  percentage={caloriePercentage}
                />
                <MacroCard
                  title="Proteína"
                  current={totals.protein_g}
                  goal={goals.protein_g}
                  unit="g"
                  icon={Activity}
                  color="text-blue-500"
                  percentage={proteinPercentage}
                />
                <MacroCard
                  title="Carbohidratos"
                  current={totals.carbs_g}
                  goal={goals.carbs_g}
                  unit="g"
                  icon={Apple}
                  color="text-green-500"
                  percentage={carbsPercentage}
                />
                <MacroCard
                  title="Grasas"
                  current={totals.fat_g}
                  goal={goals.fat_g}
                  unit="g"
                  icon={TrendingUp}
                  color="text-yellow-500"
                  percentage={fatPercentage}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leucineStatus && <NutrientStatusCard status={leucineStatus} />}
              <WaterTracker
                current={waterIntake}
                goal={goals.water_ml}
                onWaterAdded={handleWaterAdded}
              />
            </div>

            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Últimos Alimentos</h3>
              <FoodLogList refreshKey={refreshKey} onFoodDeleted={handleFoodDeleted} limit={5} />
            </div>
          </div>
        )}

        {mainTab === 'biohacking' && (
          <div className="space-y-6">
            <div className="relative bg-gradient-to-br from-dark-card to-dark-hover border border-purple-500/20 rounded-2xl p-6 md:p-8 overflow-hidden shadow-xl">
              <Ripple mainCircleSize={150} mainCircleOpacity={0.6} numCircles={8} />

              <div className="relative z-10 mb-6">
                <h2 className="text-xl md:text-2xl font-black text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Distribución Nutricional Completa
                </h2>
                <p className="text-sm text-dark-muted/80">Análisis detallado basado en estándares ODI de Lieberman</p>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto mobile-scroll-hide scroll-smooth-mobile snap-x snap-mandatory pb-2 relative z-10 -mx-2 px-2">
                <button
                  onClick={() => setActiveTab('macros')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap snap-start ${
                    activeTab === 'macros'
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/50 scale-105'
                      : 'bg-dark-hover/50 text-dark-muted hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  🍖 Macros
                </button>
                <button
                  onClick={() => setActiveTab('vitamins')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap snap-start ${
                    activeTab === 'vitamins'
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/50 scale-105'
                      : 'bg-dark-hover/50 text-dark-muted hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  💊 Vitaminas
                </button>
                <button
                  onClick={() => setActiveTab('minerals')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap snap-start ${
                    activeTab === 'minerals'
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/50 scale-105'
                      : 'bg-dark-hover/50 text-dark-muted hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  ⚡ Minerales
                </button>
                <button
                  onClick={() => setActiveTab('aminos')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap snap-start ${
                    activeTab === 'aminos'
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/50 scale-105'
                      : 'bg-dark-hover/50 text-dark-muted hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  🧬 Aminoácidos
                </button>
                <button
                  onClick={() => setActiveTab('lipids')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap snap-start ${
                    activeTab === 'lipids'
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/50 scale-105'
                      : 'bg-dark-hover/50 text-dark-muted hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  🥑 Lípidos
                </button>
                <button
                  onClick={() => setActiveTab('bioactive')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap snap-start ${
                    activeTab === 'bioactive'
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/50 scale-105'
                      : 'bg-dark-hover/50 text-dark-muted hover:text-white hover:bg-dark-hover'
                  }`}
                >
                  🌿 Bioactivos
                </button>
              </div>

              <div className="relative z-10 min-h-[400px]">
                {isLoadingStandards ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-dark-muted font-medium">Analizando nutrientes...</p>
                  </div>
                ) : (
                  <>
                    {activeTab === 'macros' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 animate-in fade-in duration-300">
                        {nutrientStatuses
                          .filter(status => ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g'].includes(status.nutrient_key))
                          .map((status, idx) => (
                            <div key={status.nutrient_key} className="animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                              <NutrientStatusCard status={status} />
                            </div>
                          ))}
                        {nutrientStatuses.filter(status => ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g'].includes(status.nutrient_key)).length === 0 && (
                          <div className="col-span-2 text-center py-16 bg-dark-hover/30 rounded-xl border border-dashed border-dark-border">
                            <p className="text-dark-muted">No hay datos de macros disponibles para hoy</p>
                            <p className="text-xs text-dark-muted/60 mt-1">Registra tu primera comida para comenzar</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'vitamins' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 animate-in fade-in duration-300">
                        {nutrientStatuses
                          .filter(status => ['vit_a_iu', 'vit_c_mg', 'vit_d3_iu', 'vit_e_iu', 'vit_k2_mcg', 'b12_mcg', 'folate_mcg'].includes(status.nutrient_key))
                          .map((status, idx) => (
                            <div key={status.nutrient_key} className="animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                              <NutrientStatusCard status={status} />
                            </div>
                          ))}
                        {nutrientStatuses.filter(status => ['vit_a_iu', 'vit_c_mg', 'vit_d3_iu', 'vit_e_iu', 'vit_k2_mcg', 'b12_mcg', 'folate_mcg'].includes(status.nutrient_key)).length === 0 && (
                          <div className="col-span-2 text-center py-16 bg-dark-hover/30 rounded-xl border border-dashed border-dark-border">
                            <p className="text-dark-muted mb-2">No hay datos de vitaminas disponibles para hoy</p>
                            <p className="text-xs text-dark-muted/60">Lieberman ODI recomienda dosis significativamente mayores que RDA</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'minerals' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 animate-in fade-in duration-300">
                        {nutrientStatuses
                          .filter(status => ['magnesium_mg', 'zinc_mg', 'potassium_mg', 'sodium_mg', 'selenium_mcg', 'iron_mg', 'chromium_mcg'].includes(status.nutrient_key))
                          .map((status, idx) => (
                            <div key={status.nutrient_key} className="animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                              <NutrientStatusCard status={status} />
                            </div>
                          ))}
                        {nutrientStatuses.filter(status => ['magnesium_mg', 'zinc_mg', 'potassium_mg', 'sodium_mg', 'selenium_mcg', 'iron_mg', 'chromium_mcg'].includes(status.nutrient_key)).length === 0 && (
                          <div className="col-span-2 text-center py-16 bg-dark-hover/30 rounded-xl border border-dashed border-dark-border">
                            <p className="text-dark-muted">No hay datos de minerales disponibles para hoy</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'aminos' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 animate-in fade-in duration-300">
                        {nutrientStatuses
                          .filter(status => ['leucine_g', 'glycine_g', 'methionine_g', 'taurine_mg', 'tryptophan_g'].includes(status.nutrient_key))
                          .map((status, idx) => (
                            <div key={status.nutrient_key} className="animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                              <NutrientStatusCard status={status} />
                            </div>
                          ))}
                        {nutrientStatuses.filter(status => ['leucine_g', 'glycine_g', 'methionine_g', 'taurine_mg', 'tryptophan_g'].includes(status.nutrient_key)).length === 0 && (
                          <div className="col-span-2 text-center py-16 bg-dark-hover/30 rounded-xl border border-dashed border-dark-border">
                            <p className="text-dark-muted mb-2">No hay datos de aminoácidos disponibles para hoy</p>
                            <p className="text-xs text-dark-muted/60">Rastreados desde carnes, huevos, pescado, lácteos y proteína en polvo</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'lipids' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 animate-in fade-in duration-300">
                        {nutrientStatuses
                          .filter(status => ['omega_3_total_g', 'omega_3_epa_dha_g', 'omega_6_g', 'sat_fat_g', 'cholesterol_mg'].includes(status.nutrient_key))
                          .map((status, idx) => (
                            <div key={status.nutrient_key} className="animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                              <NutrientStatusCard status={status} />
                            </div>
                          ))}
                        {nutrientStatuses.filter(status => ['omega_3_total_g', 'omega_3_epa_dha_g', 'omega_6_g', 'sat_fat_g', 'cholesterol_mg'].includes(status.nutrient_key)).length === 0 && (
                          <div className="col-span-2 text-center py-16 bg-dark-hover/30 rounded-xl border border-dashed border-dark-border">
                            <p className="text-dark-muted mb-2">No hay datos de lípidos disponibles para hoy</p>
                            <p className="text-xs text-dark-muted/60">Lieberman enfatiza el ratio óptimo Omega-6:Omega-3</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'bioactive' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 animate-in fade-in duration-300">
                        {nutrientStatuses
                          .filter(status => ['polyphenols_total_mg'].includes(status.nutrient_key))
                          .map((status, idx) => (
                            <div key={status.nutrient_key} className="animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                              <NutrientStatusCard status={status} />
                            </div>
                          ))}
                        {nutrientStatuses.filter(status => ['polyphenols_total_mg'].includes(status.nutrient_key)).length === 0 && (
                          <div className="col-span-2 text-center py-16 bg-dark-hover/30 rounded-xl border border-dashed border-dark-border">
                            <p className="text-dark-muted mb-2">No hay datos de bioactivos disponibles para hoy</p>
                            <p className="text-xs text-dark-muted/60">Los polifenoles se encuentran en té verde, cacao, frutos rojos y aceite de oliva</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
