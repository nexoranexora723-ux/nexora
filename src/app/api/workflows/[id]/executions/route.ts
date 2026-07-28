import { NextResponse } from 'next/server'
import { WorkflowService } from '@/server/services/workflow.service'

// NEXORA — Workflow executions API
// GET: list recent executions for a workflow

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const items = await WorkflowService.getExecutions(id, 50)
    return NextResponse.json({ items })
  } catch (error) {
    console.error('GET /api/workflows/[id]/executions error:', error)
    return NextResponse.json({ error: 'Error al obtener ejecuciones' }, { status: 500 })
  }
}
