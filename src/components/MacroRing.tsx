import { useRef, useState } from 'react'
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

function MiniArc({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color}
        strokeWidth="4" fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
        style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
      />
    </svg>
  )
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
  const [hasAnimated, setHasAnimated] = useState(false)

  const caloriePercentage = Math.min((calories / calorieGoal) * 100, 100)
  const proteinPercentage = Math.min((protein / proteinGoal) * 100, 100)
  const carbsPercentage = Math.min((carbs / carbsGoal) * 100, 100)
  const fatPercentage = Math.min((fat / fatGoal) * 100, 100)

  const circumference = 2 * Math.PI * 70
  const targetOffset = circumference - (caloriePercentage / 100) * circumference
  const remaining = Math.max(0, calorieGoal - calories)

  useGSAP(() => {
    if (reducedMotion || !ringRef.current || !calorieRef.current) return
    const trigger = containerRef.current

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

    // Animar macro cards con stagger
    const cards = containerRef.current?.querySelectorAll('.macro-item')
    if (cards && cards.length > 0) {
      gsap.from(cards, {
        y: 20, opacity: 0, scale: 0.95,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.4,
        scrollTrigger: { trigger, start: 'top 85%', once: true },
      })
    }
  }, { dependencies: [calories, calorieGoal, reducedMotion], revertOnUpdate: true })

  const macros = [
    {
      label: 'Proteína', value: Math.round(protein), goal: Math.round(proteinGoal),
      pct: proteinPercentage, unit: 'g',
      color: '#3b82f6', textCls: 'text-blue-400',
      borderCls: 'border-blue-500/15', bgCls: 'bg-blue-500/[0.06]',
      glowBg: 'rgba(59,130,246,0.08)',
    },
    {
      label: 'Carbos', value: Math.round(carbs), goal: Math.round(carbsGoal),
      pct: carbsPercentage, unit: 'g',
      color: '#10b981', textCls: 'text-emerald-400',
      borderCls: 'border-emerald-500/15', bgCls: 'bg-emerald-500/[0.06]',
      glowBg: 'rgba(16,185,129,0.08)',
    },
    {
      label: 'Grasas', value: Math.round(fat), goal: Math.round(fatGoal),
      pct: fatPercentage, unit: 'g',
      color: '#f59e0b', textCls: 'text-amber-400',
      borderCls: 'border-amber-500/15', bgCls: 'bg-amber-500/[0.06]',
      glowBg: 'rgba(245,158,11,0.08)',
    },
  ]

  return (
    <div ref={containerRef} className="macro-ring-container relative overflow-hidden rounded-2xl border border-primary/10 bg-[#050a0a] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Fondo animado — partículas + glow */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Glow central detrás del ring */}
        <div
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-56 h-56 rounded-full animate-[pulse-glow_6s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.1), transparent 65%)', filter: 'blur(25px)' }}
        />
        {/* Glow inferior en los macros */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-primary/[0.04] to-transparent"
        />
        {/* Partículas sutiles */}
        <div className="absolute w-1 h-1 rounded-full bg-primary/15 animate-[star-twinkle_4s_ease-in-out_infinite]" style={{ top: '12%', left: '8%' }} />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-blue-400/12 animate-[star-twinkle_5s_ease-in-out_infinite_1.5s]" style={{ top: '18%', right: '12%' }} />
        <div className="absolute w-0.5 h-0.5 rounded-full bg-emerald-400/10 animate-[star-twinkle_3.5s_ease-in-out_infinite_2.5s]" style={{ bottom: '25%', left: '6%' }} />
        <div className="absolute w-1 h-1 rounded-full bg-amber-400/10 animate-[star-twinkle_4.5s_ease-in-out_infinite_0.8s]" style={{ bottom: '20%', right: '10%' }} />
      </div>

      <div className="relative z-10 p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[inset_0_1px_0_rgba(13,148,136,0.1)]">
            <Zap className="w-3.5 h-3.5 text-primary drop-shadow-[0_0_6px_rgba(13,148,136,0.5)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Balance Nutricional</h3>
            <p className="text-[10px] text-dark-muted">{remaining > 0 ? `${remaining} kcal restantes` : 'Meta alcanzada'}</p>
          </div>
        </div>

        {/* Anillo central de calorías */}
        <div className="flex items-center justify-center mb-5">
          <div className="relative">
            <svg width="175" height="175" viewBox="0 0 160 160" className="transform -rotate-90">
              {/* Fondo */}
              <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.05)" strokeWidth="9" fill="none" />
              {/* Ticks */}
              <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.03)" strokeWidth="9" fill="none" strokeDasharray="1.5 7" />

              {/* Overlay macro arcs (muy sutiles, distintos radios para que no se pisen) */}
              <circle cx="80" cy="80" r="60" stroke="url(#protGrad)" strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * 60} strokeDashoffset={2 * Math.PI * 60 - (proteinPercentage / 100) * 2 * Math.PI * 60}
                strokeLinecap="round" opacity="0.25"
              />
              <circle cx="80" cy="80" r="56" stroke="url(#carbGrad)" strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * 56} strokeDashoffset={2 * Math.PI * 56 - (carbsPercentage / 100) * 2 * Math.PI * 56}
                strokeLinecap="round" opacity="0.25"
              />
              <circle cx="80" cy="80" r="52" stroke="url(#fatGrad)" strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 - (fatPercentage / 100) * 2 * Math.PI * 52}
                strokeLinecap="round" opacity="0.25"
              />

              {/* Arco principal de calorías */}
              <circle
                ref={ringRef}
                cx="80" cy="80" r="70"
                stroke="url(#calorieGrad)"
                strokeWidth="9" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={reducedMotion || hasAnimated ? targetOffset : circumference}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 8px rgba(13,148,136,0.35))' }}
              />

              <defs>
                <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
                <linearGradient id="protGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="carbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="fatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="w-4 h-4 text-primary/30 mb-0.5" />
              <div ref={calorieRef} className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(13,148,136,0.25)]">
                {Math.round(calories)}
              </div>
              <div className="text-[10px] text-dark-muted font-medium">de {calorieGoal} kcal</div>
              <div className="mt-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/15">
                <span className="text-[9px] font-bold text-primary">{Math.round(caloriePercentage)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de macros — 3 mini-tarjetas con arco individual */}
        <div className="grid grid-cols-3 gap-2">
          {macros.map((m) => (
            <div
              key={m.label}
              className={`macro-item relative rounded-xl border ${m.borderCls} ${m.bgCls} p-3 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] overflow-hidden`}
            >
              {/* Glow sutil de fondo */}
              <div className="absolute inset-0 rounded-xl" style={{ background: `radial-gradient(circle at 50% 30%, ${m.glowBg}, transparent 70%)` }} />

              <div className="relative z-10">
                {/* Mini arc gauge */}
                <div className="relative mb-1.5">
                  <MiniArc pct={m.pct} color={m.color} size={48} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[9px] font-bold ${m.textCls}`}>{Math.round(m.pct)}%</span>
                  </div>
                </div>

                {/* Valor */}
                <div className={`text-base font-black ${m.textCls}`} style={{ textShadow: `0 0 8px ${m.color}40` }}>
                  {m.value}{m.unit}
                </div>
                <div className="text-[9px] text-dark-muted mt-0.5">{m.label}</div>
                <div className="text-[8px] text-dark-muted/60 mt-0.5">
                  / {m.goal}{m.unit}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
