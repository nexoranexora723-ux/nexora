'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  sku: string
  name: string
  imageUrl: string | null
  price: number
  currencyCode: string
  quantity: number
  stock: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clear: () => void
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            const newQty = Math.min(existing.quantity + qty, item.stock)
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: newQty } : i,
              ),
              isOpen: true,
            }
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(qty, item.stock) }],
            isOpen: true,
          }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i,
          ),
        })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ isOpen: open }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    { name: 'nexora-cart' },
  ),
)

// Selectors
export const cartTotal = (items: CartItem[]): number =>
  items.reduce((s, i) => s + i.price * i.quantity, 0)

export const cartCount = (items: CartItem[]): number =>
  items.reduce((s, i) => s + i.quantity, 0)
