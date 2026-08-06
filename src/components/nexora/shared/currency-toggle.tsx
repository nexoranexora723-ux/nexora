'use client'

/**
 * NEXORA — Currency Toggle (USD ↔ COP)
 * Botón flotante que permite cambiar la moneda mostrada.
 */
import { useEffect } from 'react'
import { useCurrency, fetchExchangeRate } from '@/lib/currency-store'
import { Button } from '@/components/ui/button'
import { DollarSign, Coins } from 'lucide-react'

export function CurrencyToggle({ compact = false }: { compact?: boolean }) {
  const { currency, toggle, updateRate, lastUpdated } = useCurrency()

  // Actualizar tasa cada 1 hora
  useEffect(() => {
    const hourAgo = Date.now() - 60 * 60 * 1000
    if (lastUpdated < hourAgo) {
      fetchExchangeRate().then(updateRate)
    }
  }, [lastUpdated, updateRate])

  return (
    <Button
      variant="outline"
      size={compact ? 'sm' : 'default'}
      onClick={toggle}
      className="gap-2 font-semibold"
      title={currency === 'USD' ? 'Cambiar a COP' : 'Cambiar a USD'}
    >
      {currency === 'USD' ? (
        <>
          <DollarSign className="h-4 w-4" />
          {!compact && <span>USD</span>}
        </>
      ) : (
        <>
          <Coins className="h-4 w-4" />
          {!compact && <span>COP</span>}
        </>
      )}
    </Button>
  )
}
