import { NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { loginSchema } from '@/lib/schemas/auth.schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const ipAddress = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const userAgent = req.headers.get('user-agent') ?? 'unknown'

    const result = await AuthService.login(parsed.data, { ipAddress, userAgent })

    // Set session cookie
    const res = NextResponse.json(result)
    res.cookies.set('nexora-session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })
    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error de autenticación' }, { status: 401 })
  }
}
