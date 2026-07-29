import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth

    const roles = await db.role.findMany({
      include: { permissions: { include: { permission: true } }, users: { select: { id: true } } },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    })
    return NextResponse.json(roles.map((r) => ({
      id: r.id, name: r.name, description: r.description, isSystem: r.isSystem,
      status: r.status, companyId: r.companyId,
      userCount: r.users.length,
      permissions: r.permissions.map((rp) => ({ id: rp.permission.id, module: rp.permission.module, action: rp.permission.action })),
      createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
    })))
  } catch { return NextResponse.json([]) }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth

    const { name, description, permissionIds = [] } = await req.json()
    if (!name) return NextResponse.json({ error: 'Nombre obligatorio' }, { status: 400 })

    const company = await db.company.findFirst()
    const existing = await db.role.findUnique({ where: { name } })
    if (existing) return NextResponse.json({ error: 'Ya existe' }, { status: 400 })

    const role = await db.role.create({ data: { name, description: description || null, isSystem: false, status: 'ACTIVE', companyId: company?.id } })
    if (permissionIds.length > 0) {
      await db.rolePermission.createMany({ data: permissionIds.map((pid: string) => ({ roleId: role.id, permissionId: pid })) })
    }
    return NextResponse.json({ id: role.id, success: true }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
