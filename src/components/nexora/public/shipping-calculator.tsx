'use client'

import * as React from 'react'
import { Truck, MapPin, Clock, Gift } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Colombian cities with shipping cost (USD) and estimated delivery time.
 * "Otra ciudad" is a fallback for cities not explicitly listed.
 */
export interface CityShipping {
  /** City key — used as Select value. */
  id: string
  /** Display name in Spanish. */
  name: string
  /** Shipping cost in USD. */
  cost: number
  /** Estimated delivery time (lower bound, in days). */
  daysMin: number
  /** Estimated delivery time (upper bound, in days). */
  daysMax: number
}

export const COLOMBIAN_CITIES: CityShipping[] = [
  { id: 'bogota', name: 'Bogotá', cost: 8, daysMin: 5, daysMax: 7 },
  { id: 'medellin', name: 'Medellín', cost: 8, daysMin: 5, daysMax: 7 },
  { id: 'cali', name: 'Cali', cost: 10, daysMin: 7, daysMax: 9 },
  { id: 'barranquilla', name: 'Barranquilla', cost: 10, daysMin: 7, daysMax: 9 },
  { id: 'cartagena', name: 'Cartagena', cost: 10, daysMin: 7, daysMax: 9 },
  { id: 'bucaramanga', name: 'Bucaramanga', cost: 9, daysMin: 6, daysMax: 8 },
  { id: 'pereira', name: 'Pereira', cost: 9, daysMin: 6, daysMax: 8 },
  { id: 'manizales', name: 'Manizales', cost: 9, daysMin: 6, daysMax: 8 },
  { id: 'otra', name: 'Otra ciudad', cost: 12, daysMin: 8, daysMax: 10 },
]

/** Free-shipping threshold (USD). Orders at or above this value ship free. */
export const FREE_SHIPPING_THRESHOLD = 200

/**
 * Resolves a city id to its shipping info.
 * Returns the "Otra ciudad" fallback if the id is unknown.
 */
export function getCityShipping(cityId: string | null | undefined): CityShipping {
  if (!cityId) return COLOMBIAN_CITIES[COLOMBIAN_CITIES.length - 1] // "Otra ciudad"
  return COLOMBIAN_CITIES.find((c) => c.id === cityId) ?? COLOMBIAN_CITIES[COLOMBIAN_CITIES.length - 1]
}

export interface ShippingQuote {
  /** The resolved city. */
  city: CityShipping
  /** Final shipping cost (0 if free). */
  cost: number
  /** Whether shipping is free (order above threshold). */
  free: boolean
  /** Formatted delivery estimate string, e.g. "5-7 días". */
  estimate: string
}

/**
 * Computes the shipping quote for a given city and order subtotal.
 * Free shipping kicks in when subtotal >= FREE_SHIPPING_THRESHOLD.
 */
export function computeShippingQuote(
  cityId: string | null | undefined,
  subtotal: number,
): ShippingQuote {
  const city = getCityShipping(cityId)
  const free = subtotal >= FREE_SHIPPING_THRESHOLD
  return {
    city,
    cost: free ? 0 : city.cost,
    free,
    estimate: `${city.daysMin}-${city.daysMax} días`,
  }
}

// ============================================================================

interface ShippingCalculatorProps {
  /** Currently selected city id. */
  cityId: string | null
  /** Called when the user selects a city. */
  onCityChange: (cityId: string) => void
  /** Cart subtotal (used to compute free shipping). */
  subtotal: number
  /** Optional className for the root container. */
  className?: string
  /** Whether the select should be disabled. */
  disabled?: boolean
}

/**
 * Full shipping calculator — used in the checkout dialog.
 * Renders a city Select + the computed quote (cost + estimate + free badge).
 */
export function ShippingCalculator({
  cityId,
  onCityChange,
  subtotal,
  className,
  disabled,
}: ShippingCalculatorProps) {
  const quote = computeShippingQuote(cityId, subtotal)
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-1.5">
        <label htmlFor="shipping-city" className="flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          Ciudad de envío
        </label>
        <Select value={cityId ?? undefined} onValueChange={onCityChange} disabled={disabled}>
          <SelectTrigger id="shipping-city" className="w-full">
            <SelectValue placeholder="Selecciona tu ciudad" />
          </SelectTrigger>
          <SelectContent>
            {COLOMBIAN_CITIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} — {formatCurrency(c.cost)} · {c.daysMin}-{c.daysMax} días
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {cityId && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Truck className="h-3.5 w-3.5" /> Envío
            </span>
            <span className="font-semibold">
              {quote.free ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Gift className="h-3.5 w-3.5" /> GRATIS
                </span>
              ) : (
                formatCurrency(quote.cost)
              )}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Entrega estimada
            </span>
            <span className="font-medium">{quote.estimate}</span>
          </div>
          {!quote.free && remaining > 0 && (
            <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
              Te faltan <span className="font-semibold text-foreground">{formatCurrency(remaining)}</span> para
              obtener <span className="font-semibold text-emerald-600">envío gratis</span>.
            </p>
          )}
          {quote.free && (
            <p className="mt-2 border-t pt-2 text-[11px] font-medium text-emerald-600">
              ¡Genial! Tu pedido califica para envío gratis.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================

interface ShippingCalculatorCompactProps {
  /** Product unit price (used to compute shipping for a single unit). */
  unitPrice?: number | null
  /** Optional className. */
  className?: string
}

/**
 * Compact shipping calculator — a small read-only card used on the product
 * detail page. Shows the cheapest city cost + the free-shipping threshold.
 */
export function ShippingCalculatorCompact({ unitPrice, className }: ShippingCalculatorCompactProps) {
  // Cheapest city is Bogotá / Medellín ($8).
  const cheapest = COLOMBIAN_CITIES[0]
  // Most expensive is "Otra ciudad" ($12).
  const mostExpensive = COLOMBIAN_CITIES[COLOMBIAN_CITIES.length - 1]
  // Free-shipping quantity for this product (if price is known).
  const freeQty = unitPrice && unitPrice > 0 ? Math.ceil(FREE_SHIPPING_THRESHOLD / unitPrice) : null

  return (
    <div className={cn('rounded-lg border bg-muted/20 p-3 text-xs', className)}>
      <p className="flex items-center gap-1.5 font-semibold">
        <Truck className="h-3.5 w-3.5 text-primary" /> Envío a toda Colombia
      </p>
      <p className="mt-1.5 text-muted-foreground">
        Costo: <span className="font-medium text-foreground">{formatCurrency(cheapest.cost)}</span>
        {' – '}
        <span className="font-medium text-foreground">{formatCurrency(mostExpensive.cost)}</span>
      </p>
      <p className="mt-0.5 text-muted-foreground">
        Entrega: <span className="font-medium text-foreground">{cheapest.daysMin}-{cheapest.daysMax} días</span>
        {' – '}
        <span className="font-medium text-foreground">{mostExpensive.daysMin}-{mostExpensive.daysMax} días</span>
      </p>
      <p className="mt-2 border-t pt-2 text-[11px] text-emerald-600">
        <Gift className="mr-1 inline h-3 w-3" />
        {freeQty
          ? `Envío GRATIS comprando ${freeQty}+ unidades (≥ ${formatCurrency(FREE_SHIPPING_THRESHOLD)})`
          : `Envío GRATIS en pedidos ≥ ${formatCurrency(FREE_SHIPPING_THRESHOLD)}`}
      </p>
    </div>
  )
}
