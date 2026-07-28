// NEXORA — Finance domain hooks (TanStack Query wrappers)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  FinanceOverview,
  TransactionView,
} from '@/server/services/finance.service'
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionQuery,
} from '@/lib/schemas/finance.schema'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// Full overview (transactions + summary + monthly + categories) — used by the finance view
export function useFinance() {
  return useQuery<FinanceOverview>({
    queryKey: ['finance'],
    queryFn: () => fetchJson('/api/finance'),
  })
}

// Filtered transactions only
export function useTransactions(query?: Partial<TransactionQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.type) params.set('type', query.type)
  if (query?.category) params.set('category', query.category)
  if (query?.dateFrom) params.set('dateFrom', query.dateFrom)
  if (query?.dateTo) params.set('dateTo', query.dateTo)
  if (query?.sort) params.set('sort', query.sort)
  const qs = params.toString()
  return useQuery<{ transactions: TransactionView[] }>({
    queryKey: ['transactions', qs],
    queryFn: () => fetchJson(`/api/finance${qs ? `?${qs}` : ''}`),
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      fetchJson('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransactionInput }) =>
      fetchJson(`/api/finance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/finance/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
