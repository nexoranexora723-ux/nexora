import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { RequestService } from '@/server/services/request.service'
import { db } from '@/lib/db'

/**
 * GET /api/orders/[id]
 * Devuelve el detalle de un pedido (ImportRequest) del usuario autenticado.
 * Los clientes solo pueden ver sus propios pedidos; los admins pueden ver cualquiera.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const r = await RequestService.getById(id)
    if (!r) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    // Clientes solo pueden ver sus propios pedidos
    if (
      (user.role === 'CLIENT' || user.role === 'RESELLER') &&
      (r as { clientId?: string }).clientId !== user.id
    ) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    return NextResponse.json(r)
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

/**
 * PATCH /api/orders/[id]
 * Actualiza el estado administrativo del pedido (PENDING|CONFIRMED|PROCESSING|
 * SHIPPED|DELIVERED|CANCELLED) y/o el tracking number.
 *
 * Solo ADMIN y SUPER_ADMIN (y EMPLOYEE con permiso limitado) pueden usar esto.
 *
 * Body: { status?: string, trackingNumber?: string }
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { status, trackingNumber } = body as { status?: string; trackingNumber?: string }

    const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }

    const existing = await db.importRequest.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })

    const data: { adminStatus?: string; trackingNumber?: string | null } = {}
    if (status) data.adminStatus = status
    if (trackingNumber !== undefined) data.trackingNumber = trackingNumber || null

    const updated = await db.importRequest.update({
      where: { id },
      data,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        quotes: { select: { id: true, total: true, currencyCode: true, status: true } },
        imports: { select: { id: true, salePrice: true, currencyCode: true, carrier: true, trackingNumber: true, status: true } },
      },
    })

    // Sync tracking number to linked Import record (if exists) for backward compat
    if (trackingNumber !== undefined && updated.imports.length > 0) {
      try {
        await db.import.update({
          where: { id: updated.imports[0].id },
          data: { trackingNumber: trackingNumber || null },
        })
      } catch (e) {
        console.error('Sync tracking number to Import error:', e)
      }
    }

    // Build flat order response (mirror of GET /api/orders?scope=admin)
    const quotes = updated.quotes ?? []
    const imports = updated.imports ?? []
    let total = 0
    let currencyCode = updated.currencyCode ?? 'USD'
    if (imports.length > 0 && typeof imports[0].salePrice === 'number') {
      total = imports[0].salePrice
      currencyCode = imports[0].currencyCode ?? currencyCode
    } else if (quotes.length > 0 && typeof quotes[0].total === 'number') {
      total = quotes[0].total
      currencyCode = quotes[0].currencyCode ?? currencyCode
    } else if (typeof updated.budget === 'number') {
      total = updated.budget
    }

    return NextResponse.json({
      id: updated.id,
      number: updated.number,
      status: updated.adminStatus ?? 'PENDING',
      requestStatus: updated.status,
      trackingNumber: updated.trackingNumber,
      paymentMethod: updated.paymentMethod,
      shippingAddress: updated.shippingAddress,
      total,
      currencyCode,
      customer: updated.client
        ? {
            id: updated.client.id,
            firstName: updated.client.firstName,
            lastName: updated.client.lastName,
            email: updated.client.email,
            phone: updated.client.phone,
          }
        : null,
      updatedAt: updated.updatedAt,
    })
  } catch (error) {
    console.error('PATCH /api/orders/[id] error:', error)
    return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 })
  }
}
