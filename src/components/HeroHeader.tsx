import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface HeroHeaderProps {
  userName: string
  totalCalories: number
  goalCalories: number
  metabolicState: 'mTOR_ACTIVE' | 'NEUTRAL' | 'AUTOPHAGY_EARLY' | 'AUTOPHAGY_DEEP'
}

function SunArc() {
  const now = new Date()
  const hours = now.getHours() + now.getMinutes() / 60

  // Sun arc: 6am (sunrise) → 12pm (noon/top) → 20h (sunset)
  const sunrise = 6
  const sunset = 20
  const dayLength = sunset - sunrise
  const isDay = hours >= sunrise && hours <= sunset

  // Progress through the day: 0 (sunrise) → 1 (sunset)
  const progress = isDay
    ? Math.max(0, Math.min(1, (hours - sunrise) / dayLength))
    : hours < sunrise
    ? 0
    : 1

  // Arc geometry: semicircle from left to right
  const arcWidth = 200
  const arcHeight = 50
  const cx = progress * arcWidth
  const cy = arcHeight - Math.sin(progress * Math.PI) * arcHeight

  // Sky gradient based on time
  const skyColor = !isDay
    ? '#0f172a'
    : hours < 8
    ? '#1e3a5f'
    : hours < 17
    ? '#1e40af'
    : '#1e3a5f'

  const sunColor = !isDay ? '#94a3b8' : hours < 8 || hours > 18 ? '#f59e0b' : '#fbbf24'
  const sunGlow = !isDay ? 'transparent' : hours < 8 || hours > 18 ? '#f59e0b' : '#fde68a'
  const sunSize = isDay ? 6 : 4

  // Horizon line
  const horizonY = arcHeight + 2

  return (
    <svg viewBox={`0 0 ${arcWidth} ${arcHeight + 10}`} className="w-full h-12 md:h-14" preserveAspectRatio="xMidYMid meet">
      {/* Sky fill */}
      <rect x="0" y="0" width={arcWidth} height={horizonY} rx="6" fill={skyColor} opacity="0.15" />

      {/* Arc path (dotted trajectory) */}
      <path
        d={`M 0 ${horizonY} Q ${arcWidth / 2} ${-arcHeight * 0.8} ${arcWidth} ${horizonY}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="3 3"
        className="text-dark-border"
      />

      {/* Horizon line */}
      <line x1="0" y1={horizonY} x2={arcWidth} y2={horizonY} stroke="currentColor" strokeWidth="0.5" className="text-dark-border" />

      {/* Sun glow */}
      {isDay && (
        <circle cx={cx} cy={cy} r={sunSize * 2.5} fill={sunGlow} opacity="0.15" />
      )}

      {/* Sun / Moon */}
      <circle cx={cx} cy={cy} r={sunSize} fill={sunColor} />

      {/* Time labels */}
      <text x="4" y={horizonY + 8} fontSize="6" fill="#6b7280" fontFamily="inherit">6:00</text>
      <text x={arcWidth / 2 - 6} y="8" fontSize="6" fill="#6b7280" fontFamily="inherit">12:00</text>
      <text x={arcWidth - 22} y={horizonY + 8} fontSize="6" fill="#6b7280" fontFamily="inherit">20:00</text>
    </svg>
  )
}

export function HeroHeader({ userName, totalCalories, goalCalories }: HeroHeaderProps) {
  const [currentHour, setCurrentHour] = useState(new Date().getHours())

  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000)
    return () => clearInterval(interval)
  }, [])

  const greeting = useMemo(() => {
    if (currentHour < 12) return 'Buenos días'
    if (currentHour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [currentHour])

  const calPercentage = (totalCalories / goalCalories) * 100
  const remaining = Math.max(0, goalCalories - totalCalories)

  return (
    <div className="relative mb-6 overflow-hidden">
      <div className="relative z-10 bg-dark-card/50 backdrop-blur-xl border border-dark-border/50 rounded-2xl p-5 md:p-6">

        {/* Top row: greeting + date */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {greeting}, <span className="text-primary">{userName}</span>
          </h1>
          <p className="text-xs text-dark-muted mt-1 capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
        </div>

        {/* Sun arc */}
        <div className="mb-4 rounded-xl overflow-hidden">
          <SunArc />
        </div>

        {/* Calorie progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-muted text-xs font-medium">Energía</span>
            <span className={`text-xs font-bold ${
              calPercentage >= 90 && calPercentage <= 110 ? 'text-primary' : calPercentage > 110 ? 'text-danger' : 'text-accent'
            }`}>
              {totalCalories} / {goalCalories} kcal
            </span>
          </div>
          <div className="relative h-1.5 bg-dark-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                calPercentage >= 90 && calPercentage <= 110
                  ? 'bg-primary'
                  : calPercentage > 110
                  ? 'bg-danger'
                  : 'bg-accent'
              }`}
              style={{ width: `${Math.min(calPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-dark-muted">
            <span>{Math.round(calPercentage)}%</span>
            <span>{remaining > 0 ? `${remaining} kcal restantes` : 'Meta alcanzada'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
