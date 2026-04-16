import { Flame, Drumstick, Wheat, Droplet } from 'lucide-react'

interface CompactNutritionCardProps {
  data: any
}

export function CompactNutritionCard({ data }: CompactNutritionCardProps) {
  if (!data) return null

  const foodName = data.food_name || data.name || 'Alimento'
  const calories = data.calories || 0

  const protein = data.protein_g || data.macros?.protein_g || 0
  const carbs = data.carbs_g || data.macros?.carbs_g || 0
  const fat = data.fat_g || data.macros?.fat_g || 0

  const motor = data.nutritional_matrix?.motor || {}
  const cognitive = data.nutritional_matrix?.cognitive || {}
  const hormonal = data.nutritional_matrix?.hormonal || {}
  const inflammation = data.nutritional_matrix?.inflammation || {}

  const micros = {
    vitamin_c_mg: cognitive.energy_vitamins?.vit_c_mg || data.micros?.vitamin_c_mg || 0,
    vitamin_d_mcg: hormonal.liposolubles?.vit_d3_iu ? (hormonal.liposolubles.vit_d3_iu / 40) : (data.micros?.vitamin_d_mcg || 0),
    calcium_mg: hormonal.structure?.calcium_mg || data.micros?.calcium_mg || 0,
    iron_mg: hormonal.structure?.iron_mg || motor.structure_minerals?.iron_mg || data.micros?.iron_mg || 0,
    magnesium_mg: data.magnesium_mg || hormonal.thyroid_insulin?.magnesium_mg || motor.structure_minerals?.magnesium_mg || data.micros?.magnesium_mg || 0,
    potassium_mg: motor.electrolytes?.potassium_mg || cognitive.electrolytes?.potassium_mg || data.micros?.potassium_mg || 0,
    zinc_mg: data.zinc_mg || hormonal.thyroid_insulin?.zinc_mg || motor.structure_minerals?.zinc_mg || data.micros?.zinc_mg || 0,
    omega3_g: (data.omega_3_total_g || (inflammation.omega?.omega_3_total_mg / 1000) || data.micros?.omega3_g || 0),
  }

  const relevantMicros = [
    { label: 'Vit C', value: micros.vitamin_c_mg, unit: 'mg', icon: '🍊', show: micros.vitamin_c_mg && micros.vitamin_c_mg > 5 },
    { label: 'Vit D', value: micros.vitamin_d_mcg, unit: 'µg', icon: '☀️', show: micros.vitamin_d_mcg && micros.vitamin_d_mcg > 0.5 },
    { label: 'Calcio', value: micros.calcium_mg, unit: 'mg', icon: '🦴', show: micros.calcium_mg && micros.calcium_mg > 20 },
    { label: 'Hierro', value: micros.iron_mg, unit: 'mg', icon: '🩸', show: micros.iron_mg && micros.iron_mg > 1 },
    { label: 'Magnesio', value: micros.magnesium_mg, unit: 'mg', icon: '⚡', show: micros.magnesium_mg && micros.magnesium_mg > 20 },
    { label: 'Potasio', value: micros.potassium_mg, unit: 'mg', icon: '💪', show: micros.potassium_mg && micros.potassium_mg > 100 },
    { label: 'Zinc', value: micros.zinc_mg, unit: 'mg', icon: '🛡️', show: micros.zinc_mg && micros.zinc_mg > 0.5 },
    { label: 'Omega-3', value: micros.omega3_g, unit: 'g', icon: '🐟', show: micros.omega3_g && micros.omega3_g > 0.1 },
  ].filter(m => m.show)

  return (
    <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-3 space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-white text-sm truncate">{foodName}</h4>
        <div className="flex items-center gap-1 text-xs font-semibold text-primary">
          <Flame className="w-3.5 h-3.5" />
          <span>{calories}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Drumstick className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] text-blue-200 uppercase tracking-wide">Proteína</span>
          </div>
          <p className="text-sm font-bold text-white">{protein}g</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Wheat className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-200 uppercase tracking-wide">Carbos</span>
          </div>
          <p className="text-sm font-bold text-white">{carbs}g</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Droplet className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-200 uppercase tracking-wide">Grasas</span>
          </div>
          <p className="text-sm font-bold text-white">{fat}g</p>
        </div>
      </div>

      {relevantMicros.length > 0 && (
        <div>
          <p className="text-[10px] text-dark-muted uppercase tracking-wide mb-2">Micronutrientes Destacados</p>
          <div className="flex flex-wrap gap-1.5">
            {relevantMicros.map((micro, index) => (
              <div
                key={index}
                className="bg-neon-400/5 border border-neon-400/20 rounded-md px-2 py-1 flex items-center gap-1.5"
              >
                <span className="text-xs">{micro.icon}</span>
                <span className="text-[10px] text-neon-200 font-medium">
                  {micro.label}
                </span>
                <span className="text-[10px] text-white font-bold">
                  {typeof micro.value === 'number' ? micro.value.toFixed(1) : micro.value}
                  {micro.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
