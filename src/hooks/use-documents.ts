// NEXORA — Document domain hooks (TanStack Query)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DocumentView } from '@/server/services/document.service'
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentQuery,
} from '@/lib/schemas/document.schema'

interface DocumentListResponse {
  items: DocumentView[]
  stats: {
    total: number
    active: number
    archived: number
    categories: number
    byCategory: { category: string; count: number }[]
    recent: number
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useDocuments(query?: Partial<DocumentQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.category) params.set('category', query.category)
  if (query?.entityType) params.set('entityType', query.entityType)
  if (query?.status) params.set('status', query.status)
  const qs = params.toString()
  return useQuery<DocumentListResponse>({
    queryKey: ['documents', qs],
    queryFn: () => fetchJson(`/api/documents${qs ? `?${qs}` : ''}`),
  })
}

export function useDocument(id: string | null) {
  return useQuery<DocumentView>({
    queryKey: ['document', id],
    queryFn: () => fetchJson(`/api/documents/${id}`),
    enabled: !!id,
  })
}

export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDocumentInput) =>
      fetchJson('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useUpdateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDocumentInput }) =>
      fetchJson(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['document'] })
    },
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export function useArchiveDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'archive' | 'restore' }) =>
      fetchJson(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}
