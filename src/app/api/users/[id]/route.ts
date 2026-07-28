import { NextResponse } from 'next/server'
import { UserService } from '@/server/services/user.service'
import { updateUserSchema } from '@/lib/schemas/auth.schema'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await UserService.getById(id)
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error('GET /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const user = await UserService.update(id, parsed.data)
    return NextResponse.json(user)
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await UserService.softDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await req.json()
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }
    const user = await UserService.setStatus(id, status)
    return NextResponse.json(user)
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Error al cambiar estado' }, { status: 500 })
  }
}
