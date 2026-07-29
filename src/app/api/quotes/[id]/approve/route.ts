import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
