import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap, Brain, Activity, Flame } from 'lucide-react'

interface FoodNutritionDetailsProps {
  data: any
}

export function FoodNutritionDetails({ data }: FoodNutritionDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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
    <div className="mt-3 bg-dark-card/50 rounded-lg border border-dark-border overflow-hidden">
      {/* Resumen compacto siempre visible */}
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

        {/* Macros */}
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

        {/* Botón Ver Detalle */}
        {hasDetailedData && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 bg-dark-bg/50 hover:bg-dark-bg rounded-lg transition-colors text-sm text-dark-muted hover:text-white"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ocultar Detalles
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Ver Detalles Completos
              </>
            )}
          </button>
        )}
      </div>

      {/* Detalles expandidos */}
      {isExpanded && hasDetailedData && (
        <div className="border-t border-dark-border p-4 space-y-4 bg-dark-bg/30">
          {/* Grupo 1 - MOTOR */}
          {Object.keys(motor).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <h5 className="text-sm font-semibold text-white">Grupo Motor (Energía & Músculo)</h5>
              </div>
              <div className="space-y-2">
                {motor.fiber_g > 0 && (
                  <DetailRow label="Fibra" value={motor.fiber_g} unit="g" />
                )}
                {motor.sugar_g > 0 && (
                  <DetailRow label="Azúcares" value={motor.sugar_g} unit="g" />
                )}
                {motor.water_ml > 0 && (
                  <DetailRow label="Agua" value={motor.water_ml} unit="ml" />
                )}

                {/* Electrolitos */}
                {motor.electrolytes && (
                  <>
                    {motor.electrolytes.sodium_mg > 0 && (
                      <DetailRow label="Sodio" value={motor.electrolytes.sodium_mg} unit="mg" />
                    )}
                    {motor.electrolytes.potassium_mg > 0 && (
                      <DetailRow label="Potasio" value={motor.electrolytes.potassium_mg} unit="mg" />
                    )}
                    {motor.electrolytes.chloride_mg > 0 && (
                      <DetailRow label="Cloruro" value={motor.electrolytes.chloride_mg} unit="mg" />
                    )}
                  </>
                )}

                {/* Aminoácidos Musculares */}
                {motor.aminos_muscle && Object.values(motor.aminos_muscle).some((v: any) => v > 0) && (
                  <div className="mt-2 pl-3 border-l-2 border-blue-400/30">
                    <p className="text-xs font-medium text-blue-300 mb-1">Aminoácidos (Músculo)</p>
                    {motor.aminos_muscle.leucine_mg > 0 && (
                      <DetailRow label="Leucina" value={motor.aminos_muscle.leucine_mg} unit="mg" small />
                    )}
                    {motor.aminos_muscle.isoleucine_mg > 0 && (
                      <DetailRow label="Isoleucina" value={motor.aminos_muscle.isoleucine_mg} unit="mg" small />
                    )}
                    {motor.aminos_muscle.valine_mg > 0 && (
                      <DetailRow label="Valina" value={motor.aminos_muscle.valine_mg} unit="mg" small />
                    )}
                    {motor.aminos_muscle.lysine_mg > 0 && (
                      <DetailRow label="Lisina" value={motor.aminos_muscle.lysine_mg} unit="mg" small />
                    )}
                    {motor.aminos_muscle.methionine_mg > 0 && (
                      <DetailRow label="Metionina" value={motor.aminos_muscle.methionine_mg} unit="mg" small />
                    )}
                    {motor.aminos_muscle.threonine_mg > 0 && (
                      <DetailRow label="Treonina" value={motor.aminos_muscle.threonine_mg} unit="mg" small />
                    )}
                  </div>
                )}

                {/* Minerales Estructurales */}
                {motor.structure_minerals && Object.values(motor.structure_minerals).some((v: any) => v > 0) && (
                  <div className="mt-2 pl-3 border-l-2 border-blue-400/30">
                    <p className="text-xs font-medium text-blue-300 mb-1">Minerales Estructurales</p>
                    {motor.structure_minerals.iron_mg > 0 && (
                      <DetailRow label="Hierro" value={motor.structure_minerals.iron_mg} unit="mg" small />
                    )}
                    {motor.structure_minerals.zinc_mg > 0 && (
                      <DetailRow label="Zinc" value={motor.structure_minerals.zinc_mg} unit="mg" small />
                    )}
                    {motor.structure_minerals.magnesium_mg > 0 && (
                      <DetailRow label="Magnesio" value={motor.structure_minerals.magnesium_mg} unit="mg" small />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grupo 2 - COGNITIVO */}
          {Object.keys(cognitive).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h5 className="text-sm font-semibold text-white">Grupo Cognitivo (Cerebro)</h5>
              </div>
              <div className="space-y-2">
                {/* Aminoácidos Cerebrales */}
                {cognitive.aminos_brain && Object.values(cognitive.aminos_brain).some((v: any) => v > 0) && (
                  <div className="pl-3 border-l-2 border-purple-400/30">
                    <p className="text-xs font-medium text-purple-300 mb-1">Aminoácidos (Cerebro)</p>
                    {cognitive.aminos_brain.tryptophan_mg > 0 && (
                      <DetailRow label="Triptófano" value={cognitive.aminos_brain.tryptophan_mg} unit="mg" small />
                    )}
                    {cognitive.aminos_brain.phenylalanine_mg > 0 && (
                      <DetailRow label="Fenilalanina" value={cognitive.aminos_brain.phenylalanine_mg} unit="mg" small />
                    )}
                    {cognitive.aminos_brain.tyrosine_mg > 0 && (
                      <DetailRow label="Tirosina" value={cognitive.aminos_brain.tyrosine_mg} unit="mg" small />
                    )}
                    {cognitive.aminos_brain.histidine_mg > 0 && (
                      <DetailRow label="Histidina" value={cognitive.aminos_brain.histidine_mg} unit="mg" small />
                    )}
                  </div>
                )}

                {/* Neuronutrientes */}
                {cognitive.neuro_others && Object.values(cognitive.neuro_others).some((v: any) => v > 0) && (
                  <div className="pl-3 border-l-2 border-purple-400/30">
                    <p className="text-xs font-medium text-purple-300 mb-1">Neuronutrientes</p>
                    {cognitive.neuro_others.taurine_mg > 0 && (
                      <DetailRow label="Taurina" value={cognitive.neuro_others.taurine_mg} unit="mg" small />
                    )}
                    {cognitive.neuro_others.choline_mg > 0 && (
                      <DetailRow label="Colina" value={cognitive.neuro_others.choline_mg} unit="mg" small />
                    )}
                    {cognitive.neuro_others.creatine_mg > 0 && (
                      <DetailRow label="Creatina" value={cognitive.neuro_others.creatine_mg} unit="mg" small />
                    )}
                  </div>
                )}

                {/* Vitaminas B */}
                {cognitive.energy_vitamins && Object.values(cognitive.energy_vitamins).some((v: any) => v > 0) && (
                  <div className="pl-3 border-l-2 border-purple-400/30">
                    <p className="text-xs font-medium text-purple-300 mb-1">Vitaminas B (Energía)</p>
                    {cognitive.energy_vitamins.vit_b1_thiamin_mg > 0 && (
                      <DetailRow label="B1 (Tiamina)" value={cognitive.energy_vitamins.vit_b1_thiamin_mg} unit="mg" small />
                    )}
                    {cognitive.energy_vitamins.vit_b2_riboflavin_mg > 0 && (
                      <DetailRow label="B2 (Riboflavina)" value={cognitive.energy_vitamins.vit_b2_riboflavin_mg} unit="mg" small />
                    )}
                    {cognitive.energy_vitamins.vit_b3_niacin_mg > 0 && (
                      <DetailRow label="B3 (Niacina)" value={cognitive.energy_vitamins.vit_b3_niacin_mg} unit="mg" small />
                    )}
                    {cognitive.energy_vitamins.vit_b6_mg > 0 && (
                      <DetailRow label="B6" value={cognitive.energy_vitamins.vit_b6_mg} unit="mg" small />
                    )}
                    {cognitive.energy_vitamins.folate_mcg > 0 && (
                      <DetailRow label="B9 (Folato)" value={cognitive.energy_vitamins.folate_mcg} unit="mcg" small />
                    )}
                    {cognitive.energy_vitamins.vit_b12_mcg > 0 && (
                      <DetailRow label="B12" value={cognitive.energy_vitamins.vit_b12_mcg} unit="mcg" small />
                    )}
                    {cognitive.energy_vitamins.vit_c_mg > 0 && (
                      <DetailRow label="Vitamina C" value={cognitive.energy_vitamins.vit_c_mg} unit="mg" small />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grupo 3 - HORMONAL */}
          {Object.keys(hormonal).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-400" />
                <h5 className="text-sm font-semibold text-white">Grupo Hormonal (Tiroides & Estructura Ósea)</h5>
              </div>
              <div className="space-y-2">
                {/* Tiroides/Insulina */}
                {hormonal.thyroid_insulin && Object.values(hormonal.thyroid_insulin).some((v: any) => v > 0) && (
                  <div className="pl-3 border-l-2 border-green-400/30">
                    <p className="text-xs font-medium text-green-300 mb-1">Tiroides & Insulina</p>
                    {hormonal.thyroid_insulin.zinc_mg > 0 && (
                      <DetailRow label="Zinc" value={hormonal.thyroid_insulin.zinc_mg} unit="mg" small />
                    )}
                    {hormonal.thyroid_insulin.magnesium_mg > 0 && (
                      <DetailRow label="Magnesio" value={hormonal.thyroid_insulin.magnesium_mg} unit="mg" small />
                    )}
                    {hormonal.thyroid_insulin.selenium_mcg > 0 && (
                      <DetailRow label="Selenio" value={hormonal.thyroid_insulin.selenium_mcg} unit="mcg" small />
                    )}
                    {hormonal.thyroid_insulin.chromium_mcg > 0 && (
                      <DetailRow label="Cromo" value={hormonal.thyroid_insulin.chromium_mcg} unit="mcg" small />
                    )}
                    {hormonal.thyroid_insulin.iodine_mcg > 0 && (
                      <DetailRow label="Yodo" value={hormonal.thyroid_insulin.iodine_mcg} unit="mcg" small />
                    )}
                    {hormonal.thyroid_insulin.manganese_mg > 0 && (
                      <DetailRow label="Manganeso" value={hormonal.thyroid_insulin.manganese_mg} unit="mg" small />
                    )}
                  </div>
                )}

                {/* Vitaminas Liposolubles */}
                {hormonal.liposolubles && Object.values(hormonal.liposolubles).some((v: any) => v > 0) && (
                  <div className="pl-3 border-l-2 border-green-400/30">
                    <p className="text-xs font-medium text-green-300 mb-1">Vitaminas Liposolubles</p>
                    {hormonal.liposolubles.vit_a_mcg > 0 && (
                      <DetailRow label="Vitamina A" value={hormonal.liposolubles.vit_a_mcg} unit="mcg" small />
                    )}
                    {hormonal.liposolubles.vit_d3_iu > 0 && (
                      <DetailRow label="Vitamina D3" value={hormonal.liposolubles.vit_d3_iu} unit="IU" small />
                    )}
                    {hormonal.liposolubles.vit_e_iu > 0 && (
                      <DetailRow label="Vitamina E" value={hormonal.liposolubles.vit_e_iu} unit="IU" small />
                    )}
                    {hormonal.liposolubles.vit_k1_mcg > 0 && (
                      <DetailRow label="Vitamina K1" value={hormonal.liposolubles.vit_k1_mcg} unit="mcg" small />
                    )}
                    {hormonal.liposolubles.vit_k2_mcg > 0 && (
                      <DetailRow label="Vitamina K2" value={hormonal.liposolubles.vit_k2_mcg} unit="mcg" small />
                    )}
                  </div>
                )}

                {/* Estructura Ósea */}
                {hormonal.structure && Object.values(hormonal.structure).some((v: any) => v > 0) && (
                  <div className="pl-3 border-l-2 border-green-400/30">
                    <p className="text-xs font-medium text-green-300 mb-1">Estructura Ósea</p>
                    {hormonal.structure.calcium_mg > 0 && (
                      <DetailRow label="Calcio" value={hormonal.structure.calcium_mg} unit="mg" small />
                    )}
                    {hormonal.structure.phosphorus_mg > 0 && (
                      <DetailRow label="Fósforo" value={hormonal.structure.phosphorus_mg} unit="mg" small />
                    )}
                    {hormonal.structure.copper_mg > 0 && (
                      <DetailRow label="Cobre" value={hormonal.structure.copper_mg} unit="mg" small />
                    )}
                    {hormonal.structure.iron_mg > 0 && (
                      <DetailRow label="Hierro" value={hormonal.structure.iron_mg} unit="mg" small />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grupo 4 - INFLAMACIÓN */}
          {Object.keys(inflammation).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h5 className="text-sm font-semibold text-white">Grupo Inflamación (Omega & Antioxidantes)</h5>
              </div>
              <div className="space-y-2">
                {/* Perfil Omega */}
                {inflammation.omega && Object.values(inflammation.omega).some((v: any) => v > 0) && (
                  <div className="pl-3 border-l-2 border-orange-400/30">
                    <p className="text-xs font-medium text-orange-300 mb-1">Perfil Omega</p>
                    {inflammation.omega.omega_3_total_mg > 0 && (
                      <DetailRow label="Omega-3 Total" value={inflammation.omega.omega_3_total_mg} unit="mg" small />
                    )}
                    {inflammation.omega.epa_dha_mg > 0 && (
                      <DetailRow label="EPA + DHA" value={inflammation.omega.epa_dha_mg} unit="mg" small />
                    )}
                    {inflammation.omega.omega_6_mg > 0 && (
                      <DetailRow label="Omega-6" value={inflammation.omega.omega_6_mg} unit="mg" small />
                    )}
                  </div>
                )}

                {/* Grasas Saturadas */}
                {inflammation.sat_fats && Object.values(inflammation.sat_fats).some((v: any) => v > 0) && (
                  <div className="pl-3 border-l-2 border-orange-400/30">
                    <p className="text-xs font-medium text-orange-300 mb-1">Perfil Lipídico</p>
                    {inflammation.sat_fats.saturated_g > 0 && (
                      <DetailRow label="Grasas Saturadas" value={inflammation.sat_fats.saturated_g} unit="g" small />
                    )}
                    {inflammation.sat_fats.monounsaturated_g > 0 && (
                      <DetailRow label="Monoinsaturadas" value={inflammation.sat_fats.monounsaturated_g} unit="g" small />
                    )}
                    {inflammation.sat_fats.polyunsaturated_g > 0 && (
                      <DetailRow label="Poliinsaturadas" value={inflammation.sat_fats.polyunsaturated_g} unit="g" small />
                    )}
                    {inflammation.sat_fats.trans_fat_g > 0 && (
                      <DetailRow label="Grasas Trans" value={inflammation.sat_fats.trans_fat_g} unit="g" small />
                    )}
                    {inflammation.sat_fats.cholesterol_mg > 0 && (
                      <DetailRow label="Colesterol" value={inflammation.sat_fats.cholesterol_mg} unit="mg" small />
                    )}
                  </div>
                )}

                {/* Bioactivos */}
                {inflammation.bioactives && Object.values(inflammation.bioactives).some((v: any) => v > 0) && (
                  <div className="pl-3 border-l-2 border-orange-400/30">
                    <p className="text-xs font-medium text-orange-300 mb-1">Compuestos Bioactivos</p>
                    {inflammation.bioactives.polyphenols_total_mg > 0 && (
                      <DetailRow label="Polifenoles" value={inflammation.bioactives.polyphenols_total_mg} unit="mg" small />
                    )}
                    {inflammation.bioactives.anthocyanins_mg > 0 && (
                      <DetailRow label="Antocianinas" value={inflammation.bioactives.anthocyanins_mg} unit="mg" small />
                    )}
                    {inflammation.bioactives.quercetin_mg > 0 && (
                      <DetailRow label="Quercetina" value={inflammation.bioactives.quercetin_mg} unit="mg" small />
                    )}
                    {inflammation.bioactives.resveratrol_mg > 0 && (
                      <DetailRow label="Resveratrol" value={inflammation.bioactives.resveratrol_mg} unit="mg" small />
                    )}
                    {inflammation.bioactives.curcumin_mg > 0 && (
                      <DetailRow label="Curcumina" value={inflammation.bioactives.curcumin_mg} unit="mg" small />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: number
  unit: string
  small?: boolean
}

function DetailRow({ label, value, unit, small }: DetailRowProps) {
  const displayValue = value.toFixed(value < 10 ? 2 : value < 100 ? 1 : 0)

  return (
    <div className={`flex items-center justify-between ${small ? 'py-0.5' : 'py-1'} text-${small ? 'xs' : 'sm'}`}>
      <span className="text-dark-muted">{label}</span>
      <span className="font-medium text-white">
        {displayValue} <span className="text-dark-muted">{unit}</span>
      </span>
    </div>
  )
}
