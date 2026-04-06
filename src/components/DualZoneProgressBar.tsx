import { CheckCircle2, TrendingUp } from 'lucide-react'

interface DualZoneProgressBarProps {
  label: string
  value: number
  min: number
  optimal: number
  unit: string
  description?: string
  format?: (val: number) => string
}

export function DualZoneProgressBar({
  label,
  value,
  min,
  optimal,
  unit,
  description,
  format,
}: DualZoneProgressBarProps) {
  const formatValue = format || ((val: number) => val.toFixed(1))

  const percentageOfOptimal = (value / optimal) * 100
  const minPercentage = (min / optimal) * 100

  const getStatus = () => {
    if (value < min) {
      return {
        status: 'En progreso',
        icon: TrendingUp,
        color: 'text-orange-400',
        barColor: 'bg-orange-500',
        borderColor: 'border-orange-500/30',
        bgColor: 'bg-orange-500/10',
        message: `¡Oportunidad de mejora! Meta: ${formatValue(min)} ${unit}`,
      }
    }
    if (value < optimal) {
      return {
        status: 'Buen camino',
        icon: TrendingUp,
        color: 'text-yellow-400',
        barColor: 'bg-yellow-500',
        borderColor: 'border-yellow-500/30',
        bgColor: 'bg-yellow-500/10',
        message: `¡Vas bien! Falta poco para lo óptimo`,
      }
    }
    return {
      status: '¡Excelente!',
      icon: CheckCircle2,
      color: 'text-green-400',
      barColor: 'bg-green-500',
      borderColor: 'border-green-500/30',
      bgColor: 'bg-green-500/10',
      message: `¡Zona óptima alcanzada! 🎯`,
    }
  }

  const status = getStatus()
  const Icon = status.icon

  const barWidth = Math.min(percentageOfOptimal, 150)

  return (
    <div className={`relative bg-dark-bg/50 backdrop-blur-sm rounded-lg p-4 border ${status.borderColor} transition-all hover:border-opacity-60`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-4 h-4 ${status.color}`} />
            <span className="text-sm font-semibold text-white">{label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${status.bgColor} ${status.color} font-medium`}>
              {status.status}
            </span>
          </div>
          {description && (
            <p className="text-xs text-dark-muted ml-6">{description}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className={`font-bold ${status.color}`}>
            {formatValue(value)} {unit}
          </span>
          <span className="text-dark-muted">
            Óptimo: {formatValue(optimal)} {unit}
          </span>
        </div>

        <div className="relative h-8 bg-dark-hover rounded-full overflow-hidden border border-dark-border">
          <div
            className="absolute top-0 left-0 h-full bg-dark-card border-r-2 border-dashed border-white/20 z-10 flex items-center justify-center"
            style={{ width: `${minPercentage}%` }}
          >
            <span className="text-[10px] font-bold text-white/40 px-2">MIN</span>
          </div>

          <div
            className={`absolute top-0 left-0 h-full ${status.barColor} transition-all duration-500 ease-out shadow-lg`}
            style={{
              width: `${barWidth}%`,
              boxShadow: value >= optimal ? '0 0 20px currentColor' : 'none',
            }}
          />

          <div
            className="absolute top-0 right-0 h-full border-l-2 border-dashed border-white/10 flex items-center justify-center"
            style={{ width: '10%' }}
          >
            <span className="text-[10px] font-bold text-white/30">IDO</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-dark-muted">
          <span>Mínimo: {formatValue(min)} {unit}</span>
          <span className={status.color}>{percentageOfOptimal.toFixed(0)}% del objetivo</span>
        </div>
      </div>

      <div className={`mt-2 text-xs ${status.color} flex items-center gap-1.5`}>
        <div className={`w-1 h-1 rounded-full ${status.barColor}`} />
        {status.message}
      </div>
    </div>
  )
}
