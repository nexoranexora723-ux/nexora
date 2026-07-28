'use client'

import { useMemo, useState } from 'react'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/use-notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { formatNumber, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { NotificationView } from '@/server/services/notification.service'
import {
  Bell,
  BellOff,
  Search,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  ShoppingCart,
  Wallet,
  Package,
  Megaphone,
  Settings,
  XOctagon,
  MoreHorizontal,
  Trash2,
  Check,
  Inbox,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type FilterTab = 'all' | 'unread' | 'critical'

const TYPE_CONFIG: Record<
  string,
  { icon: LucideIcon; ring: string; bg: string; text: string; dot: string; label: string }
> = {
  info: { icon: Info, ring: 'ring-sky-200 dark:ring-sky-900', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500', label: 'Info' },
  success: { icon: CheckCircle2, ring: 'ring-emerald-200 dark:ring-emerald-900', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Éxito' },
  warning: { icon: AlertTriangle, ring: 'ring-amber-200 dark:ring-amber-900', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', label: 'Aviso' },
  error: { icon: XOctagon, ring: 'ring-rose-200 dark:ring-rose-900', bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', label: 'Error' },
  system: { icon: Settings, ring: 'ring-zinc-200 dark:ring-zinc-700', bg: 'bg-zinc-100 dark:bg-zinc-800/50', text: 'text-zinc-600 dark:text-zinc-400', dot: 'bg-zinc-500', label: 'Sistema' },
  finance: { icon: Wallet, ring: 'ring-violet-200 dark:ring-violet-900', bg: 'bg-violet-50 dark:bg-violet-950/50', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', label: 'Finanzas' },
  purchases: { icon: ShoppingCart, ring: 'ring-orange-200 dark:ring-orange-900', bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500', label: 'Compras' },
  sales: { icon: Megaphone, ring: 'ring-teal-200 dark:ring-teal-900', bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500', label: 'Ventas' },
  inventory: { icon: Package, ring: 'ring-lime-200 dark:ring-lime-900', bg: 'bg-lime-50 dark:bg-lime-950/50', text: 'text-lime-600 dark:text-lime-400', dot: 'bg-lime-500', label: 'Inventario' },
  marketing: { icon: Megaphone, ring: 'ring-fuchsia-200 dark:ring-fuchsia-900', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/50', text: 'text-fuchsia-600 dark:text-fuchsia-400', dot: 'bg-fuchsia-500', label: 'Marketing' },
  naios: { icon: Sparkles, ring: 'ring-violet-200 dark:ring-violet-900', bg: 'bg-violet-50 dark:bg-violet-950/50', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', label: 'NAIOS' },
}

const PRIORITY_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  LOW: { label: 'Baja', dot: 'bg-zinc-400', badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  MEDIUM: { label: 'Media', dot: 'bg-sky-500', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  HIGH: { label: 'Alta', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  CRITICAL: { label: 'Crítica', dot: 'bg-rose-500 animate-pulse', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
}

function configFor(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.info
}

export function NotificationsView() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<FilterTab>('all')

  const { toast } = useToast()
  const markReadMut = useMarkAsRead()
  const markAllMut = useMarkAllAsRead()
  const deleteMut = useDeleteNotification()

  const [deleteTarget, setDeleteTarget] = useState<NotificationView | null>(null)

  const queryParams = useMemo(() => {
    if (tab === 'unread') return { q: query || undefined, unreadOnly: true }
    if (tab === 'critical') return { q: query || undefined, priority: 'CRITICAL' as const }
    return { q: query || undefined }
  }, [query, tab])

  const { data, isLoading } = useNotifications(queryParams)

  const items = data?.items ?? []
  const stats = data?.stats ?? { total: 0, unread: 0, high: 0, critical: 0, today: 0 }

  const handleClick = async (n: NotificationView) => {
    if (n.readAt) return
    try {
      await markReadMut.mutateAsync(n.id)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo marcar',
        variant: 'destructive',
      })
    }
  }

  const handleMarkAll = async () => {
    if (stats.unread === 0) return
    try {
      const res = await markAllMut.mutateAsync()
      toast({
        title: 'Notificaciones leídas',
        description: `${res.count} marcada(s) como leída(s)`,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo completar',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Notificación eliminada' })
      setDeleteTarget(null)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo eliminar',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones"
        description="Centro de comunicaciones · Alertas, recomendaciones NAIOS y eventos del sistema"
        icon={Bell}
        action={
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={handleMarkAll}
            disabled={markAllMut.isPending || stats.unread === 0}
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="No leídas"
          value={formatNumber(stats.unread)}
          icon={Bell}
          accent={stats.unread > 0 ? 'amber' : 'emerald'}
          subtitle={stats.unread > 0 ? 'Pendientes de revisar' : 'Todo al día'}
        />
        <StatCard
          title="Críticas"
          value={formatNumber(stats.critical)}
          icon={AlertTriangle}
          accent={stats.critical > 0 ? 'rose' : 'zinc'}
          subtitle="Prioridad CRITICAL"
        />
        <StatCard
          title="Hoy"
          value={formatNumber(stats.today)}
          icon={Sparkles}
          accent="violet"
          subtitle="Recibidas hoy"
        />
        <StatCard
          title="Total"
          value={formatNumber(stats.total)}
          icon={Inbox}
          accent="sky"
          subtitle="Histórico"
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-lg border bg-muted/50 p-1">
              {([
                { key: 'all', label: 'Todas' },
                { key: 'unread', label: `No leídas${stats.unread > 0 ? ` (${stats.unread})` : ''}` },
                { key: 'critical', label: 'Críticas' },
              ] as { key: FilterTab; label: string }[]).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    tab === t.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar en título o mensaje..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {stats.unread > 0 && (
              <Badge variant="secondary" className="ml-auto gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {stats.unread} sin leer
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">
              {tab === 'unread'
                ? 'No hay notificaciones sin leer'
                : tab === 'critical'
                ? 'No hay notificaciones críticas'
                : 'No se encontraron notificaciones'}
            </p>
            <p className="text-xs text-muted-foreground">
              {query
                ? 'Prueba con otra búsqueda'
                : 'Cuando ocurra algo importante aparecerá aquí'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="nexora-scroll max-h-[calc(100vh-22rem)] space-y-2 overflow-y-auto pr-1">
          {items.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onRead={handleClick}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar notificación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente <strong>{deleteTarget?.title}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function NotificationCard({
  notification,
  onRead,
  onDelete,
}: {
  notification: NotificationView
  onRead: (n: NotificationView) => void
  onDelete: (n: NotificationView) => void
}) {
  const cfg = configFor(notification.type)
  const prio = PRIORITY_CONFIG[notification.priority] ?? PRIORITY_CONFIG.MEDIUM
  const Icon = cfg.icon
  const isUnread = !notification.readAt

  let parsedData: { url?: unknown; entityType?: unknown; [k: string]: unknown } | null = null
  if (notification.data) {
    try {
      parsedData = JSON.parse(notification.data) as { url?: unknown; entityType?: unknown; [k: string]: unknown }
    } catch {
      parsedData = null
    }
  }

  const dataUrl =
    parsedData && typeof parsedData.url === 'string' ? parsedData.url : null

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md',
        isUnread && 'ring-1 ring-primary/20',
      )}
      onClick={() => onRead(notification)}
    >
      <CardContent className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
            cfg.bg,
            cfg.text,
            cfg.ring,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {isUnread && (
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      prio.dot,
                    )}
                    aria-label="No leída"
                  />
                )}
                <p
                  className={cn(
                    'truncate text-sm',
                    isUnread ? 'font-semibold' : 'font-medium text-muted-foreground',
                  )}
                >
                  {notification.title}
                </p>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {notification.message}
              </p>
              {parsedData && Object.keys(parsedData).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {cfg.label}
                  </Badge>
                  {parsedData.entityType !== undefined && typeof parsedData.entityType === 'string' && (
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {String(parsedData.entityType)}
                    </Badge>
                  )}
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {timeAgo(notification.createdAt)}
                </span>
                <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium', prio.badge)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', prio.dot)} />
                  {prio.label}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {isUnread && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRead(notification)
                  }}
                  aria-label="Marcar como leída"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {isUnread && (
                    <DropdownMenuItem onClick={() => onRead(notification)}>
                      <Check className="mr-2 h-3.5 w-3.5" /> Marcar como leída
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-rose-600"
                    onClick={() => onDelete(notification)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {dataUrl && (
          <a
            href={dataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Ver
          </a>
        )}
      </CardContent>
    </Card>
  )
}
