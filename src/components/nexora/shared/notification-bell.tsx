'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { timeAgo } from '@/lib/format'
import { Bell, Check, Trash2, BellOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

const TYPE_ICONS: Record<string, string> = {
  info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌',
  system: '🔧', request: '📦', quote: '📄', import: '🚢',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-sky-400', MEDIUM: 'bg-amber-400', HIGH: 'bg-orange-500', CRITICAL: 'bg-rose-500',
}

export function NotificationBell() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  // Poll notifications every 30 seconds
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    refetchInterval: 30000, // Poll every 30s
  })

  const unread = notifications.filter((n) => !n.readAt)
  const unreadCount = unread.length

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="absolute right-2 top-1.5 h-2 w-2 animate-ping rounded-full bg-rose-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="nexora-scroll w-80 max-h-[400px] overflow-y-auto p-0">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-semibold">Notificaciones</span>
            {unreadCount > 0 && <Badge className="bg-rose-500 text-white text-[10px]">{unreadCount}</Badge>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs font-medium text-primary hover:underline">
              Marcar todas
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin notificaciones</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.slice(0, 20).map((n) => (
              <div
                key={n.id}
                className={cn('group relative flex items-start gap-2.5 p-3 transition-colors hover:bg-muted/40', !n.readAt && 'bg-primary/5')}
              >
                <span className="mt-0.5 text-base">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {!n.readAt && <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_COLORS[n.priority] ?? 'bg-amber-400')} />}
                    <p className="truncate text-xs font-semibold">{n.title}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.readAt && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    aria-label="Marcar como leída"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
