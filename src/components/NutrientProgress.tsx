interface NutrientProgressProps {
  label: string
  current: number
  goal: number
  color: string
}

export function NutrientProgress({ label, current, goal, color }: NutrientProgressProps) {
  const percentage = (current / goal) * 100
  const isOver = percentage > 100

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-dark-text">{label}</span>
        <span className="text-sm text-dark-muted">
          {Math.round(current)}g / {goal}g
        </span>
      </div>
      <div className="relative h-3 bg-dark-hover rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOver ? 'bg-danger' : color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
