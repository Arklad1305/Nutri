import type { NutrientStatus } from './nutritionStandards'

export type StatusLevel = NutrientStatus['level']

export interface StatusTokens {
  text: string
  bg: string
  border: string
  bar: string
  hex: string
}

const tokens: Record<StatusLevel, StatusTokens> = {
  critical: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    bar: 'bg-amber-500',
    hex: '#f59e0b',
  },
  survival: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/25',
    bar: 'bg-yellow-500',
    hex: '#eab308',
  },
  functional: {
    text: 'text-primary-400',
    bg: 'bg-primary/10',
    border: 'border-primary/25',
    bar: 'bg-primary',
    hex: '#2dd4bf',
  },
  optimal: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    bar: 'bg-emerald-500',
    hex: '#10b981',
  },
}

export function statusColors(level: StatusLevel): StatusTokens {
  return tokens[level]
}
