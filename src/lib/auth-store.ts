// NEXORA — Auth store (client-side session management with Zustand + persist)
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  position: string | null
  avatarUrl: string | null
  role: string
  roleName: string | null
  branchId: string | null
  branchName: string | null
  companyId: string
  timezone: string | null
  language: string | null
}

interface AuthState {
  user: AuthUser | null
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: AuthUser | null, permissions?: string[]) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  hasPermission: (module: string, action: string) => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      isAuthenticated: false,
      isLoading: true,
      setUser: (user, permissions = []) => set({ user, permissions, isAuthenticated: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, permissions: [], isAuthenticated: false }),
      hasPermission: (module, action) => {
        const perms = get().permissions
        // ADMIN and CEO roles have implicit all-permissions
        const role = get().user?.role
        if (role === 'ADMIN' || role === 'CEO') return true
        return perms.includes(`${module}:${action}`)
      },
    }),
    { name: 'nexora-auth' },
  ),
)
