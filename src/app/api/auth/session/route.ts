import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'

export async function GET(req: NextRequest) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    if (!t) return NextResponse.json({ user: null, authenticated: false })
    const user = await AuthService.validate(t)
    if (!user) {
      const res = NextResponse.json({ user: null, authenticated: false })
      res.cookies.delete('nexora-session')
      return res
    }
    return NextResponse.json({ user, authenticated: true })
  } catch {
    return NextResponse.json({ user: null, authenticated: false })
  }
}
