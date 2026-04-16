import { useEffect, useState } from 'react'
import { Activity, Sparkles, Shield, Zap, TrendingUp, Flame, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface MetabolicState {
  state: 'mTOR_ACTIVE' | 'NEUTRAL' | 'AUTOPHAGY_EARLY' | 'AUTOPHAGY_DEEP'
  label: string
  gradient: string
  glowColor: string
  textColor: string
  icon: typeof Activity
  description: string
  hoursSinceLastMeal: number
  impact: string
  hasHighLeucine?: boolean
  insulinLevel?: 'high' | 'moderate' | 'low' | 'basal'
  insulinScore?: number
}

export function MetabolicStateCard() {
  const { user } = useAuth()
  const [metabolicState, setMetabolicState] = useState<MetabolicState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchMetabolicState = async () => {
      try {
        const { data, error } = await supabase
          .from('food_logs')
          .select('logged_at, nutritional_matrix, carbs_g, protein_g')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          setMetabolicState(null)
          setIsLoading(false)
          return
        }

        const lastMealTime = new Date(data.logged_at)
        const now = new Date()
        const hoursSinceLastMeal = (now.getTime() - lastMealTime.getTime()) / (1000 * 60 * 60)

        const matrix = data.nutritional_matrix as any
        const leucineAmount = (matrix?.motor?.aminos_muscle?.leucine_mg || 0) / 1000
        const carbsAmount = data.carbs_g || 0
        const proteinAmount = data.protein_g || 0

        const state = calculateMetabolicState(hoursSinceLastMeal, leucineAmount, carbsAmount, proteinAmount)
        setMetabolicState(state)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching metabolic state:', err)
        setIsLoading(false)
      }
    }

    fetchMetabolicState()
    const interval = setInterval(fetchMetabolicState, 60000)

    return () => clearInterval(interval)
  }, [user])

  if (isLoading) {
    return (
      <div className="relative bg-gradient-to-br from-[#081210] to-[#060e0c] border border-emerald-500/15 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full border border-emerald-500/8 animate-[pulse-ring_4s_ease-out_infinite] pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-48 h-48 rounded-full border border-emerald-500/8 animate-[pulse-ring_4s_ease-out_infinite_1s] pointer-events-none"></div>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-emerald-500/10 rounded w-1/2"></div>
          <div className="h-4 bg-emerald-500/10 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!metabolicState) {
    return (
      <div className="relative bg-gradient-to-br from-[#081210] to-[#060e0c] border border-emerald-500/15 rounded-2xl p-6 overflow-hidden">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full border border-emerald-500/8 animate-[pulse-ring_4s_ease-out_infinite] pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-48 h-48 rounded-full border border-emerald-500/8 animate-[pulse-ring_4s_ease-out_infinite_1s] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-500/20">
              <Activity className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Estado Metabólico</p>
              <p className="text-xs text-dark-muted">Sin registros de comida hoy</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const Icon = metabolicState.icon

  const calculateProgress = () => {
    if (metabolicState.state === 'mTOR_ACTIVE') {
      return (metabolicState.hoursSinceLastMeal / 4) * 100
    } else if (metabolicState.state === 'NEUTRAL') {
      return ((metabolicState.hoursSinceLastMeal - 4) / 10) * 100
    } else if (metabolicState.state === 'AUTOPHAGY_EARLY') {
      return ((metabolicState.hoursSinceLastMeal - 14) / 6) * 100
    } else {
      return 100
    }
  }

  const progress = Math.min(calculateProgress(), 100)
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const hours = Math.floor(metabolicState.hoursSinceLastMeal)
  const minutes = Math.floor((metabolicState.hoursSinceLastMeal % 1) * 60)

  return (
    <div className="relative bg-gradient-to-br from-[#081210] to-[#060e0c] border border-emerald-500/15 rounded-2xl p-6 overflow-hidden group hover:border-emerald-500/25 transition-all duration-300">
      <div className="absolute top-4 right-4 w-32 h-32 rounded-full border border-emerald-500/8 animate-[pulse-ring_4s_ease-out_infinite] pointer-events-none"></div>
      <div className="absolute top-4 right-4 w-48 h-48 rounded-full border border-emerald-500/8 animate-[pulse-ring_4s_ease-out_infinite_1s] pointer-events-none"></div>
      <div className={`absolute inset-0 bg-gradient-to-br ${metabolicState.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${metabolicState.gradient} ${metabolicState.glowColor} shadow-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Estado mTOR
              </h3>
              <p className={`text-sm font-medium ${metabolicState.textColor}`}>{metabolicState.label}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 mb-6">
          <div className="relative">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-dark-border"
              />
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="url(#mtorGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="mtorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={metabolicState.textColor} />
                  <stop offset="100%" className={metabolicState.textColor} style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">{hours}</div>
              <div className="text-xs text-dark-muted">horas</div>
              <div className="text-xs text-dark-muted">{minutes}min</div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <Clock className="w-4 h-4" />
              <span>Desde última comida</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{metabolicState.description}</p>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <p className="text-dark-muted">Fase</p>
                <p className={`font-bold ${metabolicState.textColor}`}>{metabolicState.state.replace('_', ' ')}</p>
              </div>
              {metabolicState.hasHighLeucine !== undefined && (
                <div>
                  <p className="text-dark-muted">Leucina</p>
                  <p className={`font-bold ${metabolicState.hasHighLeucine ? 'text-green-400' : 'text-yellow-400'}`}>
                    {metabolicState.hasHighLeucine ? 'Óptima' : 'Baja'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border backdrop-blur-sm ${
          metabolicState.state === 'mTOR_ACTIVE'
            ? 'bg-green-500/10 border-green-500/30'
            : metabolicState.state === 'NEUTRAL'
            ? 'bg-slate-500/10 border-slate-500/30'
            : metabolicState.state === 'AUTOPHAGY_EARLY'
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-purple-500/10 border-purple-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {metabolicState.state === 'mTOR_ACTIVE' && <Zap className={`w-4 h-4 ${metabolicState.textColor}`} />}
            {metabolicState.state === 'NEUTRAL' && <Shield className={`w-4 h-4 ${metabolicState.textColor}`} />}
            {(metabolicState.state === 'AUTOPHAGY_EARLY' || metabolicState.state === 'AUTOPHAGY_DEEP') && (
              <Sparkles className={`w-4 h-4 ${metabolicState.textColor}`} />
            )}
            <p className="text-xs font-semibold text-white">
              {metabolicState.state === 'mTOR_ACTIVE' && 'Síntesis Proteica Activa'}
              {metabolicState.state === 'NEUTRAL' && 'Estado de Mantenimiento'}
              {metabolicState.state === 'AUTOPHAGY_EARLY' && 'Reciclaje Celular Activo'}
              {metabolicState.state === 'AUTOPHAGY_DEEP' && 'Limpieza Celular Profunda'}
            </p>
          </div>
          <p className="text-xs text-dark-muted leading-relaxed">{metabolicState.impact}</p>
        </div>

        {metabolicState.state === 'mTOR_ACTIVE' && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <p className="text-xs text-dark-muted">Anabolismo</p>
              </div>
              <p className="text-sm font-bold text-green-400">Activo</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Flame className={`w-3 h-3 ${
                  metabolicState.insulinLevel === 'high' ? 'text-red-400' :
                  metabolicState.insulinLevel === 'moderate' ? 'text-orange-400' :
                  metabolicState.insulinLevel === 'low' ? 'text-yellow-400' :
                  'text-green-400'
                }`} />
                <p className="text-xs text-dark-muted">Insulina</p>
              </div>
              <p className={`text-sm font-bold ${
                metabolicState.insulinLevel === 'high' ? 'text-red-400' :
                metabolicState.insulinLevel === 'moderate' ? 'text-orange-400' :
                metabolicState.insulinLevel === 'low' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {metabolicState.insulinLevel === 'high' ? 'Muy Alta' :
                 metabolicState.insulinLevel === 'moderate' ? 'Moderada' :
                 metabolicState.insulinLevel === 'low' ? 'Baja' :
                 'Basal'}
              </p>
              {metabolicState.insulinScore !== undefined && (
                <p className="text-xs text-dark-muted mt-1">
                  Índice: {metabolicState.insulinScore.toFixed(0)}
                </p>
              )}
            </div>
          </div>
        )}

        {metabolicState.state === 'NEUTRAL' && metabolicState.insulinLevel && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3 h-3 text-slate-400" />
                <p className="text-xs text-dark-muted">Balance</p>
              </div>
              <p className="text-sm font-bold text-slate-400">Estable</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Flame className={`w-3 h-3 ${
                  metabolicState.insulinLevel === 'moderate' ? 'text-orange-400' :
                  metabolicState.insulinLevel === 'low' ? 'text-yellow-400' :
                  'text-green-400'
                }`} />
                <p className="text-xs text-dark-muted">Insulina</p>
              </div>
              <p className={`text-sm font-bold ${
                metabolicState.insulinLevel === 'moderate' ? 'text-orange-400' :
                metabolicState.insulinLevel === 'low' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {metabolicState.insulinLevel === 'moderate' ? 'Moderada' :
                 metabolicState.insulinLevel === 'low' ? 'Baja' :
                 'Basal'}
              </p>
              {metabolicState.insulinScore !== undefined && (
                <p className="text-xs text-dark-muted mt-1">
                  Índice: {metabolicState.insulinScore.toFixed(0)}
                </p>
              )}
            </div>
          </div>
        )}

        {(metabolicState.state === 'AUTOPHAGY_EARLY' || metabolicState.state === 'AUTOPHAGY_DEEP') && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <p className="text-xs text-dark-muted">Autofagia</p>
              </div>
              <p className="text-sm font-bold text-blue-400">
                {metabolicState.state === 'AUTOPHAGY_DEEP' ? 'Profunda' : 'Moderada'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3 h-3 text-purple-400" />
                <p className="text-xs text-dark-muted">Longevidad</p>
              </div>
              <p className="text-sm font-bold text-purple-400">Óptima</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function calculateInsulinLevel(
  hoursSinceLastMeal: number,
  carbsG: number,
  proteinG: number
): { level: 'high' | 'moderate' | 'low' | 'basal'; score: number } {
  // Índice de insulina basado en macros
  const carbImpact = carbsG * 10
  const proteinImpact = proteinG * 4

  const initialInsulinScore = carbImpact + proteinImpact

  // Decaimiento exponencial: vida media ~2.5h
  const halfLife = 2.5
  const decayFactor = Math.pow(0.5, hoursSinceLastMeal / halfLife)
  const currentInsulinScore = initialInsulinScore * decayFactor

  if (currentInsulinScore > 60) return { level: 'high', score: currentInsulinScore }
  if (currentInsulinScore > 30) return { level: 'moderate', score: currentInsulinScore }
  if (currentInsulinScore > 10) return { level: 'low', score: currentInsulinScore }
  return { level: 'basal', score: currentInsulinScore }
}

function calculateMetabolicState(
  hoursSinceLastMeal: number,
  leucineAmount: number,
  carbsG: number,
  proteinG: number
): MetabolicState {
  const insulin = calculateInsulinLevel(hoursSinceLastMeal, carbsG, proteinG)

  if (hoursSinceLastMeal < 4) {
    const hasHighLeucine = leucineAmount > 2.5
    return {
      state: 'mTOR_ACTIVE',
      label: 'Construcción Muscular',
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      glowColor: 'shadow-emerald-500/50',
      textColor: 'text-emerald-400',
      icon: Activity,
      description: hasHighLeucine
        ? 'mTOR activado. Síntesis proteica máxima con Leucina suficiente.'
        : 'Absorción de nutrientes. Considera leucina para máxima síntesis.',
      impact: hasHighLeucine
        ? 'Máxima señalización anabólica. Ventana óptima para hipertrofia muscular.'
        : 'Señalización anabólica activa. Aumenta leucina (>2.5g) para máximo efecto.',
      hoursSinceLastMeal,
      hasHighLeucine,
      insulinLevel: insulin.level,
      insulinScore: insulin.score
    }
  }

  if (hoursSinceLastMeal >= 4 && hoursSinceLastMeal < 14) {
    return {
      state: 'NEUTRAL',
      label: 'Equilibrio Metabólico',
      gradient: 'from-slate-400 via-gray-500 to-slate-500',
      glowColor: 'shadow-slate-500/50',
      textColor: 'text-slate-400',
      icon: Shield,
      description: 'Absorción completa. Insulina estabilizada. Estado de mantenimiento.',
      impact: 'Balance energético estable. Ideal para actividad regular.',
      hoursSinceLastMeal,
      insulinLevel: insulin.level,
      insulinScore: insulin.score
    }
  }

  if (hoursSinceLastMeal >= 14 && hoursSinceLastMeal < 20) {
    return {
      state: 'AUTOPHAGY_EARLY',
      label: 'Reparación Celular',
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      glowColor: 'shadow-blue-500/50',
      textColor: 'text-blue-400',
      icon: Sparkles,
      description: 'Autofagia iniciada. Reciclaje celular en marcha. Ideal para longevidad.',
      impact: 'Activación de genes de longevidad. Limpieza de proteínas dañadas y organelas.',
      hoursSinceLastMeal,
      insulinLevel: 'basal',
      insulinScore: 0
    }
  }

  return {
    state: 'AUTOPHAGY_DEEP',
    label: 'Limpieza Profunda',
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
    glowColor: 'shadow-purple-500/50',
    textColor: 'text-purple-400',
    icon: Sparkles,
    description: 'Autofagia profunda. Máxima limpieza celular. Proceso de renovación intenso.',
    impact: 'Renovación celular máxima. Mitofagia activa. Máximos beneficios anti-envejecimiento.',
    hoursSinceLastMeal,
    insulinLevel: 'basal',
    insulinScore: 0
  }
}
