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
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-5 group-hover:opacity-10 transition-opacity duration-500"></div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 shadow-blue-500/50 shadow-lg">
              <Droplet className="w-6 h-6 text-white" />
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
          <p className="text-xs text-dark-muted font-bold">Agregar agua rápido:</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => addWater(250)}
              disabled={loading}
              className="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/30 hover:border-blue-400 rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 text-blue-400 group-hover:scale-125 transition-transform duration-300 relative z-10" />
              <div className="text-center relative z-10">
                <p className="text-sm font-black text-white">250</p>
                <p className="text-xs text-dark-muted">ml</p>
              </div>
            </button>
            <button
              onClick={() => addWater(500)}
              disabled={loading}
              className="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 hover:border-cyan-400 rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 text-cyan-400 group-hover:scale-125 transition-transform duration-300 relative z-10" />
              <div className="text-center relative z-10">
                <p className="text-sm font-black text-white">500</p>
                <p className="text-xs text-dark-muted">ml</p>
              </div>
            </button>
            <button
              onClick={() => addWater(1000)}
              disabled={loading}
              className="group relative flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 hover:from-blue-600/20 hover:to-cyan-600/20 border border-blue-600/30 hover:border-blue-500 rounded-xl transition-all duration-300 disabled:opacity-50 hover:scale-105 hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus className="w-5 h-5 text-blue-400 group-hover:scale-125 transition-transform duration-300 relative z-10" />
              <div className="text-center relative z-10">
                <p className="text-sm font-black text-white">1</p>
                <p className="text-xs text-dark-muted">litro</p>
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
