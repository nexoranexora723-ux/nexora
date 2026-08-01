import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { loginSchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const ua = req.headers.get('user-agent') ?? 'unknown'
    const result = await AuthService.login(parsed.data, { ip, ua })

    const res = NextResponse.json(result)
    res.cookies.set('nexora-session', result.sessionToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400, path: '/' })
    return res
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error de autenticación' }, { status: 401 })
  }
}
