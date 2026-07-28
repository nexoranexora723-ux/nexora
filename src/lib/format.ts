// NEXORA — Currency & formatting utilities

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  COP: '$',
  EUR: '€',
  MXN: '$',
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '$'
  const value = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${symbol}${value}`
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
  return `hace ${Math.floor(months / 12)} año(s)`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function initials(first: string, last?: string): string {
  return `${first.charAt(0)}${last ? last.charAt(0) : ''}`.toUpperCase()
}

export function inventoryStatus(stock: number, minStock: number): 'OUT' | 'LOW' | 'OK' {
  if (stock <= 0) return 'OUT'
  if (stock <= minStock) return 'LOW'
  return 'OK'
}
