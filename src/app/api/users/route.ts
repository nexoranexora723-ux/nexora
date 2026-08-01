import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth

    const users = await db.user.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, position: true, status: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(users.map((u) => ({
      ...u, lastLoginAt: u.lastLoginAt?.toISOString() ?? null, createdAt: u.createdAt.toISOString(),
    })))
  } catch { return NextResponse.json([]) }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth

    const { firstName, lastName, email, password, phone, position, role, status } = await req.json()
    if (!firstName || !lastName || !email || !password) return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 })

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 })

    const company = await db.company.findFirst()
    const hash = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: { firstName, lastName, email, password: hash, phone: phone || null, position: position || null, role: role || 'EMPLOYEE', status: status || 'ACTIVE', companyId: company!.id },
    })
    return NextResponse.json({ id: user.id, success: true }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
