'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteFooter } from '@/components/nexora/public/site-footer'
import { useAuth } from '@/lib/auth-store'
import { formatCurrency, formatDate, timeAgo } from '@/lib/format'
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Search,
  Truck,
  Lock,
  Loader2,
  ChevronRight,
  MapPin,
  CreditCard,
  Calendar,
  ShoppingBag,
  Hash,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react'

// ---------- Types ----------

interface SessionResponse {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    position: string | null
    phone: string | null
    avatarUrl: string | null
  } | null
  authenticated: boolean
}

interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
  currencyCode?: string
}

interface OrderSummary {
  id: string
  number: string
  status: string
  createdAt: string
  updatedAt?: string
  closedAt?: string | null
  total: number
  currencyCode: string
  itemsCount: number
  items?: OrderItem[]
  productName?: string
  quantity?: number
  paymentMethod?: string | null
  shippingAddress?: string | null
  trackingNumber?: string | null
  carrier?: string | null
}

interface OrderDetail extends OrderSummary {
  description?: string
  details?: string
  budget?: number
  statusHistory?: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    notes: string | null
    createdAt: string
  }>
  quotes?: Array<Record<string, unknown>>
  imports?: Array<Record<string, unknown>>
}

// ---------- Status helpers ----------

const STATUS_META: Record<string, { label: string; tone: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  NUEVA: { label: 'Nueva', tone: 'secondary', icon: <Clock className="size-3" /> },
  ANALIZANDO: { label: 'En análisis', tone: 'secondary', icon: <Search className="size-3" /> },
  BUSCANDO_PROVEEDOR: { label: 'Buscando proveedor', tone: 'secondary', icon: <Search className="size-3" /> },
  COTIZACION_RECIBIDA: { label: 'Cotización recibida', tone: 'secondary', icon: <Package className="size-3" /> },
  COTIZACION_ENVIADA: { label: 'Cotización enviada', tone: 'secondary', icon: <Package className="size-3" /> },
  ESPERANDO_APROBACION: { label: 'Esperando aprobación', tone: 'secondary', icon: <Clock className="size-3" /> },
  PAGO_RECIBIDO: { label: 'Pago recibido', tone: 'default', icon: <CheckCircle2 className="size-3" /> },
  COMPRA_REALIZADA: { label: 'Compra realizada', tone: 'default', icon: <CheckCircle2 className="size-3" /> },
  PRODUCCION: { label: 'En producción', tone: 'default', icon: <Package className="size-3" /> },
  EN_TRANSITO: { label: 'En tránsito', tone: 'default', icon: <Truck className="size-3" /> },
  ENTREGADO: { label: 'Entregado', tone: 'default', icon: <CheckCircle2 className="size-3" /> },
  CERRADO: { label: 'Cerrado', tone: 'outline', icon: <CheckCircle2 className="size-3" /> },
  CANCELLED: { label: 'Cancelado', tone: 'destructive', icon: <XCircle className="size-3" /> },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'outline' as const, icon: null }
  return (
    <Badge variant={meta.tone} className="gap-1 whitespace-nowrap">
      {meta.icon}
      {meta.label}
    </Badge>
  )
}

// ---------- Page ----------

export default function PedidosPage() {
  const { setUser } = useAuth()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  // ----- Session check -----
  const { data: session, isLoading: sessionLoading } = useQuery<SessionResponse>({
    queryKey: ['auth-session'],
    queryFn: async () => (await fetch('/api/auth/session')).json(),
    staleTime: 60 * 1000,
  })

  React.useEffect(() => {
    if (session?.user) setUser(session.user)
  }, [session])

  // ----- Orders list -----
  const { data: orders, isLoading: ordersLoading } = useQuery<OrderSummary[]>({
    queryKey: ['my-orders'],
    queryFn: async () => (await fetch('/api/orders')).json(),
    enabled: !!session?.authenticated,
  })

  // ----- Order detail (when selected) -----
  const { data: detail, isLoading: detailLoading } = useQuery<OrderDetail>({
    queryKey: ['order-detail', selectedId],
    queryFn: async () => (await fetch(`/api/orders/${selectedId}`)).json(),
    enabled: !!selectedId,
  })

  // ---------- Loading ----------
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PedidosNavbar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
          <Skeleton className="mb-6 h-9 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // ---------- Not authenticated ----------
  if (!session?.authenticated || !session.user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PedidosNavbar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="size-7" />
          </div>
          <h1 className="text-2xl font-bold">Inicia sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión para ver el historial de tus pedidos de importación.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button asChild size="lg" className="gap-2">
              <Link href="/?login=1">Iniciar sesión</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/?register=1">Crear cuenta gratuita <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver al inicio
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const list = orders ?? []

  // ---------- Empty state ----------
  if (!ordersLoading && list.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PedidosNavbar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Package className="size-7" />
          </div>
          <h1 className="text-2xl font-bold">Aún no tienes pedidos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuando solicites tu primera importación, aparecerá aquí con todo el seguimiento.
          </p>
          <Button asChild size="lg" className="mt-6 gap-2">
            <Link href="/?view=catalog">Explorar catálogo <ArrowRight className="size-4" /></Link>
          </Button>
          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver al inicio
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // ---------- Main list ----------
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PedidosNavbar />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Mis pedidos</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} {list.length === 1 ? 'pedido' : 'pedidos'} en total · Haz clic en uno para ver el detalle.
          </p>
        </div>

        {/* Orders list */}
        <div className="space-y-3">
          {ordersLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            : list.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className="group w-full rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary">{order.number}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-foreground">
                        {order.productName || (order.items?.[0]?.name ?? 'Pedido')}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="size-3" /> {formatDate(order.createdAt)}</span>
                        <span className="flex items-center gap-1"><Hash className="size-3" /> {order.itemsCount} {order.itemsCount === 1 ? 'artículo' : 'artículos'}</span>
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {timeAgo(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                        <p className="text-lg font-bold">{formatCurrency(order.total, order.currencyCode)}</p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </main>

      {/* ===== Detail dialog ===== */}
      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="font-mono text-base text-primary">
                {detail?.number ?? (detailLoading ? 'Cargando…' : 'Pedido')}
              </DialogTitle>
              {detail && <StatusBadge status={detail.status} />}
            </div>
            <DialogDescription className="text-xs">
              {detail ? `Creado el ${formatDate(detail.createdAt)}` : 'Cargando detalle del pedido…'}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="space-y-5">
              {/* Items */}
              <section>
                <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <ShoppingBag className="size-4 text-primary" /> Productos
                </h3>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <tbody>
                      {(detail.items && detail.items.length > 0
                        ? detail.items
                        : [{ name: detail.productName || 'Pedido', quantity: detail.quantity ?? 1, unitPrice: detail.total / Math.max(1, detail.quantity ?? 1), currencyCode: detail.currencyCode }]
                      ).map((it, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                          <td className="px-3 py-2.5 font-medium">
                            {it.name}
                            {it.quantity > 1 && <span className="ml-1 text-xs text-muted-foreground">× {it.quantity}</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                            {formatCurrency(it.unitPrice * it.quantity, it.currencyCode || detail.currencyCode)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-primary">{formatCurrency(detail.total, detail.currencyCode)}</span>
                </div>
              </section>

              {/* Shipping + payment */}
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <CreditCard className="size-3.5" /> Método de pago
                  </p>
                  <p className="text-sm">{detail.paymentMethod || 'Pendiente de confirmación'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="size-3.5" /> Dirección de envío
                  </p>
                  <p className="text-sm">{detail.shippingAddress || 'Se coordinará tras la cotización'}</p>
                </div>
              </section>

              {/* Tracking */}
              {(detail.trackingNumber || detail.carrier) && (
                <section className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Truck className="size-3.5" /> Seguimiento
                  </p>
                  {detail.carrier && <p className="text-sm font-medium">{detail.carrier}</p>}
                  {detail.trackingNumber && (
                    <p className="mt-0.5 font-mono text-sm">{detail.trackingNumber}</p>
                  )}
                </section>
              )}

              {/* Description / details (legacy) */}
              {detail.description && (
                <section>
                  <h3 className="mb-1 text-sm font-semibold">Notas del pedido</h3>
                  <p className="whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">{detail.description}</p>
                </section>
              )}

              {/* Status history */}
              {detail.statusHistory && detail.statusHistory.length > 0 && (
                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <Clock className="size-4 text-primary" /> Historial de estados
                  </h3>
                  <ol className="space-y-2.5 border-l-2 border-muted pl-4">
                    {detail.statusHistory.map((h) => (
                      <li key={h.id} className="relative">
                        <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary" />
                        <p className="text-sm font-medium">{STATUS_META[h.toStatus]?.label ?? h.toStatus}</p>
                        {h.notes && <p className="text-xs text-muted-foreground">{h.notes}</p>}
                        <p className="text-[11px] text-muted-foreground">{formatDate(h.createdAt)} · {timeAgo(h.createdAt)}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild className="flex-1 gap-2">
                  <Link href={`/track-order?number=${encodeURIComponent(detail.number)}`}>
                    <Truck className="size-4" /> Seguir pedido
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 gap-2">
                  <Link href="/cuenta">Ir a mi cuenta</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No se pudo cargar el detalle.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  )
}

// ---------- Subcomponents ----------

function PedidosNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Volver al inicio
        </Link>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm">
            <span className="text-sm font-black">N</span>
          </div>
          <span className="font-bold tracking-tight">NEXORA</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/cuenta">Mi cuenta</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
