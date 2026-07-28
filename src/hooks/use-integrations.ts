// NEXORA — Integration domain hooks (TanStack Query)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { IntegrationView, IntegrationLogView } from '@/server/services/integration.service'
import type {
  CreateIntegrationInput,
  UpdateIntegrationInput,
  IntegrationQuery,
} from '@/lib/schemas/integration.schema'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

interface IntegrationsResponse {
  items: IntegrationView[]
  stats: {
    total: number
    active: number
    errors: number
    byCategory: { category: string; count: number }[]
    syncsToday: number
  }
}

export function useIntegrations(query?: Partial<IntegrationQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.category) params.set('category', query.category)
  if (query?.provider) params.set('provider', query.provider)
  if (query?.status) params.set('status', query.status)
  if (query?.sort) params.set('sort', query.sort)
  const qs = params.toString()
  return useQuery<IntegrationsResponse>({
    queryKey: ['integrations', qs],
    queryFn: () => fetchJson(`/api/integrations${qs ? `?${qs}` : ''}`),
  })
}

export function useIntegration(id: string | null) {
  return useQuery<IntegrationView>({
    queryKey: ['integration', id],
    queryFn: () => fetchJson(`/api/integrations/${id}`),
    enabled: !!id,
  })
}

export function useCreateIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateIntegrationInput) =>
      fetchJson('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

export function useUpdateIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateIntegrationInput }) =>
      fetchJson(`/api/integrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] })
      qc.invalidateQueries({ queryKey: ['integration'] })
    },
  })
}

export function useDeleteIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/integrations/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

export function useConnectIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'connect' | 'disconnect' }) =>
      fetchJson(`/api/integrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })
}

export function useTestIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/integrations/${id}/test`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] })
      qc.invalidateQueries({ queryKey: ['integration-logs'] })
    },
  })
}

export function useIntegrationLogs(integrationId: string | null) {
  return useQuery<{ items: IntegrationLogView[] }>({
    queryKey: ['integration-logs', integrationId],
    queryFn: () => fetchJson(`/api/integrations/${integrationId}/test`),
    enabled: !!integrationId,
  })
}
