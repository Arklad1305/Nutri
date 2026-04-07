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
            className="food-log-item relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 hover:border-primary/30 hover:bg-white/[0.05] transition-all duration-200 group/item"
          >
            <div className="flex items-center gap-3">
              {/* Calorie badge */}
              <div className="shrink-0 w-11 h-11 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex flex-col items-center justify-center">
                <span className="text-xs font-black text-primary leading-none">{Math.round(Number(log.calories) || 0)}</span>
                <span className="text-[7px] text-primary/60 font-medium">kcal</span>
              </div>

              {/* Food info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{log.food_name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-dark-muted" />
                  <span className="text-[10px] text-dark-muted">{format(new Date(log.logged_at), 'HH:mm')}</span>
                  {log.quantity_g && (
                    <>
                      <span className="text-dark-muted/40">·</span>
                      <span className="text-[10px] text-dark-muted">{log.quantity_g}g</span>
                    </>
                  )}
                </div>
              </div>

              {/* Macro pills */}
              <div className="hidden min-[380px]:flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-bold text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded-md">{Math.round(Number(log.protein_g) || 0)}P</span>
                <span className="text-[9px] font-bold text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded-md">{Math.round(Number(log.carbs_g) || 0)}C</span>
                <span className="text-[9px] font-bold text-rose-400/80 bg-rose-500/10 px-1.5 py-0.5 rounded-md">{Math.round(Number(log.fat_g) || 0)}G</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-50 group-hover/item:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedFood(log)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-dark-muted hover:text-primary transition-all"
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-dark-muted hover:text-danger transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
