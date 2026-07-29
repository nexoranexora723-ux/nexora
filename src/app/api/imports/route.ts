import { NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from "@/lib/auth-middleware"
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const requestId = searchParams.get('requestId')
    const where: Record<string, unknown> = {}
    if (requestId) where.requestId = requestId

    const imports = await db.import.findMany({
      where,
      include: {
        supplier: { select: { id: true, companyName: true } },
        request: { select: { id: true, number: true, productName: true, client: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      imports.map((i) => ({
        ...i,
        purchasedAt: i.purchasedAt?.toISOString() ?? null,
        productionEndsAt: i.productionEndsAt?.toISOString() ?? null,
        shippedAt: i.shippedAt?.toISOString() ?? null,
        arrivedAt: i.arrivedAt?.toISOString() ?? null,
        deliveredAt: i.deliveredAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
      })),
    )
  } catch (error) {
    console.error('GET /api/imports error:', error)
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const body = await req.json()
    const { requestId, quoteId, supplierId, productCost, shippingCost = 0, customsCost = 0, otherCosts = 0, salePrice, currencyCode = 'USD', carrier, trackingNumber, incoterm = 'FOB', notes } = body
    const totalCost = productCost + shippingCost + customsCost + otherCosts
    const profit = salePrice - totalCost

    const count = await db.import.count()
    const number = `IMP-2025-${String(count + 1).padStart(6, '0')}`

    const imp = await db.import.create({
      data: {
        number, requestId, quoteId: quoteId || null, supplierId,
        productCost, shippingCost, customsCost, otherCosts, totalCost, salePrice, profit, currencyCode,
        status: 'COMPRA_REALIZADA',
        purchasedAt: new Date(),
        carrier: carrier || null,
        trackingNumber: trackingNumber || null,
        incoterm,
        notes: notes || null,
      },
    })

    // Update request status
    await db.importRequest.update({ where: { id: requestId }, data: { status: 'COMPRA_REALIZADA' } })
    await db.requestStatusHistory.create({ data: { requestId, fromStatus: 'PAGO_RECIBIDO', toStatus: 'COMPRA_REALIZADA', notes: `Importación ${number} creada` } })

    // Create transactions
    await db.transaction.create({ data: { type: 'INCOME', category: 'SALES', description: `Venta importación ${number}`, amount: salePrice, reference: number, requestId, date: new Date() } })
    await db.transaction.create({ data: { type: 'EXPENSE', category: 'PURCHASE', description: `Compra a proveedor ${number}`, amount: totalCost, reference: number, requestId, date: new Date() } })

    return NextResponse.json({ ...imp, purchasedAt: imp.purchasedAt?.toISOString() ?? null, createdAt: imp.createdAt.toISOString() }, { status: 201 })
  } catch (error) {
    console.error('POST /api/imports error:', error)
    return NextResponse.json({ error: 'Error al crear importación' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const { id, status, carrier, trackingNumber } = await req.json()
    const updates: Record<string, unknown> = { status }
    if (carrier) updates.carrier = carrier
    if (trackingNumber) updates.trackingNumber = trackingNumber
    if (status === 'ENVIADO' || status === 'EN_TRANSITO') updates.shippedAt = new Date()
    if (status === 'RECIBIDO_BODEGA' || status === 'ENTREGADO') updates.arrivedAt = new Date()
    if (status === 'ENTREGADO') {
      updates.deliveredAt = new Date()
      // Update request status
      const imp = await db.import.findUnique({ where: { id } })
      if (imp) await db.importRequest.update({ where: { id: imp.requestId }, data: { status: 'ENTREGADO' } })
    }

    const imp = await db.import.update({ where: { id }, data: updates })
    return NextResponse.json({ ...imp, purchasedAt: imp.purchasedAt?.toISOString() ?? null, createdAt: imp.createdAt.toISOString() })
  } catch (error) {
    console.error('PATCH /api/imports error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
