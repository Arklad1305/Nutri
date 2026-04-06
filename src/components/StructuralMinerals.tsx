import { Layers, Bone, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useNutritionalStandards } from '../hooks/useNutritionalStandards'

interface StructuralMineralsProps {
  minerals: {
    calcium_mg: number
    phosphorus_mg: number
    manganese_mg: number
    iodine_mcg: number
    chromium_mcg: number
  }
}

interface MineralItem {
  name: string
  value: number
  target: number
  unit: string
  description: string
}

export function StructuralMinerals({ minerals }: StructuralMineralsProps) {
  const { getOptimalTarget, loading } = useNutritionalStandards()

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
        </div>
      </div>
    )
  }

  const items: MineralItem[] = [
    {
      name: 'Calcio',
      value: minerals.calcium_mg,
      target: getOptimalTarget('calcium_mg') || 1200,
      unit: 'mg',
      description: 'Huesos y contracción muscular',
    },
    {
      name: 'Fósforo',
      value: minerals.phosphorus_mg,
      target: getOptimalTarget('phosphorus_mg') || 1000,
      unit: 'mg',
      description: 'Formación de ATP',
    },
    {
      name: 'Manganeso',
      value: minerals.manganese_mg,
      target: getOptimalTarget('manganese_mg') || 5,
      unit: 'mg',
      description: 'Protección mitocondrial',
    },
    {
      name: 'Yodo',
      value: minerals.iodine_mcg,
      target: getOptimalTarget('iodine_mcg') || 300,
      unit: 'mcg',
      description: 'Motor de la tiroides (T3/T4)',
    },
    {
      name: 'Cromo',
      value: minerals.chromium_mcg,
      target: getOptimalTarget('chromium_mcg') || 200,
      unit: 'mcg',
      description: 'Sensibilidad a insulina',
    },
  ]

  // Calculate total mineral profile status
  const totalPercentage = items.reduce((sum, mineral) => {
    return sum + (mineral.value / mineral.target) * 100
  }, 0) / items.length

  // Determine structural health status
  const getStructuralStatus = () => {
    if (totalPercentage < 30) return {
      status: 'Construyendo Bases',
      icon: Layers,
      gradient: 'from-orange-500 via-amber-500 to-orange-600',
      glowColor: 'shadow-orange-500/50',
      textColor: 'text-orange-400',
      message: '¡Es momento de fortalecer tus huesos! Los minerales son tu estructura.'
    }
    if (totalPercentage < 70) return {
      status: 'Fortaleciendo',
      icon: Layers,
      gradient: 'from-yellow-400 via-amber-500 to-yellow-500',
      glowColor: 'shadow-yellow-500/50',
      textColor: 'text-yellow-400',
      message: 'Tu estructura está mejorando. ¡Continúa así!'
    }
    if (totalPercentage < 100) return {
      status: 'Fortaleza Sólida',
      icon: CheckCircle2,
      gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
      glowColor: 'shadow-cyan-500/50',
      textColor: 'text-cyan-400',
      message: '¡Genial! Tu densidad ósea y balance hormonal van muy bien.'
    }
    return {
      status: 'Estructura Óptima',
      icon: ShieldCheck,
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      glowColor: 'shadow-emerald-500/50',
      textColor: 'text-emerald-400',
      message: '¡Perfecto! Máxima densidad ósea y balance metabólico.'
    }
  }

  const status = getStructuralStatus()
  const Icon = status.icon

  // Calculate Ca:P ratio (optimal is 1:1 to 2:1)
  const caPhosRatio = minerals.phosphorus_mg > 0 ? minerals.calcium_mg / minerals.phosphorus_mg : 0
  const isCaPhosBalanced = caPhosRatio >= 1 && caPhosRatio <= 2

  // Calculate circular progress for overall mineral status
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (Math.min(totalPercentage, 100) / 100) * circumference

  return (
    <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6 overflow-hidden group hover:border-dark-border/80 transition-all duration-300">
      {/* Ambient gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${status.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

      {/* Decorative blur effect */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Header section with structural status */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${status.gradient} ${status.glowColor} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Minerales Estructurales
              </h3>
              <p className={`text-sm font-medium ${status.textColor}`}>{status.status}</p>
            </div>
          </div>
        </div>

        {/* Circular progress and structural metrics */}
        <div className="flex items-center gap-8 mb-6">
          <div className="relative">
            <svg className="transform -rotate-90 w-32 h-32">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-dark-border"
              />
              {/* Animated progress circle with gradient */}
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="url(#mineralGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="mineralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={status.textColor} />
                  <stop offset="100%" className={status.textColor} style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            {/* Center display showing overall percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">{totalPercentage.toFixed(0)}</div>
              <div className="text-xs text-dark-muted">% Minerales</div>
            </div>
          </div>

          {/* Status message and structural info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <Bone className="w-4 h-4" />
              <span>Densidad Ósea & Regulación Hormonal</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{status.message}</p>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <p className="text-dark-muted">Minerales</p>
                <p className={`font-bold ${status.textColor}`}>{items.length}/5</p>
              </div>
              <div>
                <p className="text-dark-muted">Fortaleza</p>
                <p className={`font-bold ${status.textColor}`}>{totalPercentage.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ca:P Ratio Indicator */}
        {minerals.calcium_mg > 0 && minerals.phosphorus_mg > 0 && (
          <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${
            isCaPhosBalanced
              ? 'bg-cyan-500/10 border-cyan-500/30'
              : 'bg-orange-500/10 border-orange-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bone className={`w-5 h-5 ${isCaPhosBalanced ? 'text-cyan-400' : 'text-orange-400'}`} />
                <div>
                  <p className="text-sm font-semibold text-white">Ratio Calcio:Fósforo</p>
                  <p className="text-xs text-dark-muted">
                    {isCaPhosBalanced ? 'Balance óptimo para densidad ósea' : 'Ajustar ingesta de minerales'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${isCaPhosBalanced ? 'text-cyan-400' : 'text-orange-400'}`}>
                  {caPhosRatio.toFixed(2)}:1
                </p>
                <p className="text-xs text-dark-muted">Óptimo: 1:1 - 2:1</p>
              </div>
            </div>
          </div>
        )}

        {/* Individual minerals grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-dark-muted flex items-center gap-2">
            <span>Perfil Completo de Minerales</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((mineral) => {
              // Calculate individual progress percentage
              const percentage = (mineral.value / mineral.target) * 100
              const isGood = percentage >= 50 && percentage < 100
              const isExcellent = percentage >= 100

              const statusColor = isExcellent
                ? 'text-green-400'
                : isGood
                ? 'text-yellow-400'
                : 'text-red-400'

              const barColor = isExcellent
                ? 'bg-green-500'
                : isGood
                ? 'bg-yellow-500'
                : 'bg-red-500'

              return (
                <div
                  key={mineral.name}
                  className="bg-dark-bg/50 backdrop-blur-sm rounded-lg p-3 border border-dark-border/50 transition-all hover:border-dark-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">{mineral.name}</span>
                      <p className="text-xs text-dark-muted mt-0.5">{mineral.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${statusColor}`}>
                      {mineral.value.toFixed(1)} {mineral.unit}
                    </span>
                    <span className="text-xs text-dark-muted">
                      /{mineral.target}
                    </span>
                  </div>
                  <div className="w-full bg-dark-hover rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all duration-300`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <span className={`text-xs font-medium ${statusColor}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
