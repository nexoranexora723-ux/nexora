import { NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { changePasswordSchema } from '@/lib/schemas/auth.schema'

export async function POST(req: Request) {
  try {
    const token = req.cookies.get('nexora-session')?.value
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const user = await AuthService.validateSession(token)
    if (!user) {
      return NextResponse.json({ error: 'Sesión expirada' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    await AuthService.changePassword(user.id, parsed.data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al cambiar contraseña' }, { status: 400 })
  }
}
