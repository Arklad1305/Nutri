import { useRef, useState } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  const caloriePercentage = Math.min((calories / calorieGoal) * 100, 100)
  const proteinPercentage = Math.min((protein / proteinGoal) * 100, 100)
  const carbsPercentage = Math.min((carbs / carbsGoal) * 100, 100)
  const fatPercentage = Math.min((fat / fatGoal) * 100, 100)

  const R = 52
  const circumference = 2 * Math.PI * R
  const targetOffset = circumference - (caloriePercentage / 100) * circumference

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
  }, { dependencies: [calories, calorieGoal, reducedMotion], revertOnUpdate: true })

  // Radios internos para los macro arcs
  const rProt = 43
  const rCarb = 38
  const rFat = 33

  return (
    <div ref={containerRef} className="macro-ring-container relative overflow-hidden rounded-2xl border border-primary/10 bg-[#050a0a] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Glow sutil */}
      <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-32 h-32 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />

      <div className="relative z-10 p-4 md:p-5">
        <div className="flex items-center gap-5">
          {/* Ring compacto */}
          <div className="relative shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
              {/* Fondo */}
              <circle cx="60" cy="60" r={R} stroke="rgba(255,255,255,0.05)" strokeWidth="7" fill="none" />
              <circle cx="60" cy="60" r={R} stroke="rgba(255,255,255,0.03)" strokeWidth="7" fill="none" strokeDasharray="1.5 6" />

              {/* Macro arcs internos */}
              <circle cx="60" cy="60" r={rProt} stroke="#3b82f6" strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * rProt} strokeDashoffset={2 * Math.PI * rProt - (proteinPercentage / 100) * 2 * Math.PI * rProt}
                strokeLinecap="round" opacity="0.35"
                style={{ filter: 'drop-shadow(0 0 3px rgba(59,130,246,0.3))' }}
              />
              <circle cx="60" cy="60" r={rCarb} stroke="#10b981" strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * rCarb} strokeDashoffset={2 * Math.PI * rCarb - (carbsPercentage / 100) * 2 * Math.PI * rCarb}
                strokeLinecap="round" opacity="0.35"
                style={{ filter: 'drop-shadow(0 0 3px rgba(16,185,129,0.3))' }}
              />
              <circle cx="60" cy="60" r={rFat} stroke="#f59e0b" strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * rFat} strokeDashoffset={2 * Math.PI * rFat - (fatPercentage / 100) * 2 * Math.PI * rFat}
                strokeLinecap="round" opacity="0.35"
                style={{ filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.3))' }}
              />

              {/* Arco principal */}
              <circle
                ref={ringRef}
                cx="60" cy="60" r={R}
                stroke="url(#calorieGradCompact)"
                strokeWidth="7" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={reducedMotion || hasAnimated ? targetOffset : circumference}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgba(13,148,136,0.35))' }}
              />

              <defs>
                <linearGradient id="calorieGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Centro del ring */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div ref={calorieRef} className="text-2xl font-black text-white leading-none">
                {Math.round(calories)}
              </div>
              <div className="text-[9px] text-dark-muted mt-0.5">de {calorieGoal} kcal</div>
              <div className="mt-1 px-1.5 py-px rounded-full bg-primary/10 border border-primary/15">
                <span className="text-[8px] font-bold text-primary">{Math.round(caloriePercentage)}%</span>
              </div>
            </div>
          </div>

          {/* Info al costado */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white mb-3">Balance Nutricional</h3>

            {/* Leyenda de macros */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.4)]" />
                <span className="text-[10px] text-white/50 font-medium">Prot</span>
                <span className="text-[10px] text-blue-400 font-bold">{Math.round(protein)}g</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
                <span className="text-[10px] text-white/50 font-medium">Carbos</span>
                <span className="text-[10px] text-emerald-400 font-bold">{Math.round(carbs)}g</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(245,158,11,0.4)]" />
                <span className="text-[10px] text-white/50 font-medium">Grasas</span>
                <span className="text-[10px] text-amber-400 font-bold">{Math.round(fat)}g</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
