import { NextResponse } from 'next/server'
import { RoleService } from '@/server/services/role.service'
import { updateRoleSchema } from '@/lib/schemas/auth.schema'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const role = await RoleService.getById(id)
    if (!role) return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    return NextResponse.json(role)
  } catch (error) {
    console.error('GET /api/roles/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener rol' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateRoleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const role = await RoleService.update(id, parsed.data)
    return NextResponse.json(role)
  } catch (error) {
    console.error('PUT /api/roles/[id] error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al actualizar rol' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await RoleService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/roles/[id] error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al eliminar rol' }, { status: 500 })
  }
}
