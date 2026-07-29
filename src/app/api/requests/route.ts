import { NextResponse } from 'next/server'
import { RequestService } from '@/server/services/request.service'
import { createRequestSchema } from '@/lib/schemas'
import { AuthService } from '@/server/services/auth.service'

export async function GET(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filters: Record<string, string> = {}
    const status = searchParams.get('status')
    const q = searchParams.get('q')
    if (status) filters.status = status
    if (q) filters.q = q

    // Clients only see their own requests
    if (user.role === 'CLIENT' || user.role === 'RESELLER') {
      filters.clientId = user.id
    } else if (searchParams.get('assignedToId') === 'me') {
      filters.assignedToId = user.id
    }

    const reqs = await RequestService.list(filters)

    // Strip internal NAIOS fields from responses to clients
    const isClient = user.role === 'CLIENT' || user.role === 'RESELLER'
    const safeReqs = isClient
      ? reqs.map((r: Record<string, unknown>) => {
          const { naiosSummary, naiosCategory, naiosPriority, notes, ...publicFields } = r
          return publicFields
        })
      : reqs

    return NextResponse.json(safeReqs)
  } catch (error) {
    console.error('GET /api/requests error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const parsed = createRequestSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })

    const req2 = await RequestService.create(parsed.data, user.id)
    return NextResponse.json(req2, { status: 201 })
  } catch (error) {
    console.error('POST /api/requests error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
