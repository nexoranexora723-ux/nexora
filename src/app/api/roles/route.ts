import { NextResponse } from 'next/server'
import { RoleService } from '@/server/services/role.service'
import { createRoleSchema } from '@/lib/schemas/auth.schema'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const roles = await RoleService.list()
    return NextResponse.json(roles)
  } catch (error) {
    console.error('GET /api/roles error:', error)
    return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createRoleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No existe empresa configurada' }, { status: 500 })

    const role = await RoleService.create(parsed.data, company.id)
    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error('POST /api/roles error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al crear rol' }, { status: 500 })
  }
}
