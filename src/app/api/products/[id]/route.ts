import { NextResponse } from 'next/server'
import { ProductService } from '@/server/services/product.service'
import { updateProductSchema } from '@/lib/schemas/product.schema'

// NEXORA — Product by ID API
// GET | PUT | DELETE  (+ PATCH for status toggle)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await ProductService.getById(id)
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const product = await ProductService.update(id, parsed.data)
    return NextResponse.json(product)
  } catch (error) {
    console.error('PUT /api/products/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar producto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await ProductService.softDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}

// Toggle status: ACTIVE ↔ INACTIVE
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await req.json()
    if (!['ACTIVE', 'INACTIVE', 'DISCONTINUED'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }
    const product = await ProductService.setStatus(id, status)
    return NextResponse.json(product)
  } catch (error) {
    console.error('PATCH /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Error al cambiar estado' }, { status: 500 })
  }
}
