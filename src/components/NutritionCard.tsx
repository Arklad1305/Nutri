import { Beef, Wheat, Droplet, Activity } from 'lucide-react'

interface MacroData {
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sugar_g?: number
}

interface MicroData {
  vitamin_a_iu?: number
  vitamin_a_mcg?: number
  vitamin_c_mg?: number
  vitamin_d_mcg?: number
  vitamin_e_mg?: number
  vitamin_k_mcg?: number
  calcium_mg?: number
  iron_mg?: number
  magnesium_mg?: number
  potassium_mg?: number
  sodium_mg?: number
  zinc_mg?: number
}

interface NutritionData {
  name?: string
  calories?: number
  macros?: MacroData
  micros?: MicroData
}

interface NutritionCardProps {
  data: NutritionData
}

export function NutritionCard({ data }: NutritionCardProps) {
  const { name, calories, macros, micros } = data

  if (!name && !calories && !macros && !micros) {
    return null
  }

  const hasMacros = macros && (macros.protein_g || macros.carbs_g || macros.fat_g)
  const hasMicros = micros && Object.values(micros).some(v => v && v > 0)

  const totalMacros = hasMacros
    ? (macros.protein_g || 0) + (macros.carbs_g || 0) + (macros.fat_g || 0)
    : 0

  const proteinPercentage = totalMacros > 0 ? ((macros?.protein_g || 0) / totalMacros) * 100 : 0
  const carbsPercentage = totalMacros > 0 ? ((macros?.carbs_g || 0) / totalMacros) * 100 : 0
  const fatPercentage = totalMacros > 0 ? ((macros?.fat_g || 0) / totalMacros) * 100 : 0

  return (
    <div className="mt-3 bg-gradient-to-br from-dark-card to-dark-bg rounded-xl border border-dark-border overflow-hidden">
      {(name || calories) && (
        <div className="bg-dark-card/80 px-4 py-3 border-b border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              {name && (
                <h4 className="text-white font-semibold text-base">{name}</h4>
              )}
            </div>
            {calories && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 font-bold text-lg">{calories}</span>
                <span className="text-dark-muted text-xs">kcal</span>
              </div>
            )}
          </div>
        </div>
      )}

      {hasMacros && (
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-dark-muted uppercase tracking-wide">
            Macronutrientes
          </p>

          <div className="space-y-3">
            {macros.protein_g !== undefined && macros.protein_g > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Beef className="w-4 h-4 text-red-400" />
                    <span className="text-white font-medium">Proteína</span>
                  </div>
                  <span className="text-red-400 font-semibold">{macros.protein_g}g</span>
                </div>
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                    style={{ width: `${proteinPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {macros.carbs_g !== undefined && macros.carbs_g > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium">Carbohidratos</span>
                  </div>
                  <span className="text-yellow-400 font-semibold">{macros.carbs_g}g</span>
                </div>
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                    style={{ width: `${carbsPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {macros.fat_g !== undefined && macros.fat_g > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-green-400" />
                    <span className="text-white font-medium">Grasas</span>
                  </div>
                  <span className="text-green-400 font-semibold">{macros.fat_g}g</span>
                </div>
                <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                    style={{ width: `${fatPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {(macros.fiber_g !== undefined && macros.fiber_g > 0) && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-dark-muted">Fibra</span>
                <span className="text-white font-medium">{macros.fiber_g}g</span>
              </div>
            )}

            {(macros.sugar_g !== undefined && macros.sugar_g > 0) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-dark-muted">Azúcar</span>
                <span className="text-white font-medium">{macros.sugar_g}g</span>
              </div>
            )}
          </div>
        </div>
      )}

      {hasMicros && (
        <div className="p-4 pt-0">
          <p className="text-xs font-semibold text-dark-muted uppercase tracking-wide mb-3">
            Micronutrientes
          </p>

          <div className="grid grid-cols-2 gap-2">
            {(micros.vitamin_c_mg !== undefined && micros.vitamin_c_mg > 0) && (
              <div className="bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border/50">
                <p className="text-xs text-dark-muted">Vitamina C</p>
                <p className="text-sm text-white font-semibold">{micros.vitamin_c_mg}mg</p>
              </div>
            )}

            {(micros.vitamin_a_mcg !== undefined && micros.vitamin_a_mcg > 0) && (
              <div className="bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border/50">
                <p className="text-xs text-dark-muted">Vitamina A</p>
                <p className="text-sm text-white font-semibold">{micros.vitamin_a_mcg}mcg</p>
              </div>
            )}

            {(micros.vitamin_a_iu !== undefined && micros.vitamin_a_iu > 0 && !micros.vitamin_a_mcg) && (
              <div className="bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border/50">
                <p className="text-xs text-dark-muted">Vitamina A</p>
                <p className="text-sm text-white font-semibold">{micros.vitamin_a_iu}IU</p>
              </div>
            )}

            {(micros.vitamin_d_mcg !== undefined && micros.vitamin_d_mcg > 0) && (
              <div className="bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border/50">
                <p className="text-xs text-dark-muted">Vitamina D</p>
                <p className="text-sm text-white font-semibold">{micros.vitamin_d_mcg}mcg</p>
              </div>
            )}

            {(micros.calcium_mg !== undefined && micros.calcium_mg > 0) && (
              <div className="bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border/50">
                <p className="text-xs text-dark-muted">Calcio</p>
                <p className="text-sm text-white font-semibold">{micros.calcium_mg}mg</p>
              </div>
            )}

            {(micros.iron_mg !== undefined && micros.iron_mg > 0) && (
              <div className="bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border/50">
                <p className="text-xs text-dark-muted">Hierro</p>
                <p className="text-sm text-white font-semibold">{micros.iron_mg}mg</p>
              </div>
            )}

            {(micros.potassium_mg !== undefined && micros.potassium_mg > 0) && (
              <div className="bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border/50">
                <p className="text-xs text-dark-muted">Potasio</p>
                <p className="text-sm text-white font-semibold">{micros.potassium_mg}mg</p>
              </div>
            )}

            {(micros.magnesium_mg !== undefined && micros.magnesium_mg > 0) && (
              <div className="bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border/50">
                <p className="text-xs text-dark-muted">Magnesio</p>
                <p className="text-sm text-white font-semibold">{micros.magnesium_mg}mg</p>
              </div>
            )}

            {(micros.zinc_mg !== undefined && micros.zinc_mg > 0) && (
              <div className="bg-dark-bg/50 rounded-lg px-3 py-2 border border-dark-border/50">
                <p className="text-xs text-dark-muted">Zinc</p>
                <p className="text-sm text-white font-semibold">{micros.zinc_mg}mg</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
