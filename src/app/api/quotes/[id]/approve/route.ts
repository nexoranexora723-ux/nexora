import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isClient } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    // IDOR check: if client, verify quote belongs to their request
    const quoteCheck = await db.quote.findUnique({ where: { id }, include: { request: { select: { clientId: true } } } })
    if (!quoteCheck) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    if (isClient(auth) && quoteCheck.request.clientId !== auth.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const quote = await db.quote.update({ where: { id }, data: { status: 'APROBADA' } })
    // Update request status to ESPERANDO_APROBACION → PAGO_RECIBIDO will be set after payment
    await db.importRequest.update({ where: { id: quote.requestId }, data: { status: 'ESPERANDO_APROBACION' } })
    await db.requestStatusHistory.create({ data: { requestId: quote.requestId, fromStatus: 'COTIZACION_ENVIADA', toStatus: 'ESPERANDO_APROBACION', notes: `Cotización ${quote.number} aprobada por cliente` } })
    // Notify admins
    const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE' } })
    await db.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id, type: 'quote', priority: 'HIGH',
        title: 'Cotización aprobada',
        message: `El cliente aprobó la cotización ${quote.number}. Pendiente de pago.`,
        data: JSON.stringify({ quoteId: id }),
      })),
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/quotes/[id]/approve error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
