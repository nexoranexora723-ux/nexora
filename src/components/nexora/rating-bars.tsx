'use client'

import { cn } from '@/lib/utils'

// Supplier rating bars — per DOC-006 (communication/quality/price/shipping/warranty/trust scores)
const RATING_DIMENSIONS = [
  { key: 'communicationScore', label: 'Comunicación' },
  { key: 'qualityScore', label: 'Calidad' },
  { key: 'priceScore', label: 'Precio' },
  { key: 'shippingScore', label: 'Envío' },
  { key: 'warrantyScore', label: 'Garantía' },
  { key: 'trustScore', label: 'Confianza' },
] as const

function scoreColor(score: number): string {
  if (score >= 85) return 'bg-emerald-500'
  if (score >= 70) return 'bg-lime-500'
  if (score >= 55) return 'bg-amber-500'
  return 'bg-rose-500'
}

function scoreTextColor(score: number): string {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 70) return 'text-lime-600 dark:text-lime-400'
  if (score >= 55) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

export function RatingBars({ rating, compact = false }: { rating: { communicationScore: number; qualityScore: number; priceScore: number; shippingScore: number; warrantyScore: number; trustScore: number; overallScore: number } | null; compact?: boolean }) {
  if (!rating) {
    return <span className="text-xs text-muted-foreground">Sin calificación</span>
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-lg font-bold tabular-nums">{rating.overallScore.toFixed(1)}</div>
        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full', scoreColor(rating.overallScore))} style={{ width: `${rating.overallScore}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground">Score Global</span>
        <span className={cn('text-lg font-bold tabular-nums', scoreTextColor(rating.overallScore))}>
          {rating.overallScore.toFixed(1)}
          <span className="text-xs text-muted-foreground">/100</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {RATING_DIMENSIONS.map((d) => {
          const val = rating[d.key] as number
          return (
            <div key={d.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{d.label}</span>
                <span className={cn('font-medium tabular-nums', scoreTextColor(val))}>{val}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', scoreColor(val))} style={{ width: `${val}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
