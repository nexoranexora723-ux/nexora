// NEXORA — Auth middleware for API routes
import { NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'

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

// Get authenticated user from request, or null
export async function getUser(req: Request): Promise<AuthUser | null> {
  const token = req.cookies.get('nexora-session')?.value
  if (!token) return null
  return await AuthService.validate(token)
}

// Require authentication — returns user or 401 response
export async function requireAuth(req: Request): Promise<AuthUser | NextResponse> {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  return user
}

// Require admin role — returns user or 403 response
export async function requireAdmin(req: Request): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(req)
  if (result instanceof NextResponse) return result
  if (result.role !== 'ADMIN' && result.role !== 'SUPER_ADMIN' && result.role !== 'EMPLOYEE') {
    return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 })
  }
  return result
}

// Require admin only (no employees) — for sensitive operations
export async function requireSuperAdmin(req: Request): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(req)
  if (result instanceof NextResponse) return result
  if (result.role !== 'ADMIN' && result.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Se requieren permisos de administrador' }, { status: 403 })
  }
  return result
}

// Check if user is a client
export function isClient(user: AuthUser): boolean {
  return user.role === 'CLIENT' || user.role === 'RESELLER'
}

// Check if user is admin/employee
export function isStaff(user: AuthUser): boolean {
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'EMPLOYEE'
}
