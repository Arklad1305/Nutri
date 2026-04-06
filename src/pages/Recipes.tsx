import { useState, useEffect } from 'react'
import { ChefHat, Sparkles, Plus, X, Loader2, ShoppingBasket, UtensilsCrossed, Coffee, Sunset, Moon, Cookie, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { RecipeCard } from '../components/RecipeCard'
import { generateRecipeWithAI } from '../lib/recipeService'
import { isToday, parseISO } from 'date-fns'

interface Ingredient {
  name: string
  amount: number
  unit: string
  notes?: string
}

interface Instruction {
  step: number
  instruction: string
  time?: number
}

interface Recipe {
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

interface PantryItem {
  id: number
  name: string
  quantity: number | null
  unit: string | null
  category: string | null
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
type TabType = 'pantry' | 'recipes'

export function Recipes() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('pantry')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Pantry states
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [newIngredient, setNewIngredient] = useState('')
  const [selectedPantryItems, setSelectedPantryItems] = useState<number[]>([])

  // Recipe generation states
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)
  const [customRequest, setCustomRequest] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchRecipes()
      fetchPantryItems()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('chef-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meal_recommendations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Nueva receta del Chef!', payload.new)

          const newRecipe = {
            id: payload.new.id,
            title: payload.new.title || payload.new.recipe_title,
            description: payload.new.description || payload.new.recipe_description,
            ingredients: payload.new.ingredients || [],
            instructions: payload.new.instructions || [],
            targetNutrients: payload.new.target_nutrients || [],
            createdAt: payload.new.created_at,
            prepTime: payload.new.prep_time_minutes,
            cookTime: payload.new.cook_time_minutes,
            servings: payload.new.servings,
            difficulty: payload.new.difficulty_level,
          }

          setRecipes((currentRecipes) => [newRecipe, ...currentRecipes])
          setIsGenerating(false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user])

  const fetchRecipes = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('meal_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        const formattedRecipes = data.map((rec: any) => ({
          id: rec.id,
          title: rec.title || rec.recipe_title,
          description: rec.description || rec.recipe_description,
          ingredients: rec.ingredients || [],
          instructions: rec.instructions || [],
          targetNutrients: rec.target_nutrients || [],
          createdAt: rec.created_at,
          prepTime: rec.prep_time_minutes,
          cookTime: rec.cook_time_minutes,
          servings: rec.servings,
          difficulty: rec.difficulty_level,
        }))
        setRecipes(formattedRecipes)
      }
    } catch (err) {
      console.error('Error fetching recipes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPantryItems = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setPantryItems(data)
      }
    } catch (err) {
      console.error('Error fetching pantry items:', err)
    }
  }

  const addPantryItem = async () => {
    if (!user || !newIngredient.trim()) return

    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .insert([{ user_id: user.id, name: newIngredient.trim() }])
        .select()
        .single()

      if (error) throw error
      if (data) {
        setPantryItems([data, ...pantryItems])
        setNewIngredient('')
      }
    } catch (err) {
      console.error('Error adding pantry item:', err)
    }
  }

  const deletePantryItem = async (id: number) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      setPantryItems(pantryItems.filter(item => item.id !== id))
      setSelectedPantryItems(selectedPantryItems.filter(itemId => itemId !== id))
    } catch (err) {
      console.error('Error deleting pantry item:', err)
    }
  }

  const togglePantrySelection = (id: number) => {
    setSelectedPantryItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const generateRecipe = async () => {
    if (!user) return

    if (!selectedMealType) {
      setError('Por favor selecciona el tipo de comida')
      return
    }

    if (selectedPantryItems.length === 0 && !customRequest.trim()) {
      setError('Por favor selecciona ingredientes o describe lo que quieres')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const selectedIngredients = pantryItems
        .filter(item => selectedPantryItems.includes(item.id))
        .map(item => item.name)

      const mealTypeLabels = {
        breakfast: 'Desayuno',
        lunch: 'Almuerzo',
        dinner: 'Cena',
        snack: 'Snack'
      }

      const request = `Generar ${mealTypeLabels[selectedMealType]} usando: ${selectedIngredients.join(', ')}${customRequest ? `. ${customRequest}` : ''}`

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_diet, weight_kg, height_cm, age, gender, activity_level, target_calories, target_protein_g, target_carbs_g, target_fat_g')
        .eq('id', user.id)
        .maybeSingle()

      const dietType = profile?.preferred_diet?.[0] || 'standard'

      const userContext = {
        weight_kg: profile?.weight_kg ?? undefined,
        height_cm: profile?.height_cm ?? undefined,
        age: profile?.age ?? undefined,
        gender: profile?.gender ?? undefined,
        activity_level: profile?.activity_level ?? undefined,
        target_calories: profile?.target_calories ?? undefined,
        target_protein: profile?.target_protein_g ?? undefined,
        target_carbs: profile?.target_carbs_g ?? undefined,
        target_fat: profile?.target_fat_g ?? undefined,
      }

      const result = await generateRecipeWithAI({
        deficits: [],
        dietType: dietType,
        customRequest: request,
        userContext,
      })

      if (result.success) {
        setCustomRequest('')
        setSelectedPantryItems([])
        setSelectedMealType(null)
        setActiveTab('recipes')
      } else {
        setError(result.error || 'Error al generar receta')
        setIsGenerating(false)
      }
    } catch (err) {
      console.error('Error generating recipe:', err)
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setIsGenerating(false)
    }
  }

  const mealTypes = [
    { value: 'breakfast' as MealType, label: 'Desayuno', icon: Coffee, color: 'from-amber-500 to-orange-500' },
    { value: 'lunch' as MealType, label: 'Almuerzo', icon: Sunset, color: 'from-yellow-500 to-orange-500' },
    { value: 'dinner' as MealType, label: 'Cena', icon: Moon, color: 'from-indigo-500 to-purple-500' },
    { value: 'snack' as MealType, label: 'Snack', icon: Cookie, color: 'from-pink-500 to-rose-500' },
  ]

  const todayRecipes = recipes.filter(recipe => isToday(parseISO(recipe.createdAt)))

  return (
    <>
      <div className="pb-20">
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-6 rounded-b-3xl shadow-lg mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ChefHat className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Chef IA</h1>
          </div>
          <p className="text-purple-100 text-sm">
            Gestiona tu despensa y genera recetas personalizadas
          </p>
        </div>

        {/* Tab Selector */}
        <div className="px-4 mb-6">
          <div className="flex gap-2 bg-dark-card border border-dark-border rounded-xl p-1">
            <button
              onClick={() => setActiveTab('pantry')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'pantry'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'text-dark-muted hover:text-white'
              }`}
            >
              <ShoppingBasket className="w-5 h-5" />
              Despensa
              {pantryItems.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'pantry'
                    ? 'bg-white/20'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {pantryItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'recipes'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-dark-muted hover:text-white'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5" />
              Recetas
              {todayRecipes.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'recipes'
                    ? 'bg-white/20'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {todayRecipes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pantry Tab Content */}
        {activeTab === 'pantry' && (
          <div className="px-4 space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-xl p-5">
              <h2 className="text-lg font-bold text-white mb-1">Ingredientes Disponibles</h2>
              <p className="text-sm text-dark-muted mb-4">
                Agrega los ingredientes que tienes en casa
              </p>

              {/* Add ingredient input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPantryItem()}
                  placeholder="Ej: Pollo, Arroz, Brócoli..."
                  className="flex-1 px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={addPantryItem}
                  disabled={!newIngredient.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-green-500/30"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Pantry items list */}
              <div className="space-y-2">
                {pantryItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBasket className="w-16 h-16 text-dark-muted mx-auto mb-3 opacity-50" />
                    <p className="text-dark-muted text-sm">Tu despensa está vacía</p>
                    <p className="text-dark-muted text-xs mt-1">Comienza agregando ingredientes</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-dark-muted mb-2">
                      {pantryItems.length} {pantryItems.length === 1 ? 'ingrediente' : 'ingredientes'}
                    </p>
                    {pantryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-dark-hover border border-dark-border rounded-lg hover:border-green-500/30 transition-all group"
                      >
                        <span className="text-white font-medium">{item.name}</span>
                        <button
                          onClick={() => deletePantryItem(item.id)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {pantryItems.length > 0 && (
                <button
                  onClick={() => setActiveTab('recipes')}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generar Receta
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recipes Tab Content */}
        {activeTab === 'recipes' && (
          <div className="px-4 space-y-6">
            {pantryItems.length === 0 ? (
              <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
                <ShoppingBasket className="w-16 h-16 text-dark-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-white mb-2">Primero agrega ingredientes</h3>
                <p className="text-sm text-dark-muted mb-4">
                  Necesitas agregar ingredientes a tu despensa antes de generar recetas
                </p>
                <button
                  onClick={() => setActiveTab('pantry')}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Ir a Despensa
                </button>
              </div>
            ) : (
              <>
                {/* Recipe Generator */}
                <div className="bg-dark-card border border-dark-border rounded-xl p-5">
                  <h2 className="text-lg font-bold text-white mb-1">Generar Nueva Receta</h2>
                  <p className="text-sm text-dark-muted mb-4">
                    Selecciona ingredientes y tipo de comida
                  </p>

                  {/* Ingredient selector */}
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-white mb-2 block">
                      Ingredientes a usar ({selectedPantryItems.length} seleccionados)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {pantryItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => togglePantrySelection(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedPantryItems.includes(item.id)
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                              : 'bg-dark-hover border border-dark-border text-dark-muted hover:text-white hover:border-green-500/30'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal type selector */}
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-white mb-2 block">
                      Tipo de comida
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {mealTypes.map((mealType) => {
                        const Icon = mealType.icon
                        return (
                          <button
                            key={mealType.value}
                            onClick={() => setSelectedMealType(mealType.value)}
                            className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                              selectedMealType === mealType.value
                                ? `bg-gradient-to-br ${mealType.color} text-white shadow-lg`
                                : 'bg-dark-hover border border-dark-border text-dark-muted hover:border-dark-border/50'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-semibold">{mealType.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Custom request */}
                  <textarea
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                    placeholder="Solicitud adicional (opcional)..."
                    rows={2}
                    className="w-full px-4 py-3 bg-dark-hover border border-dark-border rounded-lg text-white placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none mb-4"
                  />

                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={generateRecipe}
                    disabled={isGenerating || !selectedMealType || selectedPantryItems.length === 0}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/30"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando receta...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generar Receta con IA
                      </>
                    )}
                  </button>
                </div>

                {/* Today's Recipes */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <h2 className="text-lg font-bold text-white">Recetas de Hoy</h2>
                    {todayRecipes.length > 0 && (
                      <span className="text-sm text-dark-muted">
                        ({todayRecipes.length})
                      </span>
                    )}
                  </div>

                  <div>
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                          <ChefHat className="w-8 h-8 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-dark-muted mt-4 text-sm">Cargando recetas...</p>
                      </div>
                    ) : todayRecipes.length === 0 ? (
                      <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center">
                        <div className="relative inline-block mb-4">
                          <ChefHat className="w-16 h-16 text-dark-muted opacity-50" />
                          <Sparkles className="w-6 h-6 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                        <p className="text-white mb-2 font-semibold">No hay recetas generadas hoy</p>
                        <p className="text-sm text-dark-muted">
                          Selecciona ingredientes y genera tu primera receta del día
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {todayRecipes.map((recipe) => (
                          <RecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
