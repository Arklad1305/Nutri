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
  const [hasAnimated, setHasAnimated] = useState(false)

  const caloriePercentage = Math.min((calories / calorieGoal) * 100, 100)
  const proteinPercentage = (protein / proteinGoal) * 100
  const carbsPercentage = (carbs / carbsGoal) * 100
  const fatPercentage = (fat / fatGoal) * 100

  const circumference = 2 * Math.PI * 70
  const targetOffset = circumference - (caloriePercentage / 100) * circumference

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

  return (
    <div className="macro-ring-container relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border/50 rounded-3xl p-6 md:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <h3 className="text-sm font-semibold text-dark-muted mb-6">Macronutrientes del Día</h3>

        <div className="flex items-center justify-center mb-8">
          {/* SVG Ring */}
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
              {/* Background ring */}
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="none" className="text-dark-border" />

              {/* Colored segments for each macro */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#proteinGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (proteinPercentage / 100) * circumference}
                strokeLinecap="round"
                opacity="0.3"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#carbsGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (carbsPercentage / 100) * circumference}
                strokeLinecap="round"
                opacity="0.3"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#fatGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (fatPercentage / 100) * circumference}
                strokeLinecap="round"
                opacity="0.3"
              />

              {/* Main calorie ring */}
              <circle
                ref={ringRef}
                cx="80"
                cy="80"
                r="70"
                stroke="url(#calorieGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={reducedMotion || hasAnimated ? targetOffset : circumference}
                strokeLinecap="round"
              />

              <defs>
                <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
                <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="carbsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="fatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div ref={calorieRef} className="text-4xl font-black text-primary-400">
                {Math.round(calories)}
              </div>
              <div className="text-xs text-dark-muted mt-1">kcal</div>
            </div>
          </div>
        </div>

        {/* Macro pills */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
            <div className="text-xs text-dark-muted mb-1">Proteína</div>
            <div className="text-lg font-bold text-blue-400">{Math.round(protein)}g</div>
            <div className="text-xs text-dark-muted">{Math.round(proteinPercentage)}%</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
            <div className="text-xs text-dark-muted mb-1">Carbos</div>
            <div className="text-lg font-bold text-green-400">{Math.round(carbs)}g</div>
            <div className="text-xs text-dark-muted">{Math.round(carbsPercentage)}%</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
            <div className="text-xs text-dark-muted mb-1">Grasas</div>
            <div className="text-lg font-bold text-amber-400">{Math.round(fat)}g</div>
            <div className="text-xs text-dark-muted">{Math.round(fatPercentage)}%</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
            <div className="text-xs text-dark-muted mb-1">Objetivo</div>
            <div className="text-lg font-bold text-amber-400">{calorieGoal}</div>
            <div className="text-xs text-dark-muted">{Math.round(caloriePercentage)}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
