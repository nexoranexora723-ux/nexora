// NEXORA — Basic tests for wishlist store
//
// NOTE: Self-contained test file (no external test runner required).
// Run with:  npx tsx src/lib/__tests__/wishlist-store.test.ts
//
// The wishlist store uses zustand `persist` middleware which needs localStorage.
// We provide a minimal in-memory localStorage shim before importing the store.

// === In-memory localStorage shim (must be set before importing the store) ===
const memoryStore: Record<string, string> = {}
;(globalThis as Record<string, unknown>).localStorage = {
  getItem: (key: string) => memoryStore[key] ?? null,
  setItem: (key: string, value: string) => { memoryStore[key] = value },
  removeItem: (key: string) => { delete memoryStore[key] },
  clear: () => { Object.keys(memoryStore).forEach((k) => delete memoryStore[k]) },
  key: (i: number) => Object.keys(memoryStore)[i] ?? null,
  length: 0,
}
;(globalThis as Record<string, unknown>).window = globalThis

import { useWishlist, selectWishlistCount, type WishlistItem, type WishlistState } from '../wishlist-store'

// === Minimal test framework ===
let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++
  } else {
    failed++
    console.error(`✗ ${message}`)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`)
}

function describe(name: string, fn: () => void): void {
  fn()
}

function getState(): WishlistState {
  return useWishlist.getState() as WishlistState
}

function resetWishlist(): void {
  useWishlist.getState().clear()
}

// === Tests ===

describe('wishlist initial state', () => {
  resetWishlist()
  const s = getState()
  assertEqual(s.items.length, 0, 'wishlist starts empty')
  assertEqual(s.isOpen, false, 'wishlist drawer starts closed')
})

describe('has (empty wishlist)', () => {
  resetWishlist()
  assertEqual(getState().has('xyz'), false, 'has() returns false when empty')
})

describe('addItem', () => {
  resetWishlist()
  const item: Omit<WishlistItem, 'addedAt'> = {
    id: 'p1', name: 'Test', imageUrl: null, price: 100, sku: 'SKU1',
  }
  useWishlist.getState().addItem(item)
  assertEqual(getState().items.length, 1, 'item added')
  assertEqual(getState().has('p1'), true, 'has() returns true after add')
  assertEqual(getState().items[0].addedAt.length > 0, true, 'addedAt timestamp set')

  // Adding same id again is a no-op
  useWishlist.getState().addItem(item)
  assertEqual(getState().items.length, 1, 'duplicate id is ignored')
})

describe('toggle', () => {
  resetWishlist()
  const item: Omit<WishlistItem, 'addedAt'> = {
    id: 'p2', name: 'Toggled', imageUrl: null, price: 50,
  }
  // Toggle on
  useWishlist.getState().toggle(item)
  assertEqual(getState().has('p2'), true, 'toggle adds when absent')

  // Toggle off
  useWishlist.getState().toggle(item)
  assertEqual(getState().has('p2'), false, 'toggle removes when present')
})

describe('removeItem', () => {
  resetWishlist()
  useWishlist.getState().addItem({ id: 'a', name: 'A', imageUrl: null, price: 10 })
  useWishlist.getState().addItem({ id: 'b', name: 'B', imageUrl: null, price: 20 })
  useWishlist.getState().removeItem('a')
  assertEqual(getState().items.length, 1, 'one removed')
  assertEqual(getState().items[0].id, 'b', 'correct item remains')
})

describe('clear', () => {
  resetWishlist()
  useWishlist.getState().addItem({ id: 'a', name: 'A', imageUrl: null, price: 10 })
  useWishlist.getState().addItem({ id: 'b', name: 'B', imageUrl: null, price: 20 })
  useWishlist.getState().clear()
  assertEqual(getState().items.length, 0, 'clear empties wishlist')
})

describe('selectWishlistCount (selector)', () => {
  resetWishlist()
  useWishlist.getState().addItem({ id: 'a', name: 'A', imageUrl: null, price: 10 })
  useWishlist.getState().addItem({ id: 'b', name: 'B', imageUrl: null, price: 20 })
  useWishlist.getState().addItem({ id: 'c', name: 'C', imageUrl: null, price: 30 })
  assertEqual(selectWishlistCount(getState()), 3, 'count = items.length')
})

describe('open/close wishlist drawer', () => {
  resetWishlist()
  useWishlist.getState().openWishlist()
  assertEqual(getState().isOpen, true, 'openWishlist opens')
  useWishlist.getState().closeWishlist()
  assertEqual(getState().isOpen, false, 'closeWishlist closes')
  useWishlist.getState().setOpen(true)
  assertEqual(getState().isOpen, true, 'setOpen(true)')
})

// === Summary ===
console.log(`\nwishlist-store.test.ts: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
