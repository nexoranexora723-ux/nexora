import { NextResponse } from 'next/server'
import { OrderService } from '@/server/services/order.service'
import { createOrderSchema, orderQuerySchema } from '@/lib/schemas/order.schema'

// NEXORA — Sales Orders API
// GET: list with filters/sort  | POST: create (transactional: order+items+income+inventory+LTV)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = orderQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      customerId: searchParams.get('customerId') ?? undefined,
      sort: searchParams.get('sort') ?? 'created_desc',
    })
    const orders = await OrderService.list(query)
    return NextResponse.json(orders)
  } catch (error) {
    console.error('GET /api/orders error:', error)
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const order = await OrderService.create(parsed.data)
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('POST /api/orders error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear pedido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
