import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { User, Target, LogOut, Save, UtensilsCrossed, Calculator } from 'lucide-react'
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Perfil y Configuración</h1>
          <p className="text-dark-muted">Personaliza tus metas nutricionales</p>
        </div>

        <div className="space-y-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">Información Personal</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Edad
                </label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="10"
                  max="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Género
                </label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  value={profile.height_cm}
                  onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="100"
                  max="250"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  value={profile.weight_kg}
                  onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="30"
                  max="300"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Nivel de Actividad
                </label>
                <select
                  value={profile.activity_level}
                  onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                >
                  <option value="sedentary">Sedentario</option>
                  <option value="light">Ligero (1-3 días/semana)</option>
                  <option value="moderate">Moderado (3-5 días/semana)</option>
                  <option value="active">Activo (6-7 días/semana)</option>
                  <option value="very_active">Muy Activo (2 veces al día)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Objetivo
                </label>
                <select
                  value={profile.goal}
                  onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                >
                  <option value="lose_weight">Perder Peso</option>
                  <option value="maintain">Mantener Peso</option>
                  <option value="gain_muscle">Ganar Músculo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Horas de Sueño (Última Noche)
                </label>
                <input
                  type="number"
                  value={profile.last_night_sleep_hours}
                  onChange={(e) => setProfile({ ...profile, last_night_sleep_hours: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                  max="24"
                  step="0.5"
                />
                <p className="text-xs text-dark-muted mt-1">
                  {profile.last_night_sleep_hours < 5 && '🔴 Privación severa: Ajustes críticos activados'}
                  {profile.last_night_sleep_hours >= 5 && profile.last_night_sleep_hours < 6.5 && '⚠️ Privación moderada: Protección metabólica activa'}
                  {profile.last_night_sleep_hours >= 6.5 && '✅ Sueño óptimo'}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-dark-hover rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-dark-muted mb-1">BMR (Basal)</p>
                  <p className="text-xl font-bold text-white">{Math.round(calculateBMR())} kcal</p>
                </div>
                <div>
                  <p className="text-sm text-dark-muted mb-1">TDEE (PAL {profile.activity_level})</p>
                  <p className="text-xl font-bold text-primary">{calculateTDEE()} kcal/día</p>
                </div>
              </div>
              <p className="text-xs text-dark-muted mt-3">
                💡 Usa "Calcular Metas Personalizadas" para obtener tus objetivos según tu nivel de actividad y objetivo real.
              </p>
            </div>
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">Preferencias de Dieta</h2>
            </div>
            <p className="text-sm text-dark-muted mb-6">
              Selecciona una o más dietas que sigas. Esto ayudará a personalizar tus recetas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        ? 'ring-2 ring-primary shadow-lg shadow-primary/20 scale-[1.02]'
                        : 'hover:scale-[1.02] hover:shadow-lg'
                    }`}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={diet.image_url}
                        alt={diet.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                      {isSelected && (
                        <div className="absolute top-3 right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-lg mb-1">{diet.name}</h3>
                        <p className="text-white/90 text-xs mb-2">{diet.description}</p>

                        <div className="flex flex-wrap gap-1">
                          {diet.benefits.slice(0, 3).map((benefit, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-[10px] rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30"
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
              <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  Seleccionadas: {preferredDiet.join(', ')}
                </p>
              </div>
            )}
          </div>

          <div className="bg-dark-card border border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-white">Metas Diarias</h2>
              </div>
              <button
                onClick={handleCalculateTargets}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              >
                <Calculator className="w-4 h-4" />
                Calcular Metas Personalizadas
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Calorías (kcal)
                </label>
                <input
                  type="number"
                  value={goals.calories}
                  onChange={(e) => setGoals({ ...goals, calories: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Proteína (g)
                </label>
                <input
                  type="number"
                  value={goals.protein_g}
                  onChange={(e) => setGoals({ ...goals, protein_g: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Carbohidratos (g)
                </label>
                <input
                  type="number"
                  value={goals.carbs_g}
                  onChange={(e) => setGoals({ ...goals, carbs_g: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Grasas (g)
                </label>
                <input
                  type="number"
                  value={goals.fat_g}
                  onChange={(e) => setGoals({ ...goals, fat_g: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Fibra (g)
                </label>
                <input
                  type="number"
                  value={goals.fiber_g}
                  onChange={(e) => setGoals({ ...goals, fiber_g: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Agua (ml)
                </label>
                <input
                  type="number"
                  value={goals.water_ml}
                  onChange={(e) => setGoals({ ...goals, water_ml: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>

          {showTargetsSummary && calculatedTargets && (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-white">Tus Metas Nutricionales Personalizadas</h3>
              </div>

              <div className="bg-dark-card/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-dark-muted mb-1">BMI</p>
                    <p className="text-xl font-bold text-white">{calculatedTargets.bmi}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-muted mb-1">Peso Ajustado</p>
                    <p className="text-xl font-bold text-white">{calculatedTargets.adjusted_weight_kg}kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-muted mb-1">Calorías Meta</p>
                    <p className="text-xl font-bold text-primary">{calculatedTargets.meta_calorias}</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-muted mb-1">Agua Diaria</p>
                    <p className="text-xl font-bold text-cyan-400">{(calculatedTargets.micros_objetivo.water_ml / 1000).toFixed(1)}L</p>
                  </div>
                </div>

                <div className="border-t border-dark-border pt-4 mb-4">
                  <p className="text-sm font-semibold text-white mb-3">Distribución de Macronutrientes</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-dark-hover rounded-lg p-3">
                      <p className="text-xs text-dark-muted mb-1">Proteína</p>
                      <p className="text-lg font-bold text-pink-400">{calculatedTargets.macros.proteina_g}g</p>
                      <p className="text-xs text-dark-muted">{Math.round((calculatedTargets.macros.proteina_g * 4 / calculatedTargets.meta_calorias) * 100)}% cal</p>
                    </div>
                    <div className="bg-dark-hover rounded-lg p-3">
                      <p className="text-xs text-dark-muted mb-1">Grasas</p>
                      <p className="text-lg font-bold text-yellow-400">{calculatedTargets.macros.grasas_g}g</p>
                      <p className="text-xs text-dark-muted">{Math.round((calculatedTargets.macros.grasas_g * 9 / calculatedTargets.meta_calorias) * 100)}% cal</p>
                    </div>
                    <div className="bg-dark-hover rounded-lg p-3">
                      <p className="text-xs text-dark-muted mb-1">Carbos</p>
                      <p className="text-lg font-bold text-green-400">{calculatedTargets.macros.carbos_g}g</p>
                      <p className="text-xs text-dark-muted">{Math.round((calculatedTargets.macros.carbos_g * 4 / calculatedTargets.meta_calorias) * 100)}% cal</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dark-border pt-4">
                  <p className="text-sm font-semibold text-white mb-2">Micronutrientes Clave</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-dark-hover rounded px-2 py-1">
                      <span className="text-dark-muted">Vit D3:</span> <span className="text-white font-medium">{calculatedTargets.micros_objetivo.vit_d3_iu} IU</span>
                    </div>
                    <div className="bg-dark-hover rounded px-2 py-1">
                      <span className="text-dark-muted">Magnesio:</span> <span className="text-white font-medium">{calculatedTargets.micros_objetivo.magnesium_mg} mg</span>
                    </div>
                    <div className="bg-dark-hover rounded px-2 py-1">
                      <span className="text-dark-muted">Calcio:</span> <span className="text-white font-medium">{calculatedTargets.micros_objetivo.calcium_mg} mg</span>
                    </div>
                    <div className="bg-dark-hover rounded px-2 py-1">
                      <span className="text-dark-muted">Zinc:</span> <span className="text-white font-medium">{calculatedTargets.micros_objetivo.zinc_mg} mg</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-dark-card/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-primary mb-2">Diagnóstico Personalizado</p>
                <p className="text-sm text-dark-text leading-relaxed">{calculatedTargets.diagnostico}</p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-dark-muted">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p>Las metas han sido calculadas. Presiona "Guardar Cambios" para aplicarlas.</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>

            <button
              onClick={signOut}
              className="flex items-center gap-2 py-3 px-6 bg-danger hover:bg-danger/90 text-white font-medium rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
