import { useRef, useState, useMemo } from 'react'
import { Flame, Zap } from 'lucide-react'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface MacroRingProps {
  calories: number
  calorieGoal: number
  protein: number
  proteinGoal: number
  carbs: number
  carbsGoal: number
  fat: number
  fatGoal: number
}

// Generate smooth rounded polygon path for radar chart
function radarPath(values: number[], cx: number, cy: number, maxR: number, smooth = true): string {
  const n = values.length
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2 // start from top

  const points = values.map((v, i) => {
    const angle = startAngle + i * angleStep
    const r = (Math.min(v, 100) / 100) * maxR
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })

  if (!smooth || n < 3) {
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z'
  }

  // Catmull-Rom to Bezier for smooth curves
  const closed = [...points, points[0], points[1]]
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length; i++) {
    const p0 = closed[i === 0 ? points.length - 1 : i - 1] || closed[0]
    const p1 = closed[i]
    const p2 = closed[i + 1]
    const p3 = closed[i + 2]

    const tension = 0.3
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return d
}


export function MacroRing({
  calories,
  calorieGoal,
  protein,
  proteinGoal,
  carbs,
  carbsGoal,
  fat,
  fatGoal,
}: MacroRingProps) {
  const reducedMotion = useReducedMotion()
  const ringRef = useRef<SVGCircleElement>(null)
  const calorieRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const radarRef = useRef<SVGPathElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  const caloriePercentage = Math.min((calories / calorieGoal) * 100, 100)
  const proteinPercentage = Math.min((protein / proteinGoal) * 100, 100)
  const carbsPercentage = Math.min((carbs / carbsGoal) * 100, 100)
  const fatPercentage = Math.min((fat / fatGoal) * 100, 100)

  const circumference = 2 * Math.PI * 70
  const targetOffset = circumference - (caloriePercentage / 100) * circumference

  const remaining = Math.max(0, calorieGoal - calories)

  // Radar chart config
  const radarCx = 100
  const radarCy = 100
  const radarR = 75
  const radarAxes = useMemo(() => [
    { label: 'Proteína', pct: proteinPercentage, value: `${Math.round(protein)}g`, color: '#3b82f6' },
    { label: 'Carbos', pct: carbsPercentage, value: `${Math.round(carbs)}g`, color: '#10b981' },
    { label: 'Grasas', pct: fatPercentage, value: `${Math.round(fat)}g`, color: '#f59e0b' },
    { label: 'Calorías', pct: caloriePercentage, value: `${Math.round(calories)}`, color: '#0d9488' },
  ], [proteinPercentage, carbsPercentage, fatPercentage, caloriePercentage, protein, carbs, fat, calories])

  const radarValues = radarAxes.map(a => a.pct)

  useGSAP(() => {
    if (reducedMotion || !ringRef.current || !calorieRef.current) return

    const trigger = ringRef.current.closest('.macro-ring-container')

    gsap.fromTo(ringRef.current,
      { strokeDashoffset: circumference },
      {
        strokeDashoffset: targetOffset,
        duration: 1.6,
        ease: 'power3.out',
        scrollTrigger: { trigger, start: 'top 85%', once: true, onEnter: () => setHasAnimated(true) },
      }
    )

    const obj = { val: 0 }
    gsap.to(obj, {
      val: Math.round(calories),
      duration: 1.3,
      ease: 'power2.out',
      scrollTrigger: { trigger, start: 'top 85%', once: true },
      onUpdate: () => {
        if (calorieRef.current) calorieRef.current.textContent = String(Math.round(obj.val))
      },
    })

    // Radar chart scale-in
    if (radarRef.current) {
      gsap.fromTo(radarRef.current,
        { scale: 0, opacity: 0, transformOrigin: `${radarCx}px ${radarCy}px` },
        {
          scale: 1, opacity: 1,
          duration: 1.2,
          ease: 'elastic.out(1, 0.6)',
          delay: 0.5,
          scrollTrigger: { trigger, start: 'top 85%', once: true },
        }
      )
    }

    // Stagger macro cards
    const cards = containerRef.current?.querySelectorAll('.macro-stat-card')
    if (cards && cards.length > 0) {
      gsap.from(cards, {
        y: 15, opacity: 0,
        duration: 0.45,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.6,
        scrollTrigger: { trigger, start: 'top 85%', once: true },
      })
    }
  }, { dependencies: [calories, calorieGoal, reducedMotion], revertOnUpdate: true })

  const macroCards = [
    { label: 'Proteína', value: Math.round(protein), goal: Math.round(proteinGoal), pct: proteinPercentage, unit: 'g', text: 'text-blue-400', border: 'border-blue-500/15', bg: 'bg-blue-500/8', glow: 'rgba(59,130,246,0.25)' },
    { label: 'Carbos', value: Math.round(carbs), goal: Math.round(carbsGoal), pct: carbsPercentage, unit: 'g', text: 'text-emerald-400', border: 'border-emerald-500/15', bg: 'bg-emerald-500/8', glow: 'rgba(16,185,129,0.25)' },
    { label: 'Grasas', value: Math.round(fat), goal: Math.round(fatGoal), pct: fatPercentage, unit: 'g', text: 'text-amber-400', border: 'border-amber-500/15', bg: 'bg-amber-500/8', glow: 'rgba(245,158,11,0.25)' },
    { label: 'Objetivo', value: calorieGoal, goal: 0, pct: caloriePercentage, unit: 'kcal', text: 'text-primary', border: 'border-primary/15', bg: 'bg-primary/8', glow: 'rgba(13,148,136,0.25)' },
  ]

  return (
    <div ref={containerRef} className="macro-ring-container relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#060a0d]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-[15%] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full animate-[pulse-glow_5s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.12), transparent 70%)', filter: 'blur(20px)' }}
        />
        <div className="absolute w-1 h-1 rounded-full bg-primary/20 animate-[star-twinkle_4s_ease-in-out_infinite]" style={{ top: '15%', left: '10%' }} />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-blue-400/15 animate-[star-twinkle_5s_ease-in-out_infinite_1.5s]" style={{ top: '20%', right: '15%' }} />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-emerald-400/15 animate-[star-twinkle_3.5s_ease-in-out_infinite_2.5s]" style={{ bottom: '30%', left: '8%' }} />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(13,148,136,0.1)]">
            <Zap className="w-4 h-4 text-primary drop-shadow-[0_0_6px_rgba(13,148,136,0.5)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white drop-shadow-[0_0_8px_rgba(13,148,136,0.2)]">Macronutrientes del Día</h3>
            <p className="text-[10px] text-dark-muted">{remaining > 0 ? `${remaining} kcal restantes` : 'Meta alcanzada'}</p>
          </div>
        </div>

        {/* Ring + Radar side by side on desktop, stacked on mobile */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
          {/* Calorie Ring */}
          <div className="relative shrink-0">
            <svg width="170" height="170" viewBox="0 0 160 160" className="transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
              <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.03)" strokeWidth="10" fill="none" strokeDasharray="2 8" />

              {/* Macro overlay rings (faint) */}
              <circle cx="80" cy="80" r="70" stroke="url(#protGrad)" strokeWidth="10" fill="none"
                strokeDasharray={circumference} strokeDashoffset={circumference - (proteinPercentage / 100) * circumference}
                strokeLinecap="round" opacity="0.18"
              />
              <circle cx="80" cy="80" r="70" stroke="url(#carbGrad)" strokeWidth="10" fill="none"
                strokeDasharray={circumference} strokeDashoffset={circumference - (carbsPercentage / 100) * circumference}
                strokeLinecap="round" opacity="0.18"
              />
              <circle cx="80" cy="80" r="70" stroke="url(#fatGrad)" strokeWidth="10" fill="none"
                strokeDasharray={circumference} strokeDashoffset={circumference - (fatPercentage / 100) * circumference}
                strokeLinecap="round" opacity="0.18"
              />

              {/* Main calorie ring */}
              <circle
                ref={ringRef}
                cx="80" cy="80" r="70"
                stroke="url(#calorieGrad)"
                strokeWidth="10" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={reducedMotion || hasAnimated ? targetOffset : circumference}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(13,148,136,0.4))' }}
              />

              <defs>
                <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="protGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="carbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="fatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="w-4 h-4 text-primary/40 mb-1" />
              <div ref={calorieRef} className="text-3xl font-black text-white drop-shadow-[0_0_12px_rgba(13,148,136,0.3)]">
                {Math.round(calories)}
              </div>
              <div className="text-[10px] text-dark-muted font-medium mt-0.5">de {calorieGoal} kcal</div>
              <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-bold text-primary">{Math.round(caloriePercentage)}%</span>
              </div>
            </div>
          </div>

          {/* Radar / Spider Chart */}
          <div className="relative shrink-0">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Grid levels — rounded polygon guides */}
              {[20, 40, 60, 80, 100].map((pct) => (
                <path
                  key={pct}
                  d={radarPath(Array(radarAxes.length).fill(pct), radarCx, radarCy, radarR, true)}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={pct === 100 ? 1 : 0.5}
                />
              ))}

              {/* Axis lines */}
              {radarAxes.map((_, i) => {
                const angle = -Math.PI / 2 + (2 * Math.PI / radarAxes.length) * i
                const x2 = radarCx + radarR * Math.cos(angle)
                const y2 = radarCy + radarR * Math.sin(angle)
                return (
                  <line
                    key={i}
                    x1={radarCx} y1={radarCy} x2={x2} y2={y2}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"
                  />
                )
              })}

              {/* Data area — filled + glowing */}
              <defs>
                <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(13,148,136,0.35)" />
                  <stop offset="50%" stopColor="rgba(59,130,246,0.2)" />
                  <stop offset="100%" stopColor="rgba(245,158,11,0.25)" />
                </linearGradient>
                <filter id="radarGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Glow layer */}
              <path
                d={radarPath(radarValues, radarCx, radarCy, radarR, true)}
                fill="url(#radarFill)"
                opacity="0.4"
                filter="url(#radarGlow)"
              />

              {/* Data fill */}
              <path
                ref={radarRef}
                d={radarPath(radarValues, radarCx, radarCy, radarR, true)}
                fill="url(#radarFill)"
                stroke="rgba(13,148,136,0.6)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {radarAxes.map((axis, i) => {
                const angle = -Math.PI / 2 + (2 * Math.PI / radarAxes.length) * i
                const r = (Math.min(axis.pct, 100) / 100) * radarR
                const x = radarCx + r * Math.cos(angle)
                const y = radarCy + r * Math.sin(angle)
                return (
                  <g key={i}>
                    {/* Point glow */}
                    <circle cx={x} cy={y} r="4" fill={axis.color} opacity="0.3" filter="url(#radarGlow)" />
                    {/* Point */}
                    <circle cx={x} cy={y} r="3" fill={axis.color} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                  </g>
                )
              })}

              {/* Axis labels */}
              {radarAxes.map((axis, i) => {
                const angle = -Math.PI / 2 + (2 * Math.PI / radarAxes.length) * i
                const labelR = radarR + 18
                const x = radarCx + labelR * Math.cos(angle)
                const y = radarCy + labelR * Math.sin(angle)
                return (
                  <g key={`label-${i}`}>
                    <text
                      x={x} y={y - 5}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-white/60"
                    >
                      {axis.label}
                    </text>
                    <text
                      x={x} y={y + 6}
                      textAnchor="middle"
                      className="text-[8px] font-medium"
                      fill={axis.color}
                    >
                      {axis.value}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* Macro stat cards — 2x2 grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {macroCards.map((m) => (
            <div key={m.label} className={`macro-stat-card ${m.bg} border ${m.border} rounded-xl p-3 text-center transition-all duration-300 hover:scale-[1.02]`}>
              <div className="text-[10px] text-dark-muted mb-1 font-medium">{m.label}</div>
              <div className={`text-lg font-black ${m.text}`} style={{ textShadow: `0 0 8px ${m.glow}` }}>
                {m.label === 'Objetivo' ? m.value : `${m.value}${m.unit}`}
              </div>
              <div className="text-[10px] text-dark-muted mt-0.5">
                {m.label === 'Objetivo'
                  ? <span className={m.text}>{Math.round(m.pct)}% alcanzado</span>
                  : `/ ${m.goal}${m.unit}`
                }
              </div>
              {/* Mini progress bar */}
              <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 relative overflow-hidden`}
                  style={{
                    width: `${Math.min(m.pct, 100)}%`,
                    background: `linear-gradient(90deg, ${m.glow}, ${m.glow.replace('0.25', '0.6')})`,
                  }}
                >
                  <div className="absolute inset-0 animate-[shimmer-sweep_2.5s_ease-in-out_infinite]"
                    style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`, width: '200%', left: '-100%' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
