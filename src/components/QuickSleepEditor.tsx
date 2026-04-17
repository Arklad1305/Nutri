import { useState } from 'react'
import { Moon, Sunrise } from 'lucide-react'
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
      message: 'Privación severa. Ajustes metabólicos críticos activos.',
    }
    if (hours < 6.5) return {
      phase: 'Recuperación',
      message: 'Déficit moderado. Protección metabólica activa.',
    }
    if (hours < 7.5) return {
      phase: 'Bueno',
      message: 'Sueño adecuado. Funcionamiento normal.',
    }
    return {
      phase: 'Óptimo',
      message: 'Recuperación completa. Rendimiento máximo.',
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

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
      {/* Header section with sleep phase indicator */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-dark-hover">
            <Moon className="w-6 h-6 text-dark-muted" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-dark-text">
              Estado de Sueño
            </h3>
            <p className="text-sm font-medium text-dark-muted">{phase.phase}</p>
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
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="54"
              stroke="#0d9488"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          {/* Center display showing hours */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-dark-text">{currentHours.toFixed(1)}</div>
            <div className="text-xs text-dark-muted">horas</div>
          </div>
        </div>

        {/* Metabolic impact message */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-xs text-dark-muted">
            <Sunrise className="w-4 h-4" />
            <span>Última noche</span>
          </div>
          <p className="text-sm text-dark-muted leading-relaxed">{phase.message}</p>
        </div>
      </div>

      {/* Display or edit mode toggle */}
      {!isEditing ? (
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 px-4 py-3 bg-dark-hover hover:bg-dark-border border border-dark-border rounded-xl text-sm font-medium text-dark-text transition-colors"
          >
            Ajustar horas
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sleep hours slider control */}
          <div className="bg-dark-hover rounded-xl p-4 border border-dark-border">
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
                background: (() => {
                  const pct = (tempHours / 12) * 100
                  return `linear-gradient(to right, #0d9488 0%, #0d9488 ${pct}%, #1e1e1e ${pct}%, #1e1e1e 100%)`
                })()
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
              className="flex-1 px-4 py-3 bg-dark-hover hover:bg-dark-border border border-dark-border rounded-xl text-sm font-medium text-dark-muted hover:text-dark-text transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Custom slider styles */}
      <style>{`
        .slider-sleep::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #f5f5f5;
          cursor: pointer;
          border: 2px solid #0d9488;
        }
        .slider-sleep::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #f5f5f5;
          cursor: pointer;
          border: 2px solid #0d9488;
        }
      `}</style>
    </div>
  )
}
