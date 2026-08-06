/**
 * NEXORA — Currency Store (Multimoneda COP/USD)
 *
 * Permite al usuario cambiar entre USD y COP con un solo clic.
 * La tasa de cambio se cachea en localStorage por 1 hora.
 * Por defecto: 1 USD = 4100 COP (tasa aprox, actualizable vía API).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Currency = 'USD' | 'COP'

// Tasa de cambio base (actualizable)
const DEFAULT_USD_TO_COP = 4100

interface CurrencyState {
  currency: Currency
  usdToCop: number
  lastUpdated: number // timestamp
  setCurrency: (c: Currency) => void
  toggle: () => void
  updateRate: (rate: number) => void
  convert: (amountUsd: number, to?: Currency) => number
  format: (amountUsd: number, to?: Currency) => string
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      usdToCop: DEFAULT_USD_TO_COP,
      lastUpdated: Date.now(),

      setCurrency: (c) => set({ currency: c }),
      toggle: () => set((s) => ({ currency: s.currency === 'USD' ? 'COP' : 'USD' })),
      updateRate: (rate) => set({ usdToCop: rate, lastUpdated: Date.now() }),

      convert: (amountUsd, to) => {
        const target = to ?? get().currency
        if (target === 'COP') return Math.round(amountUsd * get().usdToCop)
        return amountUsd
      },

      format: (amountUsd, to) => {
        const target = to ?? get().currency
        const value = get().convert(amountUsd, target)
        if (target === 'COP') {
          return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        }
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value)
      },
    }),
    {
      name: 'nexora-currency',
      version: 1,
    }
  )
)

/**
 * Hook para obtener tasa de cambio en tiempo real desde exchange-rate-api
 * (con fallback a tasa hardcodeada si la API falla)
 */
export async function fetchExchangeRate(): Promise<number> {
  try {
    const resp = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!resp.ok) throw new Error('API error')
    const data = await resp.json()
    if (data?.rates?.COP) {
      return data.rates.COP
    }
    throw new Error('No COP rate')
  } catch {
    return DEFAULT_USD_TO_COP
  }
}
