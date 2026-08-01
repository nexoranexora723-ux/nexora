import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { LoginInput, RegisterInput } from '@/lib/schemas'
import { ChangePasswordInput } from '@/lib/schemas/auth.schema'

const SESSION_DURATION = 24 * 60 * 60 * 1000

function token() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface AuthResult {
  user: { id: string; firstName: string; lastName: string; email: string; role: string; position: string | null; phone: string | null; avatarUrl: string | null }
  sessionToken: string
}

export class AuthService {
  static async login(input: LoginInput, meta?: { ip?: string; ua?: string }): Promise<AuthResult> {
    const user = await db.user.findUnique({ where: { email: input.email, deletedAt: null } })
    if (!user) throw new Error('Credenciales inválidas')
    const valid = await bcrypt.compare(input.password, user.password)
    if (!valid) throw new Error('Credenciales inválidas')
    if (user.status !== 'ACTIVE') throw new Error('Cuenta inactiva. Contacta al administrador.')

    const t = token()
    await db.session.create({ data: { userId: user.id, token: t, ipAddress: meta?.ip, userAgent: meta?.ua, expiresAt: new Date(Date.now() + SESSION_DURATION) } })
    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await db.auditLog.create({ data: { userId: user.id, action: 'LOGIN', entity: 'auth', entityId: user.id, result: 'SUCCESS', ipAddress: meta?.ip } })

    return {
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position, phone: user.phone, avatarUrl: user.avatarUrl },
      sessionToken: t,
    }
  }

  static async register(input: RegisterInput, companyId: string): Promise<AuthResult> {
    const existing = await db.user.findUnique({ where: { email: input.email } })
    if (existing) throw new Error('Ya existe una cuenta con este correo')

    const hash = await bcrypt.hash(input.password, 10)
    const user = await db.user.create({
      data: { firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone || null, password: hash, role: 'CLIENT', status: 'ACTIVE', companyId },
    })

    const t = token()
    await db.session.create({ data: { userId: user.id, token: t, expiresAt: new Date(Date.now() + SESSION_DURATION) } })
    await db.auditLog.create({ data: { userId: user.id, action: 'REGISTER', entity: 'auth', entityId: user.id, result: 'SUCCESS' } })

    return {
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position, phone: user.phone, avatarUrl: user.avatarUrl },
      sessionToken: t,
    }
  }

  static async logout(t: string): Promise<void> {
    const s = await db.session.findUnique({ where: { token: t } })
    if (s && !s.revokedAt) {
      await db.session.update({ where: { id: s.id }, data: { revokedAt: new Date() } })
      await db.auditLog.create({ data: { userId: s.userId, action: 'LOGOUT', entity: 'auth', entityId: s.userId, result: 'SUCCESS' } })
    }
  }

  static async validate(t: string) {
    const s = await db.session.findUnique({ where: { token: t, revokedAt: null }, include: { user: true } })
    if (!s) return null
    if (s.expiresAt < new Date()) {
      await db.session.update({ where: { id: s.id }, data: { revokedAt: new Date() } })
      return null
    }
    return { id: s.user.id, firstName: s.user.firstName, lastName: s.user.lastName, email: s.user.email, role: s.user.role, position: s.user.position, phone: s.user.phone, avatarUrl: s.user.avatarUrl }
  }

  static async validateSession(t: string) {
    return this.validate(t)
  }

  static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await db.user.findUnique({ where: { id: userId, deletedAt: null } })
    if (!user) throw new Error('Usuario no encontrado')

    const valid = await bcrypt.compare(input.currentPassword, user.password)
    if (!valid) throw new Error('La contraseña actual es incorrecta')

    const hash = await bcrypt.hash(input.newPassword, 10)
    await db.user.update({ where: { id: userId }, data: { password: hash } })
    await db.auditLog.create({
      data: { userId, action: 'PASSWORD_CHANGE', entity: 'user', entityId: userId, result: 'SUCCESS' },
    })
  }
}
