import { Dumbbell, Coffee, Flame, Zap } from 'lucide-react'

interface DayTypeSelectorProps {
  isTrainingDay: boolean
  onChange: (isTrainingDay: boolean) => void
}

export default function DayTypeSelector({ isTrainingDay, onChange }: DayTypeSelectorProps) {
  return (
    <div className="relative bg-gradient-to-br from-dark-card to-dark-bg border border-dark-border rounded-xl p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <h3 className="text-xs font-bold text-white">Tipo de Día</h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange(true)}
            className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-300 group overflow-hidden active:scale-95 ${
              isTrainingDay
                ? 'bg-gradient-to-br from-red-500/20 via-orange-500/20 to-red-600/20 border-red-500 shadow-lg shadow-red-500/20'
                : 'bg-dark-hover border-dark-border hover:border-red-500/50 hover:shadow-md hover:shadow-red-500/10 hover:scale-[1.02]'
            }`}
          >
            {isTrainingDay && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent animate-shimmer"></div>
            )}

            <div className={`p-1.5 rounded-lg transition-all duration-300 ${
              isTrainingDay
                ? 'bg-red-500/30 shadow-md shadow-red-500/20'
                : 'bg-dark-card group-hover:bg-red-500/10'
            }`}>
              <Dumbbell className={`w-4 h-4 transition-all duration-300 ${
                isTrainingDay ? 'text-red-400' : 'text-zinc-500 group-hover:text-red-400'
              }`} />
            </div>

            <div className="text-center relative z-10">
              <div className={`text-[10px] font-black ${
                isTrainingDay ? 'text-red-400' : 'text-zinc-500 group-hover:text-red-400'
              }`}>
                DÍA ALTO
              </div>
              <div className={`text-[8px] font-medium ${
                isTrainingDay ? 'text-red-400/70' : 'text-zinc-600 group-hover:text-red-400/70'
              }`}>
                Entrenamiento
              </div>
            </div>
          </button>

          <button
            onClick={() => onChange(false)}
            className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-300 group overflow-hidden active:scale-95 ${
              !isTrainingDay
                ? 'bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20'
                : 'bg-dark-hover border-dark-border hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/10 hover:scale-[1.02]'
            }`}
          >
            {!isTrainingDay && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent animate-shimmer"></div>
            )}

            <div className={`p-1.5 rounded-lg transition-all duration-300 ${
              !isTrainingDay
                ? 'bg-blue-500/30 shadow-md shadow-blue-500/20'
                : 'bg-dark-card group-hover:bg-blue-500/10'
            }`}>
              <Coffee className={`w-4 h-4 transition-all duration-300 ${
                !isTrainingDay ? 'text-blue-400' : 'text-zinc-500 group-hover:text-blue-400'
              }`} />
            </div>

            <div className="text-center relative z-10">
              <div className={`text-[10px] font-black ${
                !isTrainingDay ? 'text-blue-400' : 'text-zinc-500 group-hover:text-blue-400'
              }`}>
                DÍA BAJO
              </div>
              <div className={`text-[8px] font-medium ${
                !isTrainingDay ? 'text-blue-400/70' : 'text-zinc-600 group-hover:text-blue-400/70'
              }`}>
                Descanso
              </div>
            </div>
          </button>
        </div>

        {isTrainingDay && (
          <div className="mt-3 p-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-red-500/20 rounded-md shrink-0">
                <Flame className="w-3 h-3 text-red-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-400 mb-0.5">Protocolo Anabólico</p>
                <p className="text-[9px] text-red-400/70 leading-snug">
                  Más calorías y carbohidratos para recuperación muscular
                </p>
              </div>
            </div>
          </div>
        )}

        {!isTrainingDay && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-blue-500/20 rounded-md shrink-0">
                <Zap className="w-3 h-3 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-400 mb-0.5">Protocolo MATADOR</p>
                <p className="text-[9px] text-blue-400/70 leading-snug">
                  Déficit agresivo para quemar grasa sin adaptación metabólica
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
