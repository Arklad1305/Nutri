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

    gsap.fromTo(ringRef.current,
      { strokeDashoffset: circumference },
      {
        strokeDashoffset: targetOffset,
        duration: 1.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ringRef.current.closest('.macro-ring-container'),
          start: 'top 85%',
          once: true,
          onEnter: () => setHasAnimated(true),
        },
      }
    )

    const obj = { val: 0 }
    gsap.to(obj, {
      val: Math.round(calories),
      duration: 1.3,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ringRef.current.closest('.macro-ring-container'),
        start: 'top 85%',
        once: true,
      },
      onUpdate: () => {
        if (calorieRef.current) {
          calorieRef.current.textContent = String(Math.round(obj.val))
        }
      },
    })
  }, { dependencies: [calories, calorieGoal, reducedMotion], revertOnUpdate: true })

  const macros = [
    {
      label: 'Proteína',
      value: Math.round(protein),
      goal: Math.round(proteinGoal),
      pct: proteinPercentage,
      unit: 'g',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-400',
      bg: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/15',
      text: 'text-blue-400',
      bar: 'bg-gradient-to-r from-blue-500 to-blue-400',
      glow: 'rgba(59,130,246,0.3)',
    },
    {
      label: 'Carbos',
      value: Math.round(carbs),
      goal: Math.round(carbsGoal),
      pct: carbsPercentage,
      unit: 'g',
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-400',
      bg: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-500/15',
      text: 'text-emerald-400',
      bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      glow: 'rgba(16,185,129,0.3)',
    },
    {
      label: 'Grasas',
      value: Math.round(fat),
      goal: Math.round(fatGoal),
      pct: fatPercentage,
      unit: 'g',
      color: 'amber',
      gradient: 'from-amber-500 to-amber-400',
      bg: 'from-amber-500/10 to-amber-600/5',
      border: 'border-amber-500/15',
      text: 'text-amber-400',
      bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
      glow: 'rgba(245,158,11,0.3)',
    },
  ]

  return (
    <div className="macro-ring-container relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#060a0d]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle radial glow behind ring */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-48 h-48 rounded-full animate-[pulse-glow_5s_ease-in-out_infinite]"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.12), transparent 70%)', filter: 'blur(20px)' }}
        />
        {/* Ambient particles */}
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

        {/* Ring + center */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg width="180" height="180" viewBox="0 0 160 160" className="transform -rotate-90">
              {/* Background ring */}
              <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />

              {/* Track marks */}
              <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.03)" strokeWidth="10" fill="none"
                strokeDasharray="2 8"
              />

              {/* Main calorie ring */}
              <circle
                ref={ringRef}
                cx="80"
                cy="80"
                r="70"
                stroke="url(#calorieGrad)"
                strokeWidth="10"
                fill="none"
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
              </defs>
            </svg>

            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="w-4 h-4 text-primary/40 mb-1" />
              <div ref={calorieRef} className="text-4xl font-black text-white drop-shadow-[0_0_12px_rgba(13,148,136,0.3)]">
                {Math.round(calories)}
              </div>
              <div className="text-[10px] text-dark-muted font-medium mt-0.5">de {calorieGoal} kcal</div>
              <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-bold text-primary">{Math.round(caloriePercentage)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Macro bars */}
        <div className="space-y-3">
          {macros.map((m) => (
            <div key={m.label} className={`rounded-xl border ${m.border} bg-gradient-to-r ${m.bg} p-3`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white/70">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black ${m.text}`} style={{ textShadow: `0 0 8px ${m.glow}` }}>
                    {m.value}{m.unit}
                  </span>
                  <span className="text-[10px] text-dark-muted">/ {m.goal}{m.unit}</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${m.bar} transition-all duration-700`}
                  style={{ width: `${Math.min(m.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
