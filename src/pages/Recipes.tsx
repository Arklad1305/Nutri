import { useState, useEffect, useRef } from 'react'
import { ChefHat, Sparkles, Plus, X, Loader2, ShoppingBasket, UtensilsCrossed, Coffee, Sunset, Moon, Cookie, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { RecipeCard } from '../components/RecipeCard'
import { generateRecipeWithAI } from '../lib/recipeService'
import { isToday, parseISO } from 'date-fns'
import { gsap, useGSAP } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useReducedMotion'

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

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [newIngredient, setNewIngredient] = useState('')
  const [selectedPantryItems, setSelectedPantryItems] = useState<number[]>([])

  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null)
  const [customRequest, setCustomRequest] = useState('')
  const [error, setError] = useState<string | null>(null)

  const pageRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useGSAP(() => {
    if (reducedMotion || !pageRef.current) return
    const sections = pageRef.current.querySelectorAll('.chef-section')
    if (!sections.length) return
    gsap.from(sections, {
      opacity: 0,
      y: 24,
      stagger: 0.1,
      duration: 0.55,
      ease: 'power3.out',
    })
  }, { scope: pageRef, dependencies: [activeTab, reducedMotion] })

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

    return () => { supabase.removeChannel(subscription) }
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

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setRecipes(data.map((rec: any) => ({
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
        })))
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
      if (data) setPantryItems(data)
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
    if (!selectedMealType) { setError('Por favor selecciona el tipo de comida'); return }
    if (selectedPantryItems.length === 0 && !customRequest.trim()) {
      setError('Por favor selecciona ingredientes o describe lo que quieres'); return
    }
    setIsGenerating(true)
    setError(null)
    try {
      const selectedIngredients = pantryItems
        .filter(item => selectedPantryItems.includes(item.id))
        .map(item => item.name)
      const mealTypeLabels = { breakfast: 'Desayuno', lunch: 'Almuerzo', dinner: 'Cena', snack: 'Snack' }
      const request = `Generar ${mealTypeLabels[selectedMealType]} usando: ${selectedIngredients.join(', ')}${customRequest ? `. ${customRequest}` : ''}`
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_diet, weight_kg, height_cm, age, gender, activity_level, target_calories, target_protein_g, target_carbs_g, target_fat_g')
        .eq('id', user.id)
        .maybeSingle()
      const dietType = profile?.preferred_diet?.[0] || 'standard'
      const result = await generateRecipeWithAI({
        deficits: [],
        dietType,
        customRequest: request,
        userContext: {
          weight_kg: profile?.weight_kg ?? undefined,
          height_cm: profile?.height_cm ?? undefined,
          age: profile?.age ?? undefined,
          gender: profile?.gender ?? undefined,
          activity_level: profile?.activity_level ?? undefined,
          target_calories: profile?.target_calories ?? undefined,
          target_protein: profile?.target_protein_g ?? undefined,
          target_carbs: profile?.target_carbs_g ?? undefined,
          target_fat: profile?.target_fat_g ?? undefined,
        },
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
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setIsGenerating(false)
    }
  }

  const mealTypes = [
    { value: 'breakfast' as MealType, label: 'Desayuno', icon: Coffee, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/30' },
    { value: 'lunch' as MealType, label: 'Almuerzo', icon: Sunset, color: 'from-yellow-500 to-orange-500', shadow: 'shadow-yellow-500/30' },
    { value: 'dinner' as MealType, label: 'Cena', icon: Moon, color: 'from-slate-600 to-slate-700', shadow: 'shadow-slate-500/20' },
    { value: 'snack' as MealType, label: 'Snack', icon: Cookie, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/20' },
  ]

  const todayRecipes = recipes.filter(recipe => isToday(parseISO(recipe.createdAt)))

  return (
    <div ref={pageRef} className="pb-24">

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden px-4 pt-6 pb-8 mb-6">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-4 right-1/4 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-md shadow-primary/30">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Chef IA</h1>
              <p className="text-sm text-dark-muted">Recetas personalizadas con tu despensa</p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex gap-2 flex-wrap mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-card/60 backdrop-blur-sm border border-dark-border/50 rounded-full text-xs font-semibold text-white">
              <ShoppingBasket className="w-3.5 h-3.5 text-green-400" />
              {pantryItems.length} ingredientes
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-card/60 backdrop-blur-sm border border-dark-border/50 rounded-full text-xs font-semibold text-white">
              <Calendar className="w-3.5 h-3.5 text-primary-400" />
              {todayRecipes.length} recetas hoy
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {/* ── Tab Selector ── */}
        <div className="chef-section flex gap-2 p-1.5 bg-dark-hover/50 backdrop-blur-sm rounded-xl border border-dark-border/30">
          <button
            onClick={() => setActiveTab('pantry')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
              activeTab === 'pantry'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 scale-[1.02]'
                : 'text-dark-muted hover:text-white hover:bg-dark-hover/50'
            }`}
          >
            <ShoppingBasket className={`w-4 h-4 transition-transform ${activeTab === 'pantry' ? 'scale-110' : ''}`} />
            Despensa
            {pantryItems.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'pantry' ? 'bg-white/25 text-white' : 'bg-green-500/20 text-green-400'
              }`}>
                {pantryItems.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${
              activeTab === 'recipes'
                ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-lg shadow-primary/25 scale-[1.02]'
                : 'text-dark-muted hover:text-white hover:bg-dark-hover/50'
            }`}
          >
            <UtensilsCrossed className={`w-4 h-4 transition-transform ${activeTab === 'recipes' ? 'scale-110' : ''}`} />
            Recetas
            {todayRecipes.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'recipes' ? 'bg-white/25 text-white' : 'bg-primary/20 text-primary-400'
              }`}>
                {todayRecipes.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Pantry Tab ── */}
        {activeTab === 'pantry' && (
          <>
            <div className="chef-section bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-5">
              <h2 className="text-lg font-black text-white mb-1">Ingredientes Disponibles</h2>
              <p className="text-sm text-dark-muted mb-4">Agrega los ingredientes que tienes en casa</p>

              <div className="flex gap-2 mb-5">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPantryItem()}
                  placeholder="Ej: Pollo, Arroz, Brócoli..."
                  className="flex-1 px-4 py-3 bg-dark-hover/60 border border-dark-border/50 rounded-xl text-white placeholder-dark-muted focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/30 transition-all"
                />
                <button
                  onClick={addPantryItem}
                  disabled={!newIngredient.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {pantryItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBasket className="w-14 h-14 text-dark-muted mx-auto mb-3 opacity-30" />
                  <p className="text-dark-muted text-sm font-medium">Tu despensa está vacía</p>
                  <p className="text-dark-muted text-xs mt-1 opacity-60">Comienza agregando ingredientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-dark-muted mb-3 font-medium">
                    {pantryItems.length} {pantryItems.length === 1 ? 'ingrediente' : 'ingredientes'} disponibles
                  </p>
                  {pantryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-dark-hover/40 border border-dark-border/30 rounded-xl hover:border-green-500/30 hover:bg-dark-hover/60 transition-all group"
                    >
                      <span className="text-white font-semibold text-sm">{item.name}</span>
                      <button
                        onClick={() => deletePantryItem(item.id)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pantryItems.length > 0 && (
              <button
                onClick={() => setActiveTab('recipes')}
                className="chef-section w-full py-3.5 px-6 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles className="w-5 h-5" />
                Generar Receta con estos ingredientes
              </button>
            )}
          </>
        )}

        {/* ── Recipes Tab ── */}
        {activeTab === 'recipes' && (
          <>
            {pantryItems.length === 0 ? (
              <div className="chef-section bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-8 text-center">
                <ShoppingBasket className="w-14 h-14 text-dark-muted mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-black text-white mb-2">Primero agrega ingredientes</h3>
                <p className="text-sm text-dark-muted mb-5">
                  Necesitas agregar ingredientes a tu despensa antes de generar recetas
                </p>
                <button
                  onClick={() => setActiveTab('pantry')}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all inline-flex items-center gap-2 shadow-lg shadow-green-500/30"
                >
                  <Plus className="w-5 h-5" />
                  Ir a Despensa
                </button>
              </div>
            ) : (
              <>
                {/* Recipe Generator */}
                <div className="chef-section bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-5">
                  <h2 className="text-lg font-black text-white mb-1">Generar Nueva Receta</h2>
                  <p className="text-sm text-dark-muted mb-5">Selecciona ingredientes y tipo de comida</p>

                  {/* Ingredient pills */}
                  <div className="mb-5">
                    <label className="text-xs font-bold text-dark-muted uppercase tracking-wider mb-3 block">
                      Ingredientes ({selectedPantryItems.length} seleccionados)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {pantryItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => togglePantrySelection(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            selectedPantryItems.includes(item.id)
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 scale-105'
                              : 'bg-dark-hover/60 border border-dark-border/50 text-dark-muted hover:text-white hover:border-green-500/30 hover:bg-dark-hover'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Meal type grid */}
                  <div className="mb-5">
                    <label className="text-xs font-bold text-dark-muted uppercase tracking-wider mb-3 block">
                      Tipo de comida
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {mealTypes.map((mealType) => {
                        const Icon = mealType.icon
                        const isSelected = selectedMealType === mealType.value
                        return (
                          <button
                            key={mealType.value}
                            onClick={() => setSelectedMealType(mealType.value)}
                            className={`flex items-center gap-2.5 p-3.5 rounded-xl transition-all duration-200 ${
                              isSelected
                                ? `bg-gradient-to-br ${mealType.color} text-white shadow-lg ${mealType.shadow} scale-[1.02]`
                                : 'bg-dark-hover/40 border border-dark-border/40 text-dark-muted hover:text-white hover:border-dark-border/80 hover:bg-dark-hover/60'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-bold">{mealType.label}</span>
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
                    className="w-full px-4 py-3 bg-dark-hover/60 border border-dark-border/50 rounded-xl text-white placeholder-dark-muted focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 resize-none mb-4 transition-all"
                  />

                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-sm text-red-400 font-medium">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={generateRecipe}
                    disabled={isGenerating || !selectedMealType || selectedPantryItems.length === 0}
                    className="relative w-full py-3.5 px-6 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                        <span className="relative z-10">Generando receta...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Generar Receta con IA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Today's Recipes */}
                <div className="chef-section">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-primary-400" />
                    <h2 className="text-lg font-black text-white">Recetas de Hoy</h2>
                    {todayRecipes.length > 0 && (
                      <span className="text-xs font-bold text-dark-muted bg-dark-hover/60 border border-dark-border/40 px-2.5 py-1 rounded-full">
                        {todayRecipes.length}
                      </span>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-14">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-700 rounded-2xl animate-pulse shadow-md shadow-primary/30" />
                        <ChefHat className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-dark-muted text-sm">Cargando recetas...</p>
                    </div>
                  ) : todayRecipes.length === 0 ? (
                    <div className="bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 rounded-2xl p-8 text-center">
                      <div className="relative inline-block mb-4">
                        <ChefHat className="w-14 h-14 text-dark-muted opacity-30" />
                        <Sparkles className="w-5 h-5 text-primary-400 absolute -top-1 -right-1 animate-pulse" />
                      </div>
                      <p className="text-white font-black mb-1">No hay recetas generadas hoy</p>
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
