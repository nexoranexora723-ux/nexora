// NEXORA — Purchase domain hooks (TanStack Query wrappers)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PurchaseWithRelations } from '@/server/services/purchase.service'
import type { CreatePurchaseInput, UpdatePurchaseInput, PurchaseQuery } from '@/lib/schemas/purchase.schema'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function usePurchases(query?: Partial<PurchaseQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.status) params.set('status', query.status)
  if (query?.supplierId) params.set('supplierId', query.supplierId)
  if (query?.sort) params.set('sort', query.sort)
  const qs = params.toString()
  return useQuery<PurchaseWithRelations[]>({
    queryKey: ['purchases', qs],
    queryFn: () => fetchJson(`/api/purchases${qs ? `?${qs}` : ''}`),
  })
}

export function usePurchase(id: string | null) {
  return useQuery<PurchaseWithRelations>({
    queryKey: ['purchase', id],
    queryFn: () => fetchJson(`/api/purchases/${id}`),
    enabled: !!id,
  })
}

export function useCreatePurchase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePurchaseInput) =>
      fetchJson('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdatePurchase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePurchaseInput }) =>
      fetchJson(`/api/purchases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] })
      qc.invalidateQueries({ queryKey: ['purchase'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeletePurchase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/purchases/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useReceivePurchase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/purchases/${id}/receive`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] })
      qc.invalidateQueries({ queryKey: ['purchase'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useCancelPurchase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/purchases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
