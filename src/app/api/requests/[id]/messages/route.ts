import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json([])

    const { id } = await params
    // IDOR check: if client, verify request belongs to them
    if (user.role === 'CLIENT' || user.role === 'RESELLER') {
      const request = await db.importRequest.findUnique({ where: { id }, select: { clientId: true } })
      if (!request || request.clientId !== user.id) return NextResponse.json([])
    }

    const messages = await db.requestMessage.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(messages.map((m) => ({
      id: m.id, requestId: m.requestId, userId: m.userId, role: m.role,
      content: m.content, createdAt: m.createdAt.toISOString(),
    })))
  } catch { return NextResponse.json([]) }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const { content } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })

    // IDOR check: if client, verify request belongs to them
    const request = await db.importRequest.findUnique({ where: { id }, select: { clientId: true } })
    if (!request) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    if ((user.role === 'CLIENT' || user.role === 'RESELLER') && request.clientId !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const role = user.role === 'CLIENT' || user.role === 'RESELLER' ? 'client' : 'admin'
    const msg = await db.requestMessage.create({
      data: { requestId: id, userId: user.id, role, content: content.trim() },
    })

    // Notify the other party
    if (role === 'client') {
      const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] }, status: 'ACTIVE' } })
      await db.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id, type: 'request', priority: 'MEDIUM',
          title: 'Nuevo mensaje del cliente', message: content.trim().slice(0, 80),
          data: JSON.stringify({ requestId: id }),
        })),
      })
    } else {
      const req2 = await db.importRequest.findUnique({ where: { id } })
      if (req2) {
        await db.notification.create({
          data: { userId: req2.clientId, type: 'request', priority: 'MEDIUM',
            title: 'Nuevo mensaje', message: content.trim().slice(0, 80),
            data: JSON.stringify({ requestId: id }) },
        })
      }
    }

    return NextResponse.json({ ...msg, createdAt: msg.createdAt.toISOString() }, { status: 201 })
  } catch (error) {
    console.error('POST messages error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
