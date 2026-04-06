import { Zap, Battery, BatteryCharging } from 'lucide-react'
import { useNutritionalStandards } from '../hooks/useNutritionalStandards'

interface BComplexVitaminsProps {
  vitamins: {
    vitamin_b1_thiamin_mg: number
    vitamin_b2_riboflavin_mg: number
    vitamin_b3_niacin_mg: number
    vitamin_b5_pantothenic_mg: number
    vitamin_b6_mg: number
    vitamin_b7_biotin_mcg: number
    vitamin_b12_mcg: number
    folate_mcg: number
  }
}

interface VitaminItem {
  name: string
  value: number
  target: number
  min: number
  unit: string
  description: string
}

export function BComplexVitamins({ vitamins }: BComplexVitaminsProps) {
  const { getPersonalizedTarget, getStandard, loading } = useNutritionalStandards()

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    )
  }

  const vitaminData = [
    { key: 'vitamin_b1_thiamin_mg', name: 'B1 (Tiamina)', value: vitamins.vitamin_b1_thiamin_mg, description: 'Metabolismo de carbohidratos' },
    { key: 'vitamin_b2_riboflavin_mg', name: 'B2 (Riboflavina)', value: vitamins.vitamin_b2_riboflavin_mg, description: 'Salud ocular y migrañas' },
    { key: 'vitamin_b3_niacin_mg', name: 'B3 (Niacina)', value: vitamins.vitamin_b3_niacin_mg, description: 'NAD+ y reparación ADN' },
    { key: 'vitamin_b5_pantothenic_mg', name: 'B5 (Pantoténico)', value: vitamins.vitamin_b5_pantothenic_mg, description: 'Hormonas y manejo estrés' },
    { key: 'vitamin_b6_pyridoxine_mg', name: 'B6 (Piridoxina)', value: vitamins.vitamin_b6_mg, description: 'Neurotransmisores' },
    { key: 'vitamin_b7_biotin_mcg', name: 'B7 (Biotina)', value: vitamins.vitamin_b7_biotin_mcg, description: 'Pelo y piel' },
    { key: 'folate_mcg', name: 'B9 (Folato)', value: vitamins.folate_mcg, description: 'Metilación y ADN' },
    { key: 'b12_mcg', name: 'B12 (Cobalamina)', value: vitamins.vitamin_b12_mcg, description: 'Energía y sistema nervioso' },
  ]

  const items: VitaminItem[] = vitaminData.map(vit => {
    const targets = getPersonalizedTarget(vit.key)
    const standard = getStandard(vit.key)
    return {
      name: vit.name,
      value: vit.value,
      target: targets.optimal,
      min: targets.min,
      unit: standard?.unit || 'mg',
      description: vit.description,
    }
  })

  // Calculate overall B Complex energy status
  const totalPercentage = items.reduce((sum, vitamin) => {
    return sum + (vitamin.value / vitamin.target) * 100
  }, 0) / items.length

  // Determine energy production status
  const getEnergyStatus = () => {
    if (totalPercentage < 30) return {
      status: 'Construyendo Base',
      icon: Battery,
      gradient: 'from-orange-500 via-amber-500 to-orange-600',
      glowColor: 'shadow-orange-500/50',
      textColor: 'text-orange-400',
      message: '¡Empieza tu recarga energética! Las vitaminas B son tu combustible.'
    }
    if (totalPercentage < 70) return {
      status: 'Energía en Desarrollo',
      icon: BatteryCharging,
      gradient: 'from-yellow-500 via-amber-500 to-orange-500',
      glowColor: 'shadow-yellow-500/50',
      textColor: 'text-yellow-400',
      message: 'Tu metabolismo está activándose. ¡Sigue así!'
    }
    if (totalPercentage < 100) return {
      status: 'Energía Elevada',
      icon: BatteryCharging,
      gradient: 'from-lime-400 via-green-500 to-emerald-500',
      glowColor: 'shadow-green-500/50',
      textColor: 'text-green-400',
      message: '¡Excelente! Tu producción mitocondrial va muy bien.'
    }
    return {
      status: 'Energía Máxima',
      icon: Zap,
      gradient: 'from-yellow-400 via-amber-500 to-orange-500',
      glowColor: 'shadow-yellow-500/50',
      textColor: 'text-yellow-400',
      message: '¡Increíble! Ciclo de Krebs funcionando a toda máquina.'
    }
  }

  const status = getEnergyStatus()
  const Icon = status.icon

  // Calculate circular progress for overall B Complex status
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (Math.min(totalPercentage, 100) / 100) * circumference

  return (
    <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6 overflow-hidden group hover:border-dark-border/80 transition-all duration-300">
      {/* Ambient gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${status.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

      <div className="relative z-10">
        {/* Header section with energy status */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${status.gradient} ${status.glowColor} shadow-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Complejo B - Energía ATP
              </h3>
              <p className={`text-sm font-medium ${status.textColor}`}>{status.status}</p>
            </div>
          </div>
        </div>

        {/* Circular progress and energy metrics */}
        <div className="flex items-center gap-8 mb-6">
          <div className="relative">
            <svg className="transform -rotate-90 w-24 h-24" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-dark-border"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="url(#bComplexGradient)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="bComplexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={status.textColor} />
                  <stop offset="100%" className={status.textColor} style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            {/* Center display showing overall percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">{totalPercentage.toFixed(0)}</div>
              <div className="text-xs text-dark-muted">% Energía</div>
            </div>
          </div>

          {/* Status message and Krebs cycle info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <Zap className="w-4 h-4" />
              <span>Ciclo de Krebs & Producción de ATP</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{status.message}</p>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <p className="text-dark-muted">Cofactores</p>
                <p className={`font-bold ${status.textColor}`}>{items.length}/8</p>
              </div>
              <div>
                <p className="text-dark-muted">Eficiencia</p>
                <p className={`font-bold ${status.textColor}`}>{totalPercentage.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Individual B vitamins grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-dark-muted flex items-center gap-2">
            <span>Perfil Completo de Vitaminas B</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {items.map((vitamin) => {
              const percentage = (vitamin.value / vitamin.target) * 100
              const minPercentage = (vitamin.min / vitamin.target) * 100
              const isDeficient = vitamin.value < vitamin.min
              const isAcceptable = vitamin.value >= vitamin.min && vitamin.value < vitamin.target

              const statusColor = isDeficient
                ? 'text-red-400'
                : isAcceptable
                ? 'text-yellow-400'
                : 'text-green-400'

              const barColor = isDeficient
                ? 'bg-red-500'
                : isAcceptable
                ? 'bg-yellow-500'
                : 'bg-green-500'

              return (
                <div
                  key={vitamin.name}
                  className="bg-dark-bg/50 backdrop-blur-sm rounded-lg p-3 border border-dark-border/50 transition-all hover:border-dark-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">{vitamin.name}</span>
                      <p className="text-xs text-dark-muted mt-0.5">{vitamin.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${statusColor}`}>
                      {vitamin.value.toFixed(1)} {vitamin.unit}
                    </span>
                    <span className="text-xs text-dark-muted">
                      Min: {vitamin.min} • IDO: {vitamin.target}
                    </span>
                  </div>
                  <div className="relative w-full bg-dark-hover rounded-full h-2 overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-red-500/20 border-r border-dashed border-red-400/40"
                      style={{ width: `${minPercentage}%` }}
                    />
                    <div
                      className={`absolute top-0 left-0 h-full ${barColor} transition-all duration-300 shadow-md`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className={`text-xs font-medium ${statusColor}`}>
                      {percentage.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-dark-muted">
                      {isDeficient ? 'En progreso' : isAcceptable ? 'Mejorando' : '¡Logrado!'}
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
