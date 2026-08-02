'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WishlistItem {
  id: string
  name: string
  imageUrl: string | null
  price: number
  currencyCode?: string
  sku?: string
  addedAt: string
}

export interface WishlistState {
  items: WishlistItem[]
  isOpen: boolean
  setOpen: (open: boolean) => void
  openWishlist: () => void
  closeWishlist: () => void
  toggle: (item: Omit<WishlistItem, 'addedAt'>) => void
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  removeItem: (id: string) => void
  has: (id: string) => boolean
  clear: () => void
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setOpen: (isOpen) => set({ isOpen }),
      openWishlist: () => set({ isOpen: true }),
      closeWishlist: () => set({ isOpen: false }),
      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) return state
          return { items: [...state.items, { ...item, addedAt: new Date().toISOString() }] }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      toggle: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.id === item.id)
          if (exists) {
            return { items: state.items.filter((i) => i.id !== item.id) }
          }
          return { items: [...state.items, { ...item, addedAt: new Date().toISOString() }] }
        }),
      has: (id) => get().items.some((i) => i.id === id),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'nexora-wishlist',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)

/** Selector: number of wishlist items. */
export function selectWishlistCount(state: WishlistState): number {
  return state.items.length
}
