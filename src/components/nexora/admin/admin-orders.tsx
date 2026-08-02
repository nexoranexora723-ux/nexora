'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, timeAgo, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Receipt, Search, Eye, ChevronLeft, ChevronRight, Download, Truck, Package,
  TrendingUp, Clock, CheckCircle2, AlertCircle, MoreHorizontal, MapPin, CreditCard,
} from 'lucide-react'

// === Types ===
interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
  currencyCode: string
  sku?: string
}

interface Order {
  id: string
  number: string
  status: string // PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED
  requestStatus?: string
  createdAt: string
  updatedAt: string
  closedAt: string | null
  productName: string
  quantity: number
  currencyCode: string
  total: number
  itemsCount: number
  items: OrderItem[]
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  } | null
  paymentMethod: string | null
  shippingAddress: string | null
  trackingNumber: string | null
  carrier: string | null
  budget: number | null
  category: string | null
  description: string | null
}

interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  totalPages: number
  stats: {
    total: number
    pending: number
    confirmed: number
    processing: number
    shipped: number
    delivered: number
    cancelled: number
    revenue: number
  }
}

// === Status config ===
const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  PENDING: {
    label: 'Pendiente',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmado',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
    dotClass: 'bg-blue-500',
  },
  PROCESSING: {
    label: 'En proceso',
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300',
    dotClass: 'bg-violet-500',
  },
  SHIPPED: {
    label: 'Enviado',
    badgeClass: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-300',
    dotClass: 'bg-cyan-500',
  },
  DELIVERED: {
    label: 'Entregado',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelado',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300',
    dotClass: 'bg-rose-500',
  },
}

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const TAB_VALUES: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'CONFIRMED', label: 'Confirmados' },
  { key: 'PROCESSING', label: 'En proceso' },
  { key: 'SHIPPED', label: 'Enviados' },
  { key: 'DELIVERED', label: 'Entregados' },
  { key: 'CANCELLED', label: 'Cancelados' },
]

// === Main Component ===
export function AdminOrders() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [page, setPage] = useState(1)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({})

  const limit = 20

  // Debounced search via separate state
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const queryParams = new URLSearchParams({
    scope: 'admin',
    page: String(page),
    limit: String(limit),
  })
  if (statusTab !== 'all') queryParams.set('status', statusTab)
  if (debouncedSearch) queryParams.set('search', debouncedSearch)

  const { data, isLoading, isFetching } = useQuery<OrdersResponse>({
    queryKey: ['admin-orders', debouncedSearch, statusTab, page],
    queryFn: async () => (await fetch(`/api/orders?${queryParams.toString()}`)).json(),
    placeholderData: (prev) => prev,
  })

  const orders = data?.orders ?? []
  const stats = data?.stats

  // Update order status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, trackingNumber }: { id: string; status: string; trackingNumber?: string }) => {
      const payload: { status: string; trackingNumber?: string } = { status }
      if (trackingNumber !== undefined) payload.trackingNumber = trackingNumber
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error' }))
        throw new Error(err.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      toast({
        title: 'Estado actualizado',
        description: `Pedido ${vars.status === 'CANCELLED' ? 'cancelado' : `cambiado a ${STATUS_CONFIG[vars.status]?.label ?? vars.status}`}`,
      })
      // Update detail dialog if open
      setDetailOrder((prev) =>
        prev && prev.id === vars.id
          ? { ...prev, status: vars.status, trackingNumber: vars.trackingNumber ?? prev.trackingNumber }
          : prev,
      )
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const handleStatusChange = (order: Order, newStatus: string) => {
    const trackingNumber =
      newStatus === 'SHIPPED'
        ? trackingInputs[order.id] ?? order.trackingNumber ?? ''
        : undefined
    updateStatus.mutate({ id: order.id, status: newStatus, trackingNumber })
  }

  // === CSV Export ===
  const exportCSV = () => {
    if (!orders.length) {
      toast({ title: 'No hay pedidos para exportar', variant: 'destructive' })
      return
    }
    const headers = [
      'Numero', 'Cliente', 'Email', 'Telefono', 'Productos',
      'Total', 'Moneda', 'Estado', 'Metodo de pago', 'Direccion',
      'Tracking', 'Fecha',
    ]
    const rows = orders.map((o) => [
      o.number,
      o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.replace(/,/g, ';') : '',
      o.customer?.email ?? '',
      o.customer?.phone ?? '',
      o.items.map((i) => `${i.name} x${i.quantity}`).join(' | ').replace(/,/g, ';'),
      o.total.toFixed(2),
      o.currencyCode,
      STATUS_CONFIG[o.status]?.label ?? o.status,
      o.paymentMethod ?? '',
      (o.shippingAddress ?? '').replace(/,/g, ';'),
      o.trackingNumber ?? '',
      formatDate(o.createdAt),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos-nexora-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: 'CSV exportado', description: `${orders.length} pedidos` })
  }

  return (
    <div className="space-y-6">
      {/* === Stats Cards === */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          title="Total pedidos"
          value={stats?.total ?? 0}
          icon={<Receipt className="h-4 w-4" />}
          accent="text-zinc-700 dark:text-zinc-300"
        />
        <StatCard
          title="Pendientes"
          value={stats?.pending ?? 0}
          icon={<Clock className="h-4 w-4" />}
          accent="text-amber-600"
        />
        <StatCard
          title="En tránsito"
          value={(stats?.shipped ?? 0) + (stats?.processing ?? 0)}
          icon={<Truck className="h-4 w-4" />}
          accent="text-cyan-600"
        />
        <StatCard
          title="Entregados"
          value={stats?.delivered ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="text-emerald-600"
        />
        <StatCard
          title="Ingresos totales"
          value={formatCurrency(stats?.revenue ?? 0)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="text-emerald-600"
        />
      </div>

      {/* === Toolbar === */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número (NX-…) o email del cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 self-start lg:self-auto"
              onClick={exportCSV}
              disabled={!orders.length}
            >
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </div>

          {/* Status tabs */}
          <Tabs value={statusTab} onValueChange={(v) => { setStatusTab(v); setPage(1) }} className="mt-3">
            <TabsList className="nexora-scroll h-auto w-full overflow-x-auto">
              {TAB_VALUES.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="text-xs">
                  {t.label}
                  {t.key !== 'all' && stats && (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                      {(stats as Record<string, number>)[t.key.toLowerCase()] ?? 0}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* === Table === */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No hay pedidos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || statusTab !== 'all'
                ? 'Prueba con otros filtros de búsqueda'
                : 'Los pedidos aparecerán aquí cuando los clientes compren'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="nexora-scroll overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-24 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => {
                    const config = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.PENDING
                    return (
                      <TableRow
                        key={o.id}
                        className="group cursor-pointer"
                        onClick={() => setDetailOrder(o)}
                      >
                        <TableCell>
                          <code className="text-xs font-medium text-primary">{o.number}</code>
                          {o.trackingNumber && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              🚚 {o.trackingNumber}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {o.customer ? (
                            <div>
                              <p className="text-sm font-medium">
                                {o.customer.firstName} {o.customer.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{o.customer.email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="max-w-[200px] truncate text-sm">{o.items[0]?.name ?? o.productName}</p>
                          {o.itemsCount > 1 && (
                            <p className="text-[10px] text-muted-foreground">+{o.itemsCount - 1} producto(s) más</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="text-sm font-bold tabular-nums">{formatCurrency(o.total, o.currencyCode)}</p>
                          <p className="text-[10px] text-muted-foreground">{o.currencyCode}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('gap-1 text-[10px]', config.badgeClass)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)} />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {timeAgo(o.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {/* Quick status change dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" disabled={updateStatus.isPending}>
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuLabel className="text-xs">Cambiar estado</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {STATUS_FLOW.map((s) => (
                                  <DropdownMenuItem
                                    key={s}
                                    onClick={() => handleStatusChange(o, s)}
                                    disabled={o.status === s}
                                    className="gap-2 text-xs"
                                  >
                                    <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_CONFIG[s].dotClass)} />
                                    {STATUS_CONFIG[s].label}
                                    {o.status === s && <span className="ml-auto text-[10px] text-muted-foreground">●</span>}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDetailOrder(o)} className="gap-2 text-xs">
                                  <Eye className="h-3.5 w-3.5" /> Ver detalles
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setDetailOrder(o)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* === Pagination === */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {isFetching ? 'Cargando...' : `Mostrando ${orders.length} de ${data?.total ?? 0} pedidos`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  Página {page} de {data?.totalPages ?? 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (data?.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 gap-1"
                >
                  Siguiente <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Detail Dialog === */}
      <OrderDetailDialog
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onStatusChange={handleStatusChange}
        onTrackingInputChange={(id, val) => setTrackingInputs((prev) => ({ ...prev, [id]: val }))}
        trackingInputs={trackingInputs}
        updating={updateStatus.isPending}
      />
    </div>
  )
}

// === Stat Card ===
function StatCard({ title, value, icon, accent }: { title: string; value: number | string; icon: React.ReactNode; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{title}</p>
          <span className={accent ?? 'text-muted-foreground'}>{icon}</span>
        </div>
        <p className={cn('mt-2 text-2xl font-bold tabular-nums', accent)}>{value}</p>
      </CardContent>
    </Card>
  )
}

// === Order Detail Dialog ===
function OrderDetailDialog({
  order,
  onClose,
  onStatusChange,
  onTrackingInputChange,
  trackingInputs,
  updating,
}: {
  order: Order | null
  onClose: () => void
  onStatusChange: (order: Order, newStatus: string) => void
  onTrackingInputChange: (id: string, value: string) => void
  trackingInputs: Record<string, string>
  updating: boolean
}) {
  if (!order) return null

  const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
  const isShipped = order.status === 'SHIPPED'
  const trackingValue = trackingInputs[order.id] ?? order.trackingNumber ?? ''

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="nexora-scroll max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Pedido <code className="text-primary">{order.number}</code>
          </DialogTitle>
          <DialogDescription>
            Creado {formatDate(order.createdAt)} · {timeAgo(order.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status + Status changer */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Estado actual</p>
              <Badge variant="outline" className={cn('mt-1 gap-1.5', config.badgeClass)}>
                <span className={cn('h-2 w-2 rounded-full', config.dotClass)} />
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={order.status}
                onValueChange={(v) => onStatusChange(order, v)}
                disabled={updating}
              >
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (
                    <SelectItem key={s} value={s} className="gap-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_CONFIG[s].dotClass)} />
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tracking number (only when shipped) */}
          {(isShipped || order.trackingNumber) && (
            <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-4 dark:border-cyan-900 dark:bg-cyan-950/30">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-cyan-600" />
                <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">Número de seguimiento</p>
              </div>
              <Input
                placeholder="Ej. 1Z999AA10123456784"
                value={trackingValue}
                onChange={(e) => onTrackingInputChange(order.id, e.target.value)}
                className="mt-2"
                disabled={updating}
              />
              {order.carrier && (
                <p className="mt-1 text-xs text-muted-foreground">Transportista: {order.carrier}</p>
              )}
              {isShipped && trackingValue !== (order.trackingNumber ?? '') && (
                <Button
                  size="sm"
                  className="mt-2 gap-1.5"
                  disabled={updating}
                  onClick={() => onStatusChange(order, 'SHIPPED')}
                >
                  <Truck className="h-3.5 w-3.5" /> Guardar tracking
                </Button>
              )}
            </div>
          )}

          {/* Customer info */}
          {order.customer && (
            <div className="rounded-lg border p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</p>
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <a href={`mailto:${order.customer.email}`} className="font-medium text-primary hover:underline">
                    {order.customer.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{order.customer.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Categoría</p>
                  <p className="font-medium">{order.category ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Shipping + payment */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {order.shippingAddress && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Envío</p>
                </div>
                <p className="mt-2 text-sm">{order.shippingAddress}</p>
              </div>
            )}
            {order.paymentMethod && (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pago</p>
                </div>
                <p className="mt-2 text-sm font-medium">{order.paymentMethod}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Productos ({order.items.length})
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{order.quantity} unidades</p>
            </div>
            <div className="mt-3 space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-2 rounded-md bg-muted/30 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    {item.sku && <p className="text-[10px] text-muted-foreground">SKU: {item.sku}</p>}
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice, item.currencyCode)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity, item.currencyCode)}
                  </p>
                </div>
              ))}
            </div>
            {/* Total */}
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <p className="text-sm font-semibold">Total</p>
              <p className="text-xl font-bold tabular-nums text-primary">
                {formatCurrency(order.total, order.currencyCode)}
              </p>
            </div>
          </div>

          {/* Description / notes */}
          {order.description && (
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notas del pedido</p>
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{order.description}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
