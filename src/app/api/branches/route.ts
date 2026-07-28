import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createBranchSchema } from '@/lib/schemas/auth.schema'

export async function GET() {
  try {
    const branches = await db.branch.findMany({
      include: {
        responsible: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(
      branches.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        address: b.address,
        city: b.city,
        country: b.country,
        state: b.state,
        status: b.status,
        responsible: b.responsible ? { id: b.responsible.id, name: `${b.responsible.firstName} ${b.responsible.lastName}` } : null,
        userCount: b._count.users,
        createdAt: b.createdAt.toISOString(),
      })),
    )
  } catch (error) {
    console.error('GET /api/branches error:', error)
    return NextResponse.json({ error: 'Error al obtener sucursales' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createBranchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No existe empresa configurada' }, { status: 500 })

    const existing = await db.branch.findUnique({ where: { code: parsed.data.code } })
    if (existing) return NextResponse.json({ error: `Ya existe una sucursal con código "${parsed.data.code}"` }, { status: 400 })

    const { responsibleId, ...data } = parsed.data
    const branch = await db.branch.create({
      data: {
        ...data,
        companyId: company.id,
        responsibleId: responsibleId || null,
      },
    })
    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    console.error('POST /api/branches error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al crear sucursal' }, { status: 500 })
  }
}
