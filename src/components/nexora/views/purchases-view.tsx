'use client'

import { useState, useMemo } from 'react'
import {
  usePurchases,
  useDeletePurchase,
  useReceivePurchase,
  useCancelPurchase,
} from '@/hooks/use-purchases'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { StatusBadge } from '@/components/nexora/status-badge'
import { PurchaseFormDialog } from '@/components/nexora/purchases/purchase-form-dialog'
import { formatCurrency, formatNumber, timeAgo } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import type { PurchaseWithRelations } from '@/server/services/purchase.service'
import {
  ShoppingCart,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  PackageCheck,
  Ban,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react'

// Country → flag emoji (preserved from original view)
const COUNTRY_FLAGS: Record<string, string> = {
  CN: '🇨🇳',
  China: '🇨🇳',
  CO: '🇨🇴',
  Colombia: '🇨🇴',
  US: '🇺🇸',
  HK: '🇭🇰',
}
function flag(country: string | null): string {
  if (!country) return '🌍'
  return COUNTRY_FLAGS[country] ?? '🌍'
}

type StatusFilter = 'all' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'DRAFT', label: 'Borradores' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'SHIPPED', label: 'En tránsito' },
  { value: 'RECEIVED', label: 'Recibidas' },
  { value: 'CANCELLED', label: 'Canceladas' },
]

export function PurchasesView() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PurchaseWithRelations | null>(null)
  const [cancelTarget, setCancelTarget] = useState<PurchaseWithRelations | null>(null)
  const [receiveTarget, setReceiveTarget] = useState<PurchaseWithRelations | null>(null)

  const { toast } = useToast()
  const qc = useQueryClient()
  const deleteMut = useDeletePurchase()
  const receiveMut = useReceivePurchase()
  const cancelMut = useCancelPurchase()

  const { data: purchases, isLoading } = usePurchases({
    q: query || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const stats = useMemo(() => {
    const list = purchases ?? []
    const pending = list.filter(
      (p) => p.status === 'PENDING' || p.status === 'APPROVED' || p.status === 'SHIPPED',
    ).length
    const received = list.filter((p) => p.status === 'RECEIVED').length
    const invested = list
      .filter((p) => p.status !== 'CANCELLED')
      .reduce((s, p) => s + p.total, 0)
    return { total: list.length, pending, received, invested }
  }, [purchases])

  const handleEdit = (p: PurchaseWithRelations) => {
    setEditing(p)
    setFormOpen(true)
  }
  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleReceive = async () => {
    if (!receiveTarget) return
    try {
      await receiveMut.mutateAsync(receiveTarget.id)
      toast({
        title: 'Orden recibida',
        description: `${receiveTarget.number} — inventario actualizado y gasto registrado`,
      })
      setReceiveTarget(null)
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      toast({
        title: 'Error al recibir',
        description: err instanceof Error ? err.message : 'No se pudo recibir la orden',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelMut.mutateAsync(cancelTarget.id)
      toast({
        title: 'Orden cancelada',
        description: cancelTarget.number,
      })
      setCancelTarget(null)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo cancelar',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Orden eliminada', description: deleteTarget.number })
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['dashboard'] })
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
        title="Compras"
        description="Órdenes de compra a proveedores con items y recepción"
        icon={ShoppingCart}
        action={
          <Button className="gap-1.5" onClick={handleNew}>
            <Plus className="h-4 w-4" /> Nueva orden
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total órdenes"
          value={formatNumber(stats.total)}
          icon={ShoppingCart}
          accent="emerald"
        />
        <StatCard
          title="En proceso"
          value={formatNumber(stats.pending)}
          icon={Clock}
          accent="amber"
          subtitle="Pendientes / en tránsito"
        />
        <StatCard
          title="Recibidas"
          value={formatNumber(stats.received)}
          icon={CheckCircle2}
          accent="sky"
        />
        <StatCard
          title="Invertido"
          value={formatCurrency(stats.invested)}
          icon={DollarSign}
          accent="violet"
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, proveedor, notas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_FILTERS.map((s) => (
                <Button
                  key={s.value}
                  variant={statusFilter === s.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setStatusFilter(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (purchases?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron órdenes</p>
            <p className="text-xs text-muted-foreground">Prueba con otra búsqueda o crea una nueva orden</p>
            <Button className="mt-4 gap-1.5" onClick={handleNew}>
              <Plus className="h-4 w-4" /> Nueva orden
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Órdenes de compra</h3>
              <span className="text-xs text-muted-foreground">{purchases!.length} registros</span>
            </div>
            <div className="nexora-scroll overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Envío</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Fecha</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases!.map((p) => {
                    const isReceived = p.status === 'RECEIVED'
                    const isCancelled = p.status === 'CANCELLED'
                    return (
                      <TableRow key={p.id} className="group">
                        <TableCell>
                          <button
                            className="text-left"
                            onClick={() => handleEdit(p)}
                            aria-label={`Editar ${p.number}`}
                          >
                            <code className="text-xs font-medium hover:text-primary">{p.number}</code>
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none" aria-hidden>
                              {flag(p.supplier.country)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{p.supplier.companyName}</p>
                              <p className="text-xs text-muted-foreground">{p.supplier.country ?? '—'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            {p.itemCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {formatCurrency(p.subtotal, p.currencyCode)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {formatCurrency(p.shippingCost, p.currencyCode)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {formatCurrency(p.total, p.currencyCode)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {timeAgo(p.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(p)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                              </DropdownMenuItem>
                              {!isReceived && !isCancelled && (
                                <DropdownMenuItem onClick={() => setReceiveTarget(p)}>
                                  <PackageCheck className="mr-2 h-3.5 w-3.5" /> Recibir
                                </DropdownMenuItem>
                              )}
                              {!isReceived && !isCancelled && (
                                <DropdownMenuItem
                                  className="text-orange-600"
                                  onClick={() => setCancelTarget(p)}
                                >
                                  <Ban className="mr-2 h-3.5 w-3.5" /> Cancelar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-rose-600"
                                disabled={isReceived}
                                onClick={() => setDeleteTarget(p)}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form dialog */}
      <PurchaseFormDialog open={formOpen} onOpenChange={setFormOpen} purchase={editing} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar orden de compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la orden <strong>{deleteTarget?.number}</strong> y todos sus
              items. Esta acción no se puede deshacer. No se permite eliminar órdenes ya recibidas
              (impacto en inventario y finanzas).
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

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar orden?</AlertDialogTitle>
            <AlertDialogDescription>
              La orden <strong>{cancelTarget?.number}</strong> pasará a estado <strong>Cancelada</strong>.
              No se podrá editar ni recibir posteriormente. No se afectará el inventario ni las finanzas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Cancelar orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receive confirmation */}
      <AlertDialog open={!!receiveTarget} onOpenChange={(open) => !open && setReceiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar como recibida?</AlertDialogTitle>
            <AlertDialogDescription>
              Se actualizará la orden <strong>{receiveTarget?.number}</strong> a estado{' '}
              <strong>Recibida</strong>. Esta acción:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
            <li>Incrementará el stock de cada producto en el almacén activo.</li>
            <li>Creará movimientos de inventario (tipo <code>IN</code>) por cada item.</li>
            <li>
              Registrará un gasto financiero (Transaction <code>EXPENSE</code> · categoría{' '}
              <code>PURCHASES</code>) por <strong>{formatCurrency(receiveTarget?.total ?? 0)}</strong>.
            </li>
            <li>La orden quedará bloqueada para edición.</li>
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReceive}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Recibir orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
