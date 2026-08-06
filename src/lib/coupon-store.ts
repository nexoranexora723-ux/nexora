'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Coupon definitions (hardcoded for now — could be moved to DB later).
 *
 * Validation rules:
 *  - BIENVENIDA10 — 10% off, always valid (first-purchase coupon)
 *  - BLACKFRIDAY20 — 20% off, valid only during November (Cyber Month)
 *  - NAVIDAD15    — 15% off, valid only during December
 *  - VIP25        — 25% off, always valid (VIP customers)
 */
export interface CouponDef {
  code: string
  percentage: number // 0-100
  description: string
  /** Optional month (1-12) when the coupon is valid. If null → always valid. */
  validMonth?: number
}

export const COUPONS: CouponDef[] = [
  {
    code: 'BIENVENIDA10',
    percentage: 10,
    description: '10% de descuento en tu primera compra',
  },
  {
    code: 'BLACKFRIDAY20',
    percentage: 20,
    description: '20% de descuento por Black Friday',
    validMonth: 11, // November
  },
  {
    code: 'NAVIDAD15',
    percentage: 15,
    description: '15% de descuento por Navidad',
    validMonth: 12, // December
  },
  {
    code: 'VIP25',
    percentage: 25,
    description: '25% de descuento para clientes VIP',
  },
  {
    code: 'NEXORA15',
    percentage: 15,
    description: '15% de descuento en tu segunda compra',
  },
  {
    code: 'PRIMAVERA20',
    percentage: 20,
    description: '20% de descuento por primavera',
    validMonth: 3, // March
  },
  {
    code: 'VERANO10',
    percentage: 10,
    description: '10% de descuento de verano',
    validMonth: 6, // June
  },
  {
    code: 'RESPONDER5',
    percentage: 5,
    description: '5% de descuento por responder encuesta',
  },
  {
    code: 'REFERIDO10',
    percentage: 10,
    description: '10% de descuento por venir referido',
  },
  {
    code: 'MAYORISTA15',
    percentage: 15,
    description: '15% de descuento para mayoristas (compras +$500)',
  },
]

export interface AppliedCoupon {
  code: string
  percentage: number
  description: string
}

export type CouponValidationResult =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; reason: 'not_found' | 'expired' }

/**
 * Validates a coupon code against the predefined list and current date.
 * Returns the coupon if valid, or an error reason.
 */
export function validateCoupon(code: string): CouponValidationResult {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return { ok: false, reason: 'not_found' }

  const def = COUPONS.find((c) => c.code === normalized)
  if (!def) return { ok: false, reason: 'not_found' }

  // If the coupon has a validMonth, check that the current month matches.
  if (def.validMonth !== undefined) {
    const currentMonth = new Date().getMonth() + 1 // 1-12
    if (currentMonth !== def.validMonth) {
      return { ok: false, reason: 'expired' }
    }
  }

  return {
    ok: true,
    coupon: {
      code: def.code,
      percentage: def.percentage,
      description: def.description,
    },
  }
}

interface CouponState {
  applied: AppliedCoupon | null
  apply: (code: string) => CouponValidationResult
  remove: () => void
  clear: () => void
}

/**
 * Coupon store — holds the currently-applied coupon across the checkout flow.
 * Persisted so a coupon survives a page refresh during checkout.
 */
export const useCoupon = create<CouponState>()(
  persist(
    (set) => ({
      applied: null,
      apply: (code) => {
        const result = validateCoupon(code)
        if (result.ok) {
          set({ applied: result.coupon })
        }
        return result
      },
      remove: () => set({ applied: null }),
      clear: () => set({ applied: null }),
    }),
    {
      name: 'nexora-coupon',
      partialize: (state) => ({ applied: state.applied }),
    },
  ),
)

/** Selector: returns the discount percentage (0 if no coupon applied). */
export function selectCouponPct(state: CouponState): number {
  return state.applied?.percentage ?? 0
}

/**
 * Computes the discount amount given a subtotal and the applied coupon.
 * Pure helper — can be called from any component.
 */
export function computeCouponDiscount(subtotal: number, applied: AppliedCoupon | null): number {
  if (!applied) return 0
  return subtotal * (applied.percentage / 100)
}
