// NEXORA — User Service (RBAC)
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { CreateUserInput, UpdateUserInput, UserQuery } from '@/lib/schemas/auth.schema'

export interface UserWithRelations {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  position: string | null
  role: string
  roleId: string | null
  roleName: string | null
  status: string
  companyId: string
  branchId: string | null
  branchName: string | null
  timezone: string | null
  language: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

const INCLUDE = {
  roleRel: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrich(p: any): UserWithRelations {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone,
    avatarUrl: p.avatarUrl,
    position: p.position,
    role: p.role,
    roleId: p.roleId,
    roleName: p.roleRel?.name ?? null,
    status: p.status,
    companyId: p.companyId,
    branchId: p.branchId,
    branchName: p.branch?.name ?? null,
    timezone: p.timezone,
    language: p.language,
    lastLoginAt: p.lastLoginAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

export class UserService {
  static async list(query: UserQuery): Promise<UserWithRelations[]> {
    const where: Record<string, unknown> = { deletedAt: null }
    if (query.q) {
      where.OR = [
        { firstName: { contains: query.q } },
        { lastName: { contains: query.q } },
        { email: { contains: query.q } },
        { position: { contains: query.q } },
      ]
    }
    if (query.status) where.status = query.status
    if (query.roleId) where.roleId = query.roleId
    if (query.branchId) where.branchId = query.branchId

    const users = await db.user.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    return users.map(enrich)
  }

  static async getById(id: string): Promise<UserWithRelations | null> {
    const u = await db.user.findUnique({ where: { id, deletedAt: null }, include: INCLUDE })
    return u ? enrich(u) : null
  }

  static async create(input: CreateUserInput, companyId: string, createdBy?: string): Promise<UserWithRelations> {
    // Email uniqueness
    const existing = await db.user.findUnique({ where: { email: input.email } })
    if (existing) throw new Error(`Ya existe un usuario con email "${input.email}"`)

    const passwordHash = await bcrypt.hash(input.password, 10)
    const { branchId, ...data } = input

    const user = await db.user.create({
      data: {
        ...data,
        password: passwordHash,
        companyId,
        branchId: branchId || null,
      },
      include: INCLUDE,
    })

    await db.auditLog.create({
      data: {
        userId: createdBy ?? user.id,
        action: 'CREATE',
        entity: 'user',
        entityId: user.id,
        metadata: JSON.stringify({ email: user.email, role: user.role }),
        result: 'SUCCESS',
      },
    })

    return enrich(user)
  }

  static async update(id: string, input: UpdateUserInput, updatedBy?: string): Promise<UserWithRelations> {
    const existing = await db.user.findUnique({ where: { id, deletedAt: null } })
    if (!existing) throw new Error('Usuario no encontrado')

    // Email uniqueness check
    if (input.email && input.email !== existing.email) {
      const dup = await db.user.findUnique({ where: { email: input.email } })
      if (dup) throw new Error(`Ya existe un usuario con email "${input.email}"`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = { ...input }
    if (input.password) {
      data.password = await bcrypt.hash(input.password, 10)
    }
    if (input.branchId !== undefined) {
      data.branchId = input.branchId || null
    }

    const user = await db.user.update({ where: { id }, data, include: INCLUDE })

    await db.auditLog.create({
      data: {
        userId: updatedBy ?? id,
        action: 'UPDATE',
        entity: 'user',
        entityId: id,
        metadata: JSON.stringify({ fields: Object.keys(input) }),
        result: 'SUCCESS',
      },
    })

    return enrich(user)
  }

  static async softDelete(id: string, deletedBy?: string): Promise<void> {
    await db.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
    // Revoke all sessions
    await db.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })

    await db.auditLog.create({
      data: {
        userId: deletedBy ?? id,
        action: 'DELETE',
        entity: 'user',
        entityId: id,
        result: 'SUCCESS',
      },
    })
  }

  static async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED', changedBy?: string): Promise<UserWithRelations> {
    const user = await db.user.update({ where: { id, deletedAt: null }, data: { status }, include: INCLUDE })
    if (status !== 'ACTIVE') {
      await db.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
    }
    await db.auditLog.create({
      data: {
        userId: changedBy ?? id,
        action: 'STATUS_CHANGE',
        entity: 'user',
        entityId: id,
        metadata: JSON.stringify({ newStatus: status }),
        result: 'SUCCESS',
      },
    })
    return enrich(user)
  }

  static async stats() {
    const [total, active, suspended, sessions] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      db.user.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      db.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
    ])
    return { total, active, suspended, inactive: total - active - suspended, activeSessions: sessions }
  }
}
