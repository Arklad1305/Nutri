import { useState } from 'react'
import { Moon, Stars, Sunrise, CloudMoon, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface QuickSleepEditorProps {
  sleepHours: number
  onSleepUpdated: (hours: number) => void
}

export function QuickSleepEditor({ sleepHours, onSleepUpdated }: QuickSleepEditorProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [tempHours, setTempHours] = useState(sleepHours)
  const [isLoading, setIsLoading] = useState(false)

  // Display value switches between actual and temporary during editing
  const currentHours = isEditing ? tempHours : sleepHours

  // Determine sleep quality phase based on hours
  const getSleepPhase = (hours: number) => {
    if (hours < 5) return {
      phase: 'Crítico',
      icon: AlertTriangle,
      gradient: 'from-red-500 via-orange-500 to-red-600',
      glowColor: 'shadow-red-500/50',
      textColor: 'text-red-400',
      message: 'Privación severa. Ajustes metabólicos críticos activos.',
      emoji: ''
    }
    if (hours < 6.5) return {
      phase: 'Recuperación',
      icon: CloudMoon,
      gradient: 'from-yellow-500 via-amber-500 to-orange-500',
      glowColor: 'shadow-yellow-500/50',
      textColor: 'text-yellow-400',
      message: 'Déficit moderado. Protección metabólica activa.',
      emoji: ''
    }
    if (hours < 7.5) return {
      phase: 'Bueno',
      icon: Moon,
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      glowColor: 'shadow-blue-500/50',
      textColor: 'text-blue-400',
      message: 'Sueño adecuado. Funcionamiento normal.',
      emoji: ''
    }
    return {
      phase: 'Óptimo',
      icon: Stars,
      gradient: 'from-green-400 via-emerald-500 to-teal-500',
      glowColor: 'shadow-green-500/50',
      textColor: 'text-green-400',
      message: 'Recuperación completa. Rendimiento máximo.',
      emoji: ''
    }
  }

  const phase = getSleepPhase(currentHours)

  // Calculate circular progress bar values
  const percentage = Math.min((currentHours / 9) * 100, 100)
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const handleSave = async () => {
    if (!user || tempHours < 0 || tempHours > 24) return

    setIsLoading(true)
    try {
      // Persist sleep hours to user profile
      const { error } = await supabase
        .from('profiles')
        .update({ last_night_sleep_hours: tempHours })
        .eq('id', user.id)

      if (error) throw error

      onSleepUpdated(tempHours)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating sleep:', err)
      alert('Error al actualizar sueño')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setTempHours(sleepHours)
    setIsEditing(false)
  }

  const Icon = phase.icon

  return (
    <div className="relative bg-gradient-to-br from-[#080c1a] to-[#0a0e20] border border-indigo-500/15 rounded-2xl p-6 overflow-hidden group hover:border-indigo-500/25 transition-all duration-300">
      {/* Ambient gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${phase.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

      {/* Decorative blur effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/5 to-transparent rounded-full blur-3xl"></div>

      {/* Twinkling stars */}
      <div className="absolute top-4 left-8 w-0.5 h-0.5 rounded-full bg-white/40 animate-[star-twinkle_3s_ease-in-out_infinite_0s] pointer-events-none"></div>
      <div className="absolute top-8 right-12 w-1 h-1 rounded-full bg-indigo-300/40 animate-[star-twinkle_4s_ease-in-out_infinite_1s] pointer-events-none"></div>
      <div className="absolute top-16 left-1/3 w-0.5 h-0.5 rounded-full bg-white/40 animate-[star-twinkle_5s_ease-in-out_infinite_0.5s] pointer-events-none"></div>
      <div className="absolute top-6 right-1/3 w-1 h-1 rounded-full bg-indigo-300/40 animate-[star-twinkle_3.5s_ease-in-out_infinite_2s] pointer-events-none"></div>
      <div className="absolute top-12 left-16 w-0.5 h-0.5 rounded-full bg-white/40 animate-[star-twinkle_4.5s_ease-in-out_infinite_1.5s] pointer-events-none"></div>

      {/* Aurora band */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-indigo-500/[0.03] via-violet-500/[0.05] to-indigo-500/[0.03] blur-xl animate-[aurora-drift_8s_ease-in-out_infinite] pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header section with sleep phase indicator */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${phase.gradient} ${phase.glowColor} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Estado de Sueño
              </h3>
              <p className={`text-sm font-medium ${phase.textColor}`}>{phase.phase}</p>
            </div>
          </div>
        </div>

        {/* Circular progress visualization and details */}
        <div className="flex items-center gap-8 mb-6">
          <div className="relative">
            <svg className="transform -rotate-90 w-32 h-32">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-dark-border"
              />
              {/* Animated progress circle with gradient */}
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="url(#sleepGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="sleepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={phase.textColor} />
                  <stop offset="100%" className={phase.textColor} style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            {/* Center display showing hours */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">{currentHours.toFixed(1)}</div>
              <div className="text-xs text-dark-muted">horas</div>
            </div>
          </div>

          {/* Metabolic impact message */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <Sunrise className="w-4 h-4" />
              <span>Última noche</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{phase.message}</p>
          </div>
        </div>

        {/* Display or edit mode toggle */}
        {!isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 hover:border-indigo-500/30 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Ajustar horas
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sleep hours slider control */}
            <div className="bg-[#0a0e20]/60 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/15">
              <label className="block text-xs font-medium text-dark-muted mb-3">
                Desliza para ajustar
              </label>
              <input
                type="range"
                value={tempHours}
                onChange={(e) => setTempHours(Number(e.target.value))}
                min="0"
                max="12"
                step="0.5"
                className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer slider-sleep"
                style={{
                  background: `linear-gradient(to right,
                    rgb(239 68 68) 0%,
                    rgb(234 179 8) 30%,
                    rgb(59 130 246) 60%,
                    rgb(34 197 94) ${(tempHours / 12) * 100}%,
                    rgb(30 41 59) ${(tempHours / 12) * 100}%)`
                }}
              />
              <div className="flex justify-between text-xs text-dark-muted mt-2">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-sm font-medium text-dark-muted hover:text-white transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`flex-1 px-4 py-3 bg-gradient-to-r ${phase.gradient} hover:opacity-90 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 shadow-lg ${phase.glowColor} hover:scale-[1.02] active:scale-[0.98]`}
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom slider styles */}
      <style>{`
        .slider-sleep::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fff, #e2e8f0);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 2px solid #1e293b;
        }
        .slider-sleep::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fff, #e2e8f0);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 2px solid #1e293b;
        }
      `}</style>
    </div>
  )
}
