import { X, Zap, Brain, Activity, Flame } from 'lucide-react'
import { useEffect } from 'react'

interface FoodDetailsFullModalProps {
  data: any
  isOpen: boolean
  onClose: () => void
}

export function FoodDetailsFullModal({ data, isOpen, onClose }: FoodDetailsFullModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !data) return null

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-dark-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-dark-card border-b border-dark-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{foodName}</h2>
                {quantity > 0 && (
                  <p className="text-sm text-dark-muted">{quantity}g</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-dark-bg hover:bg-dark-border transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 text-dark-muted" />
            </button>
          </div>

          {/* Macros destacados */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="bg-primary/10 rounded-lg p-2 text-center border border-primary/20">
              <p className="text-xs text-dark-muted">Calorías</p>
              <p className="text-lg font-bold text-primary">{calories}</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2 text-center border border-blue-500/20">
              <p className="text-xs text-dark-muted">Proteína</p>
              <p className="text-sm font-semibold text-blue-400">{protein}g</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/20">
              <p className="text-xs text-dark-muted">Carbos</p>
              <p className="text-sm font-semibold text-emerald-400">{carbs}g</p>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-2 text-center border border-amber-500/20">
              <p className="text-xs text-dark-muted">Grasas</p>
              <p className="text-sm font-semibold text-amber-400">{fat}g</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Grupo 1 - MOTOR */}
          {Object.keys(motor).length > 0 && (
            <NutrientGroup
              title="Grupo Motor (Energía & Músculo)"
              icon={<Zap className="w-5 h-5 text-blue-400" />}
              color="blue"
            >
              {motor.fiber_g > 0 && <DetailRow label="Fibra" value={motor.fiber_g} unit="g" />}
              {motor.sugar_g > 0 && <DetailRow label="Azúcares" value={motor.sugar_g} unit="g" />}
              {motor.water_ml > 0 && <DetailRow label="Agua" value={motor.water_ml} unit="ml" />}

              {motor.electrolytes && (
                <SubGroup title="Electrolitos" color="blue">
                  {motor.electrolytes.sodium_mg > 0 && <DetailRow label="Sodio" value={motor.electrolytes.sodium_mg} unit="mg" small />}
                  {motor.electrolytes.potassium_mg > 0 && <DetailRow label="Potasio" value={motor.electrolytes.potassium_mg} unit="mg" small />}
                  {motor.electrolytes.chloride_mg > 0 && <DetailRow label="Cloruro" value={motor.electrolytes.chloride_mg} unit="mg" small />}
                </SubGroup>
              )}

              {motor.aminos_muscle && Object.values(motor.aminos_muscle).some((v: any) => v > 0) && (
                <SubGroup title="Aminoácidos (Músculo)" color="blue">
                  {motor.aminos_muscle.leucine_mg > 0 && <DetailRow label="Leucina" value={motor.aminos_muscle.leucine_mg} unit="mg" small />}
                  {motor.aminos_muscle.isoleucine_mg > 0 && <DetailRow label="Isoleucina" value={motor.aminos_muscle.isoleucine_mg} unit="mg" small />}
                  {motor.aminos_muscle.valine_mg > 0 && <DetailRow label="Valina" value={motor.aminos_muscle.valine_mg} unit="mg" small />}
                  {motor.aminos_muscle.lysine_mg > 0 && <DetailRow label="Lisina" value={motor.aminos_muscle.lysine_mg} unit="mg" small />}
                  {motor.aminos_muscle.methionine_mg > 0 && <DetailRow label="Metionina" value={motor.aminos_muscle.methionine_mg} unit="mg" small />}
                  {motor.aminos_muscle.threonine_mg > 0 && <DetailRow label="Treonina" value={motor.aminos_muscle.threonine_mg} unit="mg" small />}
                </SubGroup>
              )}

              {motor.structure_minerals && Object.values(motor.structure_minerals).some((v: any) => v > 0) && (
                <SubGroup title="Minerales Estructurales" color="blue">
                  {motor.structure_minerals.iron_mg > 0 && <DetailRow label="Hierro" value={motor.structure_minerals.iron_mg} unit="mg" small />}
                  {motor.structure_minerals.zinc_mg > 0 && <DetailRow label="Zinc" value={motor.structure_minerals.zinc_mg} unit="mg" small />}
                  {motor.structure_minerals.magnesium_mg > 0 && <DetailRow label="Magnesio" value={motor.structure_minerals.magnesium_mg} unit="mg" small />}
                </SubGroup>
              )}
            </NutrientGroup>
          )}

          {/* Grupo 2 - COGNITIVO */}
          {Object.keys(cognitive).length > 0 && (
            <NutrientGroup
              title="Grupo Cognitivo (Cerebro)"
              icon={<Brain className="w-5 h-5 text-purple-400" />}
              color="purple"
            >
              {cognitive.aminos_brain && Object.values(cognitive.aminos_brain).some((v: any) => v > 0) && (
                <SubGroup title="Aminoácidos (Cerebro)" color="purple">
                  {cognitive.aminos_brain.tryptophan_mg > 0 && <DetailRow label="Triptófano" value={cognitive.aminos_brain.tryptophan_mg} unit="mg" small />}
                  {cognitive.aminos_brain.phenylalanine_mg > 0 && <DetailRow label="Fenilalanina" value={cognitive.aminos_brain.phenylalanine_mg} unit="mg" small />}
                  {cognitive.aminos_brain.tyrosine_mg > 0 && <DetailRow label="Tirosina" value={cognitive.aminos_brain.tyrosine_mg} unit="mg" small />}
                  {cognitive.aminos_brain.histidine_mg > 0 && <DetailRow label="Histidina" value={cognitive.aminos_brain.histidine_mg} unit="mg" small />}
                </SubGroup>
              )}

              {cognitive.neuro_others && Object.values(cognitive.neuro_others).some((v: any) => v > 0) && (
                <SubGroup title="Neuronutrientes" color="purple">
                  {cognitive.neuro_others.taurine_mg > 0 && <DetailRow label="Taurina" value={cognitive.neuro_others.taurine_mg} unit="mg" small />}
                  {cognitive.neuro_others.choline_mg > 0 && <DetailRow label="Colina" value={cognitive.neuro_others.choline_mg} unit="mg" small />}
                  {cognitive.neuro_others.creatine_mg > 0 && <DetailRow label="Creatina" value={cognitive.neuro_others.creatine_mg} unit="mg" small />}
                </SubGroup>
              )}

              {cognitive.energy_vitamins && Object.values(cognitive.energy_vitamins).some((v: any) => v > 0) && (
                <SubGroup title="Vitaminas B (Energía)" color="purple">
                  {cognitive.energy_vitamins.vit_b1_thiamin_mg > 0 && <DetailRow label="B1 (Tiamina)" value={cognitive.energy_vitamins.vit_b1_thiamin_mg} unit="mg" small />}
                  {cognitive.energy_vitamins.vit_b2_riboflavin_mg > 0 && <DetailRow label="B2 (Riboflavina)" value={cognitive.energy_vitamins.vit_b2_riboflavin_mg} unit="mg" small />}
                  {cognitive.energy_vitamins.vit_b3_niacin_mg > 0 && <DetailRow label="B3 (Niacina)" value={cognitive.energy_vitamins.vit_b3_niacin_mg} unit="mg" small />}
                  {cognitive.energy_vitamins.vit_b6_mg > 0 && <DetailRow label="B6" value={cognitive.energy_vitamins.vit_b6_mg} unit="mg" small />}
                  {cognitive.energy_vitamins.folate_mcg > 0 && <DetailRow label="B9 (Folato)" value={cognitive.energy_vitamins.folate_mcg} unit="mcg" small />}
                  {cognitive.energy_vitamins.vit_b12_mcg > 0 && <DetailRow label="B12" value={cognitive.energy_vitamins.vit_b12_mcg} unit="mcg" small />}
                  {cognitive.energy_vitamins.vit_c_mg > 0 && <DetailRow label="Vitamina C" value={cognitive.energy_vitamins.vit_c_mg} unit="mg" small />}
                </SubGroup>
              )}
            </NutrientGroup>
          )}

          {/* Grupo 3 - HORMONAL */}
          {Object.keys(hormonal).length > 0 && (
            <NutrientGroup
              title="Grupo Hormonal (Tiroides & Huesos)"
              icon={<Activity className="w-5 h-5 text-green-400" />}
              color="green"
            >
              {hormonal.thyroid_insulin && Object.values(hormonal.thyroid_insulin).some((v: any) => v > 0) && (
                <SubGroup title="Tiroides & Insulina" color="green">
                  {hormonal.thyroid_insulin.zinc_mg > 0 && <DetailRow label="Zinc" value={hormonal.thyroid_insulin.zinc_mg} unit="mg" small />}
                  {hormonal.thyroid_insulin.magnesium_mg > 0 && <DetailRow label="Magnesio" value={hormonal.thyroid_insulin.magnesium_mg} unit="mg" small />}
                  {hormonal.thyroid_insulin.selenium_mcg > 0 && <DetailRow label="Selenio" value={hormonal.thyroid_insulin.selenium_mcg} unit="mcg" small />}
                  {hormonal.thyroid_insulin.chromium_mcg > 0 && <DetailRow label="Cromo" value={hormonal.thyroid_insulin.chromium_mcg} unit="mcg" small />}
                  {hormonal.thyroid_insulin.iodine_mcg > 0 && <DetailRow label="Yodo" value={hormonal.thyroid_insulin.iodine_mcg} unit="mcg" small />}
                  {hormonal.thyroid_insulin.manganese_mg > 0 && <DetailRow label="Manganeso" value={hormonal.thyroid_insulin.manganese_mg} unit="mg" small />}
                </SubGroup>
              )}

              {hormonal.liposolubles && Object.values(hormonal.liposolubles).some((v: any) => v > 0) && (
                <SubGroup title="Vitaminas Liposolubles" color="green">
                  {hormonal.liposolubles.vit_a_mcg > 0 && <DetailRow label="Vitamina A" value={hormonal.liposolubles.vit_a_mcg} unit="mcg" small />}
                  {hormonal.liposolubles.vit_d3_iu > 0 && <DetailRow label="Vitamina D3" value={hormonal.liposolubles.vit_d3_iu} unit="IU" small />}
                  {hormonal.liposolubles.vit_e_iu > 0 && <DetailRow label="Vitamina E" value={hormonal.liposolubles.vit_e_iu} unit="IU" small />}
                  {hormonal.liposolubles.vit_k1_mcg > 0 && <DetailRow label="Vitamina K1" value={hormonal.liposolubles.vit_k1_mcg} unit="mcg" small />}
                  {hormonal.liposolubles.vit_k2_mcg > 0 && <DetailRow label="Vitamina K2" value={hormonal.liposolubles.vit_k2_mcg} unit="mcg" small />}
                </SubGroup>
              )}

              {hormonal.structure && Object.values(hormonal.structure).some((v: any) => v > 0) && (
                <SubGroup title="Estructura Ósea" color="green">
                  {hormonal.structure.calcium_mg > 0 && <DetailRow label="Calcio" value={hormonal.structure.calcium_mg} unit="mg" small />}
                  {hormonal.structure.phosphorus_mg > 0 && <DetailRow label="Fósforo" value={hormonal.structure.phosphorus_mg} unit="mg" small />}
                  {hormonal.structure.copper_mg > 0 && <DetailRow label="Cobre" value={hormonal.structure.copper_mg} unit="mg" small />}
                  {hormonal.structure.iron_mg > 0 && <DetailRow label="Hierro" value={hormonal.structure.iron_mg} unit="mg" small />}
                </SubGroup>
              )}
            </NutrientGroup>
          )}

          {/* Grupo 4 - INFLAMACIÓN */}
          {Object.keys(inflammation).length > 0 && (
            <NutrientGroup
              title="Grupo Inflamación (Omega & Antioxidantes)"
              icon={<Flame className="w-5 h-5 text-orange-400" />}
              color="orange"
            >
              {inflammation.omega && Object.values(inflammation.omega).some((v: any) => v > 0) && (
                <SubGroup title="Perfil Omega" color="orange">
                  {inflammation.omega.omega_3_total_mg > 0 && <DetailRow label="Omega-3 Total" value={inflammation.omega.omega_3_total_mg} unit="mg" small />}
                  {inflammation.omega.epa_dha_mg > 0 && <DetailRow label="EPA + DHA" value={inflammation.omega.epa_dha_mg} unit="mg" small />}
                  {inflammation.omega.omega_6_mg > 0 && <DetailRow label="Omega-6" value={inflammation.omega.omega_6_mg} unit="mg" small />}
                </SubGroup>
              )}

              {inflammation.sat_fats && Object.values(inflammation.sat_fats).some((v: any) => v > 0) && (
                <SubGroup title="Perfil Lipídico" color="orange">
                  {inflammation.sat_fats.saturated_g > 0 && <DetailRow label="Grasas Saturadas" value={inflammation.sat_fats.saturated_g} unit="g" small />}
                  {inflammation.sat_fats.monounsaturated_g > 0 && <DetailRow label="Monoinsaturadas" value={inflammation.sat_fats.monounsaturated_g} unit="g" small />}
                  {inflammation.sat_fats.polyunsaturated_g > 0 && <DetailRow label="Poliinsaturadas" value={inflammation.sat_fats.polyunsaturated_g} unit="g" small />}
                  {inflammation.sat_fats.trans_fat_g > 0 && <DetailRow label="Grasas Trans" value={inflammation.sat_fats.trans_fat_g} unit="g" small />}
                  {inflammation.sat_fats.cholesterol_mg > 0 && <DetailRow label="Colesterol" value={inflammation.sat_fats.cholesterol_mg} unit="mg" small />}
                </SubGroup>
              )}

              {inflammation.bioactives && Object.values(inflammation.bioactives).some((v: any) => v > 0) && (
                <SubGroup title="Compuestos Bioactivos" color="orange">
                  {inflammation.bioactives.polyphenols_total_mg > 0 && <DetailRow label="Polifenoles" value={inflammation.bioactives.polyphenols_total_mg} unit="mg" small />}
                  {inflammation.bioactives.anthocyanins_mg > 0 && <DetailRow label="Antocianinas" value={inflammation.bioactives.anthocyanins_mg} unit="mg" small />}
                  {inflammation.bioactives.quercetin_mg > 0 && <DetailRow label="Quercetina" value={inflammation.bioactives.quercetin_mg} unit="mg" small />}
                  {inflammation.bioactives.resveratrol_mg > 0 && <DetailRow label="Resveratrol" value={inflammation.bioactives.resveratrol_mg} unit="mg" small />}
                  {inflammation.bioactives.curcumin_mg > 0 && <DetailRow label="Curcumina" value={inflammation.bioactives.curcumin_mg} unit="mg" small />}
                </SubGroup>
              )}
            </NutrientGroup>
          )}
        </div>
      </div>
    </div>
  )
}

function NutrientGroup({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className={`bg-${color}-500/5 border border-${color}-500/20 rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function SubGroup({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`mt-2 pl-3 border-l-2 border-${color}-400/30`}>
      <p className={`text-xs font-medium text-${color}-300 mb-1`}>{title}</p>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

function DetailRow({ label, value, unit, small }: { label: string; value: number; unit: string; small?: boolean }) {
  const displayValue = value.toFixed(value < 10 ? 2 : value < 100 ? 1 : 0)

  return (
    <div className={`flex items-center justify-between ${small ? 'py-0.5' : 'py-1'} text-${small ? 'xs' : 'sm'}`}>
      <span className="text-dark-muted">{label}</span>
      <span className="font-medium text-white">
        {displayValue} <span className="text-dark-muted/70">{unit}</span>
      </span>
    </div>
  )
}
