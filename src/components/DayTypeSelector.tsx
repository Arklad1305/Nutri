import { Dumbbell, Coffee, Zap } from 'lucide-react'

interface DayTypeSelectorProps {
  isTrainingDay: boolean
  onChange: (isTrainingDay: boolean) => void
}

export default function DayTypeSelector({ isTrainingDay, onChange }: DayTypeSelectorProps) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-dark-hover rounded-lg">
          <Zap className="w-3.5 h-3.5 text-dark-muted" />
        </div>
        <h3 className="text-xs font-bold text-dark-text">Tipo de Día</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange(true)}
          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-colors active:scale-95 ${
            isTrainingDay
              ? 'bg-primary/10 border-primary'
              : 'bg-dark-hover border-dark-border hover:border-dark-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg transition-colors ${
            isTrainingDay
              ? 'bg-primary/20'
              : 'bg-dark-card'
          }`}>
            <Dumbbell className={`w-4 h-4 transition-colors ${
              isTrainingDay ? 'text-primary' : 'text-dark-muted'
            }`} />
          </div>

          <div className="text-center">
            <div className={`text-[10px] font-black ${
              isTrainingDay ? 'text-primary' : 'text-dark-muted'
            }`}>
              DÍA ALTO
            </div>
            <div className={`text-[8px] font-medium ${
              isTrainingDay ? 'text-primary/70' : 'text-dark-muted'
            }`}>
              Entrenamiento
            </div>
          </div>
        </button>

        <button
          onClick={() => onChange(false)}
          className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-colors active:scale-95 ${
            !isTrainingDay
              ? 'bg-primary/10 border-primary'
              : 'bg-dark-hover border-dark-border hover:border-dark-muted'
          }`}
        >
          <div className={`p-1.5 rounded-lg transition-colors ${
            !isTrainingDay
              ? 'bg-primary/20'
              : 'bg-dark-card'
          }`}>
            <Coffee className={`w-4 h-4 transition-colors ${
              !isTrainingDay ? 'text-primary' : 'text-dark-muted'
            }`} />
          </div>

          <div className="text-center">
            <div className={`text-[10px] font-black ${
              !isTrainingDay ? 'text-primary' : 'text-dark-muted'
            }`}>
              DÍA BAJO
            </div>
            <div className={`text-[8px] font-medium ${
              !isTrainingDay ? 'text-primary/70' : 'text-dark-muted'
            }`}>
              Descanso
            </div>
          </div>
        </button>
      </div>

      <div className="mt-3 p-3 bg-dark-hover border border-dark-border rounded-lg">
        <div className="flex items-start gap-2">
          <div className="p-1.5 bg-dark-card rounded-md shrink-0">
            {isTrainingDay
              ? <Dumbbell className="w-3 h-3 text-primary" />
              : <Zap className="w-3 h-3 text-primary" />
            }
          </div>
          <div>
            <p className="text-[10px] font-bold text-dark-text mb-0.5">
              {isTrainingDay ? 'Protocolo Anabólico' : 'Protocolo MATADOR'}
            </p>
            <p className="text-[9px] text-dark-muted leading-snug">
              {isTrainingDay
                ? 'Más calorías y carbohidratos para recuperación muscular'
                : 'Déficit agresivo para quemar grasa sin adaptación metabólica'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
