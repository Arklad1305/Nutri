import { useState } from 'react'
import { Droplets, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface WaterTrackerProps {
  current: number
  goal: number
  onWaterAdded: () => void
}

export function WaterTracker({ current, goal, onWaterAdded }: WaterTrackerProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const percentage = Math.round((current / goal) * 100)
  const liters = (current / 1000).toFixed(1)
  const goalLiters = (goal / 1000).toFixed(1)
  const remaining = Math.max(0, goal - current)

  const addWater = async (amount: number) => {
    if (!user) return
    setLoading(true)
    try {
      await supabase.from('water_logs').insert({ user_id: user.id, amount_ml: amount })
      onWaterAdded()
    } catch (error) {
      console.error('Error adding water:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-dark-muted" />
          <span className="text-sm font-semibold text-dark-text">Hidratación</span>
        </div>
        <span className="text-xs text-dark-muted">{liters}L / {goalLiters}L</span>
      </div>

      <div className="mb-4">
        <div className="h-2 bg-dark-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-dark-muted">{percentage}%</span>
          <span className="text-xs text-dark-muted">
            {remaining > 0 ? `${(remaining / 1000).toFixed(1)}L restante` : 'Meta alcanzada'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[250, 500, 1000].map(amount => (
          <button
            key={amount}
            onClick={() => addWater(amount)}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 py-2 bg-dark-hover border border-dark-border rounded-lg hover:border-primary/30 transition-colors disabled:opacity-50 text-xs"
          >
            <Plus className="w-3 h-3 text-dark-muted" />
            <span className="text-dark-text font-medium">{amount >= 1000 ? '1L' : `${amount}ml`}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
