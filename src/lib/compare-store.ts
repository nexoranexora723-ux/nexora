'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/lib/types'

/**
 * Subset of Product fields used for comparison. Stored separately so the
 * comparator doesn't depend on the full product list at runtime.
 */
export interface CompareItem {
  id: string
  name: string
  imageUrl: string | null
  brand: { id: string; name: string } | null
  category: { id: string; name: string; icon: string | null } | null
  estimatedCost: number | null
  currencyCode: string
  rating?: number
  reviewCount?: number
  soldCount?: number
  photoCount?: number
}

interface CompareState {
  items: CompareItem[]
  maxItems: number
  isOpen: boolean
  setOpen: (open: boolean) => void
  toggle: (item: CompareItem) => void
  addItem: (item: CompareItem) => void
  removeItem: (id: string) => void
  has: (id: string) => boolean
  clear: () => void
}

export const MAX_COMPARE = 4

/**
 * Product comparison store. Persists up to 4 selected products in localStorage
 * so the user can compare them across pages.
 */
export const useCompare = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: MAX_COMPARE,
      isOpen: false,
      setOpen: (isOpen) => set({ isOpen }),
      toggle: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.id === item.id)
          if (exists) {
            return { items: state.items.filter((i) => i.id !== item.id) }
          }
          if (state.items.length >= state.maxItems) return state // silently ignore
          return { items: [...state.items, item] }
        }),
      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) return state
          if (state.items.length >= state.maxItems) return state
          return { items: [...state.items, item] }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      has: (id) => get().items.some((i) => i.id === id),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'nexora-compare',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)

/** Selector: number of items currently selected for comparison. */
export function selectCompareCount(state: CompareState): number {
  return state.items.length
}

/**
 * Convert a Product (from /api/products) into a CompareItem.
 */
export function toCompareItem(p: Product): CompareItem {
  return {
    id: p.id,
    name: p.name,
    imageUrl: p.imageUrl,
    brand: p.brand,
    category: p.category,
    estimatedCost: p.estimatedCost,
    currencyCode: p.currencyCode,
    rating: p.rating,
    reviewCount: p.reviewCount,
    soldCount: p.soldCount,
    photoCount: (p.images?.length ?? 0) || (p.imageUrl ? 1 : 0),
  }
}
