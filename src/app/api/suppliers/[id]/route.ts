import { NextResponse } from 'next/server'
import { SupplierService } from '@/server/services/supplier.service'
import { updateSupplierSchema } from '@/lib/schemas/supplier.schema'

// NEXORA — Supplier by ID API
// GET | PUT | DELETE  (+ PATCH for status toggle)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supplier = await SupplierService.getById(id)
    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })
    }
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('GET /api/suppliers/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener proveedor' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSupplierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const supplier = await SupplierService.update(id, parsed.data)
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('PUT /api/suppliers/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar proveedor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await SupplierService.softDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/suppliers/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar proveedor' }, { status: 500 })
  }
}

// Toggle status: ACTIVE ↔ INACTIVE ↔ BLACKLISTED
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await req.json()
    if (!['ACTIVE', 'INACTIVE', 'BLACKLISTED'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }
    const supplier = await SupplierService.setStatus(id, status)
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('PATCH /api/suppliers/[id] error:', error)
    return NextResponse.json({ error: 'Error al cambiar estado' }, { status: 500 })
  }
}
