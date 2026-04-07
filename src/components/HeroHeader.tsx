import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface HeroHeaderProps {
  userName: string
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
    <svg viewBox={`0 0 ${arcWidth} ${arcHeight + 14}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Dashed arc path */}
      <path
        d={`M 10 ${arcHeight + 2} Q ${arcWidth / 2} ${-arcHeight * 0.6} ${arcWidth - 10} ${arcHeight + 2}`}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="0.8"
        strokeDasharray="4 4"
      />
      {/* Horizon line */}
      <line x1="0" y1={arcHeight + 2} x2={arcWidth} y2={arcHeight + 2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      {/* Sun glow halos */}
      {isDay && <circle cx={cx} cy={cy} r={sunSize * 4} fill={sunColor} opacity="0.06" />}
      {isDay && <circle cx={cx} cy={cy} r={sunSize * 2.2} fill={sunColor} opacity="0.15" />}
      {/* Sun dot */}
      <circle cx={cx} cy={cy} r={sunSize} fill={sunColor} />
      {/* Time labels */}
      <text x="6" y={arcHeight + 12} fontSize="7" fill="rgba(255,255,255,0.45)" fontFamily="inherit" fontWeight="600">6:00</text>
      <text x={arcWidth / 2 - 8} y="10" fontSize="7" fill="rgba(255,255,255,0.45)" fontFamily="inherit" fontWeight="600">12:00</text>
      <text x={arcWidth - 28} y={arcHeight + 12} fontSize="7" fill="rgba(255,255,255,0.45)" fontFamily="inherit" fontWeight="600">20:00</text>
    </svg>
  )
}

type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'sunset' | 'dusk' | 'night'

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 10) return 'morning'
  if (hour >= 10 && hour < 14) return 'midday'
  if (hour >= 14 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 19) return 'sunset'
  if (hour >= 19 && hour < 21) return 'dusk'
  return 'night'
}

const skyThemes: Record<TimeOfDay, { sky: string; horizon: string; accent: string; label: string }> = {
  dawn:      { sky: 'from-indigo-950 via-rose-900/60 to-amber-800/40', horizon: 'from-amber-500/30 via-rose-400/20 to-transparent', accent: 'rgba(251,191,36,0.3)', label: 'Amanecer' },
  morning:   { sky: 'from-sky-900 via-sky-800/70 to-cyan-700/30', horizon: 'from-amber-400/15 via-sky-400/10 to-transparent', accent: 'rgba(56,189,248,0.2)', label: 'Mañana' },
  midday:    { sky: 'from-sky-800 via-blue-700/50 to-cyan-600/20', horizon: 'from-white/8 via-sky-300/5 to-transparent', accent: 'rgba(250,204,21,0.25)', label: 'Mediodía' },
  afternoon: { sky: 'from-sky-900 via-blue-800/60 to-slate-700/30', horizon: 'from-amber-500/10 via-sky-400/5 to-transparent', accent: 'rgba(251,191,36,0.2)', label: 'Tarde' },
  sunset:    { sky: 'from-indigo-950 via-orange-900/50 to-rose-800/40', horizon: 'from-orange-500/35 via-rose-500/20 to-transparent', accent: 'rgba(249,115,22,0.35)', label: 'Atardecer' },
  dusk:      { sky: 'from-slate-950 via-indigo-950/80 to-purple-950/40', horizon: 'from-orange-500/15 via-purple-500/10 to-transparent', accent: 'rgba(139,92,246,0.2)', label: 'Anochecer' },
  night:     { sky: 'from-slate-950 via-slate-950/90 to-indigo-950/50', horizon: 'from-indigo-500/8 via-transparent to-transparent', accent: 'rgba(99,102,241,0.15)', label: 'Noche' },
}

function Landscape({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  const theme = skyThemes[timeOfDay]
  const isNight = timeOfDay === 'night' || timeOfDay === 'dusk'
  const isDawn = timeOfDay === 'dawn' || timeOfDay === 'sunset'

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.sky} transition-colors duration-1000`} />

      {/* Stars (night/dusk only) */}
      {isNight && (
        <>
          <div className="absolute w-0.5 h-0.5 rounded-full bg-white/50 animate-[star-twinkle_3s_ease-in-out_infinite]" style={{ top: '12%', left: '8%' }} />
          <div className="absolute w-1 h-1 rounded-full bg-white/40 animate-[star-twinkle_4s_ease-in-out_infinite_1s]" style={{ top: '8%', left: '25%' }} />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-white/60 animate-[star-twinkle_3.5s_ease-in-out_infinite_0.5s]" style={{ top: '18%', left: '42%' }} />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-indigo-200/40 animate-[star-twinkle_5s_ease-in-out_infinite_2s]" style={{ top: '6%', left: '60%' }} />
          <div className="absolute w-1 h-1 rounded-full bg-white/35 animate-[star-twinkle_4.5s_ease-in-out_infinite_1.5s]" style={{ top: '14%', left: '78%' }} />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-white/45 animate-[star-twinkle_3s_ease-in-out_infinite_2.5s]" style={{ top: '22%', left: '92%' }} />
        </>
      )}

      {/* Sun/moon glow */}
      {isDawn && (
        <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 w-48 h-24 rounded-full animate-[pulse-glow_4s_ease-in-out_infinite]" style={{ background: `radial-gradient(ellipse, ${theme.accent}, transparent 70%)`, filter: 'blur(15px)' }} />
      )}

      {/* Clouds / atmospheric layers */}
      <div className="absolute inset-0 animate-[mist-drift-1_12s_ease-in-out_infinite]">
        <div className="absolute inset-0 w-[200%]" style={{ background: `linear-gradient(90deg, transparent 10%, ${theme.accent} 35%, transparent 60%)`, filter: 'blur(20px)' }} />
      </div>

      {/* Mountains silhouette — far */}
      <svg className="absolute bottom-0 left-0 w-full h-[45%]" viewBox="0 0 400 80" preserveAspectRatio="none">
        <path d="M0,80 L0,55 Q30,20 70,40 Q100,10 140,35 Q180,5 220,30 Q260,15 300,38 Q340,8 370,32 Q390,25 400,40 L400,80 Z" fill="rgba(15,23,42,0.35)" />
      </svg>

      {/* Mountains silhouette — near */}
      <svg className="absolute bottom-0 left-0 w-full h-[35%]" viewBox="0 0 400 60" preserveAspectRatio="none">
        <path d="M0,60 L0,40 Q40,15 80,30 Q120,5 160,25 Q200,10 240,28 Q280,8 320,22 Q360,12 400,30 L400,60 Z" fill="rgba(15,23,42,0.5)" />
      </svg>

      {/* Ground / treeline */}
      <svg className="absolute bottom-0 left-0 w-full h-[20%]" viewBox="0 0 400 30" preserveAspectRatio="none">
        <path d="M0,30 L0,15 Q10,8 20,14 Q30,5 40,12 Q50,7 60,13 Q70,4 80,11 Q90,6 100,13 Q110,5 120,12 Q130,7 140,14 Q150,4 160,11 Q170,6 180,13 Q190,5 200,12 Q210,7 220,14 Q230,4 240,11 Q250,6 260,13 Q270,5 280,12 Q290,7 300,14 Q310,4 320,11 Q330,6 340,13 Q350,5 360,12 Q370,7 380,14 Q390,8 400,15 L400,30 Z" fill="rgba(6,8,9,0.65)" />
      </svg>

      {/* Horizon glow */}
      <div className={`absolute bottom-[15%] left-0 right-0 h-[30%] bg-gradient-to-t ${theme.horizon}`} />
    </div>
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

export function HeroHeader({ userName }: HeroHeaderProps) {
  const [currentHour, setCurrentHour] = useState(new Date().getHours())

  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000)
    return () => clearInterval(interval)
  }, [])

  const timeOfDay = useMemo(() => getTimeOfDay(currentHour), [currentHour])
  const theme = skyThemes[timeOfDay]

  const greeting = useMemo(() => {
    if (currentHour < 12) return 'Buenos días'
    if (currentHour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [currentHour])

  const weatherIcon = useMemo(() => getWeatherIcon(currentHour), [currentHour])

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/[0.06]">
      {/* Dynamic landscape */}
      <Landscape timeOfDay={timeOfDay} />

      {/* Sun arc — directly over the landscape */}
      <div className="absolute inset-x-0 bottom-0 z-[5] h-[55%] px-6 pb-2 pointer-events-none">
        <SunArc />
      </div>

      {/* Greeting overlay */}
      <div className="relative z-10 p-5 md:p-6 pb-20 md:pb-24">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              {greeting}, <span className="text-primary-300 drop-shadow-[0_0_12px_rgba(13,148,136,0.4)]">{userName}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-white/60 capitalize drop-shadow-sm">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
              <span className="text-[9px] text-white/40">·</span>
              <span className="text-[9px] text-white/40 font-medium">{theme.label}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <img
              src={weatherIcon}
              alt={theme.label}
              className="w-14 h-14 md:w-16 md:h-16 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
