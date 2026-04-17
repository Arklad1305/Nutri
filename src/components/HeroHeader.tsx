import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface HeroHeaderProps {
  userName: string
}

export function HeroHeader({ userName }: HeroHeaderProps) {
  const now = new Date()
  const hour = now.getHours()

  const greeting = useMemo(() => {
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }, [hour])

  return (
    <div className="px-1 py-4">
      <h1 className="text-xl font-bold text-dark-text tracking-tight">
        {greeting}, <span className="text-primary">{userName}</span>
      </h1>
      <p className="text-xs text-dark-muted mt-1 capitalize">
        {format(now, "EEEE, d 'de' MMMM", { locale: es })}
      </p>
    </div>
  )
}
