// NEXORA — Role Service (RBAC)
import { db } from '@/lib/db'
import { CreateRoleInput, UpdateRoleInput } from '@/lib/schemas/auth.schema'

export interface RoleWithRelations {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  status: string
  companyId: string | null
  userCount: number
  permissions: { id: string; module: string; action: string }[]
  createdAt: string
  updatedAt: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enrich(r: any): RoleWithRelations {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    status: r.status,
    companyId: r.companyId,
    userCount: r.users?.length ?? 0,
    permissions: (r.permissions ?? []).map((rp: { permission: { id: string; module: string; action: string } }) => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action,
    })),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
}

const INCLUDE = {
  permissions: { include: { permission: true } },
  users: { select: { id: true } },
} as const

export class RoleService {
  static async list(): Promise<RoleWithRelations[]> {
    const roles = await db.role.findMany({ include: INCLUDE, orderBy: [{ isSystem: 'desc' }, { name: 'asc' }] })
    return roles.map(enrich)
  }

  static async getById(id: string): Promise<RoleWithRelations | null> {
    const r = await db.role.findUnique({ where: { id }, include: INCLUDE })
    return r ? enrich(r) : null
  }

  static async create(input: CreateRoleInput, companyId: string, createdBy?: string): Promise<RoleWithRelations> {
    const existing = await db.role.findUnique({ where: { name: input.name } })
    if (existing) throw new Error(`Ya existe un rol con nombre "${input.name}"`)

    const role = await db.role.create({
      data: {
        name: input.name,
        description: input.description || null,
        isSystem: false,
        status: 'ACTIVE',
        companyId,
      },
      include: INCLUDE,
    })

    // Assign permissions
    if (input.permissionIds.length > 0) {
      await db.rolePermission.createMany({
        data: input.permissionIds.map((pid) => ({ roleId: role.id, permissionId: pid })),
      })
    }

    const refreshed = await db.role.findUnique({ where: { id: role.id }, include: INCLUDE })
    await db.auditLog.create({
      data: {
        userId: createdBy ?? 'system',
        action: 'CREATE',
        entity: 'role',
        entityId: role.id,
        metadata: JSON.stringify({ name: role.name, permissions: input.permissionIds.length }),
        result: 'SUCCESS',
      },
    })
    return enrich(refreshed!)
  }

  static async update(id: string, input: UpdateRoleInput, updatedBy?: string): Promise<RoleWithRelations> {
    const existing = await db.role.findUnique({ where: { id } })
    if (!existing) throw new Error('Rol no encontrado')
    if (existing.isSystem && input.name && input.name !== existing.name) {
      throw new Error('Los roles del sistema no pueden renombrarse')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {}
    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) data.description = input.description || null
    if (input.status !== undefined) data.status = input.status

    if (Object.keys(data).length > 0) {
      await db.role.update({ where: { id }, data })
    }

    // Sync permissions if provided
    if (input.permissionIds) {
      await db.rolePermission.deleteMany({ where: { roleId: id } })
      if (input.permissionIds.length > 0) {
        await db.rolePermission.createMany({
          data: input.permissionIds.map((pid) => ({ roleId: id, permissionId: pid })),
        })
      }
    }

    const refreshed = await db.role.findUnique({ where: { id }, include: INCLUDE })
    await db.auditLog.create({
      data: {
        userId: updatedBy ?? 'system',
        action: 'UPDATE',
        entity: 'role',
        entityId: id,
        metadata: JSON.stringify({ fields: Object.keys(input) }),
        result: 'SUCCESS',
      },
    })
    return enrich(refreshed!)
  }

  static async delete(id: string, deletedBy?: string): Promise<void> {
    const existing = await db.role.findUnique({ where: { id }, include: { users: { select: { id: true } } } })
    if (!existing) throw new Error('Rol no encontrado')
    if (existing.isSystem) throw new Error('Los roles del sistema no pueden eliminarse')
    if (existing.users.length > 0) throw new Error('No se puede eliminar un rol con usuarios asignados')

    await db.rolePermission.deleteMany({ where: { roleId: id } })
    await db.role.delete({ where: { id } })
    await db.auditLog.create({
      data: { userId: deletedBy ?? 'system', action: 'DELETE', entity: 'role', entityId: id, result: 'SUCCESS' },
    })
  }

  static async listPermissions() {
    const perms = await db.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] })
    // Group by module
    const grouped: Record<string, { id: string; action: string }[]> = {}
    for (const p of perms) {
      if (!grouped[p.module]) grouped[p.module] = []
      grouped[p.module].push({ id: p.id, action: p.action })
    }
    return grouped
  }
}
