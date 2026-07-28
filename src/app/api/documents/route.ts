import { NextResponse } from 'next/server'
import { DocumentService } from '@/server/services/document.service'
import {
  createDocumentSchema,
  documentQuerySchema,
} from '@/lib/schemas/document.schema'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

// NEXORA — Documents API
// GET: list with filters  | POST: create

async function resolveContext(req: Request): Promise<{ companyId: string; userId?: string }> {
  const token = req.cookies.get('nexora-session')?.value
  if (token) {
    const u = await AuthService.validateSession(token)
    if (u) return { companyId: u.companyId, userId: u.id }
  }
  const company = await db.company.findFirst({ include: { users: { take: 1 } } })
  return {
    companyId: company?.id ?? 'unknown',
    userId: company?.users[0]?.id,
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = documentQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      entityType: searchParams.get('entityType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    })
    const { companyId } = await resolveContext(req)
    const [items, stats] = await Promise.all([
      DocumentService.list(query, companyId),
      DocumentService.stats(companyId),
    ])
    return NextResponse.json({ items, stats })
  } catch (error) {
    console.error('GET /api/documents error:', error)
    return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createDocumentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const { companyId, userId } = await resolveContext(req)
    const doc = await DocumentService.create(parsed.data, companyId, userId)
    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('POST /api/documents error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear documento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
