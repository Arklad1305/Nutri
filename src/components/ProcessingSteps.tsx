import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface ProcessingStepsProps {
  type: 'text' | 'audio' | 'image'
}

const STEPS = {
  text: [
    'Analizando tu consulta...',
    'Consultando base de conocimiento...',
    'Procesando información nutricional...',
    'Generando respuesta personalizada...',
  ],
  audio: [
    'Transcribiendo audio...',
    'Identificando alimentos mencionados...',
    'Calculando valores nutricionales...',
    'Componiendo macronutrientes...',
    'Analizando micronutrientes...',
    'Generando resumen nutricional...',
  ],
  image: [
    'Analizando imagen con IA...',
    'Identificando alimentos en la foto...',
    'Estimando porciones y cantidades...',
    'Calculando calorías totales...',
    'Componiendo perfil de macros...',
    'Obteniendo valores de micronutrientes...',
    'Preparando análisis completo...',
  ],
}

export function ProcessingSteps({ type }: ProcessingStepsProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const steps = STEPS[type]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1
        if (nextStep < steps.length) {
          setCompletedSteps((completed) => [...completed, prev])
          return nextStep
        }
        return prev
      })
    }, 2200)

    return () => clearInterval(interval)
  }, [steps.length])

  const getTypeIcon = () => {
    switch (type) {
      case 'audio':
        return '🎤'
      case 'image':
        return '📷'
      default:
        return '💬'
    }
  }

  return (
    <div className="space-y-4 min-w-[280px] max-w-[360px]">
      <div className="flex items-center gap-2 pb-2 border-b border-dark-border/50">
        <span className="text-2xl">{getTypeIcon()}</span>
        <span className="text-sm font-medium text-white">
          {type === 'audio' ? 'Procesando Audio' : type === 'image' ? 'Analizando Imagen' : 'Procesando Consulta'}
        </span>
        <div className="ml-auto">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index)
        const isCurrent = currentStep === index
        const isPending = index > currentStep

        return (
          <div
            key={index}
            className={`flex items-center gap-3 transition-all duration-500 ${
              isPending ? 'opacity-30' : 'opacity-100'
            }`}
          >
            <div className="flex-shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-neon-400" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-dark-border" />
              )}
            </div>
            <p
              className={`text-sm transition-colors duration-300 ${
                isCompleted
                  ? 'text-neon-400 line-through'
                  : isCurrent
                  ? 'text-white font-medium'
                  : 'text-dark-muted'
              }`}
            >
              {step}
            </p>
          </div>
        )
      })}
      </div>
    </div>
  )
}
