// NEXORA — Notification domain hooks (TanStack Query)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NotificationView } from '@/server/services/notification.service'
import type {
  CreateNotificationInput,
  NotificationQuery,
} from '@/lib/schemas/notification.schema'

interface NotificationListResponse {
  items: NotificationView[]
  stats: {
    total: number
    unread: number
    high: number
    critical: number
    today: number
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

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['notifications'] })
  qc.invalidateQueries({ queryKey: ['unread-count'] })
}

export function useNotifications(query?: Partial<NotificationQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.type) params.set('type', query.type)
  if (query?.priority) params.set('priority', query.priority)
  if (query?.unreadOnly) params.set('unreadOnly', 'true')
  const qs = params.toString()
  return useQuery<NotificationListResponse>({
    queryKey: ['notifications', qs],
    queryFn: () => fetchJson(`/api/notifications${qs ? `?${qs}` : ''}`),
  })
}

export function useUnreadCount() {
  return useQuery<{ total: number; unread: number }>({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const data = await fetchJson<NotificationListResponse>('/api/notifications?unreadOnly=true')
      return { total: data.stats.total, unread: data.stats.unread }
    },
    refetchInterval: 30_000, // light polling for the bell badge
  })
}

export function useCreateNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateNotificationInput) =>
      fetchJson('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/notifications/${id}`, { method: 'PATCH' }),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => fetchJson<{ success: boolean; count: number }>('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/notifications/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateAll(qc),
  })
}
