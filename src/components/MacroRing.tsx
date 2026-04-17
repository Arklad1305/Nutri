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
  calories, calorieGoal, protein, proteinGoal, carbs, carbsGoal, fat, fatGoal,
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
        duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger, start: 'top 85%', once: true, onEnter: () => setHasAnimated(true) },
      }
    )

    const obj = { val: 0 }
    gsap.to(obj, {
      val: Math.round(calories), duration: 1, ease: 'power2.out',
      scrollTrigger: { trigger, start: 'top 85%', once: true },
      onUpdate: () => { if (calorieRef.current) calorieRef.current.textContent = String(Math.round(obj.val)) },
    })
  }, { dependencies: [calories, calorieGoal, reducedMotion], revertOnUpdate: true })

  const rProt = 43
  const rCarb = 38
  const rFat = 33

  return (
    <div ref={containerRef} className="rounded-xl border border-dark-border bg-dark-card">
      <div className="p-4">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
              <circle cx="60" cy="60" r={R} stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="none" />

              <circle cx="60" cy="60" r={rProt} stroke="#3b82f6" strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * rProt}
                strokeDashoffset={2 * Math.PI * rProt - (proteinPercentage / 100) * 2 * Math.PI * rProt}
                strokeLinecap="round" opacity="0.5"
              />
              <circle cx="60" cy="60" r={rCarb} stroke="#10b981" strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * rCarb}
                strokeDashoffset={2 * Math.PI * rCarb - (carbsPercentage / 100) * 2 * Math.PI * rCarb}
                strokeLinecap="round" opacity="0.5"
              />
              <circle cx="60" cy="60" r={rFat} stroke="#d97706" strokeWidth="3" fill="none"
                strokeDasharray={2 * Math.PI * rFat}
                strokeDashoffset={2 * Math.PI * rFat - (fatPercentage / 100) * 2 * Math.PI * rFat}
                strokeLinecap="round" opacity="0.5"
              />

              <circle
                ref={ringRef}
                cx="60" cy="60" r={R}
                stroke="#0d9488" strokeWidth="7" fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={reducedMotion || hasAnimated ? targetOffset : circumference}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div ref={calorieRef} className="text-2xl font-black text-dark-text leading-none">
                {Math.round(calories)}
              </div>
              <div className="text-[9px] text-dark-muted mt-0.5">de {calorieGoal} kcal</div>
              <div className="mt-1 px-1.5 py-px rounded-full bg-primary/10">
                <span className="text-[8px] font-bold text-primary">{Math.round(caloriePercentage)}%</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-dark-text mb-3">Balance Nutricional</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-dark-muted">Proteína</span>
                <span className="text-xs text-dark-text font-semibold ml-auto">{Math.round(protein)}g</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-dark-muted">Carbos</span>
                <span className="text-xs text-dark-text font-semibold ml-auto">{Math.round(carbs)}g</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs text-dark-muted">Grasas</span>
                <span className="text-xs text-dark-text font-semibold ml-auto">{Math.round(fat)}g</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
