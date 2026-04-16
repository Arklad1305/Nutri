import { NutrientStatus } from '../lib/nutritionStandards'
import { statusColors } from '../lib/statusColors'
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp, Target } from 'lucide-react'

interface NutrientStatusCardProps {
  status: NutrientStatus
}

export function NutrientStatusCard({ status }: NutrientStatusCardProps) {
  const c = statusColors(status.level)

  const Icon =
    status.level === 'critical' ? AlertCircle
    : status.level === 'survival' ? AlertTriangle
    : status.level === 'functional' ? TrendingUp
    : CheckCircle

  const percentage = Math.min(status.percentage, 100)

  return (
    <div className={`relative bg-dark-card/60 border ${c.border} rounded-xl p-5 transition-colors duration-200 hover:border-dark-border`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-base leading-tight">{status.label}</h3>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
          {status.description && (
            <p className="text-xs text-dark-muted/80 line-clamp-2">{status.description}</p>
          )}
        </div>
      </div>

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

      <div className="mb-3">
        <div className="relative w-full h-2 bg-dark-bg/60 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full ${c.bar} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className={`text-xs font-semibold ${c.text}`}>{percentage.toFixed(0)}%</span>
        </div>
      </div>

      <div className={`${c.bg} border ${c.border} ${c.text} rounded-lg p-2.5 text-xs font-medium leading-relaxed`}>
        {status.message}
      </div>

      {status.min_optimal && (
        <div className="mt-3 pt-3 border-t border-dark-border/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400/50" />
              <span className="text-dark-muted/70">Mínimo</span>
              <span className="font-semibold text-white/80">{status.min_survival}{status.unit}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
              <span className="text-dark-muted/70">Óptimo</span>
              <span className="font-semibold text-white/80">{status.min_optimal}{status.unit}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
