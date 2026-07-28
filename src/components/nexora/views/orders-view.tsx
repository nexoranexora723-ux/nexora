'use client'

import { useState, useMemo } from 'react'
import { useOrders, useDeleteOrder, useCancelOrder } from '@/hooks/use-orders'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { StatusBadge } from '@/components/nexora/status-badge'
import { OrderFormDialog } from '@/components/nexora/orders/order-form-dialog'
import { formatCurrency, formatNumber, timeAgo } from '@/lib/format'
import { useQueryClient } from '@tanstack/react-query'
import {
  Receipt, Search, Plus, MoreHorizontal, Pencil, Trash2, Ban,
  Clock, Truck, CheckCircle2, DollarSign, MapPin, Package,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { OrderWithRelations } from '@/server/services/order.service'

type StatusFilter = 'all' | 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'

type DialogState =
  | { kind: 'delete'; order: OrderWithRelations }
  | { kind: 'cancel'; order: OrderWithRelations }
  | null

export function OrdersView() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<OrderWithRelations | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)

  const { toast } = useToast()
  const qc = useQueryClient()
  const deleteMut = useDeleteOrder()
  const cancelMut = useCancelOrder()

  const { data: orders, isLoading } = useOrders({
    q: query || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const stats = useMemo(() => {
    const list = orders ?? []
    const pending = list.filter((o) => o.status === 'PENDING' || o.status === 'PAID').length
    const inTransit = list.filter((o) => o.status === 'SHIPPED').length
    const delivered = list.filter((o) => o.status === 'DELIVERED').length
    const revenue = list
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
      .reduce((s, o) => s + o.total, 0)
    return { total: list.length, pending, inTransit, delivered, revenue }
  }, [orders])

  const handleEdit = (o: OrderWithRelations) => {
    setEditing(o)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!dialog || dialog.kind !== 'delete') return
    const order = dialog.order
    try {
      await deleteMut.mutateAsync(order.id)
      toast({ title: 'Pedido eliminado', description: order.number })
      setDialog(null)
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo eliminar',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = async () => {
    if (!dialog || dialog.kind !== 'cancel') return
    const order = dialog.order
    try {
      await cancelMut.mutateAsync(order.id)
      toast({ title: 'Pedido cancelado', description: `${order.number} · inventario restaurado` })
      setDialog(null)
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo cancelar',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Órdenes de venta · CRUD completo con inventario y finanzas"
        icon={Receipt}
        action={<Button className="gap-1.5" onClick={handleNew}><Plus className="h-4 w-4" /> Nuevo pedido</Button>}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total pedidos" value={formatNumber(stats.total)} icon={Receipt} accent="zinc" subtitle="Histórico" />
        <StatCard title="Pendientes" value={formatNumber(stats.pending)} icon={Clock} accent="amber" subtitle="Por pagar/pagados" />
        <StatCard title="En tránsito" value={formatNumber(stats.inTransit)} icon={Truck} accent="violet" subtitle="Enviados" />
        <StatCard title="Entregados" value={formatNumber(stats.delivered)} icon={CheckCircle2} accent="emerald" subtitle="Completados" />
      </div>

      {/* Revenue banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="text-sm">
            <p className="text-xs text-muted-foreground">Ingresos generados (excluye cancelados/reembolsados)</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(stats.revenue)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por número, cliente, email..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'Todos' : s === 'PENDING' ? 'Pendientes' : s === 'PAID' ? 'Pagados' : s === 'SHIPPED' ? 'Enviados' : s === 'DELIVERED' ? 'Entregados' : 'Cancelados'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (orders?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">No se encontraron pedidos</p>
              <p className="text-xs text-muted-foreground">Prueba con otra búsqueda o crea un nuevo pedido</p>
              <Button className="mt-4 gap-1.5" onClick={handleNew}><Plus className="h-4 w-4" /> Nuevo pedido</Button>
            </div>
          ) : (
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
                    <TableHead className="text-right">Fecha</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders!.map((o) => (
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
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm tabular-nums text-muted-foreground">
                          <Package className="h-3.5 w-3.5" />
                          {o.itemCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">
                        {formatCurrency(o.total, o.currencyCode)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.paymentMethod ?? '—'}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{timeAgo(o.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(o)} disabled={o.status === 'CANCELLED' || o.status === 'DELIVERED'}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDialog({ kind: 'cancel', order: o })}
                              disabled={o.status === 'CANCELLED'}
                            >
                              <Ban className="mr-2 h-3.5 w-3.5" /> Cancelar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={() => setDialog({ kind: 'delete', order: o })}
                              disabled={o.status !== 'CANCELLED'}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form dialog */}
      <OrderFormDialog open={formOpen} onOpenChange={setFormOpen} order={editing} />

      {/* Cancel confirmation */}
      <AlertDialog open={dialog?.kind === 'cancel'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cancelará <strong>{dialog?.order.number}</strong>. Esta acción:
              restaura el inventario, elimina la transacción de venta asociada y
              decrementa el LTV del cliente. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-amber-600 hover:bg-amber-700">
              Sí, cancelar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={dialog?.kind === 'delete'} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente <strong>{dialog?.order.number}</strong> y sus
              líneas. Solo se pueden eliminar pedidos cancelados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
