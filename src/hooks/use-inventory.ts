// NEXORA — Inventory domain hooks (TanStack Query wrappers)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  InventoryWithRelations,
  InventoryMovementWithRelations,
} from '@/server/services/inventory.service'
import type { AdjustStockInput, InventoryQuery, MovementQuery } from '@/lib/schemas/inventory.schema'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useInventory(query?: Partial<InventoryQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.warehouseId) params.set('warehouseId', query.warehouseId)
  if (query?.status) params.set('status', query.status)
  const qs = params.toString()
  return useQuery<InventoryWithRelations[]>({
    queryKey: ['inventory', qs],
    queryFn: () => fetchJson(`/api/inventory${qs ? `?${qs}` : ''}`),
  })
}

export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AdjustStockInput) =>
      fetchJson('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useInventoryMovements(query?: Partial<MovementQuery>) {
  const params = new URLSearchParams()
  if (query?.productId) params.set('productId', query.productId)
  if (query?.warehouseId) params.set('warehouseId', query.warehouseId)
  if (query?.type) params.set('type', query.type)
  if (query?.dateFrom) params.set('dateFrom', query.dateFrom)
  if (query?.dateTo) params.set('dateTo', query.dateTo)
  const qs = params.toString()
  return useQuery<InventoryMovementWithRelations[]>({
    queryKey: ['inventory-movements', qs],
    queryFn: () => fetchJson(`/api/inventory/movements${qs ? `?${qs}` : ''}`),
  })
}
