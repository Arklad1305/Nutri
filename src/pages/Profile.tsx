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

const inputCls = 'w-full px-3 py-2.5 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary/50 text-dark-text text-sm placeholder:text-dark-muted'
const labelCls = 'block text-xs font-medium text-dark-muted mb-1.5'

export function Profile() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '', age: 25, gender: 'other', height_cm: 170, weight_kg: 70,
    activity_level: 'moderate', goal: 'maintain', last_night_sleep_hours: 7.5,
  })
  const [goals, setGoals] = useState<DailyGoalsData>({
    calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 65, fiber_g: 30, water_ml: 2000,
  })
  const [preferredDiet, setPreferredDiet] = useState<string[]>([])
  const [availableDiets, setAvailableDiets] = useState<DietType[]>([])
  const [calculatedTargets, setCalculatedTargets] = useState<NutritionTargets | null>(null)
  const [showTargetsSummary, setShowTargetsSummary] = useState(false)

  useEffect(() => {
    if (user) { loadProfile(); loadGoals(); loadDietTypes() }
  }, [user])

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle()
    if (data) {
      setProfile({
        full_name: data.full_name || '', age: data.age || 25, gender: data.gender || 'other',
        height_cm: data.height_cm || 170, weight_kg: data.weight_kg || 70,
        activity_level: data.activity_level || 'moderate', goal: data.goal || 'maintain',
        last_night_sleep_hours: data.last_night_sleep_hours || 7.5,
      })
      setPreferredDiet(data.preferred_diet || [])
    }
    setLoading(false)
  }

  const loadGoals = async () => {
    const { data } = await supabase.from('daily_goals').select('*').eq('user_id', user!.id).maybeSingle()
    if (data) {
      setGoals({
        calories: data.calories || 2000, protein_g: data.protein_g || 150, carbs_g: data.carbs_g || 250,
        fat_g: data.fat_g || 65, fiber_g: data.fiber_g || 30, water_ml: data.water_ml || 2000,
      })
    }
  }

  const loadDietTypes = async () => {
    const { data, error } = await supabase.from('diet_types').select('*').order('sort_order', { ascending: true })
    if (data && !error) setAvailableDiets(data)
  }

  const handleCalculateTargets = () => {
    if (!profile.weight_kg || !profile.height_cm || !profile.age) {
      alert('Completa peso, altura y edad primero'); return
    }
    const goalMapping: Record<string, 'lose_weight' | 'maintain' | 'gain_muscle'> = {
      'lose_weight': 'lose_weight', 'maintain': 'maintain', 'gain_muscle': 'gain_muscle'
    }
    const targets = calculateNutritionTargets({
      weight_kg: profile.weight_kg, height_cm: profile.height_cm, age: profile.age,
      gender: profile.gender as 'male' | 'female',
      activity_level: profile.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
      goal: goalMapping[profile.goal] || 'maintain',
      last_night_sleep_hours: profile.last_night_sleep_hours,
    })
    setCalculatedTargets(targets)
    setShowTargetsSummary(true)
    setGoals({
      calories: targets.meta_calorias, protein_g: targets.macros.proteina_g,
      carbs_g: targets.macros.carbos_g, fat_g: targets.macros.grasas_g,
      fiber_g: 30, water_ml: targets.micros_objetivo.water_ml,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (calculatedTargets) {
        await supabase.from('profiles').update({
          ...profile, preferred_diet: preferredDiet,
          target_calories: calculatedTargets.meta_calorias,
          target_protein_g: calculatedTargets.macros.proteina_g,
          target_carbs_g: calculatedTargets.macros.carbos_g,
          target_fat_g: calculatedTargets.macros.grasas_g,
          bmi: calculatedTargets.bmi, adjusted_weight_kg: calculatedTargets.adjusted_weight_kg,
          nutrition_targets_json: calculatedTargets, updated_at: new Date().toISOString(),
        }).eq('id', user!.id)
      } else {
        await supabase.from('profiles').update({
          ...profile, preferred_diet: preferredDiet, updated_at: new Date().toISOString(),
        }).eq('id', user!.id)
      }
      await supabase.from('daily_goals').update({
        ...goals, updated_at: new Date().toISOString(),
      }).eq('user_id', user!.id)
      alert('Perfil actualizado correctamente')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error al guardar el perfil')
    } finally { setSaving(false) }
  }

  const calculateBMR = () => {
    if (profile.gender === 'male') return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5
    if (profile.gender === 'female') return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161
    return 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 78
  }

  const calculateTDEE = () => {
    const bmr = calculateBMR()
    const m: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
    return Math.round(bmr * (m[profile.activity_level] || 1.55))
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-dark-bg"><div className="text-dark-muted text-sm">Cargando...</div></div>
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-dark-text">Perfil</h1>
          <p className="text-xs text-dark-muted">Configuración y metas nutricionales</p>
        </div>

        <div className="space-y-4">
          {/* Personal Info */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-dark-muted" />
              <h2 className="text-sm font-semibold text-dark-text">Información Personal</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Nombre</label>
                <input type="text" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Edad</label>
                <input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} className={inputCls} min="10" max="120" />
              </div>
              <div>
                <label className={labelCls}>Género</label>
                <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} className={inputCls}>
                  <option value="male">Masculino</option><option value="female">Femenino</option><option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Altura (cm)</label>
                <input type="number" value={profile.height_cm} onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Peso (kg)</label>
                <input type="number" value={profile.weight_kg} onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })} className={inputCls} step="0.1" />
              </div>
              <div>
                <label className={labelCls}>Actividad</label>
                <select value={profile.activity_level} onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })} className={inputCls}>
                  <option value="sedentary">Sedentario</option><option value="light">Ligero</option><option value="moderate">Moderado</option><option value="active">Activo</option><option value="very_active">Muy Activo</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Objetivo</label>
                <select value={profile.goal} onChange={(e) => setProfile({ ...profile, goal: e.target.value })} className={inputCls}>
                  <option value="lose_weight">Perder Peso</option><option value="maintain">Mantener</option><option value="gain_muscle">Ganar Músculo</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Horas de sueño (anoche)</label>
                <input type="number" value={profile.last_night_sleep_hours} onChange={(e) => setProfile({ ...profile, last_night_sleep_hours: Number(e.target.value) })} className={inputCls} min="0" max="24" step="0.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-dark-hover rounded-lg p-3">
                <p className="text-[10px] text-dark-muted mb-0.5">BMR</p>
                <p className="text-lg font-bold text-dark-text">{Math.round(calculateBMR())} <span className="text-xs text-dark-muted">kcal</span></p>
              </div>
              <div className="bg-dark-hover rounded-lg p-3">
                <p className="text-[10px] text-dark-muted mb-0.5">TDEE</p>
                <p className="text-lg font-bold text-primary">{calculateTDEE()} <span className="text-xs text-dark-muted">kcal</span></p>
              </div>
            </div>
          </div>

          {/* Diet Preferences */}
          {availableDiets.length > 0 && (
            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-4 h-4 text-dark-muted" />
                <h2 className="text-sm font-semibold text-dark-text">Preferencias de Dieta</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableDiets.map((diet) => {
                  const isSelected = preferredDiet.includes(diet.name)
                  return (
                    <button key={diet.id}
                      onClick={() => isSelected ? setPreferredDiet(preferredDiet.filter(d => d !== diet.name)) : setPreferredDiet([...preferredDiet, diet.name])}
                      className={`relative rounded-lg overflow-hidden h-24 text-left ${isSelected ? 'ring-2 ring-primary' : 'border border-dark-border'}`}
                    >
                      <img src={diet.image_url} alt={diet.name} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60" />
                      <div className="relative p-2.5">
                        <p className="text-xs font-semibold text-white">{diet.name}</p>
                        <p className="text-[9px] text-white/60 line-clamp-2 mt-0.5">{diet.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {preferredDiet.length > 0 && (
                <p className="text-xs text-primary mt-2">{preferredDiet.join(', ')}</p>
              )}
            </div>
          )}

          {/* Daily Goals */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-dark-muted" />
                <h2 className="text-sm font-semibold text-dark-text">Metas Diarias</h2>
              </div>
              <button onClick={handleCalculateTargets}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary hover:bg-primary/15 transition-colors">
                <Calculator className="w-3 h-3" /> Calcular
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: 'Calorías (kcal)', key: 'calories' as const },
                { label: 'Proteína (g)', key: 'protein_g' as const },
                { label: 'Carbos (g)', key: 'carbs_g' as const },
                { label: 'Grasas (g)', key: 'fat_g' as const },
                { label: 'Fibra (g)', key: 'fiber_g' as const },
                { label: 'Agua (ml)', key: 'water_ml' as const },
              ]).map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type="number" value={goals[f.key]} onChange={(e) => setGoals({ ...goals, [f.key]: Number(e.target.value) })}
                    className={inputCls} min="0" step={f.key === 'water_ml' ? '100' : '1'} />
                </div>
              ))}
            </div>
          </div>

          {/* Calculated Targets Summary */}
          {showTargetsSummary && calculatedTargets && (
            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-dark-text mb-3">Metas Calculadas</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-dark-hover rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-dark-muted">BMI</p>
                  <p className="text-base font-bold text-dark-text">{calculatedTargets.bmi}</p>
                </div>
                <div className="bg-dark-hover rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-dark-muted">Meta kcal</p>
                  <p className="text-base font-bold text-primary">{calculatedTargets.meta_calorias}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-dark-hover rounded-lg p-2 text-center">
                  <p className="text-[10px] text-dark-muted">P</p>
                  <p className="text-sm font-bold text-dark-text">{calculatedTargets.macros.proteina_g}g</p>
                </div>
                <div className="bg-dark-hover rounded-lg p-2 text-center">
                  <p className="text-[10px] text-dark-muted">C</p>
                  <p className="text-sm font-bold text-dark-text">{calculatedTargets.macros.carbos_g}g</p>
                </div>
                <div className="bg-dark-hover rounded-lg p-2 text-center">
                  <p className="text-[10px] text-dark-muted">G</p>
                  <p className="text-sm font-bold text-dark-text">{calculatedTargets.macros.grasas_g}g</p>
                </div>
              </div>
              <p className="text-xs text-dark-muted leading-relaxed">{calculatedTargets.diagnostico}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={signOut}
              className="flex items-center gap-2 py-2.5 px-4 bg-dark-hover border border-dark-border text-dark-muted text-sm rounded-lg hover:text-red-400 hover:border-red-500/20 transition-colors">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
