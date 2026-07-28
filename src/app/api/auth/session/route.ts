import { NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'

// Validate current session via cookie
export async function GET(req: Request) {
  try {
    const token = req.cookies.get('nexora-session')?.value
    if (!token) {
      return NextResponse.json({ user: null, authenticated: false })
    }
    const user = await AuthService.validateSession(token)
    if (!user) {
      const res = NextResponse.json({ user: null, authenticated: false })
      res.cookies.delete('nexora-session')
      return res
    }
    return NextResponse.json({ user, authenticated: true })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null, authenticated: false })
  }
}
