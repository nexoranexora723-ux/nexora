import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const token = req.cookies.get('nexora-session')?.value
    if (token) {
      // Import dynamically to avoid circular deps in route
      const { AuthService } = await import('@/server/services/auth.service')
      await AuthService.logout(token)
    }
    const res = NextResponse.json({ success: true })
    res.cookies.delete('nexora-session')
    return res
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 })
  }
}
