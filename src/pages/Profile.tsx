import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { User, Target, LogOut, Save, UtensilsCrossed, Calculator, Zap, Droplets, Flame } from 'lucide-react'
import { calculateNutritionTargets, type NutritionTargets } from '../lib/nutritionTargetCalculator'

interface ProfileData {
  full_name: string
  age: number
  gender: string
  height_cm: number
  weight_kg: number
  activity_level: string
  goal: string
  last_night_sleep_hours: number
}

interface DailyGoalsData {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  water_ml: number
}

interface DietType {
  id: number
  name: string
  description: string
  image_url: string
  color: string
  benefits: string[]
  sort_order: number
}

export function Profile() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    age: 25,
    gender: 'other',
    height_cm: 170,
    weight_kg: 70,
    activity_level: 'moderate',
    goal: 'maintain',
    last_night_sleep_hours: 7.5,
  })
  const [goals, setGoals] = useState<DailyGoalsData>({
    calories: 2000,
    protein_g: 150,
    carbs_g: 250,
    fat_g: 65,
    fiber_g: 30,
    water_ml: 2000,
  })
  const [preferredDiet, setPreferredDiet] = useState<string[]>([])
  const [availableDiets, setAvailableDiets] = useState<DietType[]>([])
  const [calculatedTargets, setCalculatedTargets] = useState<NutritionTargets | null>(null)
  const [showTargetsSummary, setShowTargetsSummary] = useState(false)

  useEffect(() => {
    if (user) {
      loadProfile()
      loadGoals()
      loadDietTypes()
    }
  }, [user])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .maybeSingle()

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        age: data.age || 25,
        gender: data.gender || 'other',
        height_cm: data.height_cm || 170,
        weight_kg: data.weight_kg || 70,
        activity_level: data.activity_level || 'moderate',
        goal: data.goal || 'maintain',
        last_night_sleep_hours: data.last_night_sleep_hours || 7.5,
      })
      setPreferredDiet(data.preferred_diet || [])
    }
    setLoading(false)
  }

  const loadGoals = async () => {
    const { data } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle()

    if (data) {
      setGoals({
        calories: data.calories || 2000,
        protein_g: data.protein_g || 150,
        carbs_g: data.carbs_g || 250,
        fat_g: data.fat_g || 65,
        fiber_g: data.fiber_g || 30,
        water_ml: data.water_ml || 2000,
      })
    }
  }

  const loadDietTypes = async () => {
    const { data, error } = await supabase
      .from('diet_types')
      .select('*')
      .order('sort_order', { ascending: true })

    if (data && !error) {
      setAvailableDiets(data)
    }
  }

  const handleCalculateTargets = () => {
    if (!profile.weight_kg || !profile.height_cm || !profile.age) {
      alert('Por favor completa tu peso, altura y edad primero')
      return
    }

    const goalMapping: Record<string, 'lose_weight' | 'maintain' | 'gain_muscle'> = {
      'lose_weight': 'lose_weight',
      'maintain': 'maintain',
      'gain_muscle': 'gain_muscle'
    }

    const targets = calculateNutritionTargets({
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      age: profile.age,
      gender: profile.gender as 'male' | 'female',
      activity_level: profile.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
      goal: goalMapping[profile.goal] || 'maintain',
      last_night_sleep_hours: profile.last_night_sleep_hours,
    })

    setCalculatedTargets(targets)
    setShowTargetsSummary(true)

    setGoals({
      calories: targets.meta_calorias,
      protein_g: targets.macros.proteina_g,
      carbs_g: targets.macros.carbos_g,
      fat_g: targets.macros.grasas_g,
      fiber_g: 30,
      water_ml: targets.micros_objetivo.water_ml,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (calculatedTargets) {
        await supabase
          .from('profiles')
          .update({
            ...profile,
            preferred_diet: preferredDiet,
            target_calories: calculatedTargets.meta_calorias,
            target_protein_g: calculatedTargets.macros.proteina_g,
            target_carbs_g: calculatedTargets.macros.carbos_g,
            target_fat_g: calculatedTargets.macros.grasas_g,
            bmi: calculatedTargets.bmi,
            adjusted_weight_kg: calculatedTargets.adjusted_weight_kg,
            nutrition_targets_json: calculatedTargets,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user!.id)
      } else {
        await supabase
          .from('profiles')
          .update({
            ...profile,
            preferred_diet: preferredDiet,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user!.id)
      }

      await supabase
        .from('daily_goals')
        .update({
          ...goals,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user!.id)

      alert('Perfil actualizado correctamente')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const calculateBMR = () => {
    if (profile.gender === 'male') {
      return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
    } else if (profile.gender === 'female') {
      return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161
    }
    return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 78
  }

  const calculateTDEE = () => {
    const bmr = calculateBMR()
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    }
    return Math.round(bmr * (multipliers[profile.activity_level] || 1.55))
  }

  // Shared input style
  const inputCls = 'w-full px-4 py-2.5 bg-[#080e0e]/60 border border-white/[0.06] rounded-xl focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 text-white transition-all text-sm placeholder:text-white/20'
  const selectCls = inputCls
  const labelCls = 'block text-xs font-semibold text-white/50 mb-1.5'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-dark-muted">Cargando perfil...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary drop-shadow-[0_0_6px_rgba(13,148,136,0.5)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Perfil y Configuración</h1>
              <p className="text-xs text-dark-muted">Personaliza tus metas nutricionales</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* ── Información Personal ── */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-[#050a0a] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
            {/* Glow */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-primary/[0.05] to-transparent pointer-events-none" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />

            <div className="relative z-10 p-5 md:p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="text-sm font-bold text-white">Información Personal</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nombre Completo</label>
                  <input type="text" value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className={inputCls} placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className={labelCls}>Edad</label>
                  <input type="number" value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                    className={inputCls} min="10" max="120"
                  />
                </div>
                <div>
                  <label className={labelCls}>Género</label>
                  <select value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className={selectCls}>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Altura (cm)</label>
                  <input type="number" value={profile.height_cm}
                    onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
                    className={inputCls} min="100" max="250"
                  />
                </div>
                <div>
                  <label className={labelCls}>Peso (kg)</label>
                  <input type="number" value={profile.weight_kg}
                    onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
                    className={inputCls} min="30" max="300" step="0.1"
                  />
                </div>
                <div>
                  <label className={labelCls}>Nivel de Actividad</label>
                  <select value={profile.activity_level}
                    onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
                    className={selectCls}>
                    <option value="sedentary">Sedentario</option>
                    <option value="light">Ligero (1-3 días/semana)</option>
                    <option value="moderate">Moderado (3-5 días/semana)</option>
                    <option value="active">Activo (6-7 días/semana)</option>
                    <option value="very_active">Muy Activo (2 veces al día)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Objetivo</label>
                  <select value={profile.goal}
                    onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                    className={selectCls}>
                    <option value="lose_weight">Perder Peso</option>
                    <option value="maintain">Mantener Peso</option>
                    <option value="gain_muscle">Ganar Músculo</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Horas de Sueño (Última Noche)</label>
                  <input type="number" value={profile.last_night_sleep_hours}
                    onChange={(e) => setProfile({ ...profile, last_night_sleep_hours: Number(e.target.value) })}
                    className={inputCls} min="0" max="24" step="0.5"
                  />
                  <p className="text-[10px] mt-1.5 text-white/30">
                    {profile.last_night_sleep_hours < 5 && 'Privación severa: Ajustes críticos activados'}
                    {profile.last_night_sleep_hours >= 5 && profile.last_night_sleep_hours < 6.5 && 'Privación moderada: Protección metabólica activa'}
                    {profile.last_night_sleep_hours >= 6.5 && 'Sueño adecuado'}
                  </p>
                </div>
              </div>

              {/* BMR / TDEE cards */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="relative overflow-hidden rounded-xl border border-amber-500/10 bg-amber-500/[0.04] p-4">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/[0.05] rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Flame className="w-3 h-3 text-amber-400/60" />
                      <p className="text-[10px] text-white/40 font-medium">BMR (Basal)</p>
                    </div>
                    <p className="text-xl font-black text-white">{Math.round(calculateBMR())} <span className="text-xs font-medium text-white/30">kcal</span></p>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-primary/[0.04] p-4">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/[0.05] rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3 h-3 text-primary/60" />
                      <p className="text-[10px] text-white/40 font-medium">TDEE ({profile.activity_level})</p>
                    </div>
                    <p className="text-xl font-black text-primary">{calculateTDEE()} <span className="text-xs font-medium text-primary/40">kcal/día</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Preferencias de Dieta ── */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-[#050a08] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-emerald-500/[0.04] to-transparent pointer-events-none" />

            <div className="relative z-10 p-5 md:p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h2 className="text-sm font-bold text-white">Preferencias de Dieta</h2>
              </div>
              <p className="text-[10px] text-white/30 mb-5 ml-10">
                Selecciona una o más dietas. Personaliza tus recetas.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableDiets.map((diet) => {
                  const isSelected = preferredDiet.includes(diet.name)
                  return (
                    <div
                      key={diet.id}
                      onClick={() => {
                        if (isSelected) {
                          setPreferredDiet(preferredDiet.filter(d => d !== diet.name))
                        } else {
                          setPreferredDiet([...preferredDiet, diet.name])
                        }
                      }}
                      className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                        isSelected
                          ? 'ring-2 ring-primary shadow-[0_0_20px_-4px_rgba(13,148,136,0.3)] scale-[1.02]'
                          : 'hover:scale-[1.02] hover:shadow-lg border border-white/[0.04]'
                      }`}
                    >
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={diet.image_url}
                          alt={diet.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="text-white font-bold text-sm mb-0.5">{diet.name}</h3>
                          <p className="text-white/70 text-[10px] mb-1.5 line-clamp-2">{diet.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {diet.benefits.slice(0, 3).map((benefit, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 text-[8px] rounded-full bg-white/15 backdrop-blur-sm text-white/80 border border-white/20"
                              >
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {preferredDiet.length > 0 && (
                <div className="mt-4 p-2.5 bg-primary/[0.06] border border-primary/15 rounded-xl">
                  <p className="text-xs text-primary font-medium">
                    Seleccionadas: {preferredDiet.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Metas Diarias ── */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/10 bg-[#050810] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-blue-500/[0.04] to-transparent pointer-events-none" />

            <div className="relative z-10 p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Metas Diarias</h2>
                </div>
                <button
                  onClick={handleCalculateTargets}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/15 border border-primary/20 hover:border-primary/30 rounded-xl text-xs font-medium text-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Calcular Metas
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Calorías', key: 'calories' as const, unit: 'kcal', icon: Flame, color: 'amber' },
                  { label: 'Proteína', key: 'protein_g' as const, unit: 'g', icon: Zap, color: 'blue' },
                  { label: 'Carbohidratos', key: 'carbs_g' as const, unit: 'g', icon: Zap, color: 'emerald' },
                  { label: 'Grasas', key: 'fat_g' as const, unit: 'g', icon: Zap, color: 'yellow' },
                  { label: 'Fibra', key: 'fiber_g' as const, unit: 'g', icon: Zap, color: 'green' },
                  { label: 'Agua', key: 'water_ml' as const, unit: 'ml', icon: Droplets, color: 'cyan' },
                ].map((field) => (
                  <div key={field.key} className={`rounded-xl border border-${field.color}-500/10 bg-${field.color}-500/[0.03] p-3`}>
                    <label className={labelCls}>{field.label} ({field.unit})</label>
                    <input
                      type="number"
                      value={goals[field.key]}
                      onChange={(e) => setGoals({ ...goals, [field.key]: Number(e.target.value) })}
                      className={inputCls}
                      min="0"
                      step={field.key === 'water_ml' ? '100' : '1'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Resultado de metas calculadas ── */}
          {showTargetsSummary && calculatedTargets && (
            <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-[#050a0a] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-primary/[0.06] to-transparent pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 p-5 md:p-6">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center">
                    <Calculator className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Metas Personalizadas</h3>
                </div>

                {/* Summary grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
                  {[
                    { label: 'BMI', value: calculatedTargets.bmi, color: 'white' },
                    { label: 'Peso Ajustado', value: `${calculatedTargets.adjusted_weight_kg}kg`, color: 'white' },
                    { label: 'Meta Calorías', value: calculatedTargets.meta_calorias, color: 'primary' },
                    { label: 'Agua Diaria', value: `${(calculatedTargets.micros_objetivo.water_ml / 1000).toFixed(1)}L`, color: 'cyan-400' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                      <p className="text-[9px] text-white/30 font-medium mb-1">{item.label}</p>
                      <p className={`text-lg font-black text-${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Macros */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-white/50 mb-3">Distribución de Macros</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: 'Proteína', value: calculatedTargets.macros.proteina_g, cal: calculatedTargets.macros.proteina_g * 4, color: 'blue' },
                      { label: 'Grasas', value: calculatedTargets.macros.grasas_g, cal: calculatedTargets.macros.grasas_g * 9, color: 'amber' },
                      { label: 'Carbos', value: calculatedTargets.macros.carbos_g, cal: calculatedTargets.macros.carbos_g * 4, color: 'emerald' },
                    ].map((m) => (
                      <div key={m.label} className={`rounded-xl bg-${m.color}-500/[0.06] border border-${m.color}-500/15 p-3 text-center`}>
                        <p className="text-[9px] text-white/30 mb-1">{m.label}</p>
                        <p className={`text-lg font-black text-${m.color}-400`}>{m.value}g</p>
                        <p className="text-[9px] text-white/25">{Math.round((m.cal / calculatedTargets.meta_calorias) * 100)}% cal</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Micros */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-white/50 mb-3">Micronutrientes Clave</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: 'Vit D3', value: `${calculatedTargets.micros_objetivo.vit_d3_iu} IU` },
                      { label: 'Magnesio', value: `${calculatedTargets.micros_objetivo.magnesium_mg} mg` },
                      { label: 'Calcio', value: `${calculatedTargets.micros_objetivo.calcium_mg} mg` },
                      { label: 'Zinc', value: `${calculatedTargets.micros_objetivo.zinc_mg} mg` },
                    ].map((micro) => (
                      <div key={micro.label} className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2 flex items-center justify-between">
                        <span className="text-[10px] text-white/30">{micro.label}</span>
                        <span className="text-[10px] text-white font-semibold">{micro.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Diagnóstico */}
                <div className="rounded-xl bg-primary/[0.04] border border-primary/10 p-4">
                  <p className="text-[10px] font-bold text-primary/60 mb-1.5">Diagnóstico Personalizado</p>
                  <p className="text-xs text-white/60 leading-relaxed">{calculatedTargets.diagnostico}</p>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] text-white/25">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <p>Metas calculadas. Presiona "Guardar Cambios" para aplicar.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 hover:bg-primary/15 border border-primary/20 hover:border-primary/30 text-primary font-medium rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-sm shadow-[0_4px_20px_-4px_rgba(13,148,136,0.15)]"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-2 py-3 px-5 bg-red-500/8 hover:bg-red-500/12 border border-red-500/15 hover:border-red-500/25 text-red-400 font-medium rounded-xl transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
