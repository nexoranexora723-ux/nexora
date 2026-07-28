import { NextResponse } from 'next/server'
import { IntegrationService } from '@/server/services/integration.service'
import { updateIntegrationSchema } from '@/lib/schemas/integration.schema'

// NEXORA — Integration by ID API
// GET | PUT | DELETE  (+ PATCH for connect/disconnect)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const i = await IntegrationService.getById(id)
    if (!i) {
      return NextResponse.json({ error: 'Integración no encontrada' }, { status: 404 })
    }
    return NextResponse.json(i)
  } catch (error) {
    console.error('GET /api/integrations/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener integración' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateIntegrationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const i = await IntegrationService.update(id, parsed.data)
    return NextResponse.json(i)
  } catch (error) {
    console.error('PUT /api/integrations/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar integración'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await IntegrationService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/integrations/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar integración' }, { status: 500 })
  }
}

// PATCH { action: 'connect' | 'disconnect' }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { action } = await req.json()
    if (action === 'connect') {
      const i = await IntegrationService.connect(id)
      return NextResponse.json(i)
    }
    if (action === 'disconnect') {
      const i = await IntegrationService.disconnect(id)
      return NextResponse.json(i)
    }
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (error) {
    console.error('PATCH /api/integrations/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al cambiar estado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
