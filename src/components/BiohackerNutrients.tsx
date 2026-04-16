import { Brain, Zap, Shield, Activity, Flame, Sparkles } from 'lucide-react'
import { useNutritionalStandards } from '../hooks/useNutritionalStandards'

interface BiohackerNutrientsProps {
  nutrients: {
    choline_mg: number
    anthocyanins_mg: number
    copper_mg: number
    vitamin_e_iu: number
    vitamin_k1_mcg: number
    probiotics_cfu: number
    omega_3_mg: number
    omega_6_mg: number
  }
  targets?: {
    choline_mg?: number
    anthocyanins_mg?: number
    copper_mg?: number
    vitamin_e_iu?: number
    vitamin_k1_mcg?: number
    probiotics_cfu?: number
    omega_3_mg?: number
    omega_6_mg?: number
  }
}

interface NutrientItem {
  name: string
  value: number
  target: number      // ODI optimal target
  rdaTarget?: number  // RDA minimum target
  unit: string
  description: string
  format?: (val: number) => string
}

export function BiohackerNutrients({ nutrients, targets }: BiohackerNutrientsProps) {
  const { getOptimalTarget, loading } = useNutritionalStandards()

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400"></div>
        </div>
      </div>
    )
  }

  const defaultTargets = {
    choline_mg: getOptimalTarget('choline_mg') || 1000,
    anthocyanins_mg: getOptimalTarget('anthocyanins_mg') || 200,
    copper_mg: getOptimalTarget('copper_mg') || 2,
    vitamin_e_iu: getOptimalTarget('vit_e_iu') || 400,
    vitamin_k1_mcg: getOptimalTarget('vitamin_k1_mcg') || 200,
    probiotics_cfu: 10000000000,
    omega_3_mg: getOptimalTarget('omega_3_total_g') * 1000 || 4000,
    omega_6_mg: getOptimalTarget('omega_6_g') * 1000 || 5000,
  }

  const finalTargets = { ...defaultTargets, ...targets }

  // Calculate Omega-3 to Omega-6 ratio (optimal is 1:1 to 1:4)
  const omegaRatio = nutrients.omega_6_mg > 0 ? nutrients.omega_6_mg / nutrients.omega_3_mg : 0
  const isOmegaBalanced = omegaRatio >= 1 && omegaRatio <= 4

  const items = [
    {
      category: 'Cerebro & Cognición',
      icon: Brain,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      glowColor: 'shadow-purple-500/50',
      textColor: 'text-purple-400',
      nutrients: [
        {
          name: 'Colina',
          value: nutrients.choline_mg,
          target: finalTargets.choline_mg,
          unit: 'mg',
          description: 'Memoria y acetilcolina',
        },
        {
          name: 'Antocianinas',
          value: nutrients.anthocyanins_mg,
          target: finalTargets.anthocyanins_mg,
          unit: 'mg',
          description: 'Limpieza neuronal',
        },
      ],
    },
    {
      category: 'Energía Mitocondrial',
      icon: Zap,
      gradient: 'from-amber-500 via-yellow-500 to-orange-500',
      glowColor: 'shadow-yellow-500/50',
      textColor: 'text-yellow-400',
      nutrients: [
        {
          name: 'Cobre',
          value: nutrients.copper_mg,
          target: finalTargets.copper_mg,
          unit: 'mg',
          description: 'Producción de ATP',
        },
        {
          name: 'Vitamina E',
          value: nutrients.vitamin_e_iu,
          target: finalTargets.vitamin_e_iu,
          unit: 'IU',
          description: 'Protección celular',
        },
      ],
    },
    {
      category: 'Perfil Omega (Antiinflamatorio)',
      icon: Flame,
      gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
      glowColor: 'shadow-cyan-500/50',
      textColor: 'text-cyan-400',
      nutrients: [
        {
          name: 'Omega-3',
          value: nutrients.omega_3_mg,
          target: finalTargets.omega_3_mg,
          unit: 'mg',
          description: 'EPA/DHA antiinflamatorio',
        },
        {
          name: 'Omega-6',
          value: nutrients.omega_6_mg,
          target: finalTargets.omega_6_mg,
          unit: 'mg',
          description: 'Balance Omega-6',
        },
      ],
    },
    {
      category: 'Coagulación & Huesos',
      icon: Shield,
      gradient: 'from-green-400 via-emerald-500 to-teal-500',
      glowColor: 'shadow-green-500/50',
      textColor: 'text-green-400',
      nutrients: [
        {
          name: 'Vitamina K1',
          value: nutrients.vitamin_k1_mcg,
          target: finalTargets.vitamin_k1_mcg,
          unit: 'mcg',
          description: 'Coagulación sanguínea',
        },
      ],
    },
    {
      category: 'Microbiota Intestinal',
      icon: Activity,
      gradient: 'from-blue-400 via-sky-500 to-cyan-500',
      glowColor: 'shadow-blue-500/50',
      textColor: 'text-blue-400',
      nutrients: [
        {
          name: 'Probióticos',
          value: nutrients.probiotics_cfu,
          target: finalTargets.probiotics_cfu,
          unit: 'CFU',
          description: 'Salud intestinal',
          format: (val: number) => {
            if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`
            if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
            return val.toString()
          },
        },
      ],
    },
  ]

  return (
    <div className="relative bg-dark-card border border-dark-border rounded-2xl p-6 overflow-hidden group hover:border-dark-border/80 transition-colors duration-300">
      <div className="relative z-10">
        {/* Header section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Nutrientes Biohacker</h3>
              <p className="text-sm text-dark-muted">Optimización Avanzada</p>
            </div>
          </div>
        </div>

        {/* Omega Ratio Indicator */}
        {nutrients.omega_3_mg > 0 && nutrients.omega_6_mg > 0 && (
          <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${
            isOmegaBalanced
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-orange-500/10 border-orange-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className={`w-5 h-5 ${isOmegaBalanced ? 'text-green-400' : 'text-orange-400'}`} />
                <div>
                  <p className="text-sm font-semibold text-white">Ratio Omega-6:Omega-3</p>
                  <p className="text-xs text-dark-muted">
                    {isOmegaBalanced ? '¡Balance antiinflamatorio óptimo!' : 'Aumenta tu Omega-3 para mejor balance'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${isOmegaBalanced ? 'text-green-400' : 'text-orange-400'}`}>
                  {omegaRatio.toFixed(1)}:1
                </p>
                <p className="text-xs text-dark-muted">Óptimo: 1:1 - 4:1</p>
              </div>
            </div>
          </div>
        )}

        {/* Nutrient categories grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const Icon = item.icon

            // Calculate category completion percentage
            const categoryPercentage = item.nutrients.reduce((sum, nutrient) => {
              return sum + (nutrient.value / nutrient.target) * 100
            }, 0) / item.nutrients.length

            return (
              <div
                key={item.category}
                className="relative bg-dark-bg/50 backdrop-blur-sm border border-dark-border/50 rounded-xl p-4 hover:border-dark-border transition-all duration-300 overflow-hidden"
              >
                {/* Category gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-5`}></div>

                {/* Header with icon and category name */}
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} ${item.glowColor} shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">{item.category}</h4>
                  </div>
                  <span className={`text-xs font-bold ${item.textColor}`}>
                    {categoryPercentage.toFixed(0)}%
                  </span>
                </div>

                {/* Individual nutrients */}
                <div className="relative z-10 space-y-3">
                  {item.nutrients.map((nutrient: NutrientItem) => {
                    const percentage = (nutrient.value / nutrient.target) * 100
                    const isGood = percentage >= 50 && percentage < 100
                    const isExcellent = percentage >= 100

                    const statusColor = isExcellent
                      ? 'text-green-400'
                      : isGood
                      ? 'text-yellow-400'
                      : 'text-red-400'

                    const barColor = isExcellent
                      ? 'bg-green-500'
                      : isGood
                      ? 'bg-yellow-500'
                      : 'bg-red-500'

                    const displayValue = nutrient.format
                      ? nutrient.format(nutrient.value)
                      : nutrient.value.toFixed(1)

                    return (
                      <div key={nutrient.name} className="bg-dark-card/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-white">
                              {nutrient.name}
                            </span>
                            <p className="text-xs text-dark-muted">{nutrient.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold ${statusColor}`}>
                            {displayValue} {nutrient.unit}
                          </span>
                          <span className="text-xs text-dark-muted">
                            /{nutrient.format && nutrient.target >= 1000000000
                              ? nutrient.format(nutrient.target)
                              : nutrient.target} {nutrient.unit}
                          </span>
                        </div>
                        <div className="w-full bg-dark-hover rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all duration-300`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-right mt-1">
                          <span className={`text-xs font-medium ${statusColor}`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
