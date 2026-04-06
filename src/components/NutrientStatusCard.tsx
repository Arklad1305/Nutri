import { NutrientStatus } from '../lib/nutritionStandards'
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp, Target } from 'lucide-react'

interface NutrientStatusCardProps {
  status: NutrientStatus
}

export function NutrientStatusCard({ status }: NutrientStatusCardProps) {
  const getIcon = () => {
    switch (status.level) {
      case 'critical':
        return <AlertCircle className="w-4 h-4" />
      case 'survival':
        return <AlertTriangle className="w-4 h-4" />
      case 'functional':
        return <TrendingUp className="w-4 h-4" />
      case 'optimal':
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const getGradient = () => {
    switch (status.level) {
      case 'critical':
        return 'from-orange-500 via-orange-400 to-orange-600'
      case 'survival':
        return 'from-orange-400 via-orange-500 to-yellow-500'
      case 'functional':
        return 'from-yellow-400 via-yellow-500 to-amber-500'
      case 'optimal':
        return 'from-emerald-400 via-green-500 to-teal-500'
    }
  }

  const getGlowColor = () => {
    switch (status.level) {
      case 'critical':
        return 'shadow-orange-500/20'
      case 'survival':
        return 'shadow-orange-400/20'
      case 'functional':
        return 'shadow-yellow-400/20'
      case 'optimal':
        return 'shadow-green-500/20'
    }
  }

  const getTextColor = () => {
    switch (status.level) {
      case 'critical':
        return 'text-orange-400'
      case 'survival':
        return 'text-orange-400'
      case 'functional':
        return 'text-yellow-400'
      case 'optimal':
        return 'text-green-400'
    }
  }

  const getBgGradient = () => {
    switch (status.level) {
      case 'critical':
        return 'bg-gradient-to-br from-orange-500/5 to-orange-600/10'
      case 'survival':
        return 'bg-gradient-to-br from-orange-400/5 to-yellow-500/10'
      case 'functional':
        return 'bg-gradient-to-br from-yellow-400/5 to-amber-500/10'
      case 'optimal':
        return 'bg-gradient-to-br from-emerald-400/5 to-teal-500/10'
    }
  }

  const percentage = Math.min(status.percentage, 100)

  return (
    <div className={`group relative bg-dark-card/80 backdrop-blur-sm border border-dark-border ${getBgGradient()} rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${getGlowColor()} overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white text-base leading-tight">{status.label}</h3>
              <span className={`${getTextColor()} opacity-80`}>{getIcon()}</span>
            </div>
            {status.description && (
              <p className="text-xs text-dark-muted/80 line-clamp-2">{status.description}</p>
            )}
          </div>
        </div>

        {/* Values */}
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white tracking-tight">
                {status.current.toFixed(status.unit === 'mcg' || status.unit === 'IU' ? 0 : 1)}
              </span>
              <span className="text-sm font-medium text-dark-muted/70">{status.unit}</span>
            </div>
            <p className="text-xs text-dark-muted/60 mt-0.5">Consumido hoy</p>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-dark-muted/70">
              <Target className="w-3 h-3" />
              <span className="text-xs font-medium">Meta</span>
            </div>
            <p className="text-sm font-bold text-white mt-0.5">
              {status.min_optimal || status.min_survival}{status.unit}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="relative w-full h-3 bg-dark-bg/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getGradient()} transition-all duration-700 ease-out rounded-full shadow-lg`}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20" />
              <div className="absolute inset-0 bg-white/20 animate-pulse" style={{ animationDuration: '2s' }} />
            </div>

            {/* Percentage label inside bar */}
            {percentage > 15 && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white/90 z-10 drop-shadow-lg">
                {percentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Status Message */}
        <div className={`${getBgGradient()} border border-current/20 ${getTextColor()} rounded-lg p-2.5 text-xs font-medium leading-relaxed backdrop-blur-sm`}>
          {status.message}
        </div>

        {/* Range Info */}
        {status.min_optimal && (
          <div className="mt-3 pt-3 border-t border-dark-border/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-400/50" />
                <span className="text-dark-muted/70">Mínimo</span>
                <span className="font-semibold text-white/80">{status.min_survival}{status.unit}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400/50" />
                <span className="text-dark-muted/70">Óptimo</span>
                <span className="font-semibold text-white/80">{status.min_optimal}{status.unit}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
