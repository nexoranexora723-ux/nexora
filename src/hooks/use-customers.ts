// NEXORA — Customer domain hooks (TanStack Query wrappers)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CustomerWithRelations } from '@/server/services/customer.service'
import type { CreateCustomerInput, UpdateCustomerInput, CustomerQuery } from '@/lib/schemas/customer.schema'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useCustomers(query?: Partial<CustomerQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.status) params.set('status', query.status)
  if (query?.sort) params.set('sort', query.sort)
  const qs = params.toString()
  return useQuery<CustomerWithRelations[]>({
    queryKey: ['customers', qs],
    queryFn: () => fetchJson(`/api/customers${qs ? `?${qs}` : ''}`),
  })
}

export function useCustomer(id: string | null) {
  return useQuery<CustomerWithRelations>({
    queryKey: ['customer', id],
    queryFn: () => fetchJson(`/api/customers/${id}`),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      fetchJson('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      fetchJson(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useToggleCustomerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'VIP' }) =>
      fetchJson(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
