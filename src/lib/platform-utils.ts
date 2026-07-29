// NEXORA — Rate Limiting utility (#34)
import { db } from '@/lib/db'

const WINDOW_MS = 60 * 1000 // 1 minute

export async function checkRateLimit(key: string, max: number): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + WINDOW_MS)

  try {
    const existing = await db.rateLimit.findUnique({ where: { key } })
    if (!existing || existing.resetAt < now) {
      await db.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { key, count: 1, resetAt },
      })
      return { allowed: true, remaining: max - 1 }
    }
    if (existing.count >= max) {
      return { allowed: false, remaining: 0 }
    }
    await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
    return { allowed: true, remaining: max - existing.count - 1 }
  } catch {
    // If DB fails, allow (fail open)
    return { allowed: true, remaining: max }
  }
}

// NEXORA — Structured logging (#25 Observability)
export function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }
  if (level === 'error') console.error(JSON.stringify(entry))
  else if (level === 'warn') console.warn(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

// NEXORA — File validation (#35)
export function validateFile(file: File): { valid: boolean; error?: string } {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Tipo no permitido: ${file.type}. Usa JPG, PNG, WebP, GIF o PDF.` }
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: `Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(1)}MB. Máximo 5MB.` }
  }
  return { valid: true }
}

// NEXORA — Currency conversion (#18 Multi-moneda)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  COP: 4100,
  MXN: 17.5,
  EUR: 0.92,
  BRL: 5.1,
}

export function convertCurrency(amount: number, from: string, to: string): number {
  const usdAmount = amount / (EXCHANGE_RATES[from] ?? 1)
  return usdAmount * (EXCHANGE_RATES[to] ?? 1)
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Dólar' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'BRL', symbol: 'R$', name: 'Real' },
]

// NEXORA — Export to CSV (#33 Reportes exportables)
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
