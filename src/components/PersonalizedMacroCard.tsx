import { LucideIcon } from 'lucide-react'
import { TrendingUp, CheckCircle2 } from 'lucide-react'

interface PersonalizedMacroCardProps {
  title: string
  current: number
  min: number
  optimal: number
  unit: string
  icon: LucideIcon
  color: string
}

const colorConfig: Record<string, {
  gradient: string
  textColor: string
  glowColor: string
  bgGradient: string
}> = {
  'text-orange-500': {
    gradient: 'from-orange-500 via-red-500 to-orange-600',
    textColor: 'text-orange-400',
    glowColor: 'shadow-orange-500/50',
    bgGradient: 'from-orange-500/10 to-red-500/10'
  },
  'text-blue-500': {
    gradient: 'from-blue-500 via-cyan-500 to-blue-600',
    textColor: 'text-blue-400',
    glowColor: 'shadow-blue-500/50',
    bgGradient: 'from-blue-500/10 to-cyan-500/10'
  },
  'text-green-500': {
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    textColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/50',
    bgGradient: 'from-emerald-500/10 to-green-500/10'
  },
  'text-yellow-500': {
    gradient: 'from-yellow-500 via-amber-500 to-yellow-600',
    textColor: 'text-yellow-400',
    glowColor: 'shadow-yellow-500/50',
    bgGradient: 'from-yellow-500/10 to-amber-500/10'
  },
}

export function PersonalizedMacroCard({
  title,
  current,
  min,
  optimal,
  unit,
  icon: Icon,
  color
}: PersonalizedMacroCardProps) {
  const config = colorConfig[color] || colorConfig['text-blue-500']

  const isDeficient = current < min
  const isAcceptable = current >= min && current < optimal

  const percentage = (current / optimal) * 100
  const minPercentage = (min / optimal) * 100

  const getStatusConfig = () => {
    if (isDeficient) {
      return {
        status: 'Empezando',
        icon: TrendingUp,
        statusColor: 'text-orange-400',
        barColor: 'bg-orange-500',
        message: `Meta inicial: ${min} ${unit}`
      }
    }
    if (isAcceptable) {
      return {
        status: 'Progresando',
        icon: TrendingUp,
        statusColor: 'text-yellow-400',
        barColor: 'bg-yellow-500',
        message: `¡Avanzando hacia lo óptimo!`
      }
    }
    return {
      status: '¡Logrado!',
      icon: CheckCircle2,
      statusColor: 'text-green-400',
      barColor: 'bg-green-500',
      message: `Objetivo óptimo alcanzado`
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  const clampedPercentage = Math.min(percentage, 100)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference

  return (
    <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-5 overflow-hidden group hover:border-dark-border/80 transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} ${config.glowColor} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${statusConfig.statusColor}`} />
            <span className={`text-xs font-medium ${statusConfig.statusColor}`}>
              {statusConfig.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="45"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-dark-border"
              />
              <circle
                cx="48"
                cy="48"
                r="45"
                stroke="url(#macroGradient)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="macroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={config.textColor} />
                  <stop offset="100%" className={config.textColor} style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`text-2xl font-bold ${config.textColor}`}>
                {Math.round(percentage)}%
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-dark-muted mb-1">{title}</h3>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${statusConfig.statusColor}`}>
                {Math.round(current)}
              </span>
              <span className="text-xs text-dark-muted">/ {optimal} {unit}</span>
            </div>
            <div className="text-xs text-dark-muted mt-1">
              Mínimo: {min} {unit} • Óptimo: {optimal} {unit}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative h-2 bg-dark-hover rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-red-500/20 border-r-2 border-dashed border-red-400/50"
              style={{ width: `${minPercentage}%` }}
            />
            <div
              className={`absolute top-0 left-0 h-full ${statusConfig.barColor} transition-all duration-500 shadow-lg`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-dark-muted mt-1">
            <span>MIN</span>
            <span className={statusConfig.statusColor}>{statusConfig.message}</span>
            <span>IDO</span>
          </div>
        </div>
      </div>
    </div>
  )
}
