'use client'

import { useState, useMemo } from 'react'
import {
  useCustomers,
  useDeleteCustomer,
  useToggleCustomerStatus,
} from '@/hooks/use-customers'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { CustomerFormDialog } from '@/components/nexora/customers/customer-form-dialog'
import { formatCurrency, formatNumber, initials, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import type { CustomerWithRelations } from '@/server/services/customer.service'
import {
  Users,
  Plus,
  Crown,
  DollarSign,
  TrendingUp,
  Mail,
  MapPin,
  ShoppingBag,
  Sparkles,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react'

type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'VIP'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activos' },
  { value: 'VIP', label: 'VIP' },
  { value: 'INACTIVE', label: 'Inactivos' },
]

export function CustomersView() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomerWithRelations | null>(null)

  const { toast } = useToast()
  const qc = useQueryClient()
  const deleteMut = useDeleteCustomer()
  const toggleMut = useToggleCustomerStatus()

  const { data: customers, isLoading } = useCustomers({
    q: query || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sort: 'ltv_desc',
  })

  const stats = useMemo(() => {
    const list = customers ?? []
    const vip = list.filter((c) => c.status === 'VIP').length
    const totalLtv = list.reduce((s, c) => s + c.lifetimeValue, 0)
    const totalOrders = list.reduce((s, c) => s + c.totalOrders, 0)
    const avgTicket = totalOrders > 0 ? totalLtv / totalOrders : 0
    return { total: list.length, vip, totalLtv, avgTicket }
  }, [customers])

  const sorted = useMemo(() => {
    const list = customers ?? []
    return [...list].sort((a, b) => b.lifetimeValue - a.lifetimeValue)
  }, [customers])

  const handleEdit = (c: CustomerWithRelations) => {
    setEditing(c)
    setFormOpen(true)
  }
  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  // Cycle: ACTIVE → INACTIVE, INACTIVE → ACTIVE, VIP → ACTIVE
  const handleToggle = async (c: CustomerWithRelations) => {
    const newStatus: 'ACTIVE' | 'INACTIVE' | 'VIP' =
      c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await toggleMut.mutateAsync({ id: c.id, status: newStatus })
      toast({
        title: 'Estado actualizado',
        description: `${c.fullName} → ${newStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}`,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo cambiar el estado',
        variant: 'destructive',
      })
    }
  }

  const handleToggleVip = async (c: CustomerWithRelations) => {
    const newStatus: 'ACTIVE' | 'INACTIVE' | 'VIP' =
      c.status === 'VIP' ? 'ACTIVE' : 'VIP'
    try {
      await toggleMut.mutateAsync({ id: c.id, status: newStatus })
      toast({
        title: newStatus === 'VIP' ? 'Cliente marcado como VIP' : 'VIP removido',
        description: c.fullName,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo actualizar',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Cliente eliminado', description: deleteTarget.fullName })
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
        title="Clientes"
        description="CRM y valor de vida del cliente"
        icon={Users}
        action={
          <Button className="gap-1.5" onClick={handleNew}>
            <Plus className="h-4 w-4" /> Nuevo cliente
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total clientes"
          value={formatNumber(stats.total)}
          icon={Users}
          accent="emerald"
        />
        <StatCard
          title="Clientes VIP"
          value={formatNumber(stats.vip)}
          icon={Crown}
          accent="amber"
        />
        <StatCard
          title="Valor de vida total"
          value={formatCurrency(stats.totalLtv)}
          icon={DollarSign}
          accent="violet"
        />
        <StatCard
          title="Ticket promedio"
          value={formatCurrency(stats.avgTicket)}
          icon={TrendingUp}
          accent="sky"
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, teléfono, ciudad..."
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

      {/* Customer cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron clientes</p>
            <p className="text-xs text-muted-foreground">Prueba con otra búsqueda o crea un nuevo cliente</p>
            <Button className="mt-4 gap-1.5" onClick={handleNew}>
              <Plus className="h-4 w-4" /> Nuevo cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((c) => {
            const isVip = c.status === 'VIP'
            return (
              <Card key={c.id} className="group transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <button onClick={() => handleEdit(c)} aria-label={`Editar ${c.fullName}`}>
                      <div
                        className={cn(
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105',
                          isVip
                            ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                            : 'bg-gradient-to-br from-primary to-emerald-700',
                        )}
                        aria-hidden
                      >
                        {initials(c.firstName, c.lastName)}
                      </div>
                    </button>

                    {/* Header */}
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => handleEdit(c)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold hover:text-primary">
                          {c.firstName} {c.lastName}
                        </h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{c.email}</span>
                        </a>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {c.city ?? '—'}, {c.country ?? '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          {formatNumber(c.totalOrders)} pedidos
                        </span>
                      </div>
                    </button>

                    {/* LTV + actions */}
                    <div className="flex shrink-0 items-start gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums">{formatCurrency(c.lifetimeValue)}</p>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">valor de vida</p>
                      </div>
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
                          <DropdownMenuItem onClick={() => handleEdit(c)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleVip(c)}>
                            {isVip ? (
                              <>
                                <PowerOff className="mr-2 h-3.5 w-3.5" /> Quitar VIP
                              </>
                            ) : (
                              <>
                                <Crown className="mr-2 h-3.5 w-3.5" /> Marcar VIP
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(c)}>
                            {c.status === 'ACTIVE' ? (
                              <>
                                <PowerOff className="mr-2 h-3.5 w-3.5" /> Desactivar
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-3.5 w-3.5" /> Activar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-rose-600"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Tags */}
                  {c.tagsList.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
                      {c.tagsList.map((t, i) => (
                        <Badge key={`${t}-${i}`} variant="secondary" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        Cliente desde {timeAgo(c.createdAt)}
                      </span>
                    </div>
                  )}
                  {c.tagsList.length === 0 && (
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="text-xs text-muted-foreground">Sin etiquetas</span>
                      <span className="text-[10px] text-muted-foreground">
                        Cliente desde {timeAgo(c.createdAt)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* NAIOS insight card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Análisis de NAIOS · Clientes VIP</p>
            <p className="mt-1 text-muted-foreground">
              {stats.vip > 0 ? (
                <>
                  Detectamos <strong className="text-foreground">{stats.vip} cliente(s) VIP</strong> que representan una
                  proporción significativa del valor de vida total. NAIOS recomienda implementar un programa de
                  fidelización exclusivo con beneficios diferenciados (envío prioritario, soporte dedicado y acceso
                  anticipado a nuevos productos) para maximizar la retención y aumentar la frecuencia de compra.
                </>
              ) : (
                <>
                  Aún no se han identificado clientes VIP. NAIOS monitorea continuamente el valor de vida y la
                  frecuencia de compra para detectar candidatos a upgrade automático al estatus VIP.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará a <strong>{deleteTarget?.fullName}</strong> ({deleteTarget?.email}). El cliente
              se marcará como inactivo (soft delete) y no aparecerá en las listas activas. No se borrarán los pedidos
              históricos asociados.
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
