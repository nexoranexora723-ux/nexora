'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  position: string | null
  phone: string | null
  avatarUrl: string | null
}

type Portal = 'public' | 'client' | 'admin'

interface AuthState {
  user: AuthUser | null
  portal: Portal
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setPortal: (p: Portal) => void
  setLoading: (b: boolean) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      portal: 'public',
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          portal: user ? (user.role === 'CLIENT' || user.role === 'RESELLER' ? 'client' : 'admin') : 'public',
        }),
      setPortal: (portal) => set({ portal }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isAuthenticated: false, portal: 'public', isLoading: false }),
    }),
    {
      name: 'nexora-auth',
      // Only persist the user object. isLoading / isAuthenticated / portal are
      // derived/ephemeral and must NOT be hydrated — otherwise SSR renders with
      // the defaults (isLoading:true, isAuthenticated:false) while the client
      // hydrates with persisted (isLoading:false, isAuthenticated:true),
      // causing a hydration mismatch that crashes the catalog for authed users.
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
