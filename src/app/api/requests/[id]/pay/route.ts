import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isClient } from '@/lib/auth-middleware'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { method = 'Nequi' } = body

    // IDOR check: clients can only pay their own requests
    const request = await db.importRequest.findUnique({ where: { id } })
    if (!request) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    if (isClient(auth) && request.clientId !== auth.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // Update request to PAGO_RECIBIDO
    await db.importRequest.update({ where: { id }, data: { status: 'PAGO_RECIBIDO' } })
    await db.requestStatusHistory.create({ data: { requestId: id, fromStatus: 'ESPERANDO_APROBACION', toStatus: 'PAGO_RECIBIDO', notes: `Pago recibido vía ${method}` } })

    // Notify admins
    const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE' } })
    await db.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id, type: 'request', priority: 'HIGH',
        title: 'Pago recibido',
        message: `Pago recibido para ${request.number}. Método: ${method}. Listo para proceder con la compra.`,
        data: JSON.stringify({ requestId: id }),
      })),
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/requests/[id]/pay error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
