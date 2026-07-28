// NEXORA — Product domain hooks (eliminates useQuery duplication per audit)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProductWithRelations } from '@/server/services/product.service'
import type { CreateProductInput, UpdateProductInput, ProductQuery } from '@/lib/schemas/product.schema'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useProducts(query?: Partial<ProductQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.status) params.set('status', query.status)
  if (query?.brandId) params.set('brandId', query.brandId)
  if (query?.categoryId) params.set('categoryId', query.categoryId)
  if (query?.supplierId) params.set('supplierId', query.supplierId)
  if (query?.sort) params.set('sort', query.sort)
  const qs = params.toString()
  return useQuery<ProductWithRelations[]>({
    queryKey: ['products', qs],
    queryFn: () => fetchJson(`/api/products${qs ? `?${qs}` : ''}`),
  })
}

export function useProduct(id: string | null) {
  return useQuery<ProductWithRelations>({
    queryKey: ['product', id],
    queryFn: () => fetchJson(`/api/products/${id}`),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      fetchJson('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      fetchJson(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product'] })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useToggleProductStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' }) =>
      fetchJson(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
