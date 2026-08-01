import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'

export async function POST(req: NextRequest) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    if (t) await AuthService.logout(t)
    const res = NextResponse.json({ success: true })
    res.cookies.delete('nexora-session')
    return res
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
