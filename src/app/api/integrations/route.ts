import { NextResponse } from 'next/server'
import { IntegrationService } from '@/server/services/integration.service'
import { createIntegrationSchema, integrationQuerySchema } from '@/lib/schemas/integration.schema'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

// NEXORA — Integrations API
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
    const query = integrationQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      provider: searchParams.get('provider') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      sort: searchParams.get('sort') ?? 'created_desc',
    })

    const companyId = await resolveCompanyId(req)
    const [items, stats] = await Promise.all([
      IntegrationService.list(query, companyId),
      IntegrationService.stats(companyId),
    ])
    return NextResponse.json({ items, stats })
  } catch (error) {
    console.error('GET /api/integrations error:', error)
    return NextResponse.json({ error: 'Error al obtener integraciones' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createIntegrationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const companyId = await resolveCompanyId(req)
    const i = await IntegrationService.create(parsed.data, companyId)
    return NextResponse.json(i, { status: 201 })
  } catch (error) {
    console.error('POST /api/integrations error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear integración'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
