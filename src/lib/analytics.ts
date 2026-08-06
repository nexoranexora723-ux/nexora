/**
 * NEXORA — Analytics & Metrics
 *
 * - Dashboard de ventas
 * - Métricas de conversión (visitas → carritos → checkouts → ventas)
 * - Heatmap tracking (clics por zona)
 * - A/B testing framework
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// EVENT TRACKING
// ============================================================================

export type AnalyticsEvent =
  | 'page_view'
  | 'product_view'
  | 'product_search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'add_to_wishlist'
  | 'begin_checkout'
  | 'complete_purchase'
  | 'abandon_cart'
  | 'share_product'
  | 'contact_whatsapp'
  | 'apply_coupon'
  | 'newsletter_signup'
  | 'login'
  | 'register'

export interface TrackedEvent {
  id: string
  event: AnalyticsEvent
  timestamp: number
  userId?: string
  sessionId: string
  properties?: Record<string, any>
  page?: string
}

// ============================================================================
// SESSION TRACKING
// ============================================================================

function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

interface AnalyticsState {
  sessionId: string
  events: TrackedEvent[]
  track: (event: AnalyticsEvent, properties?: Record<string, any>) => void
  getSessionStats: () => {
    totalEvents: number
    uniqueEvents: number
    eventsByType: Record<string, number>
  }
  clearEvents: () => void
}

export const useAnalytics = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      sessionId: generateSessionId(),
      events: [],

      track: (event, properties) => {
        const tracked: TrackedEvent = {
          id: `e_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          event,
          timestamp: Date.now(),
          sessionId: get().sessionId,
          properties,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }
        set((state) => ({
          events: [...state.events.slice(-499), tracked], // max 500 events
        }))

        // Enviar a Google Analytics si está disponible
        if (typeof window !== 'undefined' && (window as any).gtag) {
          ;(window as any).gtag('event', event, properties)
        }
      },

      getSessionStats: () => {
        const events = get().events
        const eventsByType: Record<string, number> = {}
        for (const e of events) {
          eventsByType[e.event] = (eventsByType[e.event] || 0) + 1
        }
        return {
          totalEvents: events.length,
          uniqueEvents: Object.keys(eventsByType).length,
          eventsByType,
        }
      },

      clearEvents: () => set({ events: [] }),
    }),
    {
      name: 'nexora-analytics',
      partialize: (state) => ({ sessionId: state.sessionId, events: state.events }),
    }
  )
)

// ============================================================================
// CONVERSION FUNNEL
// ============================================================================

export interface FunnelStep {
  step: string
  event: AnalyticsEvent
  count: number
  conversionRate: number // % relativo al paso anterior
  dropoffRate: number // % que abandonó
}

export function calculateConversionFunnel(events: TrackedEvent[]): FunnelStep[] {
  const steps: Array<{ step: string; event: AnalyticsEvent }> = [
    { step: 'Visitas', event: 'page_view' },
    { step: 'Vistas de producto', event: 'product_view' },
    { step: 'Agregar al carrito', event: 'add_to_cart' },
    { step: 'Iniciar checkout', event: 'begin_checkout' },
    { step: 'Compras completadas', event: 'complete_purchase' },
  ]

  const counts: Record<string, number> = {}
  for (const e of events) {
    counts[e.event] = (counts[e.event] || 0) + 1
  }

  const result: FunnelStep[] = []
  let prevCount = counts[steps[0].event] || 0

  for (let i = 0; i < steps.length; i++) {
    const count = counts[steps[i].event] || 0
    const conversionRate = i === 0 ? 100 : (prevCount > 0 ? (count / prevCount) * 100 : 0)
    const dropoffRate = i === 0 ? 0 : 100 - conversionRate

    result.push({
      step: steps[i].step,
      event: steps[i].event,
      count,
      conversionRate: Math.round(conversionRate * 10) / 10,
      dropoffRate: Math.round(dropoffRate * 10) / 10,
    })

    prevCount = count
  }

  return result
}

// ============================================================================
// HEATMAP TRACKING (clics por zona de pantalla)
// ============================================================================

export interface HeatmapPoint {
  x: number // 0-100 (% del ancho)
  y: number // 0-100 (% del alto)
  timestamp: number
  element?: string // selector o texto del elemento clickeado
  page: string
}

interface HeatmapState {
  points: HeatmapPoint[]
  trackClick: (x: number, y: number, element?: string) => void
  getPointsByPage: (page: string) => HeatmapPoint[]
  clear: () => void
}

export const useHeatmap = create<HeatmapState>()(
  persist(
    (set, get) => ({
      points: [],

      trackClick: (x, y, element) => {
        const point: HeatmapPoint = {
          x: Math.round((x / window.innerWidth) * 10000) / 100,
          y: Math.round((y / window.innerHeight) * 10000) / 100,
          timestamp: Date.now(),
          element,
          page: window.location.pathname,
        }
        set((state) => ({
          points: [...state.points.slice(-999), point], // max 1000 points
        }))
      },

      getPointsByPage: (page) => {
        return get().points.filter((p) => p.page === page)
      },

      clear: () => set({ points: [] }),
    }),
    {
      name: 'nexora-heatmap',
    }
  )
)

// ============================================================================
// A/B TESTING FRAMEWORK
// ============================================================================

export interface ABTestVariant {
  id: string
  name: string
  weight: number // probabilidad (0-100)
}

export interface ABTest {
  id: string
  name: string
  description: string
  variants: ABTestVariant[]
  active: boolean
  startDate: Date
  endDate?: Date
}

// Tests predefinidos
export const AB_TESTS: ABTest[] = [
  {
    id: 'hero_cta_color',
    name: 'CTA Hero Color',
    description: 'Probar color del botón principal en hero',
    variants: [
      { id: 'control', name: 'Azul (control)', weight: 50 },
      { id: 'green', name: 'Verde WhatsApp', weight: 50 },
    ],
    active: true,
    startDate: new Date(),
  },
  {
    id: 'product_card_layout',
    name: 'Layout Product Card',
    description: 'Probar layout de tarjetas de producto',
    variants: [
      { id: 'vertical', name: 'Vertical (control)', weight: 50 },
      { id: 'horizontal', name: 'Horizontal', weight: 50 },
    ],
    active: false,
    startDate: new Date(),
  },
  {
    id: 'checkout_steps',
    name: 'Checkout Steps',
    description: 'Probar 4 pasos vs checkout de 1 página',
    variants: [
      { id: '4steps', name: '4 pasos (control)', weight: 50 },
      { id: '1page', name: '1 página', weight: 50 },
    ],
    active: false,
    startDate: new Date(),
  },
]

interface ABTestState {
  // Mapa testId → variantId asignado al usuario actual
  assignments: Record<string, string>
  getVariant: (testId: string) => string | null
  assignVariant: (testId: string) => string
  trackConversion: (testId: string, variantId: string) => void
  conversions: Record<string, Record<string, number>> // testId → variantId → count
}

export const useABTest = create<ABTestState>()(
  persist(
    (set, get) => ({
      assignments: {},
      conversions: {},

      getVariant: (testId) => {
        return get().assignments[testId] || null
      },

      assignVariant: (testId) => {
        const existing = get().assignments[testId]
        if (existing) return existing

        const test = AB_TESTS.find((t) => t.id === testId && t.active)
        if (!test) return 'control'

        // Selección ponderada
        const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0)
        const random = Math.random() * totalWeight
        let cumulative = 0
        let selected = test.variants[0].id

        for (const v of test.variants) {
          cumulative += v.weight
          if (random <= cumulative) {
            selected = v.id
            break
          }
        }

        set((state) => ({
          assignments: { ...state.assignments, [testId]: selected },
        }))

        return selected
      },

      trackConversion: (testId, variantId) => {
        set((state) => ({
          conversions: {
            ...state.conversions,
            [testId]: {
              ...state.conversions[testId],
              [variantId]: (state.conversions[testId]?.[variantId] || 0) + 1,
            },
          },
        }))
      },
    }),
    {
      name: 'nexora-ab-tests',
    }
  )
)

/**
 * Hook para usar A/B test en componentes
 */
export function useABTestVariant(testId: string): string {
  const { getVariant, assignVariant } = useABTest()
  if (typeof window === 'undefined') return 'control'
  return getVariant(testId) || assignVariant(testId)
}
