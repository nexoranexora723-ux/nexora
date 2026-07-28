import { NextResponse } from 'next/server'
import { PurchaseService } from '@/server/services/purchase.service'
import { createPurchaseSchema, purchaseQuerySchema } from '@/lib/schemas/purchase.schema'

// NEXORA — Purchase Orders API
// GET: list with filters (q, status, supplierId, sort)  |  POST: create with line items
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = purchaseQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      supplierId: searchParams.get('supplierId') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    })
    const purchases = await PurchaseService.list(query)
    return NextResponse.json(purchases)
  } catch (error) {
    console.error('GET /api/purchases error:', error)
    return NextResponse.json({ error: 'Error al obtener órdenes de compra' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createPurchaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const purchase = await PurchaseService.create(parsed.data)
    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('POST /api/purchases error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear orden de compra'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
