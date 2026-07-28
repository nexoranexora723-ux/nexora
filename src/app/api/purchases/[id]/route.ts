import { NextResponse } from 'next/server'
import { PurchaseService } from '@/server/services/purchase.service'
import { updatePurchaseSchema } from '@/lib/schemas/purchase.schema'

// NEXORA — Purchase Order by ID API
// GET | PUT (update) | DELETE

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const purchase = await PurchaseService.getById(id)
    if (!purchase) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 })
    }
    return NextResponse.json(purchase)
  } catch (error) {
    console.error('GET /api/purchases/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener orden de compra' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updatePurchaseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const purchase = await PurchaseService.update(id, parsed.data)
    return NextResponse.json(purchase)
  } catch (error) {
    console.error('PUT /api/purchases/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar orden de compra'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await PurchaseService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/purchases/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al eliminar orden de compra'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH: status change — supports CANCELLED only (RECEIVED is via /receive endpoint)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await req.json()
    if (status === 'CANCELLED') {
      const purchase = await PurchaseService.cancel(id)
      return NextResponse.json(purchase)
    }
    return NextResponse.json({ error: 'Acción no soportada. Use /receive para recibir.' }, { status: 400 })
  } catch (error) {
    console.error('PATCH /api/purchases/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al cambiar estado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
