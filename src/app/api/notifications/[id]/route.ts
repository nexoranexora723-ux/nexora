import { NextResponse } from 'next/server'
import { NotificationService } from '@/server/services/notification.service'

// NEXORA — Notification by ID API
// PATCH (mark as read) + DELETE

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const n = await NotificationService.markAsRead(id)
    return NextResponse.json(n)
  } catch (error) {
    console.error('PATCH /api/notifications/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al marcar como leída'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await NotificationService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/notifications/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar notificación' }, { status: 500 })
  }
}
