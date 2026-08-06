// NEXORA — Currency & formatting utilities

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  COP: '$',
  EUR: '€',
  MXN: '$',
}

// Tasa de cambio fallback (COP por USD)
const USD_TO_COP_FALLBACK = 4100

export function formatCurrency(amount: number, currency = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$'
  const value = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${symbol}${value}`
}

/**
 * Formatear precio en COP (Pesos colombianos) — sin decimales, con separador de miles
 */
export function formatCOP(amountCop: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCop)
}

/**
 * Convertir USD → COP usando tasa actual (fallback si no hay store)
 */
export function usdToCop(amountUsd: number, rate?: number): number {
  const r = rate ?? USD_TO_COP_FALLBACK
  return Math.round(amountUsd * r)
}

/**
 * Formatear precio de forma adaptable: si el amount es > 1000 asume COP, si no USD
 */
export function formatPriceAdaptive(amountUsd: number, currency: 'USD' | 'COP' = 'USD', rate?: number): string {
  if (currency === 'COP') {
    return formatCOP(usdToCop(amountUsd, rate))
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUsd)
}

export function formatCompact(amount: number, currency = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$'
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`
  return `${symbol}${amount.toFixed(0)}`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}

export function marginPct(purchasePrice: number, salePrice: number): number {
  if (salePrice <= 0) return 0
  return ((salePrice - purchasePrice) / salePrice) * 100
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days} d`
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`
  return `hace ${Math.floor(months / 12)} año${months >= 24 ? 's' : ''}`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function initials(first: string, last?: string): string {
  const f = first?.trim()?.charAt(0) ?? ''
  const l = last?.trim()?.charAt(0) ?? ''
  return (f + l).toUpperCase() || '?'
}

export function inventoryStatus(stock: number, minStock: number): 'OUT' | 'LOW' | 'OK' {
  if (stock <= 0) return 'OUT'
  if (stock <= minStock) return 'LOW'
  return 'OK'
}
