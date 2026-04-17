import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, startOfDay, endOfDay } from 'date-fns'
import { Droplets, Moon, Activity, Dumbbell, Zap, ClipboardList, ChevronRight } from 'lucide-react'
import { FoodLogList } from '../components/FoodLogList'
import { WaterTracker } from '../components/WaterTracker'
import { MetabolicStateCard } from '../components/MetabolicStateCard'
import { QuickSleepEditor } from '../components/QuickSleepEditor'
import { ActivityTracker } from '../components/ActivityTracker'
import DayTypeSelector from '../components/DayTypeSelector'
import { HeroHeader } from '../components/HeroHeader'
import { MacroRing } from '../components/MacroRing'
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

function DashCard({ id, expanded, onToggle, icon: Icon, title, subtitle, value, children }: {
  id: string
  expanded: string | null
  onToggle: (id: string) => void
  icon: any
  title: string
  subtitle: string
  value?: string
  children: React.ReactNode
}) {
  return (
    <div className="dash-section">
      <button
        onClick={() => onToggle(id)}
        className="w-full text-left rounded-xl border border-dark-border bg-dark-card hover:bg-dark-hover hover:border-dark-border/80 transition-colors duration-200"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-dark-hover flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-dark-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-dark-text">{title}</h3>
            <p className="text-xs text-dark-muted truncate">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {value && <span className="text-sm font-bold text-dark-text">{value}</span>}
            <ChevronRight className={`w-4 h-4 text-dark-muted transition-transform duration-200 ${expanded === id ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </button>
      {expanded === id && (
        <div className="mt-2 animate-in">
          {children}
        </div>
      )}
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<DailyGoals | null>(null)
  const [totals, setTotals] = useState<DailyTotals>({
    calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
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
      opacity: 0, y: 20, stagger: 0.06, duration: 0.4, ease: 'power2.out',
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

  useEffect(() => {
    if (!user) return
    const bump = () => setRefreshKey(k => k + 1)
    const channel = supabase
      .channel(`dashboard-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_logs', filter: `user_id=eq.${user.id}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_logs', filter: `user_id=eq.${user.id}` }, bump)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const loadDailyActivity = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('daily_activity')
      .select('is_training_day')
      .eq('user_id', user!.id)
      .eq('date', today)
      .maybeSingle()
    if (data) setIsTrainingDay(data.is_training_day)
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
      }, { onConflict: 'user_id,date' })
    if (!error) setIsTrainingDay(isTraining)
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
        'lose_weight': 'lose_weight', 'lose_fat': 'lose_weight',
        'maintain': 'maintain', 'gain_muscle': 'gain_muscle',
        'build_muscle': 'gain_muscle', 'biohacking_focus': 'maintain'
      }
      const targets = calculateNutritionTargets({
        weight_kg: profileData.weight_kg,
        height_cm: profileData.height_cm,
        age: profileData.age,
        gender: (profileData.gender || 'male') as 'male' | 'female',
        activity_level: (profileData.activity_level || 'moderate') as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
        goal: goalMapping[profileData.goal || 'maintain'] || 'maintain',
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

    setGoals({ calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 65, fiber_g: 30, water_ml: 2000 })
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
          const calories = Number(log.calories) || 0
          const protein = Number(log.protein_g) || 0
          const carbs = Number(log.carbs_g) || 0
          const fat = Number(log.fat_g) || 0
          const matrix = log.nutritional_matrix as any
          const fiber = matrix?.motor?.fiber_g || 0
          return {
            calories: acc.calories + calories,
            protein_g: acc.protein_g + protein,
            carbs_g: acc.carbs_g + carbs,
            fat_g: acc.fat_g + fat,
            fiber_g: acc.fiber_g + fiber,
          }
        },
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
      )
      setTotals(totals)

      let omega3Total = 0, omega3EpaDha = 0, omega6Total = 0, satFatTotal = 0, cholesterolTotal = 0
      let seleniumTotal = 0, chromiumTotal = 0, sodiumTotal = 0, polyphenolsTotal = 0
      let leucineTotal = 0, glycineTotal = 0, methionineTotal = 0, taurineTotal = 0, tryptophanTotal = 0
      let vitETotal = 0, folateTotal = 0, zincTotal = 0, magnesiumTotal = 0, potassiumTotal = 0
      let ironTotal = 0, isoleucineTotal = 0, valineTotal = 0, lysineTotal = 0, threonineTotal = 0
      let phenylalanineTotal = 0, tyrosineTotal = 0, histidineTotal = 0, creatineTotal = 0
      let calciumTotal = 0, phosphorusTotal = 0, copperTotal = 0, manganeseTotal = 0, iodineTotal = 0
      let vitB1Total = 0, vitB2Total = 0, vitB3Total = 0, vitB5Total = 0, vitB6Total = 0
      let vitB7Total = 0, vitB12Total = 0, vitATotal = 0, vitCTotal = 0, vitDTotal = 0, vitKTotal = 0

      data.forEach(log => {
        const matrix = log.nutritional_matrix as any
        const hasMatrix = !!matrix

        if (log.omega_3_total_g) omega3Total += Number(log.omega_3_total_g)
        else if (hasMatrix && matrix.inflammation?.omega?.omega_3_total_mg) omega3Total += Number(matrix.inflammation.omega.omega_3_total_mg) / 1000

        if (hasMatrix && matrix.inflammation?.omega?.epa_dha_mg) omega3EpaDha += Number(matrix.inflammation.omega.epa_dha_mg) / 1000
        if (hasMatrix && matrix.inflammation?.omega?.omega_6_mg) omega6Total += Number(matrix.inflammation.omega.omega_6_mg) / 1000

        if (log.sodium_mg) sodiumTotal += Number(log.sodium_mg)
        else if (hasMatrix && matrix.motor?.electrolytes?.sodium_mg) sodiumTotal += Number(matrix.motor.electrolytes.sodium_mg)

        if (log.polyphenols_total_mg) polyphenolsTotal += Number(log.polyphenols_total_mg)
        else if (hasMatrix && matrix.inflammation?.bioactives?.polyphenols_total_mg) polyphenolsTotal += Number(matrix.inflammation.bioactives.polyphenols_total_mg)

        if (log.leucine_mg) leucineTotal += Number(log.leucine_mg) / 1000
        else if (hasMatrix && matrix.motor?.aminos_muscle?.leucine_mg) leucineTotal += Number(matrix.motor.aminos_muscle.leucine_mg) / 1000

        if (log.zinc_mg) zincTotal += Number(log.zinc_mg)
        else if (hasMatrix) zincTotal += Number(matrix.motor?.structure_minerals?.zinc_mg || 0)

        if (log.magnesium_mg) magnesiumTotal += Number(log.magnesium_mg)
        else if (hasMatrix) magnesiumTotal += Number(matrix.motor?.structure_minerals?.magnesium_mg || 0)

        if (hasMatrix) {
          if (matrix.inflammation?.sat_fats) {
            satFatTotal += Number(matrix.inflammation.sat_fats.saturated_g || 0)
            cholesterolTotal += Number(matrix.inflammation.sat_fats.cholesterol_mg || 0)
          }
          potassiumTotal += Number(matrix.motor?.electrolytes?.potassium_mg || 0)
          if (matrix.motor?.aminos_muscle) {
            const aminos = matrix.motor.aminos_muscle
            isoleucineTotal += Number(aminos.isoleucine_mg || 0) / 1000
            valineTotal += Number(aminos.valine_mg || 0) / 1000
            lysineTotal += Number(aminos.lysine_mg || 0) / 1000
            methionineTotal += Number(aminos.methionine_mg || 0) / 1000
            threonineTotal += Number(aminos.threonine_mg || 0) / 1000
          }
          ironTotal += Number(matrix.motor?.structure_minerals?.iron_mg || 0)
          if (matrix.cognitive?.aminos_brain) {
            const aminosBrain = matrix.cognitive.aminos_brain
            tryptophanTotal += Number(aminosBrain.tryptophan_mg || 0) / 1000
            phenylalanineTotal += Number(aminosBrain.phenylalanine_mg || 0) / 1000
            tyrosineTotal += Number(aminosBrain.tyrosine_mg || 0) / 1000
            histidineTotal += Number(aminosBrain.histidine_mg || 0) / 1000
          }
          if (matrix.cognitive?.neuro_others) {
            taurineTotal += Number(matrix.cognitive.neuro_others.taurine_mg || 0)
            creatineTotal += Number(matrix.cognitive.neuro_others.creatine_mg || 0)
          }
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
          seleniumTotal += Number(matrix.cognitive?.trace_minerals?.selenium_mcg || 0)
          chromiumTotal += Number(matrix.cognitive?.trace_minerals?.chromium_mcg || 0)
          if (matrix.hormonal?.thyroid_insulin) {
            iodineTotal += Number(matrix.hormonal.thyroid_insulin.iodine_mcg || 0)
            manganeseTotal += Number(matrix.hormonal.thyroid_insulin.manganese_mg || 0)
          }
          if (matrix.hormonal?.structure) {
            calciumTotal += Number(matrix.hormonal.structure.calcium_mg || 0)
            phosphorusTotal += Number(matrix.hormonal.structure.phosphorus_mg || 0)
            copperTotal += Number(matrix.hormonal.structure.copper_mg || 0)
          }
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
        calories: totals.calories, protein_g: totals.protein_g, carbs_g: totals.carbs_g,
        fat_g: totals.fat_g, fiber_g: totals.fiber_g,
        sugar_g: data.reduce((acc, log) => { const m = log.nutritional_matrix as any; return acc + (m?.motor?.sugar_g || 0) }, 0),
        omega_3_total_g: omega3Total, omega_3_epa_dha_g: omega3EpaDha, omega_6_g: omega6Total,
        sat_fat_g: satFatTotal, cholesterol_mg: cholesterolTotal,
        vit_a_iu: vitATotal, vit_c_mg: vitCTotal, vit_d3_iu: vitDTotal, vit_e_iu: vitETotal, vit_k_mcg: vitKTotal,
        b1_mg: vitB1Total, b2_mg: vitB2Total, b3_mg: vitB3Total, b5_mg: vitB5Total, b6_mg: vitB6Total,
        b7_mcg: vitB7Total, b12_mcg: vitB12Total, folate_mcg: folateTotal,
        calcium_mg: calciumTotal, phosphorus_mg: phosphorusTotal, magnesium_mg: magnesiumTotal,
        zinc_mg: zincTotal, potassium_mg: potassiumTotal, sodium_mg: sodiumTotal,
        selenium_mcg: seleniumTotal, iron_mg: ironTotal, copper_mg: copperTotal,
        manganese_mg: manganeseTotal, iodine_mcg: iodineTotal, chromium_mcg: chromiumTotal,
        leucine_g: leucineTotal, isoleucine_g: isoleucineTotal, valine_g: valineTotal,
        lysine_g: lysineTotal, glycine_g: glycineTotal, methionine_g: methionineTotal,
        threonine_g: threonineTotal, phenylalanine_g: phenylalanineTotal, tyrosine_g: tyrosineTotal,
        histidine_g: histidineTotal, taurine_mg: taurineTotal, tryptophan_g: tryptophanTotal,
        creatine_mg: creatineTotal, polyphenols_total_mg: polyphenolsTotal,
        water_ml: data.reduce((acc, log) => {
          const directWater = Number(log.water_ml) || 0
          if (directWater > 0) return acc + directWater
          const matrix = log.nutritional_matrix as any
          return acc + Number(matrix?.motor?.water_ml || 0)
        }, 0),
      }

      await analyzeAllNutrients(allNutrients, {
        calories: goals?.calories, protein_g: goals?.protein_g,
        carbs_g: goals?.carbs_g, fat_g: goals?.fat_g, fiber_g: goals?.fiber_g
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
    if (waterData) waterTotal += waterData.reduce((acc, log) => acc + log.amount_ml, 0)
    if (foodData) {
      waterTotal += foodData.reduce((acc, log) => {
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
    if (data && data.last_night_sleep_hours) setSleepHours(data.last_night_sleep_hours)
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
    if (data) setActivities(data)
  }

  if (!goals) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-dark-muted text-sm">Cargando...</div>
      </div>
    )
  }

  const waterPercentage = goals.water_ml > 0 ? Math.round((waterIntake / goals.water_ml) * 100) : 0
  const waterLiters = (waterIntake / 1000).toFixed(1)
  const waterGoalLiters = (goals.water_ml / 1000).toFixed(1)
  const totalBurned = activities.reduce((acc, a) => acc + (a.calories_burned || 0), 0)

  return (
    <div ref={dashRef} className="min-h-screen bg-dark-bg pb-24">
      <div className="max-w-lg mx-auto px-4 py-2">

        <div className="dash-section">
          <HeroHeader userName={profileName || user?.user_metadata?.first_name || 'Usuario'} />
        </div>

        <div className="dash-section mb-6">
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

        <div className="space-y-2 mb-6">
          <DashCard
            id="water" expanded={expandedCard} onToggle={toggleCard}
            icon={Droplets} title="Hidratación"
            subtitle={`${waterLiters}L / ${waterGoalLiters}L`}
            value={`${waterPercentage}%`}
          >
            <WaterTracker current={waterIntake} goal={goals.water_ml} onWaterAdded={() => loadWaterIntake()} />
          </DashCard>

          {sleepHours !== null && (
            <DashCard
              id="sleep" expanded={expandedCard} onToggle={toggleCard}
              icon={Moon} title="Sueño"
              subtitle={sleepHours < 6 ? 'Descanso insuficiente' : sleepHours < 7.5 ? 'Descanso moderado' : 'Buen descanso'}
              value={`${sleepHours}h`}
            >
              <QuickSleepEditor sleepHours={sleepHours} onSleepUpdated={(h) => setSleepHours(h)} />
            </DashCard>
          )}

          <DashCard
            id="metabolic" expanded={expandedCard} onToggle={toggleCard}
            icon={Activity} title="Estado Metabólico"
            subtitle="mTOR / autofagia"
          >
            <MetabolicStateCard />
          </DashCard>

          <DashCard
            id="activity" expanded={expandedCard} onToggle={toggleCard}
            icon={Dumbbell} title="Actividad Física"
            subtitle={activities.length > 0 ? `${activities.length} registrada${activities.length > 1 ? 's' : ''}` : 'Sin actividad'}
            value={totalBurned > 0 ? `${totalBurned} kcal` : undefined}
          >
            <ActivityTracker activities={activities} onActivityAdded={() => loadActivities()} />
          </DashCard>

          <DashCard
            id="daytype" expanded={expandedCard} onToggle={toggleCard}
            icon={Zap} title="Tipo de Día"
            subtitle={isTrainingDay ? 'Entrenamiento' : 'Descanso'}
            value={isTrainingDay ? 'Training' : 'Rest'}
          >
            <DayTypeSelector isTrainingDay={isTrainingDay} onChange={updateDailyActivity} />
          </DashCard>
        </div>

        <div className="dash-section">
          <div className="rounded-xl border border-dark-border bg-dark-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-dark-hover flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-dark-muted" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-text">Registro de Alimentos</h3>
                <p className="text-[10px] text-dark-muted">Comidas de hoy</p>
              </div>
            </div>
            <FoodLogList refreshKey={refreshKey} onFoodDeleted={() => setRefreshKey(prev => prev + 1)} limit={5} />
          </div>
        </div>
      </div>

      {/* Water quick-add FAB */}
      <button
        onClick={async () => {
          if (!user) return
          await supabase.from('water_logs').insert({ user_id: user.id, amount_ml: 250, logged_at: new Date().toISOString() })
          loadWaterIntake()
        }}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full bg-dark-card border border-dark-border flex items-center justify-center hover:bg-dark-hover transition-colors shadow-card z-40"
        title="Añadir 250ml de agua"
      >
        <Droplets className="w-5 h-5 text-primary" />
      </button>

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
