export const macroColorConfig: Record<string, {
  gradient: string
  textColor: string
  glowColor: string
  bgGradient: string
}> = {
  'text-orange-500': {
    gradient: 'from-orange-500 via-red-500 to-orange-600',
    textColor: 'text-orange-400',
    glowColor: 'shadow-orange-500/50',
    bgGradient: 'from-orange-500/10 to-red-500/10'
  },
  'text-blue-500': {
    gradient: 'from-blue-500 via-cyan-500 to-blue-600',
    textColor: 'text-blue-400',
    glowColor: 'shadow-blue-500/50',
    bgGradient: 'from-blue-500/10 to-cyan-500/10'
  },
  'text-green-500': {
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    textColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-500/50',
    bgGradient: 'from-emerald-500/10 to-green-500/10'
  },
  'text-yellow-500': {
    gradient: 'from-yellow-500 via-amber-500 to-yellow-600',
    textColor: 'text-yellow-400',
    glowColor: 'shadow-yellow-500/50',
    bgGradient: 'from-yellow-500/10 to-amber-500/10'
  },
}
