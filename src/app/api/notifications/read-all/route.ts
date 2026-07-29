import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export async function POST(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const result = await db.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    })
    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error('POST /api/notifications/read-all error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
