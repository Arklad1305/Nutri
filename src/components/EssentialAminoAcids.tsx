import { Dna, Zap, TrendingUp, Activity } from 'lucide-react'
import { useNutritionalStandards } from '../hooks/useNutritionalStandards'

interface EssentialAminoAcidsProps {
  aminoAcids: {
    leucine_mg: number
    isoleucine_mg: number
    valine_mg: number
    lysine_mg: number
    methionine_mg: number
    phenylalanine_mg: number
    threonine_mg: number
    histidine_mg: number
    tryptophan_mg: number
  }
}

interface AminoAcidItem {
  name: string
  value: number
  target: number
  unit: string
  description: string
  isBCAA?: boolean
}

export function EssentialAminoAcids({ aminoAcids }: EssentialAminoAcidsProps) {
  const { getOptimalTarget, loading } = useNutritionalStandards()

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </div>
    )
  }

  const leucineTarget = getOptimalTarget('leucine_g') * 1000 || 8000
  const isoleucineTarget = getOptimalTarget('isoleucine_mg') || 3000
  const valineTarget = getOptimalTarget('valine_mg') || 4000
  const lysineTarget = getOptimalTarget('lysine_mg') || 3000
  const methionineTarget = getOptimalTarget('methionine_g') * 1000 || 2000
  const phenylalanineTarget = getOptimalTarget('phenylalanine_mg') || 3000
  const threonineTarget = getOptimalTarget('threonine_mg') || 2500
  const histidineTarget = getOptimalTarget('histidine_mg') || 2000
  const tryptophanTarget = getOptimalTarget('tryptophan_g') * 1000 || 1000

  const items: AminoAcidItem[] = [
    {
      name: 'Leucina',
      value: aminoAcids.leucine_mg,
      target: leucineTarget,
      unit: 'mg',
      description: 'mTOR y síntesis proteica',
      isBCAA: true,
    },
    {
      name: 'Isoleucina',
      value: aminoAcids.isoleucine_mg,
      target: isoleucineTarget,
      unit: 'mg',
      description: 'Energía e inmunidad',
      isBCAA: true,
    },
    {
      name: 'Valina',
      value: aminoAcids.valine_mg,
      target: valineTarget,
      unit: 'mg',
      description: 'Recuperación muscular',
      isBCAA: true,
    },
    {
      name: 'Lisina',
      value: aminoAcids.lysine_mg,
      target: lysineTarget,
      unit: 'mg',
      description: 'Colágeno y antiviral',
    },
    {
      name: 'Metionina',
      value: aminoAcids.methionine_mg,
      target: methionineTarget,
      unit: 'mg',
      description: 'Metilación (SAMe)',
    },
    {
      name: 'Fenilalanina',
      value: aminoAcids.phenylalanine_mg,
      target: phenylalanineTarget,
      unit: 'mg',
      description: 'Dopamina y tirosina',
    },
    {
      name: 'Treonina',
      value: aminoAcids.threonine_mg,
      target: threonineTarget,
      unit: 'mg',
      description: 'Salud intestinal',
    },
    {
      name: 'Histidina',
      value: aminoAcids.histidine_mg,
      target: histidineTarget,
      unit: 'mg',
      description: 'Respuesta inmune',
    },
    {
      name: 'Triptófano',
      value: aminoAcids.tryptophan_mg,
      target: tryptophanTarget,
      unit: 'mg',
      description: 'Serotonina y sueño',
    },
  ]

  const bcaaTotal = aminoAcids.leucine_mg + aminoAcids.isoleucine_mg + aminoAcids.valine_mg
  const bcaaTarget = leucineTarget + isoleucineTarget + valineTarget
  const bcaaPercentage = (bcaaTotal / bcaaTarget) * 100

  // Calculate total EAA progress
  const totalEAA = items.reduce((sum, item) => sum + item.value, 0)
  const totalEAATarget = items.reduce((sum, item) => sum + item.target, 0)
  const totalPercentage = (totalEAA / totalEAATarget) * 100

  // Determine muscle building status based on BCAA and total EAA levels
  const getMuscleStatus = () => {
    if (bcaaPercentage < 30 || totalPercentage < 30) return {
      status: 'Iniciando',
      icon: Activity,
      gradient: 'from-orange-500 via-amber-500 to-orange-600',
      glowColor: 'shadow-orange-500/50',
      textColor: 'text-orange-400',
      message: '¡Construye músculo! Aumenta tu proteína de calidad.'
    }
    if (bcaaPercentage < 70 || totalPercentage < 70) return {
      status: 'En Desarrollo',
      icon: TrendingUp,
      gradient: 'from-yellow-500 via-amber-500 to-orange-500',
      glowColor: 'shadow-yellow-500/50',
      textColor: 'text-yellow-400',
      message: 'Tu síntesis proteica está activándose. ¡Sigue así!'
    }
    if (bcaaPercentage < 100 || totalPercentage < 100) return {
      status: 'Construyendo',
      icon: TrendingUp,
      gradient: 'from-blue-400 via-cyan-500 to-blue-500',
      glowColor: 'shadow-blue-500/50',
      textColor: 'text-blue-400',
      message: '¡Excelente! Tu cuerpo está construyendo músculo.'
    }
    return {
      status: 'Hipertrofia Máxima',
      icon: Zap,
      gradient: 'from-green-400 via-emerald-500 to-teal-500',
      glowColor: 'shadow-green-500/50',
      textColor: 'text-green-400',
      message: '¡Increíble! Máxima activación mTOR y construcción muscular.'
    }
  }

  const status = getMuscleStatus()
  const Icon = status.icon

  // Calculate circular progress values for BCAA visualization
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (Math.min(bcaaPercentage, 100) / 100) * circumference

  return (
    <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6 overflow-hidden group hover:border-dark-border/80 transition-all duration-300">
      {/* Ambient gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${status.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

      {/* Decorative blur effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Header section with muscle building status */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${status.gradient} ${status.glowColor} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Construcción Muscular
              </h3>
              <p className={`text-sm font-medium ${status.textColor}`}>{status.status}</p>
            </div>
          </div>
        </div>

        {/* BCAA circular progress and metrics */}
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
                stroke="url(#bcaaGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="bcaaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={status.textColor} />
                  <stop offset="100%" className={status.textColor} style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            {/* Center display showing BCAA percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">{bcaaPercentage.toFixed(0)}</div>
              <div className="text-xs text-dark-muted">% BCAAs</div>
            </div>
          </div>

          {/* BCAA breakdown and status message */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <Dna className="w-4 h-4" />
              <span>Aminoácidos de Cadena Ramificada</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-muted">BCAAs Totales</p>
                <p className={`text-lg font-bold ${status.textColor}`}>{bcaaTotal.toFixed(0)} mg</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-dark-muted">Objetivo</p>
                <p className="text-lg font-bold text-white">{bcaaTarget} mg</p>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{status.message}</p>
          </div>
        </div>

        {/* Individual amino acids grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-dark-muted flex items-center gap-2">
            <span>Perfil Completo de EAAs</span>
            <span className={`${status.textColor}`}>
              {totalPercentage.toFixed(0)}%
            </span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((amino) => {
              // Calculate individual progress percentage
              const percentage = (amino.value / amino.target) * 100
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
                  key={amino.name}
                  className={`bg-dark-bg/50 backdrop-blur-sm rounded-lg p-3 border transition-all hover:border-dark-border ${
                    amino.isBCAA
                      ? `border-gradient-to-br ${status.gradient} border-opacity-30`
                      : 'border-dark-border/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white">{amino.name}</span>
                        {amino.isBCAA && (
                          <span className={`text-xs px-1.5 py-0.5 rounded bg-gradient-to-r ${status.gradient} text-white font-medium`}>
                            BCAA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-dark-muted mt-0.5">{amino.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${statusColor}`}>
                      {amino.value.toFixed(0)} {amino.unit}
                    </span>
                    <span className="text-xs text-dark-muted">
                      /{amino.target}
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
