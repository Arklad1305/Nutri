import { useState } from 'react'
import { Zap, Eye } from 'lucide-react'
import { FoodDetailsFullModal } from './FoodDetailsFullModal'

interface CompactFoodCardProps {
  data: any
}

export function CompactFoodCard({ data }: CompactFoodCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!data) return null

  const foodName = data.food_name || data.name || 'Alimento'
  const calories = data.calories || 0
  const protein = data.protein_g || 0
  const carbs = data.carbs_g || 0
  const fat = data.fat_g || 0
  const quantity = data.quantity_g || 0

  const motor = data.nutritional_matrix?.motor || {}
  const cognitive = data.nutritional_matrix?.cognitive || {}
  const hormonal = data.nutritional_matrix?.hormonal || {}
  const inflammation = data.nutritional_matrix?.inflammation || {}

  const hasDetailedData = Object.keys(motor).length > 0 ||
                          Object.keys(cognitive).length > 0 ||
                          Object.keys(hormonal).length > 0 ||
                          Object.keys(inflammation).length > 0

  return (
    <>
      <div className="mt-3 bg-dark-card/50 rounded-lg border border-dark-border overflow-hidden">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{foodName}</h4>
                {quantity > 0 && (
                  <p className="text-xs text-dark-muted">{quantity}g</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{calories}</p>
              <p className="text-xs text-dark-muted">kcal</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-dark-bg/50 rounded-lg p-2 text-center">
              <p className="text-xs text-dark-muted">Proteína</p>
              <p className="text-sm font-semibold text-blue-400">{protein}g</p>
            </div>
            <div className="bg-dark-bg/50 rounded-lg p-2 text-center">
              <p className="text-xs text-dark-muted">Carbos</p>
              <p className="text-sm font-semibold text-green-400">{carbs}g</p>
            </div>
            <div className="bg-dark-bg/50 rounded-lg p-2 text-center">
              <p className="text-xs text-dark-muted">Grasas</p>
              <p className="text-sm font-semibold text-yellow-400">{fat}g</p>
            </div>
          </div>

          {hasDetailedData && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 rounded-lg transition-colors text-sm text-primary font-medium"
            >
              <Eye className="w-4 h-4" />
              Ver Detalle Completo
            </button>
          )}
        </div>
      </div>

      <FoodDetailsFullModal
        data={data}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
