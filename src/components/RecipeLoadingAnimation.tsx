import { useState, useEffect } from 'react'
import { ChefHat, Flame, Sparkles, Coffee, Apple, Carrot, Fish } from 'lucide-react'

const cookingSteps = [
  { icon: ChefHat, text: 'Consultando al chef...', color: 'text-purple-400' },
  { icon: Apple, text: 'Seleccionando ingredientes frescos...', color: 'text-green-400' },
  { icon: Flame, text: 'Calentando los sartenes...', color: 'text-orange-400' },
  { icon: Carrot, text: 'Cortando vegetales...', color: 'text-orange-300' },
  { icon: Fish, text: 'Preparando proteínas...', color: 'text-blue-400' },
  { icon: Coffee, text: 'Agregando especias...', color: 'text-amber-400' },
  { icon: Sparkles, text: 'Finalizando platillo...', color: 'text-yellow-400' },
]

export function RecipeLoadingAnimation() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % cookingSteps.length)
    }, 2000)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95
        return prev + Math.random() * 5
      })
    }, 300)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [])

  const CurrentIcon = cookingSteps[currentStep].icon

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full border border-purple-500/20 shadow-2xl">
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-purple-500/50">
              <CurrentIcon className={`w-12 h-12 ${cookingSteps[currentStep].color}`} />
            </div>
          </div>

          <div className="absolute -top-2 -right-2 animate-ping">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute -bottom-2 -left-2 animate-ping delay-500">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <ChefHat className="w-5 h-5 text-purple-400" />
            Tu Chef IA está trabajando
          </h3>
          <p className={`text-sm ${cookingSteps[currentStep].color} font-medium transition-all duration-500 min-h-[20px]`}>
            {cookingSteps[currentStep].text}
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Creando receta personalizada con Gemini 2.0 Flash
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'bg-purple-500 scale-125'
                  : 'bg-gray-600 scale-100'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}
