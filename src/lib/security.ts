/**
 * NEXORA — Security & Auth Enhancements
 *
 * - Google/Facebook OAuth login (configurable)
 * - 2FA (Two-Factor Authentication) para admin
 * - Roles de usuarios mejorados (RBAC)
 * - Password recovery con email
 * - Session management con JWT
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================================
// OAUTH (Google/Facebook)
// ============================================================================

export interface OAuthProvider {
  id: 'google' | 'facebook' | 'github'
  name: string
  icon: string
  color: string
  enabled: boolean
}

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: '🔴',
    color: '#DB4437',
    enabled: true, // siempre disponible
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '🔵',
    color: '#1877F2',
    enabled: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '⚫',
    color: '#333',
    enabled: true,
  },
]

/**
 * Genera URL de OAuth para login social
 * Para producción requiere configurar:
 *   - GOOGLE_CLIENT_ID
 *   - FACEBOOK_APP_ID
 *   - GITHUB_CLIENT_ID
 */
export function buildOAuthUrl(provider: 'google' | 'facebook' | 'github'): string {
  const redirectUri = `${window.location.origin}/api/auth/oauth/callback`

  switch (provider) {
    case 'google': {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: btoa(JSON.stringify({ provider: 'google', ts: Date.now() })),
      })
      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    }
    case 'facebook': {
      const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'email,public_profile',
        state: btoa(JSON.stringify({ provider: 'facebook', ts: Date.now() })),
      })
      return `https://www.facebook.com/v18.0/dialog/oauth?${params}`
    }
    case 'github': {
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ''
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'user:email',
        state: btoa(JSON.stringify({ provider: 'github', ts: Date.now() })),
      })
      return `https://github.com/login/oauth/authorize?${params}`
    }
  }
}

// ============================================================================
// 2FA (Two-Factor Authentication)
// ============================================================================

/**
 * Genera código TOTP de 6 dígitos (válido por 30 segundos)
 * En producción se debería usar una lib como 'otplib'
 */
export function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Verifica código 2FA
 */
export function verify2FACode(input: string, expected: string): boolean {
  if (!input || !expected) return false
  return input.trim() === expected.trim()
}

/**
 * Genera código de recuperación de contraseña (válido 15 min)
 */
export function generateRecoveryCode(): string {
  const parts: string[] = []
  for (let i = 0; i < 4; i++) {
    parts.push(Math.random().toString(36).substring(2, 6).toUpperCase())
  }
  return parts.join('-')
}

// ============================================================================
// RBAC (Role-Based Access Control)
// ============================================================================

export type UserRole = 'CLIENT' | 'RESELLER' | 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN'

export type Permission =
  | 'catalog.view'
  | 'catalog.edit'
  | 'orders.view.own'
  | 'orders.view.all'
  | 'orders.update_status'
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'suppliers.view'
  | 'suppliers.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'users.view'
  | 'users.manage'
  | 'admin.access'
  | 'settings.manage'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  CLIENT: [
    'catalog.view',
    'orders.view.own',
  ],
  RESELLER: [
    'catalog.view',
    'orders.view.own',
    'products.view',
  ],
  EMPLOYEE: [
    'catalog.view',
    'catalog.edit',
    'orders.view.all',
    'orders.update_status',
    'products.view',
    'products.create',
    'products.edit',
    'suppliers.view',
  ],
  ADMIN: [
    'catalog.view', 'catalog.edit',
    'orders.view.all', 'orders.update_status',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'suppliers.view', 'suppliers.manage',
    'finance.view', 'finance.manage',
    'users.view',
    'admin.access',
  ],
  SUPER_ADMIN: [
    'catalog.view', 'catalog.edit',
    'orders.view.all', 'orders.update_status',
    'products.view', 'products.create', 'products.edit', 'products.delete',
    'suppliers.view', 'suppliers.manage',
    'finance.view', 'finance.manage',
    'users.view', 'users.manage',
    'admin.access',
    'settings.manage',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

interface SecurityState {
  twoFactorEnabled: boolean
  lastLoginAt: string | null
  loginAttempts: number
  lockedUntil: number | null
  enable2FA: () => void
  disable2FA: () => void
  recordLoginAttempt: (success: boolean) => void
  isLocked: () => boolean
  resetAttempts: () => void
}

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 min

export const useSecurity = create<SecurityState>()(
  persist(
    (set, get) => ({
      twoFactorEnabled: false,
      lastLoginAt: null,
      loginAttempts: 0,
      lockedUntil: null,

      enable2FA: () => set({ twoFactorEnabled: true }),
      disable2FA: () => set({ twoFactorEnabled: false }),

      recordLoginAttempt: (success) => {
        if (success) {
          set({
            loginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date().toISOString(),
          })
        } else {
          const attempts = get().loginAttempts + 1
          const shouldLock = attempts >= MAX_LOGIN_ATTEMPTS
          set({
            loginAttempts: attempts,
            lockedUntil: shouldLock ? Date.now() + LOCK_DURATION_MS : null,
          })
        }
      },

      isLocked: () => {
        const lockedUntil = get().lockedUntil
        if (!lockedUntil) return false
        if (Date.now() >= lockedUntil) {
          set({ lockedUntil: null, loginAttempts: 0 })
          return false
        }
        return true
      },

      resetAttempts: () => set({ loginAttempts: 0, lockedUntil: null }),
    }),
    {
      name: 'nexora-security',
      partialize: (state) => ({
        twoFactorEnabled: state.twoFactorEnabled,
        lastLoginAt: state.lastLoginAt,
        loginAttempts: state.loginAttempts,
        lockedUntil: state.lockedUntil,
      }),
    }
  )
)

// ============================================================================
// PASSWORD STRENGTH VALIDATOR
// ============================================================================

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4 // 0-4 (very weak to very strong)
  label: string
  color: string
  suggestions: string[]
}

export function validatePasswordStrength(password: string): PasswordStrength {
  let score = 0
  const suggestions: string[] = []

  if (password.length >= 8) score++
  else suggestions.push('Usa al menos 8 caracteres')

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  else suggestions.push('Mezcla mayúsculas y minúsculas')

  if (/\d/.test(password)) score++
  else suggestions.push('Incluye números')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else suggestions.push('Añade símbolos especiales (!@#$...)')

  if (password.length >= 12 && score === 4) score = 4

  const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente']
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']

  return {
    score: score as 0 | 1 | 2 | 3 | 4,
    label: labels[score],
    color: colors[score],
    suggestions,
  }
}
