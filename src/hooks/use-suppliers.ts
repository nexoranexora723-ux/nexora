// NEXORA — Supplier domain hooks (TanStack Query wrappers)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SupplierWithRelations } from '@/server/services/supplier.service'
import type { CreateSupplierInput, UpdateSupplierInput, SupplierQuery } from '@/lib/schemas/supplier.schema'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useSuppliers(query?: Partial<SupplierQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.status) params.set('status', query.status)
  if (query?.riskLevel) params.set('riskLevel', query.riskLevel)
  const qs = params.toString()
  return useQuery<SupplierWithRelations[]>({
    queryKey: ['suppliers', qs],
    queryFn: () => fetchJson(`/api/suppliers${qs ? `?${qs}` : ''}`),
  })
}

export function useSupplier(id: string | null) {
  return useQuery<SupplierWithRelations>({
    queryKey: ['supplier', id],
    queryFn: () => fetchJson(`/api/suppliers/${id}`),
    enabled: !!id,
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSupplierInput) =>
      fetchJson('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) =>
      fetchJson(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['supplier'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/suppliers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useToggleSupplierStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED' }) =>
      fetchJson(`/api/suppliers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}
