// NEXORA — Basic tests for format utilities
//
// NOTE: This is a self-contained test file with a minimal assertion
// framework (no external test runner required). Run with:
//
//   npx tsx src/lib/__tests__/format.test.ts
//
// (Do NOT execute as part of CI — these files exist for documentation
//  coverage and to demonstrate intended behavior.)

import { formatCurrency, formatNumber, formatCompact, formatPercent, marginPct, inventoryStatus, initials, timeAgo, formatDate } from '../format'

// === Minimal test framework ===
let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++
    // console.log(`✓ ${message}`)
  } else {
    failed++
    console.error(`✗ ${message}`)
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`)
}

function describe(name: string, fn: () => void): void {
  // console.log(`\n${name}`)
  fn()
}

// === Tests ===

describe('formatCurrency', () => {
  assertEqual(formatCurrency(0), '$0.00', 'formats zero')
  assertEqual(formatCurrency(1234.5), '$1,234.50', 'formats thousands separator')
  assertEqual(formatCurrency(1234.5, 'USD'), '$1,234.50', 'USD prefix')
  assertEqual(formatCurrency(100, 'EUR'), '€100.00', 'EUR prefix')
  assertEqual(formatCurrency(99.999), '$100.00', 'rounds to 2 decimals')
  assertEqual(formatCurrency(-50), '$-50.00', 'handles negative')
  assertEqual(formatCurrency(1_000_000), '$1,000,000.00', 'formats millions')
})

describe('formatNumber', () => {
  assertEqual(formatNumber(0), '0', 'zero')
  assertEqual(formatNumber(1000), '1,000', 'thousands separator')
  assertEqual(formatNumber(1234567), '1,234,567', 'millions separator')
  assertEqual(formatNumber(-42), '-42', 'negative numbers')
})

describe('formatCompact', () => {
  assertEqual(formatCompact(500), '$500', 'under 1K')
  assertEqual(formatCompact(1500), '$1.5K', 'thousands compact')
  assertEqual(formatCompact(1_500_000), '$1.5M', 'millions compact')
})

describe('formatPercent', () => {
  assertEqual(formatPercent(50), '50.0%', 'default digits')
  assertEqual(formatPercent(33.333, 2), '33.33%', 'custom digits')
  assertEqual(formatPercent(0), '0.0%', 'zero percent')
})

describe('marginPct', () => {
  assertEqual(marginPct(50, 100), 50, '50% margin')
  assertEqual(marginPct(100, 100), 0, '0% margin')
  assertEqual(marginPct(0, 100), 100, '100% margin')
  assertEqual(marginPct(50, 0), 0, 'zero sale price returns 0 (no division by zero)')
})

describe('inventoryStatus', () => {
  assertEqual(inventoryStatus(0, 5), 'OUT', 'out of stock')
  assertEqual(inventoryStatus(5, 5), 'LOW', 'at minimum (low)')
  assertEqual(inventoryStatus(3, 5), 'LOW', 'below minimum (low)')
  assertEqual(inventoryStatus(10, 5), 'OK', 'above minimum (ok)')
  assertEqual(inventoryStatus(-1, 5), 'OUT', 'negative stock is OUT')
})

describe('initials', () => {
  assertEqual(initials('Adrián', 'Gómez'), 'AG', 'two names')
  assertEqual(initials('María'), 'M', 'one name only')
  assertEqual(initials('a', 'b'), 'AB', 'lowercase gets uppercased')
})

describe('timeAgo', () => {
  const now = new Date()
  const secondsAgo = new Date(now.getTime() - 30 * 1000)
  const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const hoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const daysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  assertEqual(timeAgo(secondsAgo), 'hace un momento', '30s ago')
  assertEqual(timeAgo(minutesAgo), 'hace 5 min', '5 min ago')
  assertEqual(timeAgo(hoursAgo), 'hace 3 h', '3 hours ago')
  assertEqual(timeAgo(daysAgo), 'hace 5 d', '5 days ago')
})

describe('formatDate', () => {
  const d = new Date('2025-03-15T10:00:00Z')
  const out = formatDate(d)
  assert(out.includes('2025'), 'formatDate includes year')
  assert(out.includes('mar') || out.includes('Mar'), 'formatDate includes month abbreviation')
})

// === Summary ===
console.log(`\nformat.test.ts: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
