import { useRef, useState, useCallback } from 'react'
import { X, Sparkles, PenLine } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { createNutritionalMatrix } from '../lib/nutritionUtils'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface AddFoodModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddFoodModal({ isOpen, onClose, onSuccess }: AddFoodModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (!isOpen || reducedMotion) return
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
    }
    if (panelRef.current) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.4)' }
      )
    }
  }, { dependencies: [isOpen, reducedMotion] })

  const handleClose = useCallback(() => {
    if (reducedMotion || !overlayRef.current || !panelRef.current) {
      onClose()
      return
    }
    gsap.to(panelRef.current, {
      opacity: 0, y: 20, scale: 0.97,
      duration: 0.2, ease: 'power2.in',
    })
    gsap.to(overlayRef.current, {
      opacity: 0, duration: 0.2, ease: 'power2.in',
      onComplete: onClose,
    })
  }, [onClose, reducedMotion])
  const [inputMode, setInputMode] = useState<'manual' | 'ai'>('manual')
  const [aiDescription, setAiDescription] = useState('')
  const [formData, setFormData] = useState({
    food_name: '',
    quantity_g: 100,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    water_ml: 0,
    leucine_mg: 0,
    sodium_mg: 0,
    choline_mg: 0,
    zinc_mg: 0,
    magnesium_mg: 0,
    vit_d3_iu: 0,
    omega_3_total_g: 0,
    polyphenols_total_mg: 0,
  })

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!aiDescription.trim()) {
      alert('Por favor escribe una descripción del alimento')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        alert('Sesión expirada. Por favor inicia sesión nuevamente.')
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-food-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: aiDescription
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al procesar con IA')
      }

      await response.json()

      setAiDescription('')
      onSuccess()
    } catch (error) {
      console.error('Error processing with AI:', error)
      alert(error instanceof Error ? error.message : 'Error al procesar con IA')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const nutritionalMatrix = createNutritionalMatrix({
        calories: formData.calories,
        protein_g: formData.protein_g,
        carbs_g: formData.carbs_g,
        fat_g: formData.fat_g,
        water_ml: formData.water_ml,
        leucine_mg: formData.leucine_mg,
        sodium_mg: formData.sodium_mg,
        choline_mg: formData.choline_mg,
        zinc_mg: formData.zinc_mg,
        magnesium_mg: formData.magnesium_mg,
        vit_d3_iu: formData.vit_d3_iu,
        omega_3_total_g: formData.omega_3_total_g,
        polyphenols_total_mg: formData.polyphenols_total_mg,
      })

      await supabase.from('food_logs').insert({
        user_id: user.id,
        food_name: formData.food_name,
        quantity_g: formData.quantity_g,
        calories: formData.calories,
        protein_g: formData.protein_g,
        carbs_g: formData.carbs_g,
        fat_g: formData.fat_g,
        water_ml: formData.water_ml,
        leucine_mg: formData.leucine_mg,
        sodium_mg: formData.sodium_mg,
        choline_mg: formData.choline_mg,
        zinc_mg: formData.zinc_mg,
        magnesium_mg: formData.magnesium_mg,
        vit_d3_iu: formData.vit_d3_iu,
        omega_3_total_g: formData.omega_3_total_g,
        polyphenols_total_mg: formData.polyphenols_total_mg,
        nutritional_matrix: nutritionalMatrix,
      })

      setFormData({
        food_name: '',
        quantity_g: 100,
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        water_ml: 0,
        leucine_mg: 0,
        sodium_mg: 0,
        choline_mg: 0,
        zinc_mg: 0,
        magnesium_mg: 0,
        vit_d3_iu: 0,
        omega_3_total_g: 0,
        polyphenols_total_mg: 0,
      })

      onSuccess()
    } catch (error) {
      console.error('Error adding food:', error)
      alert('Error al agregar alimento')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div ref={overlayRef} className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div ref={panelRef} className="bg-dark-card/95 backdrop-blur-xl border border-dark-border/50 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mobile-scroll-hide scroll-smooth-mobile shadow-2xl shadow-black/50">
        <div className="sticky top-0 bg-gradient-to-b from-dark-card via-dark-card to-dark-card/80 backdrop-blur-xl border-b border-dark-border/50 px-6 py-5 flex items-center justify-between z-10">
          <h2 className="text-xl font-black text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text">Agregar Alimento</h2>
          <button
            onClick={handleClose}
            className="p-2 text-dark-muted hover:text-white hover:bg-dark-hover rounded-xl transition-all duration-200 hover:scale-110 group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-2 p-1.5 bg-dark-hover/50 backdrop-blur-sm rounded-xl border border-dark-border/30">
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                inputMode === 'manual'
                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30 scale-[1.02]'
                  : 'text-dark-muted hover:text-white hover:bg-dark-hover/50'
              }`}
            >
              <PenLine className={`w-4 h-4 transition-transform ${inputMode === 'manual' ? 'scale-110' : ''}`} />
              <span>Manual</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('ai')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
                inputMode === 'ai'
                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30 scale-[1.02]'
                  : 'text-dark-muted hover:text-white hover:bg-dark-hover/50'
              }`}
            >
              <Sparkles className={`w-4 h-4 transition-transform ${inputMode === 'ai' ? 'scale-110' : ''}`} />
              <span>Con IA</span>
            </button>
          </div>

          {inputMode === 'ai' ? (
            <form onSubmit={handleAiSubmit} className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-300">
                  <span className="font-semibold">Análisis con IA potenciado por Gemini:</span> Describe tu comida en lenguaje natural y la IA calculará automáticamente todos los nutrientes organizados en los 4 grupos bioquímicos.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Describe tu comida *
                </label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Ej: 200g de salmón a la plancha con brócoli al vapor&#10;Ej: Dos huevos revueltos con aguacate&#10;Ej: Batido de proteína con banana y almendras"
                  className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white min-h-[120px] resize-none"
                  required
                />
                <p className="text-xs text-dark-muted mt-2">
                  Tip: Incluye cantidades aproximadas para mayor precisión
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 px-4 bg-dark-hover/80 hover:bg-dark-border border border-dark-border/50 hover:border-dark-border text-white font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !aiDescription.trim()}
                  className="relative flex-1 py-3.5 px-4 bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">{loading ? 'Procesando con IA...' : 'Analizar con IA'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Nombre del Alimento *
              </label>
              <input
                type="text"
                value={formData.food_name}
                onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                placeholder="Ej: Pechuga de pollo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-text mb-2">
                Cantidad (g) *
              </label>
              <input
                type="number"
                value={formData.quantity_g}
                onChange={(e) => setFormData({ ...formData, quantity_g: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                placeholder="100"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Motor (Energía y Rendimiento)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Calorías (kcal)
                </label>
                <input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Proteína (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.protein_g}
                  onChange={(e) => setFormData({ ...formData, protein_g: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Carbohidratos (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.carbs_g}
                  onChange={(e) => setFormData({ ...formData, carbs_g: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Grasas (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.fat_g}
                  onChange={(e) => setFormData({ ...formData, fat_g: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Agua (ml)
                </label>
                <input
                  type="number"
                  value={formData.water_ml}
                  onChange={(e) => setFormData({ ...formData, water_ml: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Leucina (mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.leucine_mg}
                  onChange={(e) => setFormData({ ...formData, leucine_mg: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Sodio (mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.sodium_mg}
                  onChange={(e) => setFormData({ ...formData, sodium_mg: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Cognitivo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Colina (mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.choline_mg}
                  onChange={(e) => setFormData({ ...formData, choline_mg: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Hormonal</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Zinc (mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.zinc_mg}
                  onChange={(e) => setFormData({ ...formData, zinc_mg: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Magnesio (mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.magnesium_mg}
                  onChange={(e) => setFormData({ ...formData, magnesium_mg: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Vitamina D3 (IU)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vit_d3_iu}
                  onChange={(e) => setFormData({ ...formData, vit_d3_iu: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Inflamación</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Omega-3 Total (g)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.omega_3_total_g}
                  onChange={(e) => setFormData({ ...formData, omega_3_total_g: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Polifenoles (mg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.polyphenols_total_mg}
                  onChange={(e) => setFormData({ ...formData, polyphenols_total_mg: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-dark-hover border border-dark-border rounded-lg focus:outline-none focus:border-primary text-white"
                  min="0"
                />
              </div>
            </div>
          </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 px-4 bg-dark-hover/80 hover:bg-dark-border border border-dark-border/50 hover:border-dark-border text-white font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex-1 py-3.5 px-4 bg-gradient-to-r from-primary to-orange-500 hover:from-primary-hover hover:to-orange-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">{loading ? 'Guardando...' : 'Agregar Alimento'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
