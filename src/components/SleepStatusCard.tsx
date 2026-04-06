import { Moon, AlertTriangle, AlertCircle, CheckCircle2, Sparkles, Brain } from 'lucide-react'

interface SleepStatusCardProps {
  sleepHours: number
}

export function SleepStatusCard({ sleepHours }: SleepStatusCardProps) {
  // Optimal sleep target: 7-9 hours for adults
  const optimalSleepMin = 7
  const optimalSleepMax = 9

  // Determine sleep quality status based on hours
  const getSleepStatus = () => {
    if (sleepHours < 5.0) return {
      status: 'Privación Severa',
      icon: AlertCircle,
      gradient: 'from-red-500 via-orange-500 to-red-600',
      glowColor: 'shadow-red-500/50',
      textColor: 'text-red-400',
      message: 'Protocolo CRÍTICO: Carbos mínimos, proteína alta, soporte adrenal máximo.',
      impact: 'Metabolismo comprometido. Resistencia a insulina temporal activa.'
    }
    if (sleepHours < 6.5) return {
      status: 'Privación Moderada',
      icon: AlertTriangle,
      gradient: 'from-yellow-500 via-amber-500 to-orange-500',
      glowColor: 'shadow-yellow-500/50',
      textColor: 'text-yellow-400',
      message: 'Protección metabólica activa: Reducción de carbos por resistencia a insulina.',
      impact: 'Rendimiento cognitivo reducido. Ajuste nutricional recomendado.'
    }
    if (sleepHours < optimalSleepMin) return {
      status: 'Sueño Subóptimo',
      icon: Moon,
      gradient: 'from-blue-400 via-cyan-500 to-blue-500',
      glowColor: 'shadow-blue-500/50',
      textColor: 'text-blue-400',
      message: 'Sueño funcional pero por debajo del rango óptimo.',
      impact: 'Recuperación parcial. Considera dormir más esta noche.'
    }
    if (sleepHours <= optimalSleepMax) return {
      status: 'Sueño Óptimo',
      icon: CheckCircle2,
      gradient: 'from-emerald-400 via-green-500 to-teal-500',
      glowColor: 'shadow-emerald-500/50',
      textColor: 'text-emerald-400',
      message: 'Sueño recuperador. Metabolismo funcionando al 100%.',
      impact: 'Óptima regulación hormonal. Rendimiento cognitivo máximo.'
    }
    return {
      status: 'Sueño Excesivo',
      icon: Sparkles,
      gradient: 'from-purple-400 via-violet-500 to-purple-500',
      glowColor: 'shadow-purple-500/50',
      textColor: 'text-purple-400',
      message: 'Sueño prolongado detectado. Puede indicar deuda de sueño acumulada.',
      impact: 'Recuperación profunda en proceso. Monitorea tu energía diaria.'
    }
  }

  const status = getSleepStatus()
  const Icon = status.icon

  // Calculate sleep quality percentage (optimal range: 7-9 hours)
  const calculateSleepQuality = () => {
    if (sleepHours < optimalSleepMin) {
      // Below optimal: scale from 0% at 0 hours to 70% at 7 hours
      return Math.min((sleepHours / optimalSleepMin) * 70, 70)
    } else if (sleepHours <= optimalSleepMax) {
      // In optimal range: 100%
      return 100
    } else {
      // Above optimal: decrease from 100% as hours increase
      const excess = sleepHours - optimalSleepMax
      return Math.max(100 - (excess * 10), 70)
    }
  }

  const sleepQuality = calculateSleepQuality()
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (sleepQuality / 100) * circumference

  return (
    <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6 overflow-hidden group hover:border-dark-border/80 transition-all duration-300">
      {/* Ambient gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${status.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

      {/* Decorative blur effect */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Header section with sleep status */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${status.gradient} ${status.glowColor} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Estado de Sueño
              </h3>
              <p className={`text-sm font-medium ${status.textColor}`}>{status.status}</p>
            </div>
          </div>
        </div>

        {/* Circular progress and sleep metrics */}
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
                stroke="url(#sleepGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="sleepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={status.textColor} />
                  <stop offset="100%" className={status.textColor} style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            {/* Center display showing sleep hours */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">{sleepHours.toFixed(1)}</div>
              <div className="text-xs text-dark-muted">horas</div>
            </div>
          </div>

          {/* Status message and sleep impact info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <Brain className="w-4 h-4" />
              <span>Calidad de Recuperación</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{status.message}</p>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <p className="text-dark-muted">Calidad</p>
                <p className={`font-bold ${status.textColor}`}>{sleepQuality.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-dark-muted">Rango Óptimo</p>
                <p className={`font-bold ${status.textColor}`}>{optimalSleepMin}-{optimalSleepMax}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metabolic impact indicator */}
        <div className={`p-4 rounded-xl border backdrop-blur-sm ${
          sleepHours >= optimalSleepMin && sleepHours <= optimalSleepMax
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : sleepHours < 5.0
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-orange-500/10 border-orange-500/30'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Moon className={`w-4 h-4 ${status.textColor}`} />
            <p className="text-xs font-semibold text-white">Impacto Metabólico</p>
          </div>
          <p className="text-xs text-dark-muted leading-relaxed">{status.impact}</p>
        </div>
      </div>
    </div>
  )
}
