import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, startOfDay, endOfDay } from 'date-fns'
import { Trash2, Clock, Eye } from 'lucide-react'
import { Database } from '../lib/database.types'
import FoodDetailsModal from './FoodDetailsModal'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

type FoodLog = Database['public']['Tables']['food_logs']['Row']

interface FoodLogListProps {
  refreshKey: number
  onFoodDeleted: () => void
  limit?: number
}

export function FoodLogList({ refreshKey, onFoodDeleted, limit }: FoodLogListProps) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFood, setSelectedFood] = useState<FoodLog | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (user) {
      loadLogs()
    }
  }, [user, refreshKey])

  const loadLogs = async () => {
    setLoading(true)
    const today = new Date()
    const start = startOfDay(today).toISOString()
    const end = endOfDay(today).toISOString()

    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', start)
      .lte('logged_at', end)
      .order('logged_at', { ascending: false })

    if (data) {
      setLogs(data as FoodLog[])
    }
    setLoading(false)
  }

  const deleteLog = async (id: number) => {
    if (!confirm('¿Eliminar este registro?')) return

    await supabase.from('food_logs').delete().eq('id', id)
    onFoodDeleted()
  }

  useGSAP(() => {
    if (reducedMotion || loading || logs.length === 0 || !listRef.current) return

    const items = listRef.current.querySelectorAll('.food-log-item')
    if (items.length === 0) return

    gsap.set(items, { opacity: 0, y: 20 })

    ScrollTrigger.batch(items, {
      onEnter: (elements) => {
        gsap.to(elements, {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: true,
        })
      },
      start: 'top 90%',
      once: true,
    })
  }, { scope: listRef, dependencies: [logs, loading, reducedMotion], revertOnUpdate: true })

  if (loading) {
    return <div className="text-center text-dark-muted py-8">Cargando...</div>
  }

  if (logs.length === 0) {
    return (
      <div className="text-center text-dark-muted py-8">
        No hay registros para hoy. Agrega tu primera comida.
      </div>
    )
  }

  const displayedLogs = limit ? logs.slice(0, limit) : logs

  return (
    <>
      <div ref={listRef} className="space-y-3">
        {displayedLogs.map((log) => (
          <div
            key={log.id}
            className="food-log-item bg-dark-hover border border-dark-border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{log.food_name}</h3>
                <div className="flex items-center gap-2 text-sm text-dark-muted">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(log.logged_at), 'HH:mm')}</span>
                  {log.quantity_g && (
                    <>
                      <span>•</span>
                      <span>{log.quantity_g}g</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFood(log)}
                  className="text-dark-muted hover:text-primary transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="text-dark-muted hover:text-danger transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-3">
              <div className="text-center">
                <div className="text-xs text-dark-muted mb-1">Calorías</div>
                <div className="text-sm font-semibold text-white">{Math.round(Number(log.calories) || 0)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-dark-muted mb-1">Proteína</div>
                <div className="text-sm font-semibold text-white">{Math.round(Number(log.protein_g) || 0)}g</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-dark-muted mb-1">Carbos</div>
                <div className="text-sm font-semibold text-white">{Math.round(Number(log.carbs_g) || 0)}g</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-dark-muted mb-1">Grasas</div>
                <div className="text-sm font-semibold text-white">{Math.round(Number(log.fat_g) || 0)}g</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedFood && (
        <FoodDetailsModal
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </>
  )
}
