import { NextResponse } from 'next/server'
import { UserService } from '@/server/services/user.service'
import { createUserSchema, userQuerySchema } from '@/lib/schemas/auth.schema'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = userQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      roleId: searchParams.get('roleId') ?? undefined,
      branchId: searchParams.get('branchId') ?? undefined,
    })
    const users = await UserService.list(query)
    return NextResponse.json(users)
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No existe empresa configurada' }, { status: 500 })

    const user = await UserService.create(parsed.data, company.id)
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al crear usuario' }, { status: 500 })
  }
}
