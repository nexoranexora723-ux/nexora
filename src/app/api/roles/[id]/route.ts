import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const role = await db.role.findUnique({ where: { id }, include: { permissions: { include: { permission: true } } } })
    if (!role) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(role)
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const body = await req.json()
    const { name, description, status, permissionIds } = body
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description || null
    if (status !== undefined) data.status = status
    if (Object.keys(data).length > 0) await db.role.update({ where: { id }, data })
    if (permissionIds) {
      await db.rolePermission.deleteMany({ where: { roleId: id } })
      if (permissionIds.length > 0) await db.rolePermission.createMany({ data: permissionIds.map((pid: string) => ({ roleId: id, permissionId: pid })) })
    }
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const role = await db.role.findUnique({ where: { id }, include: { users: { select: { id: true } } } })
    if (!role) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    if (role.isSystem) return NextResponse.json({ error: 'No se pueden eliminar roles del sistema' }, { status: 400 })
    if (role.users.length > 0) return NextResponse.json({ error: 'No se puede eliminar un rol con usuarios' }, { status: 400 })
    await db.rolePermission.deleteMany({ where: { roleId: id } })
    await db.role.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
