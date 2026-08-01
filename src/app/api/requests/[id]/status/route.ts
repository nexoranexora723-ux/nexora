import { NextRequest, NextResponse } from 'next/server'
import { RequestService } from '@/server/services/request.service'
import { AuthService } from '@/server/services/auth.service'
import { db } from '@/lib/db'
import { sendOrderStatusUpdate } from '@/lib/email-service'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const body = await req.json().catch(() => ({}))
    const status: string = body.status
    const notes: string | undefined = body.notes

    // Traer estado previo para pasarlo al email
    const prev = await db.importRequest.findUnique({
      where: { id },
      select: { status: true, number: true, clientId: true },
    })
    if (!prev) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    const r = await RequestService.updateStatus(id, status, notes, user.id)

    // Enviar email de actualización de estado al cliente
    try {
      const client = await db.user.findUnique({
        where: { id: prev.clientId },
        select: { email: true, firstName: true, lastName: true },
      })
      if (client) {
        // Buscar tracking si hay import asociado
        const imp = await db.import.findFirst({
          where: { requestId: id },
          select: { trackingNumber: true, carrier: true },
        })
        await sendOrderStatusUpdate(client.email, prev.number, status, {
          clientName: `${client.firstName} ${client.lastName}`,
          previousStatus: prev.status,
          notes,
          trackingNumber: imp?.trackingNumber ?? undefined,
          carrier: imp?.carrier ?? undefined,
          trackingUrl: `/track-order?number=${encodeURIComponent(prev.number)}`,
        })
      }
    } catch (e) {
      console.error('sendOrderStatusUpdate error:', e)
    }

    return NextResponse.json(r)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
