'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  imageUrl: string | null
  price: number
  currencyCode?: string
  sku?: string
  quantity: number
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
  /** Whether the multi-step checkout dialog is open. */
  checkoutOpen: boolean
  setOpen: (open: boolean) => void
  openCart: () => void
  closeCart: () => void
  setCheckoutOpen: (open: boolean) => void
  openCheckout: () => void
  closeCheckout: () => void
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      checkoutOpen: false,
      setOpen: (isOpen) => set({ isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setCheckoutOpen: (checkoutOpen) => set({ checkoutOpen }),
      openCheckout: () => set({ checkoutOpen: true }),
      closeCheckout: () => set({ checkoutOpen: false }),
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity }] }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id ? { ...i, quantity } : i,
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'nexora-cart',
      // Only persist the items — drawer open state is ephemeral.
      partialize: (state) => ({ items: state.items }),
    },
  ),
)

/** Selector: total number of items in the cart (sum of quantities). */
export function selectCartCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.quantity, 0)
}

/** Selector: raw subtotal of the cart (sum of price × quantity, before any discount). */
export function selectCartTotal(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

/**
 * Volume discount tiers based on TOTAL item quantity in the cart.
 *  - 1-4 items:   0% off
 *  - 5-9 items:   10% off
 *  - 10-19 items: 15% off
 *  - 20+ items:   20% off
 */
export function getVolumeDiscountPct(totalQuantity: number): number {
  if (totalQuantity >= 20) return 20
  if (totalQuantity >= 10) return 15
  if (totalQuantity >= 5) return 10
  return 0
}

/** Selector: the volume-discount percentage that applies to the current cart. */
export function selectVolumeDiscountPct(state: CartState): number {
  return getVolumeDiscountPct(selectCartCount(state))
}

/** Selector: the monetary amount of the volume discount. */
export function selectVolumeDiscountAmount(state: CartState): number {
  const subtotal = selectCartTotal(state)
  const pct = selectVolumeDiscountPct(state)
  return subtotal * (pct / 100)
}

/** Selector: the cart subtotal after applying the volume discount. */
export function selectDiscountedSubtotal(state: CartState): number {
  return selectCartTotal(state) - selectVolumeDiscountAmount(state)
}
