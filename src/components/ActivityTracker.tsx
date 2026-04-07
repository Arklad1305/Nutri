import { useState } from 'react'
import { Activity, X, Clock, Flame, Dumbbell, Wind, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface ActivityLog {
  id: number
  activity_name: string
  duration_minutes: number
  intensity_level: string
  calories_burned: number
  logged_at: string
}

interface ActivityTrackerProps {
  activities: ActivityLog[]
  onActivityAdded: () => void
}

// Activity catalog with associated metabolic rates
const COMMON_ACTIVITIES = [
  { name: 'Caminata paso lento', type: 'walk', intensity: 'light', calPerMin: 3.5 },
  { name: 'Caminata paso moderado', type: 'walk', intensity: 'moderate', calPerMin: 4.5 },
  { name: 'Caminata rápida', type: 'walk', intensity: 'vigorous', calPerMin: 6 },
  { name: 'Trotar', type: 'run', intensity: 'vigorous', calPerMin: 10 },
  { name: 'Bicicleta ligera', type: 'bike', intensity: 'light', calPerMin: 4 },
  { name: 'Pesas/Fuerza', type: 'strength', intensity: 'moderate', calPerMin: 5 },
  { name: 'Yoga', type: 'yoga', intensity: 'light', calPerMin: 3 },
  { name: 'HIIT', type: 'hiit', intensity: 'vigorous', calPerMin: 12 },
]

export function ActivityTracker({ activities, onActivityAdded }: ActivityTrackerProps) {
  const { user } = useAuth()
  const [isAdding, setIsAdding] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState(COMMON_ACTIVITIES[0])
  const [duration, setDuration] = useState(30)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate daily totals from all logged activities
  const totalCaloriesBurned = activities.reduce((sum, act) => sum + Number(act.calories_burned || 0), 0)
  const totalMinutes = activities.reduce((sum, act) => sum + Number(act.duration_minutes || 0), 0)

  // Determine activity level based on total minutes and calories
  const getActivityLevel = () => {
    if (totalMinutes === 0) return {
      level: 'Sedentario',
      icon: Wind,
      gradient: 'from-gray-500 via-slate-500 to-gray-600',
      glowColor: 'shadow-gray-500/50',
      textColor: 'text-gray-400',
      message: 'Sin actividad registrada. Considera moverte para activar tu metabolismo.'
    }
    if (totalMinutes < 20) return {
      level: 'Actividad Ligera',
      icon: Wind,
      gradient: 'from-blue-400 via-cyan-500 to-blue-500',
      glowColor: 'shadow-blue-500/50',
      textColor: 'text-blue-400',
      message: 'Movimiento inicial detectado. Continúa acumulando tiempo activo.'
    }
    if (totalMinutes < 40) return {
      level: 'Actividad Moderada',
      icon: Dumbbell,
      gradient: 'from-orange-400 via-amber-500 to-orange-500',
      glowColor: 'shadow-orange-500/50',
      textColor: 'text-orange-400',
      message: 'Nivel moderado alcanzado. Buen impacto en gasto energético.'
    }
    return {
      level: 'Actividad Alta',
      icon: Zap,
      gradient: 'from-red-500 via-orange-500 to-red-600',
      glowColor: 'shadow-red-500/50',
      textColor: 'text-red-400',
      message: 'Alto nivel de actividad. Excelente contribución al déficit calórico.'
    }
  }

  const level = getActivityLevel()
  const Icon = level.icon

  // Calculate progress percentage (target: 45 min daily)
  const targetMinutes = 45
  const percentage = Math.min((totalMinutes / targetMinutes) * 100, 100)
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const handleAddActivity = async () => {
    if (!user || duration <= 0) return

    setIsLoading(true)
    try {
      // Calculate caloric expenditure based on activity and duration
      const caloriesBurned = Math.round(selectedActivity.calPerMin * duration)

      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          activity_type: selectedActivity.type,
          activity_name: selectedActivity.name,
          duration_minutes: duration,
          intensity_level: selectedActivity.intensity,
          calories_burned: caloriesBurned,
          logged_at: new Date().toISOString(),
        })

      if (error) throw error

      setIsAdding(false)
      setDuration(30)
      onActivityAdded()
    } catch (err) {
      console.error('Error adding activity:', err)
      alert('Error al registrar actividad')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteActivity = async (id: number) => {
    if (!confirm('¿Eliminar esta actividad?')) return

    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', id)

      if (error) throw error
      onActivityAdded()
    } catch (err) {
      console.error('Error deleting activity:', err)
    }
  }

  return (
    <div className="relative bg-gradient-to-br from-[#140c06] to-[#100a05] border border-amber-500/15 rounded-2xl p-6 overflow-hidden group hover:border-amber-500/25 transition-all duration-300">
      {/* Ambient gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${level.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

      {/* Decorative blur effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/5 to-transparent rounded-full blur-3xl"></div>

      {/* Subtle flame layer at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1/6 bg-gradient-to-t from-amber-500/5 via-orange-500/3 to-transparent animate-[flame-flicker-3_2s_ease-in-out_infinite] pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header section with activity level indicator */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${level.gradient} ${level.glowColor} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Actividad Física
              </h3>
              <p className={`text-sm font-medium ${level.textColor}`}>{level.level}</p>
            </div>
          </div>
        </div>

        {/* Circular progress visualization and metrics */}
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
                stroke="url(#activityGradient)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={level.textColor} />
                  <stop offset="100%" className={level.textColor} style={{ stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
            </svg>
            {/* Center display showing total minutes */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-white">{totalMinutes}</div>
              <div className="text-xs text-dark-muted">minutos</div>
            </div>
          </div>

          {/* Secondary metrics panel */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs text-dark-muted">
              <Activity className="w-4 h-4" />
              <span>Resumen del día</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-muted">Calorías Quemadas</p>
                <p className="text-lg font-bold text-orange-400">{totalCaloriesBurned} kcal</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-dark-muted">Objetivo Diario</p>
                <p className="text-lg font-bold text-white">{targetMinutes} min</p>
              </div>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{level.message}</p>
          </div>
        </div>

        {/* Add activity interface or logged activities list */}
        {!isAdding ? (
          <div className="space-y-4">
            <button
              onClick={() => setIsAdding(true)}
              className="w-full px-4 py-3 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 rounded-xl text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Registrar Actividad
            </button>

            {/* List of logged activities */}
            {activities.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-dark-muted">Actividades Registradas</h4>
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between bg-amber-500/5 backdrop-blur-sm rounded-lg p-3 border border-amber-500/10 hover:border-amber-500/20 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{activity.activity_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-dark-muted">
                          <Clock className="w-3 h-3" />
                          {activity.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1 text-xs text-orange-400">
                          <Flame className="w-3 h-3" />
                          {activity.calories_burned} kcal
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activities.length === 0 && (
              <p className="text-xs text-dark-muted text-center py-4">
                Sin actividades registradas para hoy
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Activity selection dropdown */}
            <div className="bg-[#100a05]/60 backdrop-blur-sm rounded-xl p-4 border border-amber-500/15">
              <label className="block text-xs font-medium text-dark-muted mb-3">
                Tipo de Actividad
              </label>
              <select
                value={selectedActivity.name}
                onChange={(e) => {
                  const activity = COMMON_ACTIVITIES.find(a => a.name === e.target.value)
                  if (activity) setSelectedActivity(activity)
                }}
                className="w-full bg-[#140c06] border border-amber-500/15 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/30"
              >
                {COMMON_ACTIVITIES.map((activity) => (
                  <option key={activity.name} value={activity.name}>
                    {activity.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration slider control */}
            <div className="bg-[#100a05]/60 backdrop-blur-sm rounded-xl p-4 border border-amber-500/15">
              <label className="block text-xs font-medium text-dark-muted mb-3">
                Duración: {duration} minutos
              </label>
              <input
                type="range"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="5"
                max="120"
                step="5"
                className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer slider-activity"
                style={{
                  background: `linear-gradient(to right,
                    rgb(59 130 246) 0%,
                    rgb(249 115 22) 50%,
                    rgb(239 68 68) ${(duration / 120) * 100}%,
                    rgb(30 41 59) ${(duration / 120) * 100}%)`
                }}
              />
              <div className="flex justify-between text-xs text-dark-muted mt-2">
                <span>5 min</span>
                <span>60 min</span>
                <span>120 min</span>
              </div>
              <div className="mt-3 text-xs text-dark-muted">
                Calorías estimadas: ~{Math.round(selectedActivity.calPerMin * duration)} kcal
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsAdding(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 rounded-xl text-sm font-medium text-dark-muted hover:text-white transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddActivity}
                disabled={isLoading || duration <= 0}
                className={`flex-1 px-4 py-3 bg-gradient-to-r ${level.gradient} hover:opacity-90 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 shadow-lg ${level.glowColor} hover:scale-[1.02] active:scale-[0.98]`}
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom slider styles */}
      <style>{`
        .slider-activity::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fff, #e2e8f0);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 2px solid #1e293b;
        }
        .slider-activity::-moz-range-thumb {
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
