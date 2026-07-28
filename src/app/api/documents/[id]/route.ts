import { NextResponse } from 'next/server'
import { DocumentService } from '@/server/services/document.service'
import { updateDocumentSchema } from '@/lib/schemas/document.schema'

// NEXORA — Document by ID API
// GET | PUT | DELETE  (+ PATCH for archive/restore)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const d = await DocumentService.getById(id)
    if (!d) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }
    return NextResponse.json(d)
  } catch (error) {
    console.error('GET /api/documents/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener documento' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateDocumentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const d = await DocumentService.update(id, parsed.data)
    return NextResponse.json(d)
  } catch (error) {
    console.error('PUT /api/documents/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar documento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await DocumentService.softDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/documents/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 })
  }
}

// PATCH: archive / restore
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { action } = await req.json()
    if (action === 'archive') {
      const d = await DocumentService.archive(id)
      return NextResponse.json(d)
    }
    if (action === 'restore') {
      const d = await DocumentService.restore(id)
      return NextResponse.json(d)
    }
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (error) {
    console.error('PATCH /api/documents/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al cambiar estado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
