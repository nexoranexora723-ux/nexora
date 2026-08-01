// NEXORA — Basic tests for cart store
//
// NOTE: Self-contained test file (no external test runner required).
// Run with:  npx tsx src/lib/__tests__/cart-store.test.ts
//
// The cart store uses zustand `persist` middleware which needs localStorage.
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

import { useCart, selectCartCount, selectCartTotal, type CartItem, type CartState } from '../cart-store'

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

// Helper: get a snapshot of the store state
function getState(): CartState {
  return useCart.getState() as CartState
}

function resetCart(): void {
  useCart.getState().clear()
}

// === Tests ===

describe('cart initial state', () => {
  resetCart()
  const s = getState()
  assertEqual(s.items.length, 0, 'cart starts empty')
  assertEqual(s.isOpen, false, 'cart starts closed')
})

describe('addItem', () => {
  resetCart()
  const item: Omit<CartItem, 'quantity'> = {
    id: 'p1', name: 'Test Product', imageUrl: null, price: 50, sku: 'SKU1',
  }
  useCart.getState().addItem(item)
  assertEqual(getState().items.length, 1, 'item is added')
  assertEqual(getState().items[0].quantity, 1, 'default quantity is 1')

  // Adding same item again increments quantity
  useCart.getState().addItem(item, 2)
  assertEqual(getState().items.length, 1, 'duplicate id does not create new line')
  assertEqual(getState().items[0].quantity, 3, 'quantity increments by amount')
})

describe('removeItem', () => {
  resetCart()
  useCart.getState().addItem({ id: 'a', name: 'A', imageUrl: null, price: 10 })
  useCart.getState().addItem({ id: 'b', name: 'B', imageUrl: null, price: 20 })
  assertEqual(getState().items.length, 2, 'setup: 2 items')

  useCart.getState().removeItem('a')
  assertEqual(getState().items.length, 1, 'one item removed')
  assertEqual(getState().items[0].id, 'b', 'correct item remains')
})

describe('updateQuantity', () => {
  resetCart()
  useCart.getState().addItem({ id: 'a', name: 'A', imageUrl: null, price: 10 })
  useCart.getState().updateQuantity('a', 5)
  assertEqual(getState().items[0].quantity, 5, 'quantity updated to 5')

  // Quantity <= 0 removes item
  useCart.getState().updateQuantity('a', 0)
  assertEqual(getState().items.length, 0, 'quantity 0 removes item')

  useCart.getState().addItem({ id: 'a', name: 'A', imageUrl: null, price: 10 })
  useCart.getState().updateQuantity('a', -3)
  assertEqual(getState().items.length, 0, 'negative quantity removes item')
})

describe('clear', () => {
  resetCart()
  useCart.getState().addItem({ id: 'a', name: 'A', imageUrl: null, price: 10 })
  useCart.getState().addItem({ id: 'b', name: 'B', imageUrl: null, price: 20 })
  useCart.getState().clear()
  assertEqual(getState().items.length, 0, 'clear empties the cart')
})

describe('selectCartCount (selector)', () => {
  resetCart()
  useCart.getState().addItem({ id: 'a', name: 'A', imageUrl: null, price: 10 }, 2)
  useCart.getState().addItem({ id: 'b', name: 'B', imageUrl: null, price: 20 }, 3)
  assertEqual(selectCartCount(getState()), 5, 'count = sum of quantities')
})

describe('selectCartTotal (selector)', () => {
  resetCart()
  useCart.getState().addItem({ id: 'a', name: 'A', imageUrl: null, price: 10 }, 2) // 20
  useCart.getState().addItem({ id: 'b', name: 'B', imageUrl: null, price: 20 }, 3) // 60
  assertEqual(selectCartTotal(getState()), 80, 'total = sum(price * qty)')
})

describe('open/close cart', () => {
  resetCart()
  useCart.getState().openCart()
  assertEqual(getState().isOpen, true, 'openCart opens')
  useCart.getState().closeCart()
  assertEqual(getState().isOpen, false, 'closeCart closes')
  useCart.getState().setOpen(true)
  assertEqual(getState().isOpen, true, 'setOpen(true)')
})

// === Summary ===
console.log(`\ncart-store.test.ts: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
