import { useState } from 'react'
import { ChefHat, Clock, Users, TrendingUp, ChevronDown, ChevronUp, Flame, X, Leaf } from 'lucide-react'

interface Ingredient {
  name: string
  amount: number | string
  unit: string
  notes?: string
  category?: string
}

interface NormalizedIngredient {
  name: string
  amount: string
  unit: string
  notes?: string
  category?: string
}

interface Instruction {
  step: number
  instruction: string
  time?: number
}

interface RecipeCardProps {
  recipe: {
    id: string
    title: string
    description: string
    ingredients: (string | Ingredient)[]
    instructions: (string | Instruction)[]
    targetNutrients: string[]
    createdAt: string
    prepTime?: number
    cookTime?: number
    servings?: number
    difficulty?: string
  }
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullRecipe, setShowFullRecipe] = useState(false)

  // Parser robusto que normaliza TODOS los ingredientes a un formato consistente
  const normalizeIngredient = (ing: string | Ingredient): NormalizedIngredient => {
    // Si ya es un objeto estructurado, normalízalo
    if (typeof ing === 'object' && ing !== null) {
      return {
        name: ing.name || 'Ingrediente',
        amount: String(ing.amount || ''),
        unit: ing.unit || '',
        notes: ing.notes,
        category: ing.category || detectCategory(ing.name)
      }
    }

    // Si es string, primero intentar parsearlo como JSON
    const text = String(ing).trim()

    // Detectar si es un JSON string y parsearlo
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text)
        if (parsed.name) {
          return {
            name: parsed.name || 'Ingrediente',
            amount: String(parsed.amount || ''),
            unit: parsed.unit || '',
            notes: parsed.notes,
            category: parsed.category || detectCategory(parsed.name)
          }
        }
      } catch (e) {
        // Si falla el parsing, continuar con el procesamiento de texto normal
      }
    }

    // Patrones comunes: "200g pollo", "1 taza arroz", "2 cucharadas aceite"
    const patterns = [
      /^(\d+\.?\d*)\s*(g|gr|gramos?|kg|ml|litros?|l|taza|cucharada|cdta|cdas?|unidades?|u)\s+(.+)$/i,
      /^(\d+\.?\d*)\s+(.+)$/,  // "2 huevos"
      /^(.+?)\s*\((\d+\.?\d*)\s*(g|gr|ml|kg|l|taza|cdta|cdas?)\)$/i,  // "Pollo (200g)"
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        if (pattern.source.includes('\\(')) {
          // Formato: "Pollo (200g)"
          return {
            name: match[1].trim(),
            amount: match[2],
            unit: match[3] || '',
            category: detectCategory(match[1])
          }
        } else if (match.length === 4) {
          // Formato: "200g pollo"
          return {
            name: match[3].trim(),
            amount: match[1],
            unit: match[2],
            category: detectCategory(match[3])
          }
        } else if (match.length === 3) {
          // Formato: "2 huevos"
          return {
            name: match[2].trim(),
            amount: match[1],
            unit: '',
            category: detectCategory(match[2])
          }
        }
      }
    }

    // Si no matchea ningún patrón, devolver como está
    return {
      name: text,
      amount: '',
      unit: '',
      category: detectCategory(text)
    }
  }

  // Detecta la categoría del ingrediente para aplicar colores/iconos
  const detectCategory = (name: string): string => {
    const nameLower = name.toLowerCase()

    if (/pollo|carne|res|cerdo|pescado|salmón|atún|camarón|huevo|pavo/i.test(nameLower)) {
      return 'protein'
    }
    if (/arroz|pasta|pan|avena|quinoa|papa|batata|tortilla/i.test(nameLower)) {
      return 'carbs'
    }
    if (/aceite|mantequilla|aguacate|nuez|almendra|aceitunas/i.test(nameLower)) {
      return 'fats'
    }
    if (/lechuga|tomate|cebolla|ajo|espinaca|brócoli|zanahoria|pimiento|vegetal|verdura/i.test(nameLower)) {
      return 'vegetables'
    }
    if (/sal|pimienta|comino|oregano|cilantro|perejil|especias/i.test(nameLower)) {
      return 'seasoning'
    }

    return 'other'
  }

  // Obtiene el color según categoría
  const getCategoryColor = (category?: string): string => {
    switch (category) {
      case 'protein': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'carbs': return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      case 'fats': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'vegetables': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'seasoning': return 'text-purple-400 bg-purple-500/10 border-purple-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const formatInstruction = (inst: string | Instruction): string => {
    if (typeof inst === 'string') return inst
    return inst.instruction
  }

  const getInstructionTime = (inst: string | Instruction): number | undefined => {
    if (typeof inst === 'string') return undefined
    return inst.time
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  // Normalizar todos los ingredientes al inicio
  const normalizedIngredients = recipe.ingredients?.map(normalizeIngredient) || []

  return (
    <>
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transform hover:-translate-y-1">
        <div className="relative h-48 bg-gradient-to-br from-purple-600/20 to-blue-600/20 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20"></div>

          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
            <ChefHat className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-white">Receta IA</span>
          </div>

          {recipe.targetNutrients && recipe.targetNutrients.length > 0 && (
            <div className="absolute top-4 right-4 bg-orange-500/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-orange-400/30">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Optimizada
              </span>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <ChefHat className="w-24 h-24 text-white/10" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-900 to-transparent"></div>

          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{recipe.title}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {totalTime > 0 ? `${totalTime} min` : '20-30 min'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {recipe.servings || 2} {recipe.servings === 1 ? 'porción' : 'porciones'}
              </span>
              {recipe.difficulty && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-medium">
                  {recipe.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-300 mb-4 line-clamp-2">{recipe.description}</p>

          {recipe.targetNutrients && recipe.targetNutrients.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                Nutrientes Optimizados
              </p>
              <div className="flex flex-wrap gap-2">
                {recipe.targetNutrients.slice(0, 4).map((nutrient, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 rounded-lg text-xs font-medium border border-purple-500/30"
                  >
                    {nutrient}
                  </span>
                ))}
                {recipe.targetNutrients.length > 4 && (
                  <span className="px-2.5 py-1 bg-gray-700/50 text-gray-400 rounded-lg text-xs">
                    +{recipe.targetNutrients.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-center py-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                Ver menos
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Ver ingredientes
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>

          {isExpanded && (
            <div className="mt-4 space-y-4 border-t border-gray-700 pt-4">
              {normalizedIngredients.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <ChefHat className="w-3.5 h-3.5" />
                    Ingredientes ({normalizedIngredients.length})
                  </p>
                  <ul className="space-y-2">
                    {normalizedIngredients.map((ingredient, idx) => (
                      <li key={idx} className={`flex items-start gap-2 p-2 rounded-lg border ${getCategoryColor(ingredient.category)}`}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px] font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {ingredient.amount && (
                              <span className="font-bold text-xs whitespace-nowrap">
                                {ingredient.amount}{ingredient.unit}
                              </span>
                            )}
                            <span className="text-xs text-gray-200">{ingredient.name}</span>
                          </div>
                          {ingredient.notes && (
                            <p className="text-[10px] text-gray-500 mt-1 italic">{ingredient.notes}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setShowFullRecipe(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-[0.98]"
              >
                Ver Receta Completa
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4 text-center">
            {new Date(recipe.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {showFullRecipe && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-t-2xl flex items-start justify-between border-b border-purple-500/30 z-10">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{recipe.title}</h2>
                <p className="text-purple-100 text-sm">{recipe.description}</p>
              </div>
              <button
                onClick={() => setShowFullRecipe(false)}
                className="ml-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {recipe.targetNutrients && recipe.targetNutrients.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Optimiza estos nutrientes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recipe.targetNutrients.map((nutrient, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-xs font-medium"
                      >
                        {nutrient}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {normalizedIngredients.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-purple-400" />
                    Ingredientes ({normalizedIngredients.length})
                  </h3>
                  <div className="grid gap-3">
                    {normalizedIngredients.map((ingredient, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] ${getCategoryColor(ingredient.category)}`}
                      >
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-current/30 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap mb-1">
                            {ingredient.amount && (
                              <span className="font-bold text-base">
                                {ingredient.amount}
                                <span className="text-sm ml-0.5">{ingredient.unit}</span>
                              </span>
                            )}
                            <span className="text-sm text-gray-200 font-medium">{ingredient.name}</span>
                          </div>
                          {ingredient.notes && (
                            <p className="text-xs text-gray-400 mt-1.5 italic flex items-start gap-1">
                              <Leaf className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {ingredient.notes}
                            </p>
                          )}
                          {ingredient.category && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-current/20 rounded text-[10px] font-semibold uppercase tracking-wide">
                              {ingredient.category === 'protein' && 'Proteína'}
                              {ingredient.category === 'carbs' && 'Carbohidrato'}
                              {ingredient.category === 'fats' && 'Grasa'}
                              {ingredient.category === 'vegetables' && 'Vegetal'}
                              {ingredient.category === 'seasoning' && 'Condimento'}
                              {ingredient.category === 'other' && 'Otro'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recipe.instructions && recipe.instructions.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Instrucciones
                  </h3>
                  <ol className="space-y-3">
                    {recipe.instructions.map((instruction, idx) => {
                      const time = getInstructionTime(instruction)
                      const text = formatInstruction(instruction)
                      return (
                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-sm font-bold text-white">
                            {idx + 1}
                          </span>
                          <div className="flex-1 pt-1.5">
                            <p>{text}</p>
                            {time && (
                              <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {time} min
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
