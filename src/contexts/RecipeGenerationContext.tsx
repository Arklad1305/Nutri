import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, X, Sparkles, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface RecipeGenerationState {
  isGenerating: boolean
  recipeReady: boolean
  recipeTitle: string | null
}

interface RecipeGenerationContextType {
  state: RecipeGenerationState
  startGeneration: () => void
  dismiss: () => void
}

const RecipeGenerationContext = createContext<RecipeGenerationContextType>({
  state: { isGenerating: false, recipeReady: false, recipeTitle: null },
  startGeneration: () => {},
  dismiss: () => {},
})

export const useRecipeGeneration = () => useContext(RecipeGenerationContext)

export function RecipeGenerationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<RecipeGenerationState>({
    isGenerating: false,
    recipeReady: false,
    recipeTitle: null,
  })

  const startGeneration = useCallback(() => {
    setState({ isGenerating: true, recipeReady: false, recipeTitle: null })
  }, [])

  const dismiss = useCallback(() => {
    setState({ isGenerating: false, recipeReady: false, recipeTitle: null })
  }, [])

  // Escuchar inserciones en meal_recommendations (real-time)
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('recipe-generation-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meal_recommendations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const title = payload.new.title || payload.new.recipe_title || 'Nueva receta'
          setState(prev => {
            if (prev.isGenerating) {
              return { isGenerating: false, recipeReady: true, recipeTitle: title }
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [user])

  // Auto-dismiss success toast after 8 seconds
  useEffect(() => {
    if (state.recipeReady) {
      const timer = setTimeout(() => dismiss(), 8000)
      return () => clearTimeout(timer)
    }
  }, [state.recipeReady, dismiss])

  return (
    <RecipeGenerationContext.Provider value={{ state, startGeneration, dismiss }}>
      {children}
      <RecipeToast />
    </RecipeGenerationContext.Provider>
  )
}

// ═══ Toast flotante ═══

function RecipeToast() {
  const { state, dismiss } = useRecipeGeneration()

  if (!state.isGenerating && !state.recipeReady) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center pointer-events-none">
      {state.isGenerating && <GeneratingToast onDismiss={dismiss} />}
      {state.recipeReady && <ReadyToast title={state.recipeTitle} onDismiss={dismiss} />}
    </div>
  )
}

function GeneratingToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="pointer-events-auto w-full max-w-sm animate-slide-up">
      <div className="relative overflow-hidden bg-dark-card/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-[0_8px_40px_-4px_rgba(0,0,0,0.6),0_0_20px_rgba(13,148,136,0.15)] p-4">
        {/* Barra de progreso animada */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-dark-border/30 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary via-teal-400 to-primary animate-progress-bar" />
        </div>

        <div className="flex items-start gap-3">
          {/* Icono animado */}
          <div className="shrink-0 relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-teal-600/10 border border-primary/20 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary-400 animate-pulse" />
            </div>
            <Sparkles className="w-3 h-3 text-primary-300 absolute -top-1 -right-1 animate-bounce" />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Preparando tu receta...</p>
            <p className="text-xs text-dark-muted mt-0.5">
              Puedes navegar tranquilo, te avisaremos cuando este lista
            </p>
          </div>

          {/* Cerrar */}
          <button
            onClick={onDismiss}
            className="shrink-0 p-1 rounded-lg hover:bg-dark-hover/60 transition-colors"
          >
            <X className="w-4 h-4 text-dark-muted" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ReadyToast({ title, onDismiss }: { title: string | null; onDismiss: () => void }) {
  let navigate: ReturnType<typeof useNavigate> | null = null
  try {
    navigate = useNavigate()
  } catch {
    // Outside router context
  }

  return (
    <div className="pointer-events-auto w-full max-w-sm animate-slide-up">
      <div className="relative overflow-hidden bg-dark-card/95 backdrop-blur-xl border border-emerald-500/25 rounded-2xl shadow-[0_8px_40px_-4px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.2)] p-4">
        <div className="flex items-start gap-3">
          {/* Icono de exito */}
          <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Tu receta esta lista!</p>
            {title && (
              <p className="text-xs text-emerald-300/70 mt-0.5 truncate">{title}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1 shrink-0">
            {navigate && (
              <button
                onClick={() => { navigate!('/recipes'); onDismiss() }}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg transition-colors"
              >
                Ver
              </button>
            )}
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg hover:bg-dark-hover/60 transition-colors"
            >
              <X className="w-4 h-4 text-dark-muted" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
