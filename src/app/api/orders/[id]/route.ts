import { NextResponse } from 'next/server'
import { OrderService } from '@/server/services/order.service'
import { updateOrderSchema } from '@/lib/schemas/order.schema'

// NEXORA — Order by ID API
// GET | PUT | DELETE  (+ PATCH for cancel)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await OrderService.getById(id)
    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }
    return NextResponse.json(order)
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener pedido' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const order = await OrderService.update(id, parsed.data)
    return NextResponse.json(order)
  } catch (error) {
    console.error('PUT /api/orders/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar pedido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await OrderService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/orders/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al eliminar pedido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Cancel: status → CANCELLED + restore inventory + reverse transaction + decrement LTV
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await OrderService.cancel(id)
    return NextResponse.json(order)
  } catch (error) {
    console.error('PATCH /api/orders/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al cancelar pedido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
