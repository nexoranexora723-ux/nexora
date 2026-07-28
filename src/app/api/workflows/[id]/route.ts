import { NextResponse } from 'next/server'
import { WorkflowService } from '@/server/services/workflow.service'
import { updateWorkflowSchema } from '@/lib/schemas/workflow.schema'

// NEXORA — Workflow by ID API
// GET | PUT | DELETE  (+ PATCH for status toggle, POST for execute)

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const w = await WorkflowService.getById(id)
    if (!w) {
      return NextResponse.json({ error: 'Workflow no encontrado' }, { status: 404 })
    }
    return NextResponse.json(w)
  } catch (error) {
    console.error('GET /api/workflows/[id] error:', error)
    return NextResponse.json({ error: 'Error al obtener workflow' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateWorkflowSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const w = await WorkflowService.update(id, parsed.data)
    return NextResponse.json(w)
  } catch (error) {
    console.error('PUT /api/workflows/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar workflow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await WorkflowService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/workflows/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar workflow' }, { status: 500 })
  }
}

// Toggle status ACTIVE ↔ INACTIVE
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const w = await WorkflowService.toggleStatus(id)
    return NextResponse.json(w)
  } catch (error) {
    console.error('PATCH /api/workflows/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al cambiar estado'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Execute (manual run)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const exec = await WorkflowService.execute(id)
    return NextResponse.json(exec, { status: 201 })
  } catch (error) {
    console.error('POST /api/workflows/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al ejecutar workflow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
