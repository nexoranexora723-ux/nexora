import { NextResponse } from 'next/server'
import { WorkflowService } from '@/server/services/workflow.service'
import { createWorkflowSchema, workflowQuerySchema } from '@/lib/schemas/workflow.schema'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

// NEXORA — Workflows API
// GET: list with filters  | POST: create

async function resolveCompanyId(req: Request): Promise<string> {
  const token = req.cookies.get('nexora-session')?.value
  if (token) {
    const u = await AuthService.validateSession(token)
    if (u) return u.companyId
  }
  const company = await db.company.findFirst()
  return company?.id ?? 'unknown'
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = workflowQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      triggerType: searchParams.get('triggerType') ?? undefined,
      sort: searchParams.get('sort') ?? 'created_desc',
    })

    const companyId = await resolveCompanyId(req)
    const [items, stats] = await Promise.all([
      WorkflowService.list(query, companyId),
      WorkflowService.stats(companyId),
    ])
    return NextResponse.json({ items, stats })
  } catch (error) {
    console.error('GET /api/workflows error:', error)
    return NextResponse.json({ error: 'Error al obtener workflows' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createWorkflowSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const companyId = await resolveCompanyId(req)
    const w = await WorkflowService.create(parsed.data, companyId)
    return NextResponse.json(w, { status: 201 })
  } catch (error) {
    console.error('POST /api/workflows error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear workflow'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
