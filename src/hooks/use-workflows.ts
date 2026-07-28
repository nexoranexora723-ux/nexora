// NEXORA — Workflow domain hooks (TanStack Query)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { WorkflowView, WorkflowExecutionView } from '@/server/services/workflow.service'
import type { CreateWorkflowInput, UpdateWorkflowInput, WorkflowQuery } from '@/lib/schemas/workflow.schema'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function useWorkflows(query?: Partial<WorkflowQuery>) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.status) params.set('status', query.status)
  if (query?.triggerType) params.set('triggerType', query.triggerType)
  if (query?.sort) params.set('sort', query.sort)
  const qs = params.toString()
  return useQuery<{ items: WorkflowView[]; stats: { total: number; active: number; inactive: number; runsToday: number; errors: number } }>({
    queryKey: ['workflows', qs],
    queryFn: () => fetchJson(`/api/workflows${qs ? `?${qs}` : ''}`),
  })
}

export function useWorkflow(id: string | null) {
  return useQuery<WorkflowView>({
    queryKey: ['workflow', id],
    queryFn: () => fetchJson(`/api/workflows/${id}`),
    enabled: !!id,
  })
}

export function useCreateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateWorkflowInput) =>
      fetchJson('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}

export function useUpdateWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkflowInput }) =>
      fetchJson(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflows'] })
      qc.invalidateQueries({ queryKey: ['workflow'] })
    },
  })
}

export function useDeleteWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/workflows/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}

export function useToggleWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/workflows/${id}`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}

export function useExecuteWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/workflows/${id}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}

export function useWorkflowExecutions(workflowId: string | null) {
  return useQuery<{ items: WorkflowExecutionView[] }>({
    queryKey: ['workflow-executions', workflowId],
    queryFn: () => fetchJson(`/api/workflows/${workflowId}/executions`),
    enabled: !!workflowId,
  })
}
