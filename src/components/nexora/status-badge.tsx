'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// NEXORA status badge — maps business states to semantic colors
const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  INACTIVE: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  SUSPENDED: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900',
  PAID: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900',
  SHIPPED: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-900',
  RECEIVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  REFUNDED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  VIP: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  DISCONTINUED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  BLACKLISTED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo', INACTIVE: 'Inactivo', PENDING: 'Pendiente', APPROVED: 'Aprobado',
  REJECTED: 'Rechazado', CANCELLED: 'Cancelado', SUSPENDED: 'Suspendido',
  PAID: 'Pagado', SHIPPED: 'Enviado', RECEIVED: 'Recibido', DELIVERED: 'Entregado',
  REFUNDED: 'Reembolsado', VIP: 'VIP', DISCONTINUED: 'Descontinuado', BLACKLISTED: 'Blacklist',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE
  const label = STATUS_LABELS[status] ?? status
  return (
    <Badge variant="outline" className={cn('font-medium', style, className)}>
      {label}
    </Badge>
  )
}

export function InventoryStatusBadge({ status }: { status: 'OUT' | 'LOW' | 'OK' }) {
  const map = {
    OUT: { label: 'Agotado', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900' },
    LOW: { label: 'Stock bajo', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900' },
    OK: { label: 'Disponible', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' },
  }[status]
  return (
    <Badge variant="outline" className={cn('font-medium', map.cls)}>{map.label}</Badge>
  )
}

export function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    LOW: { label: 'Bajo', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' },
    MEDIUM: { label: 'Medio', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900' },
    HIGH: { label: 'Alto', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900' },
  }
  const m = map[level] ?? map.MEDIUM
  return <Badge variant="outline" className={cn('font-medium', m.cls)}>{m.label}</Badge>
}

export function NaiosTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string; emoji: string }> = {
    ALERT: { label: 'Alerta', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900', emoji: '🚨' },
    RISK: { label: 'Riesgo', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900', emoji: '⚠️' },
    OPPORTUNITY: { label: 'Oportunidad', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900', emoji: '💡' },
    INSIGHT: { label: 'Insight', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900', emoji: '📊' },
  }
  const m = map[type] ?? map.INSIGHT
  return (
    <Badge variant="outline" className={cn('font-medium gap-1', m.cls)}>
      <span>{m.emoji}</span> {m.label}
    </Badge>
  )
}

export function SeverityDot({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    LOW: 'bg-sky-400', MEDIUM: 'bg-amber-400', HIGH: 'bg-orange-500', CRITICAL: 'bg-rose-500',
  }
  return <span className={cn('inline-block h-2 w-2 rounded-full', map[severity] ?? map.MEDIUM)} />
}
