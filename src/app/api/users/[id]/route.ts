import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const user = await db.user.findUnique({ where: { id, deletedAt: null }, select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, position: true, status: true } })
    if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(user)
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.firstName) data.firstName = body.firstName
    if (body.lastName) data.lastName = body.lastName
    if (body.email) data.email = body.email
    if (body.phone !== undefined) data.phone = body.phone || null
    if (body.position !== undefined) data.position = body.position || null
    if (body.role) data.role = body.role
    if (body.status) data.status = body.status
    if (body.password) data.password = await bcrypt.hash(body.password, 10)
    await db.user.update({ where: { id }, data })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    await db.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
    await db.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const { status } = await req.json()
    await db.user.update({ where: { id }, data: { status } })
    if (status !== 'ACTIVE') {
      await db.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } })
    }
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
