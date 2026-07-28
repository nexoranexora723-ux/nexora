import { NextResponse } from 'next/server'
import { CustomerService } from '@/server/services/customer.service'
import { updateCustomerSchema } from '@/lib/schemas/customer.schema'

// NEXORA — Customer by ID API
// GET | PUT (update) | DELETE (soft delete) | PATCH (status toggle)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customer = await CustomerService.getById(id)
    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    return NextResponse.json(customer)
  } catch (error) {
    console.error('GET /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateCustomerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const customer = await CustomerService.update(id, parsed.data)
    return NextResponse.json(customer)
  } catch (error) {
    console.error('PUT /api/customers/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar cliente'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await CustomerService.softDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 })
  }
}

// Toggle status: ACTIVE ↔ INACTIVE ↔ VIP
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await req.json()
    if (!['ACTIVE', 'INACTIVE', 'VIP'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }
    const customer = await CustomerService.setStatus(id, status)
    return NextResponse.json(customer)
  } catch (error) {
    console.error('PATCH /api/customers/[id] error:', error)
    return NextResponse.json({ error: 'Error al cambiar estado' }, { status: 500 })
  }
}
