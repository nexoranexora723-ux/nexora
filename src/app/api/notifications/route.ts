import { NextResponse } from 'next/server'
import { NotificationService } from '@/server/services/notification.service'
import {
  createNotificationSchema,
  notificationQuerySchema,
} from '@/lib/schemas/notification.schema'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

// NEXORA — Notifications API
// GET: list with filters  | POST: create

interface RequestContext {
  companyId: string
  userId: string | undefined
}

async function resolveContext(req: Request): Promise<RequestContext> {
  const token = req.cookies.get('nexora-session')?.value
  if (token) {
    const u = await AuthService.validateSession(token)
    if (u) return { companyId: u.companyId, userId: u.id }
  }
  // Fallback: first company + first user (matches single-tenant demo pattern of products API)
  const company = await db.company.findFirst({ include: { users: { take: 1 } } })
  return {
    companyId: company?.id ?? 'unknown',
    userId: company?.users[0]?.id,
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = notificationQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      unreadOnly: searchParams.get('unreadOnly') ?? undefined,
    })

    const { companyId, userId } = await resolveContext(req)
    const [items, stats] = await Promise.all([
      NotificationService.list(query, companyId, userId),
      NotificationService.stats(companyId, userId),
    ])
    return NextResponse.json({ items, stats })
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createNotificationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const { companyId, userId } = await resolveContext(req)
    const data = {
      ...parsed.data,
      userId:
        parsed.data.userId && parsed.data.userId !== ''
          ? parsed.data.userId
          : (userId ?? ''),
    }
    const n = await NotificationService.create(data, companyId)
    return NextResponse.json(n, { status: 201 })
  } catch (error) {
    console.error('POST /api/notifications error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear notificación'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
