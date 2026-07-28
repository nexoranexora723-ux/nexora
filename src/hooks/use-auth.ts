// NEXORA — Auth & RBAC hooks
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth, type AuthUser } from '@/lib/auth-store'
import type { UserWithRelations } from '@/server/services/user.service'
import type { RoleWithRelations } from '@/server/services/role.service'
import type { LoginInput, CreateUserInput, UpdateUserInput, CreateRoleInput, UpdateRoleInput } from '@/lib/schemas/auth.schema'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// === Auth ===
export function useLogin() {
  const setUser = useAuth((s) => s.setUser)
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const result = await fetchJson<{ user: AuthUser; permissions: string[] }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      return result
    },
    onSuccess: (data) => setUser(data.user, data.permissions),
  })
}

export function useLogout() {
  const logout = useAuth((s) => s.logout)
  return useMutation({
    mutationFn: async () => fetchJson('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => logout(),
  })
}

export function useSession() {
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuth()
  return useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const data = await fetchJson<{ user: AuthUser | null; authenticated: boolean }>('/api/auth/session')
      setUser(data.user, data.user ? undefined : [])
      return data
    },
    enabled: isLoading,
    staleTime: 5 * 60 * 1000,
  })
}

// === Users ===
export function useUsers(query?: { q?: string; status?: string; roleId?: string; branchId?: string }) {
  const params = new URLSearchParams()
  if (query?.q) params.set('q', query.q)
  if (query?.status) params.set('status', query.status)
  if (query?.roleId) params.set('roleId', query.roleId)
  if (query?.branchId) params.set('branchId', query.branchId)
  const qs = params.toString()
  return useQuery<UserWithRelations[]>({
    queryKey: ['users', qs],
    queryFn: () => fetchJson(`/api/users${qs ? `?${qs}` : ''}`),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      fetchJson('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      fetchJson(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      qc.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useToggleUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }) =>
      fetchJson(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

// === Roles ===
export function useRoles() {
  return useQuery<RoleWithRelations[]>({
    queryKey: ['roles'],
    queryFn: () => fetchJson('/api/roles'),
  })
}

export function usePermissions() {
  return useQuery<Record<string, { id: string; action: string }[]>>({
    queryKey: ['permissions'],
    queryFn: () => fetchJson('/api/roles/permissions'),
  })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRoleInput) =>
      fetchJson('/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoleInput }) =>
      fetchJson(`/api/roles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/roles/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}

// === Branches ===
export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => fetchJson('/api/branches'),
  })
}
