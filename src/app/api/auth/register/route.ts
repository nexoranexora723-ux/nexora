import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { registerSchema } from '@/lib/schemas'
import { db } from '@/lib/db'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Rate limit: 10 registrations per minute per IP
  const limited = enforceRateLimit(req, 'auth-register', RATE_LIMITS.AUTH)
  if (limited) return limited

  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })

    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'No hay empresa configurada' }, { status: 500 })

    const result = await AuthService.register(parsed.data, company.id)
    const res = NextResponse.json(result, { status: 201 })
    res.cookies.set('nexora-session', result.sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' })
    return res
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al registrarse' }, { status: 400 })
  }
}
