import { useEffect, useState, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ImagePlus } from 'lucide-react'

interface HeroHeaderProps {
  userName: string
  totalCalories: number
  goalCalories: number
  metabolicState: 'mTOR_ACTIVE' | 'NEUTRAL' | 'AUTOPHAGY_EARLY' | 'AUTOPHAGY_DEEP'
}

function SunArc() {
  const now = new Date()
  const hours = now.getHours() + now.getMinutes() / 60

  const sunrise = 6
  const sunset = 20
  const dayLength = sunset - sunrise
  const isDay = hours >= sunrise && hours <= sunset

  const progress = isDay
    ? Math.max(0, Math.min(1, (hours - sunrise) / dayLength))
    : hours < sunrise ? 0 : 1

  const arcWidth = 240
  const arcHeight = 70
  const cx = 10 + progress * (arcWidth - 20)
  const cy = arcHeight - Math.sin(progress * Math.PI) * (arcHeight - 8)

  const sunColor = !isDay ? '#7d8590' : hours < 8 || hours > 18 ? '#d97706' : '#f59e0b'
  const sunSize = isDay ? 5 : 3.5

  return (
    <svg viewBox={`0 0 ${arcWidth} ${arcHeight + 14}`} className="w-full h-20 md:h-24" preserveAspectRatio="xMidYMid meet">
      {/* Sky gradient */}
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isDay ? '#0c4a6e' : '#0f172a'} stopOpacity="0.12" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={arcWidth} height={arcHeight + 2} rx="8" fill="url(#skyGrad)" />

      {/* Arc trajectory */}
      <path
        d={`M 10 ${arcHeight + 2} Q ${arcWidth / 2} ${-arcHeight * 0.6} ${arcWidth - 10} ${arcHeight + 2}`}
        fill="none"
        stroke="#21262d"
        strokeWidth="0.8"
        strokeDasharray="4 4"
      />

      {/* Horizon */}
      <line x1="0" y1={arcHeight + 2} x2={arcWidth} y2={arcHeight + 2} stroke="#21262d" strokeWidth="0.5" />

      {/* Sun glow */}
      {isDay && <circle cx={cx} cy={cy} r={sunSize * 3} fill={sunColor} opacity="0.08" />}
      {isDay && <circle cx={cx} cy={cy} r={sunSize * 1.8} fill={sunColor} opacity="0.15" />}

      {/* Sun */}
      <circle cx={cx} cy={cy} r={sunSize} fill={sunColor} />

      {/* Labels */}
      <text x="6" y={arcHeight + 12} fontSize="7" fill="#7d8590" fontFamily="inherit" fontWeight="500">6:00</text>
      <text x={arcWidth / 2 - 8} y="10" fontSize="7" fill="#7d8590" fontFamily="inherit" fontWeight="500">12:00</text>
      <text x={arcWidth - 28} y={arcHeight + 12} fontSize="7" fill="#7d8590" fontFamily="inherit" fontWeight="500">20:00</text>
    </svg>
  )
}

function getWeatherIcon(hour: number): string {
  if (hour >= 6 && hour < 7) return '/weather-icons/sunrise.svg'
  if (hour >= 7 && hour < 10) return '/weather-icons/clear-day.svg'
  if (hour >= 10 && hour < 16) return '/weather-icons/partly-cloudy-day.svg'
  if (hour >= 16 && hour < 18) return '/weather-icons/haze-day.svg'
  if (hour >= 18 && hour < 19) return '/weather-icons/sunset.svg'
  if (hour >= 19 && hour < 21) return '/weather-icons/clear-night.svg'
  return '/weather-icons/starry-night.svg'
}

function getWeatherLabel(hour: number): string {
  if (hour >= 6 && hour < 7) return 'Amanecer'
  if (hour >= 7 && hour < 10) return 'Mañana despejada'
  if (hour >= 10 && hour < 16) return 'Parcialmente nublado'
  if (hour >= 16 && hour < 18) return 'Atardecer'
  if (hour >= 18 && hour < 19) return 'Puesta de sol'
  if (hour >= 19 && hour < 21) return 'Noche despejada'
  return 'Noche estrellada'
}

export function HeroHeader({ userName, totalCalories, goalCalories }: HeroHeaderProps) {
  const [currentHour, setCurrentHour] = useState(new Date().getHours())
  const [bgImage, setBgImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Load saved background or default
  useEffect(() => {
    const saved = localStorage.getItem('nutri_hero_bg')
    setBgImage(saved || '/hero-default.svg')
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return // 2MB max

    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setBgImage(dataUrl)
      localStorage.setItem('nutri_hero_bg', dataUrl)
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const greeting = useMemo(() => {
    if (currentHour < 12) return 'Buenos días'
    if (currentHour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [currentHour])

  const weatherIcon = useMemo(() => getWeatherIcon(currentHour), [currentHour])
  const weatherLabel = useMemo(() => getWeatherLabel(currentHour), [currentHour])

  const calPercentage = goalCalories > 0 ? (totalCalories / goalCalories) * 100 : 0
  const remaining = Math.max(0, goalCalories - totalCalories)

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl">
      {/* Background image */}
      {bgImage && (
        <div className="absolute inset-0 z-0">
          <img src={bgImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-sm" />
        </div>
      )}

      <div className={`relative z-10 ${bgImage ? '' : 'bg-dark-card/50 backdrop-blur-xl border border-dark-border/50'} rounded-2xl p-5 md:p-6`}>
        {/* Upload button */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-dark-hover/60 border border-dark-border/40 text-dark-muted hover:text-white hover:bg-dark-hover transition-all z-20"
          title="Cambiar fondo"
        >
          <ImagePlus className="w-3.5 h-3.5" />
        </button>

        {/* Greeting + weather icon + date */}
        <div className="flex items-start gap-4 mb-3">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-dark-text tracking-tight">
              {greeting}, <span className="text-primary">{userName}</span>
            </h1>
            <p className="text-[11px] text-dark-muted mt-0.5 capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <img
              src={weatherIcon}
              alt={weatherLabel}
              className="w-14 h-14 md:w-16 md:h-16 drop-shadow-lg"
            />
            <span className="text-[9px] text-dark-muted font-medium">{weatherLabel}</span>
          </div>
        </div>

        {/* Sun arc */}
        <div className="mb-3 rounded-xl overflow-hidden">
          <SunArc />
        </div>

        {/* Calorie progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-dark-muted text-[11px] font-medium">Energía diaria</span>
            <span className={`text-[11px] font-semibold ${
              calPercentage >= 90 && calPercentage <= 110 ? 'text-primary' : calPercentage > 110 ? 'text-danger' : 'text-accent'
            }`}>
              {totalCalories} / {goalCalories} kcal
            </span>
          </div>
          <div className="relative h-1 bg-dark-border/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                calPercentage >= 90 && calPercentage <= 110 ? 'bg-primary' : calPercentage > 110 ? 'bg-danger' : 'bg-accent'
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
