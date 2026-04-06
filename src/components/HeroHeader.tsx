import { useEffect, useState } from 'react'
import { Sun, Moon, Cloud } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface HeroHeaderProps {
  userName: string
  totalCalories: number
  goalCalories: number
  metabolicState: 'mTOR_ACTIVE' | 'NEUTRAL' | 'AUTOPHAGY_EARLY' | 'AUTOPHAGY_DEEP'
}

export function HeroHeader({ userName, totalCalories, goalCalories, metabolicState }: HeroHeaderProps) {
  const [greeting, setGreeting] = useState('')
  const [icon, setIcon] = useState<React.ReactNode>(null)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting('Buenos días')
      setIcon(<Sun className="w-6 h-6 text-amber-400" />)
    } else if (hour < 18) {
      setGreeting('Buenas tardes')
      setIcon(<Cloud className="w-6 h-6 text-cyan-400" />)
    } else {
      setGreeting('Buenas noches')
      setIcon(<Moon className="w-6 h-6 text-purple-400" />)
    }
  }, [])

  const calPercentage = (totalCalories / goalCalories) * 100
  const remaining = Math.max(0, goalCalories - totalCalories)
  const statusColor = calPercentage >= 90 && calPercentage <= 110 ? 'text-green-400' : calPercentage > 110 ? 'text-red-400' : 'text-amber-400'

  const metabolicColors = {
    mTOR_ACTIVE: 'from-emerald-500/20 to-green-500/10',
    NEUTRAL: 'from-slate-500/20 to-gray-500/10',
    AUTOPHAGY_EARLY: 'from-blue-500/20 to-cyan-500/10',
    AUTOPHAGY_DEEP: 'from-purple-500/20 to-fuchsia-500/10',
  }

  return (
    <div className="relative mb-8 overflow-hidden">
      {/* Ambient glow background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${metabolicColors[metabolicState]} blur-3xl opacity-40`} />

      {/* Content */}
      <div className="relative z-10 bg-dark-card/40 backdrop-blur-xl border border-dark-border/50 rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                {greeting}, <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{userName}</span>
              </h1>
              <p className="text-sm text-dark-muted mt-1">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
            </div>
          </div>
        </div>

        {/* Calorie Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-muted">Energía del día</span>
            <span className={`font-bold ${statusColor}`}>
              {totalCalories} / {goalCalories} kcal
            </span>
          </div>
          <div className="relative h-2 bg-dark-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                calPercentage >= 90 && calPercentage <= 110
                  ? 'from-green-500 to-emerald-500 shadow-lg shadow-green-500/50'
                  : calPercentage > 110
                  ? 'from-red-500 to-orange-500 shadow-lg shadow-red-500/50'
                  : 'from-amber-500 to-yellow-500 shadow-lg shadow-amber-500/50'
              }`}
              style={{ width: `${Math.min(calPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-dark-muted">
            <span>{Math.round(calPercentage)}% completado</span>
            <span>{remaining > 0 ? `${remaining} kcal restantes` : '✓ Meta alcanzada'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
