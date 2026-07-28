import { NextResponse } from 'next/server'
import { NotificationService } from '@/server/services/notification.service'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

// NEXORA — Mark all notifications as read API

async function resolveContext(req: Request): Promise<{ companyId: string; userId?: string }> {
  const token = req.cookies.get('nexora-session')?.value
  if (token) {
    const u = await AuthService.validateSession(token)
    if (u) return { companyId: u.companyId, userId: u.id }
  }
  const company = await db.company.findFirst({ include: { users: { take: 1 } } })
  return {
    companyId: company?.id ?? 'unknown',
    userId: company?.users[0]?.id,
  }
}

export async function POST(req: Request) {
  try {
    const { companyId, userId } = await resolveContext(req)
    const count = await NotificationService.markAllAsRead(companyId, userId)
    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error('POST /api/notifications/read-all error:', error)
    return NextResponse.json({ error: 'Error al marcar todas como leídas' }, { status: 500 })
  }
}
