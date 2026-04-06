import { useRef, useState } from 'react'
import { Droplet, Waves, Plus, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface WaterTrackerProps {
  current: number
  goal: number
  onWaterAdded: () => void
}

export function WaterTracker({ current, goal, onWaterAdded }: WaterTrackerProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const reducedMotion = useReducedMotion()

  const percentage = (current / goal) * 100
  const liters = current / 1000
  const goalLiters = goal / 1000
  const isOptimal = percentage >= 90 && percentage <= 110
  const isLow = percentage < 70

  const addWater = async (amount: number) => {
    if (!user) return
    setLoading(true)

    try {
      await supabase.from('water_logs').insert({
        user_id: user.id,
        amount_ml: amount,
      })
      onWaterAdded()
    } catch (error) {
      console.error('Error adding water:', error)
    } finally {
      setLoading(false)
    }
  }

  const clampedPercentage = Math.min(percentage, 100)
  const circumference = 2 * Math.PI * 54
  const targetOffset = circumference - (clampedPercentage / 100) * circumference

  const cardRef = useRef<HTMLDivElement>(null)
  const circleRef = useRef<SVGCircleElement>(null)
  const litersRef = useRef<HTMLDivElement>(null)
  const percentRef = useRef<HTMLSpanElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useGSAP(() => {
    if (reducedMotion || !cardRef.current) return

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

    if (litersRef.current) {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: liters,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          once: true,
        },
        onUpdate: () => {
          if (litersRef.current) {
            litersRef.current.textContent = obj.val.toFixed(1)
          }
        },
      })
    }

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
  }, { scope: cardRef, dependencies: [current, percentage, reducedMotion], revertOnUpdate: true })

  return (
    <div ref={cardRef} className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6 overflow-hidden group hover:border-dark-border/80 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 shadow-blue-500/30 shadow-md">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Hidratación</h3>
              <p className="text-xs text-dark-muted">Estado diario</p>
            </div>
          </div>
          {isOptimal && <CheckCircle2 className="w-5 h-5 text-green-400" />}
          {isLow && <AlertCircle className="w-5 h-5 text-yellow-400" />}
        </div>

        <div className="flex items-center gap-8 mb-6">
          <div className="relative">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-dark-border"
              />
              <circle
                ref={circleRef}
                cx="64"
                cy="64"
                r="54"
                stroke="url(#waterGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={reducedMotion || hasAnimated ? targetOffset : circumference}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className="text-blue-400" />
                  <stop offset="100%" className="text-cyan-400" style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div ref={litersRef} className="text-3xl font-bold text-blue-400">
                {liters.toFixed(1)}
              </div>
              <div className="text-xs text-dark-muted">litros</div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <Waves className="w-4 h-4" />
              <span>Progreso del día</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span ref={percentRef} className="text-2xl font-bold text-white">{Math.round(percentage)}%</span>
                <span className="text-xs text-dark-muted">completado</span>
              </div>
              <p className="text-xs text-dark-muted">
                Meta: {goalLiters.toFixed(1)}L
              </p>
            </div>

            <div className={`p-2 rounded-lg ${
              isOptimal
                ? 'bg-green-500/10 border border-green-500/30'
                : isLow
                ? 'bg-yellow-500/10 border border-yellow-500/30'
                : 'bg-blue-500/10 border border-blue-500/30'
            }`}>
              <p className={`text-xs font-medium ${
                isOptimal
                  ? 'text-green-400'
                  : isLow
                  ? 'text-yellow-400'
                  : 'text-blue-400'
              }`}>
                {isOptimal
                  ? 'Hidratación óptima'
                  : isLow
                  ? 'Nivel bajo - Bebe agua'
                  : `${(goalLiters - liters).toFixed(1)}L restantes`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-dark-muted font-semibold">Agregar agua:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => addWater(250)}
              disabled={loading}
              className="flex flex-col items-center gap-1 py-3 px-2 bg-dark-hover/60 border border-dark-border/50 hover:border-blue-500/40 rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <div className="text-center">
                <p className="text-sm font-bold text-white">250</p>
                <p className="text-[10px] text-dark-muted">ml</p>
              </div>
            </button>
            <button
              onClick={() => addWater(500)}
              disabled={loading}
              className="flex flex-col items-center gap-1 py-3 px-2 bg-dark-hover/60 border border-dark-border/50 hover:border-blue-500/40 rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <div className="text-center">
                <p className="text-sm font-bold text-white">500</p>
                <p className="text-[10px] text-dark-muted">ml</p>
              </div>
            </button>
            <button
              onClick={() => addWater(1000)}
              disabled={loading}
              className="flex flex-col items-center gap-1 py-3 px-2 bg-dark-hover/60 border border-dark-border/50 hover:border-blue-500/40 rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <div className="text-center">
                <p className="text-sm font-bold text-white">1</p>
                <p className="text-[10px] text-dark-muted">litro</p>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-dark-border/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
              <span className="text-dark-muted">Actualizado en tiempo real</span>
            </div>
            <span className="text-blue-400 font-medium">{current} ml</span>
          </div>
        </div>
      </div>
    </div>
  )
}
