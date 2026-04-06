import { useState } from 'react'
import { Plus, Droplets, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface QuickActionsBarProps {
  onWaterAdded?: () => void
  onOpenAddFood?: () => void
}

export function QuickActionsBar({ onWaterAdded, onOpenAddFood }: QuickActionsBarProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const addWaterQuick = async () => {
    if (!user) return
    setLoading(true)
    try {
      await supabase.from('water_logs').insert({
        user_id: user.id,
        amount_ml: 250,
      })
      onWaterAdded?.()
    } catch (error) {
      console.error('Error adding water:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-4 md:right-8 flex flex-col gap-3 z-40">
      {/* Water quick add */}
      <button
        onClick={addWaterQuick}
        disabled={loading}
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 flex items-center justify-center disabled:opacity-50 hover:scale-110 active:scale-95"
        title="Agregar 250ml de agua"
      >
        <Droplets className="w-6 h-6 text-white" />
        <span className="absolute -left-16 bg-dark-card/90 backdrop-blur-sm border border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          +250ml agua
        </span>
      </button>

      {/* Add food primary */}
      <button
        onClick={onOpenAddFood}
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
        title="Agregar alimento"
      >
        <Plus className="w-6 h-6 text-white" />
        <span className="absolute -left-20 bg-dark-card/90 backdrop-blur-sm border border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Agregar comida
        </span>
      </button>

      {/* Camera/photo (placeholder) */}
      <button
        disabled
        className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/50 to-pink-500/50 cursor-not-allowed shadow-lg shadow-purple-500/30 transition-all duration-300 flex items-center justify-center opacity-60"
        title="Próximamente"
      >
        <Camera className="w-6 h-6 text-white" />
        <span className="absolute -left-20 bg-dark-card/90 backdrop-blur-sm border border-dark-border rounded-lg px-3 py-1.5 text-xs font-bold text-dark-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Próximamente
        </span>
      </button>
    </div>
  )
}
