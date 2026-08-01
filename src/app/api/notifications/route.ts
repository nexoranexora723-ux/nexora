import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export async function GET(req: NextRequest) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json([])

    const notifs = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(
      notifs.map((n) => ({
        id: n.id, type: n.type, priority: n.priority, title: n.title, message: n.message,
        readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString(),
      })),
    )
  } catch (error) {
    return NextResponse.json([])
  }
}
