// NEXORA — Notification Service
// Business logic layer. Route handlers delegate here (per DOC-002 §7, §12 "Regla de Oro").
import { db } from '@/lib/db'
import {
  CreateNotificationInput,
  NotificationQuery,
  NotificationPriority,
} from '@/lib/schemas/notification.schema'

export interface NotificationView {
  id: string
  companyId: string
  userId: string | null
  type: string
  priority: string
  title: string
  message: string
  data: string | null
  readAt: string | null
  createdAt: string
}

function enrich(n: {
  id: string
  companyId: string
  userId: string | null
  type: string
  priority: string
  title: string
  message: string
  data: string | null
  readAt: Date | null
  createdAt: Date
}): NotificationView {
  return {
    id: n.id,
    companyId: n.companyId,
    userId: n.userId,
    type: n.type,
    priority: n.priority,
    title: n.title,
    message: n.message,
    data: n.data,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  }
}

export class NotificationService {
  /**
   * List notifications filtered by company + (optional) user.
   * If unreadOnly is true, returns only notifications where readAt is null.
   */
  static async list(
    query: NotificationQuery,
    companyId: string,
    userId?: string,
  ): Promise<NotificationView[]> {
    const where: Record<string, unknown> = { companyId }
    // Scope by user when provided (user sees their own + system-wide)
    if (userId) {
      where.OR = [{ userId }, { userId: null }]
    } else if (query.unreadOnly === undefined) {
      // listing all by default
    }

    if (query.unreadOnly) {
      where.readAt = null
    }
    if (query.q) {
      where.OR = [
        { title: { contains: query.q } },
        { message: { contains: query.q } },
      ]
    }
    if (query.type) where.type = query.type
    if (query.priority) where.priority = query.priority

    const items = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return items.map(enrich)
  }

  static async getById(id: string): Promise<NotificationView | null> {
    const n = await db.notification.findUnique({ where: { id } })
    return n ? enrich(n) : null
  }

  static async create(
    input: CreateNotificationInput,
    companyId: string,
  ): Promise<NotificationView> {
    const n = await db.notification.create({
      data: {
        companyId,
        type: input.type,
        priority: input.priority,
        title: input.title,
        message: input.message,
        data: input.data && input.data !== '' ? input.data : null,
        userId: input.userId && input.userId !== '' ? input.userId : null,
      },
    })
    return enrich(n)
  }

  static async markAsRead(id: string): Promise<NotificationView> {
    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) throw new Error('Notificación no encontrada')

    const n = await db.notification.update({
      where: { id },
      data: { readAt: existing.readAt ?? new Date() },
    })
    return enrich(n)
  }

  static async markAllAsRead(companyId: string, userId?: string): Promise<number> {
    const where: Record<string, unknown> = { companyId, readAt: null }
    if (userId) {
      where.OR = [{ userId }, { userId: null }]
    }
    const result = await db.notification.updateMany({
      where,
      data: { readAt: new Date() },
    })
    return result.count
  }

  static async delete(id: string): Promise<void> {
    await db.notification.delete({ where: { id } })
  }

  // Stats for the header cards
  static async stats(companyId: string, userId?: string): Promise<{
    total: number
    unread: number
    high: number
    critical: number
    today: number
  }> {
    const baseWhere: Record<string, unknown> = { companyId }
    const userScope: Record<string, unknown> =
      userId !== undefined ? { OR: [{ userId }, { userId: null }] } : {}

    const [total, unread, high, critical, today] = await Promise.all([
      db.notification.count({ where: { ...baseWhere, ...userScope } }),
      db.notification.count({
        where: { ...baseWhere, ...userScope, readAt: null },
      }),
      db.notification.count({
        where: { ...baseWhere, ...userScope, priority: 'HIGH', readAt: null },
      }),
      db.notification.count({
        where: { ...baseWhere, ...userScope, priority: 'CRITICAL', readAt: null },
      }),
      db.notification.count({
        where: {
          ...baseWhere,
          ...userScope,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ])

    return { total, unread, high, critical, today }
  }

  // Helper to allow other services to spawn notifications
  static async spawn(params: {
    companyId: string
    userId?: string | null
    type: string
    priority?: NotificationPriority
    title: string
    message: string
    data?: Record<string, unknown> | null
  }): Promise<NotificationView> {
    return NotificationService.create(
      {
        type: params.type as CreateNotificationInput['type'],
        priority: params.priority ?? 'MEDIUM',
        title: params.title,
        message: params.message,
        data: params.data ? JSON.stringify(params.data) : '',
        userId: params.userId ?? '',
      },
      params.companyId,
    )
  }
}
