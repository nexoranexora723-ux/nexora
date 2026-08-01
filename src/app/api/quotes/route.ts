import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const requestId = searchParams.get('requestId')
    const where: Record<string, unknown> = {}
    if (requestId) where.requestId = requestId

    const quotes = await db.quote.findMany({
      where,
      include: {
        supplier: { select: { id: true, companyName: true } },
        request: { select: { id: true, number: true, productName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      quotes.map((q) => ({
        ...q,
        validity: q.validity?.toISOString() ?? null,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    console.error('GET /api/quotes error:', error)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth2 = await requireAdmin(req)
    if (auth2 instanceof NextResponse) return auth2
    const body = await req.json()
    const { requestId, supplierId, unitPrice, quantity, shippingCost = 0, tax = 0, currencyCode = 'USD', leadTime, warranty, validity, notes } = body
    const subtotal = unitPrice * quantity
    const total = subtotal + shippingCost + tax

    const count = await db.quote.count()
    const number = `COT-2025-${String(count + 1).padStart(6, '0')}`

    const quote = await db.quote.create({
      data: {
        number, requestId, supplierId,
        unitPrice, quantity, subtotal, shippingCost, tax, total, currencyCode,
        leadTime: leadTime || null,
        warranty: warranty || null,
        validity: validity ? new Date(validity) : null,
        notes: notes || null,
        status: 'RECIBIDA',
      },
      include: { supplier: { select: { id: true, companyName: true } } },
    })

    // Update request status
    await db.importRequest.update({ where: { id: requestId }, data: { status: 'COTIZACION_RECIBIDA' } })
    await db.requestStatusHistory.create({ data: { requestId, fromStatus: 'BUSCANDO_PROVEEDOR', toStatus: 'COTIZACION_RECIBIDA', notes: `Cotización ${number} recibida` } })

    return NextResponse.json({ ...quote, validity: quote.validity?.toISOString() ?? null, createdAt: quote.createdAt.toISOString(), updatedAt: quote.updatedAt.toISOString() }, { status: 201 })
  } catch (error) {
    console.error('POST /api/quotes error:', error)
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}
