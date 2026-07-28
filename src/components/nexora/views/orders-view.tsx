'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/nexora/stat-card'
import { StatusBadge } from '@/components/nexora/status-badge'
import { Order } from '@/lib/types'
import { formatCurrency, timeAgo } from '@/lib/format'
import { Receipt, Plus, Clock, Truck, CheckCircle2, DollarSign, MapPin } from 'lucide-react'

export function OrdersView() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders')
      return res.json()
    },
  })

  const stats = useMemo(() => {
    const list = orders ?? []
    const active = list.filter((o) => o.status !== 'CANCELLED')
    const pending = list.filter((o) => o.status === 'PENDING' || o.status === 'PAID').length
    const inTransit = list.filter((o) => o.status === 'SHIPPED').length
    const delivered = list.filter((o) => o.status === 'DELIVERED').length
    const revenue = active.reduce((s, o) => s + o.total, 0)
    return { total: list.length, pending, inTransit, delivered, revenue }
  }, [orders])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Órdenes de venta y su estado"
        icon={Receipt}
        action={
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Nuevo pedido
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total pedidos</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-violet-500" />
              <p className="text-xs text-muted-foreground">En tránsito</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">{stats.inTransit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Entregados</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.delivered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">Ingresos generados (excluye pedidos cancelados)</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(stats.revenue)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pedidos recientes</h3>
            <span className="text-xs text-muted-foreground">{stats.total} registros</span>
          </div>
          <div className="nexora-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (orders?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No hay pedidos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((o) => (
                    <TableRow key={o.id} className="group">
                      <TableCell>
                        <code className="text-xs font-medium">{o.number}</code>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {o.customer.firstName} {o.customer.lastName}
                          </p>
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {o.customer.city ?? '—'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{o.items.length}</TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">
                        {formatCurrency(o.total, o.currencyCode)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.paymentMethod ?? '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>
                        {o.trackingNumber ? (
                          <code className="text-xs">{o.trackingNumber}</code>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{timeAgo(o.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
