import { useRef, useState } from 'react'
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react'
import { macroColorConfig } from '../lib/colorConfig'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface MacroCardProps {
  title: string
  current: number
  goal: number
  unit: string
  icon: LucideIcon
  color: string
  percentage: number
}

export function MacroCard({ title, current, goal, unit, icon: Icon, color, percentage }: MacroCardProps) {
  const isOverGoal = percentage > 100
  const isOnTarget = percentage >= 90 && percentage <= 110
  const config = macroColorConfig[color] || macroColorConfig['text-blue-500']
  const reducedMotion = useReducedMotion()

  const clampedPercentage = Math.min(percentage, 100)
  const circumference = 2 * Math.PI * 45
  const targetOffset = circumference - (clampedPercentage / 100) * circumference

  const cardRef = useRef<HTMLDivElement>(null)
  const circleRef = useRef<SVGCircleElement>(null)
  const percentRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLSpanElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useGSAP(() => {
    if (reducedMotion || !cardRef.current) return

    // Animate SVG arc from empty to current value
    if (circleRef.current) {
      gsap.fromTo(circleRef.current,
        { strokeDashoffset: circumference },
        {
          strokeDashoffset: targetOffset,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 85%',
            once: true,
            onEnter: () => setHasAnimated(true),
          },
        }
      )
    }

    // Count-up for percentage display
    if (percentRef.current) {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: Math.round(percentage),
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          once: true,
        },
        onUpdate: () => {
          if (percentRef.current) {
            percentRef.current.textContent = `${Math.round(obj.val)}%`
          }
        },
      })
    }

    // Count-up for absolute value
    if (valueRef.current) {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: Math.round(current),
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          once: true,
        },
        onUpdate: () => {
          if (valueRef.current) {
            valueRef.current.textContent = String(Math.round(obj.val))
          }
        },
      })
    }
  }, { scope: cardRef, dependencies: [current, percentage, reducedMotion], revertOnUpdate: true })

  return (
    <div ref={cardRef} className="macro-card relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-5 overflow-hidden group hover:border-dark-border/80 transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} ${config.glowColor} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {isOnTarget && (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          )}
          {isOverGoal && (
            <TrendingUp className="w-5 h-5 text-red-400" />
          )}
          {!isOnTarget && !isOverGoal && percentage > 0 && (
            <TrendingDown className="w-5 h-5 text-yellow-400" />
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="45"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-dark-border"
              />
              <circle
                ref={circleRef}
                cx="48"
                cy="48"
                r="45"
                stroke="url(#macroGradient)"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={reducedMotion || hasAnimated ? targetOffset : circumference}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="macroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={config.textColor} />
                  <stop offset="100%" className={config.textColor} style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div ref={percentRef} className={`text-2xl font-bold ${config.textColor}`}>
                {Math.round(percentage)}%
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-dark-muted mb-1">{title}</h3>
            <div className="flex items-baseline gap-1">
              <span ref={valueRef} className="text-2xl font-bold text-white truncate">
                {Math.round(current)}
              </span>
              <span className="text-xs text-dark-muted">{unit}</span>
            </div>
            <div className="text-xs text-dark-muted mt-1">
              Meta: {goal} {unit}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dark-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${
              isOverGoal
                ? 'text-red-400'
                : isOnTarget
                ? 'text-green-400'
                : 'text-yellow-400'
            }`}>
              {isOverGoal
                ? `+${Math.round(current - goal)} ${unit} sobre meta`
                : isOnTarget
                ? 'En objetivo'
                : `${Math.round(goal - current)} ${unit} restantes`}
            </span>
            <span className="text-dark-muted">
              {current > 0 ? Math.round((current / goal) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
