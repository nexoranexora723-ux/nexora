// NEXORA — Auth Service
// Handles login, logout, sessions, password changes, audit logging
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { LoginInput, ChangePasswordInput } from '@/lib/schemas/auth.schema'

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface AuthResult {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    position: string | null
    avatarUrl: string | null
    role: string
    roleId: string | null
    roleName: string | null
    branchId: string | null
    branchName: string | null
    companyId: string
    timezone: string | null
    language: string | null
  }
  permissions: string[] // e.g. ["products:view", "orders:edit"]
  sessionToken: string
}

export class AuthService {
  static async login(input: LoginInput, meta?: { ipAddress?: string; userAgent?: string }): Promise<AuthResult> {
    const user = await db.user.findUnique({
      where: { email: input.email, deletedAt: null },
      include: {
        roleRel: { include: { permissions: { include: { permission: true } } } },
        branch: true,
      },
    })

    // Audit log attempt (even if user not found, we log the email attempt)
    if (!user) {
      await db.auditLog.create({
        data: {
          userId: 'unknown',
          action: 'LOGIN',
          entity: 'auth',
          result: 'FAILURE',
          metadata: JSON.stringify({ email: input.email, reason: 'user_not_found' }),
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      }).catch(() => {})
      throw new Error('Credenciales inválidas')
    }

    const valid = await bcrypt.compare(input.password, user.password)
    if (!valid) {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'auth',
          entityId: user.id,
          result: 'FAILURE',
          metadata: JSON.stringify({ reason: 'wrong_password' }),
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      })
      throw new Error('Credenciales inválidas')
    }

    if (user.status !== 'ACTIVE') {
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'auth',
          entityId: user.id,
          result: 'FAILURE',
          metadata: JSON.stringify({ reason: 'inactive_account', status: user.status }),
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        },
      })
      throw new Error(`Cuenta ${user.status === 'SUSPENDED' ? 'suspendida' : 'inactiva'}. Contacta al administrador.`)
    }

    // Create session
    const token = generateToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
    await db.session.create({
      data: {
        userId: user.id,
        token,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        expiresAt,
      },
    })

    // Update last login
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

    // Audit success
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'auth',
        entityId: user.id,
        result: 'SUCCESS',
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    })

    const permissions = (user.roleRel?.permissions ?? []).map((rp) => `${rp.permission.module}:${rp.permission.action}`)

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        position: user.position,
        avatarUrl: user.avatarUrl,
        role: user.role,
        roleId: user.roleId,
        roleName: user.roleRel?.name ?? null,
        branchId: user.branchId,
        branchName: user.branch?.name ?? null,
        companyId: user.companyId,
        timezone: user.timezone,
        language: user.language,
      },
      permissions,
      sessionToken: token,
    }
  }

  static async logout(token: string): Promise<void> {
    const session = await db.session.findUnique({ where: { token } })
    if (session && !session.revokedAt) {
      await db.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } })
      await db.auditLog.create({
        data: { userId: session.userId, action: 'LOGOUT', entity: 'auth', entityId: session.userId, result: 'SUCCESS' },
      })
    }
  }

  static async validateSession(token: string): Promise<AuthResult['user'] | null> {
    const session = await db.session.findUnique({
      where: { token, revokedAt: null },
      include: {
        user: {
          include: {
            roleRel: { include: { permissions: { include: { permission: true } } } },
            branch: true,
          },
        },
      },
    })
    if (!session) return null
    if (session.expiresAt < new Date()) {
      await db.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } })
      return null
    }
    const u = session.user
    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      position: u.position,
      avatarUrl: u.avatarUrl,
      role: u.role,
      roleId: u.roleId,
      roleName: u.roleRel?.name ?? null,
      branchId: u.branchId,
      branchName: u.branch?.name ?? null,
      companyId: u.companyId,
      timezone: u.timezone,
      language: u.language,
    }
  }

  static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await db.user.findUnique({ where: { id: userId, deletedAt: null } })
    if (!user) throw new Error('Usuario no encontrado')

    const valid = await bcrypt.compare(input.currentPassword, user.password)
    if (!valid) throw new Error('Contraseña actual incorrecta')

    const newHash = await bcrypt.hash(input.newPassword, 10)
    await db.user.update({ where: { id: userId }, data: { password: newHash } })

    // Revoke all sessions (force re-login)
    await db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })

    await db.auditLog.create({
      data: { userId, action: 'PASSWORD_CHANGE', entity: 'user', entityId: userId, result: 'SUCCESS' },
    })
  }

  static async revokeAllSessions(userId: string, exceptToken?: string): Promise<void> {
    await db.session.updateMany({
      where: { userId, revokedAt: null, ...(exceptToken ? { NOT: { token: exceptToken } } : {}) },
      data: { revokedAt: new Date() },
    })
    await db.auditLog.create({
      data: { userId, action: 'REVOKE_SESSIONS', entity: 'auth', entityId: userId, result: 'SUCCESS' },
    })
  }
}
