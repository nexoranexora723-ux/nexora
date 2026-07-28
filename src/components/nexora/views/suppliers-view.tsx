'use client'

import { useState, useMemo } from 'react'
import { useSuppliers, useDeleteSupplier, useToggleSupplierStatus } from '@/hooks/use-suppliers'
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
import { StatusBadge, RiskBadge } from '@/components/nexora/status-badge'
import { RatingBars } from '@/components/nexora/rating-bars'
import { SupplierFormDialog } from '@/components/nexora/suppliers/supplier-form-dialog'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import {
  Truck, MapPin, MessageCircle, Mail, Globe, Clock, Shield,
  Star, TrendingUp, AlertTriangle, Award, Plus, Search, MoreHorizontal,
  Pencil, Trash2, Power, PowerOff, Ban,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { SupplierWithRelations } from '@/server/services/supplier.service'

type RiskFilter = 'all' | 'LOW' | 'MEDIUM' | 'HIGH'

export function SuppliersView() {
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [selected, setSelected] = useState<SupplierWithRelations | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SupplierWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SupplierWithRelations | null>(null)

  const { toast } = useToast()
  const qc = useQueryClient()
  const deleteMut = useDeleteSupplier()
  const toggleMut = useToggleSupplierStatus()

  const { data: suppliers, isLoading } = useSuppliers({
    q: query || undefined,
    riskLevel: riskFilter === 'all' ? undefined : riskFilter,
  })

  const stats = useMemo(() => {
    if (!suppliers) return { total: 0, avgScore: 0, lowRisk: 0, highRisk: 0 }
    const withRating = suppliers.filter((s) => s.rating)
    const avgScore =
      withRating.length > 0
        ? withRating.reduce((s, x) => s + (x.rating?.overallScore ?? 0), 0) / withRating.length
        : 0
    return {
      total: suppliers.length,
      avgScore,
      lowRisk: suppliers.filter((s) => s.riskLevel === 'LOW').length,
      highRisk: suppliers.filter((s) => s.riskLevel === 'HIGH').length,
    }
  }, [suppliers])

  const sorted = useMemo(
    () =>
      suppliers
        ? [...suppliers].sort((a, b) => (b.rating?.overallScore ?? 0) - (a.rating?.overallScore ?? 0))
        : [],
    [suppliers],
  )

  const handleEdit = (s: SupplierWithRelations) => {
    setEditing(s)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleToggle = async (s: SupplierWithRelations) => {
    // Cycle: ACTIVE → INACTIVE; INACTIVE → ACTIVE; BLACKLISTED → ACTIVE
    const newStatus: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED' =
      s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await toggleMut.mutateAsync({ id: s.id, status: newStatus })
      toast({
        title: 'Estado actualizado',
        description: `${s.companyName} → ${newStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}`,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo cambiar el estado',
        variant: 'destructive',
      })
    }
  }

  const handleBlacklist = async (s: SupplierWithRelations) => {
    try {
      await toggleMut.mutateAsync({ id: s.id, status: 'BLACKLISTED' })
      toast({
        title: 'Proveedor en lista negra',
        description: s.companyName,
        variant: 'destructive',
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
      toast({ title: 'Proveedor eliminado', description: deleteTarget.companyName })
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
        title="Proveedores"
        description="Abastecimiento internacional con calificación multifactor por NAIOS"
        icon={Truck}
        action={
          <Button className="gap-1.5" onClick={handleNew}>
            <Plus className="h-4 w-4" /> Nuevo proveedor
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Proveedores"
          value={formatNumber(stats.total)}
          icon={Truck}
          accent="emerald"
        />
        <StatCard
          title="Score promedio"
          value={stats.avgScore.toFixed(1)}
          icon={Star}
          accent="amber"
          subtitle="Evaluación NAIOS"
        />
        <StatCard
          title="Bajo riesgo"
          value={formatNumber(stats.lowRisk)}
          icon={Award}
          accent="emerald"
        />
        <StatCard
          title="Alto riesgo"
          value={formatNumber(stats.highRisk)}
          icon={AlertTriangle}
          accent={stats.highRisk > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, contacto, email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'LOW', 'MEDIUM', 'HIGH'] as const).map((r) => (
                <Button
                  key={r}
                  variant={riskFilter === r ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setRiskFilter(r)}
                >
                  {r === 'all' ? 'Todos' : r === 'LOW' ? 'Bajo' : r === 'MEDIUM' ? 'Medio' : 'Alto'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron proveedores</p>
            <p className="text-xs text-muted-foreground">Prueba con otra búsqueda o crea un nuevo proveedor</p>
            <Button className="mt-4 gap-1.5" onClick={handleNew}>
              <Plus className="h-4 w-4" /> Nuevo proveedor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((s) => (
            <Card
              key={s.id}
              className={cn(
                'group transition-all hover:shadow-md',
                selected?.id === s.id && 'ring-2 ring-primary',
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => handleEdit(s)}
                    aria-label={`Editar ${s.companyName}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold hover:text-primary">{s.companyName}</h3>
                      <RiskBadge level={s.riskLevel} />
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.contactName ?? '—'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {s.city ?? '—'}, {s.country ?? '—'}
                      </span>
                      {s.leadTime != null && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {s.leadTime}d lead
                        </span>
                      )}
                      {s.warranty && (
                        <span className="inline-flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {s.warranty}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-start gap-1">
                    <div className="text-right">
                      <div
                        className={cn(
                          'text-3xl font-bold tabular-nums',
                          (s.rating?.overallScore ?? 0) >= 85
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : (s.rating?.overallScore ?? 0) >= 70
                              ? 'text-lime-600 dark:text-lime-400'
                              : (s.rating?.overallScore ?? 0) >= 55
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400',
                        )}
                      >
                        {(s.rating?.overallScore ?? 0).toFixed(1)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">score</div>
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
                        <DropdownMenuItem onClick={() => handleEdit(s)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(s)}>
                          {s.status === 'ACTIVE' ? (
                            <>
                              <PowerOff className="mr-2 h-3.5 w-3.5" /> Desactivar
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-3.5 w-3.5" /> Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        {s.status !== 'BLACKLISTED' && (
                          <DropdownMenuItem className="text-orange-600" onClick={() => handleBlacklist(s)}>
                            <Ban className="mr-2 h-3.5 w-3.5" /> Lista negra
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-600" onClick={() => setDeleteTarget(s)}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Rating bars */}
                <div className="mt-4">
                  <RatingBars rating={s.rating ?? null} compact={!selected || selected.id !== s.id} />
                </div>

                {/* Tags & contact links */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <Award className="h-3 w-3" /> {s.productCount} productos
                  </Badge>
                  {s.oem && <Badge variant="outline" className="font-normal">OEM</Badge>}
                  {s.odm && <Badge variant="outline" className="font-normal">ODM</Badge>}
                  {s.moq != null && <Badge variant="outline" className="font-normal">MOQ {s.moq}</Badge>}
                  {s.approvedQuotes > 0 && (
                    <Badge variant="outline" className="font-normal">
                      {s.approvedQuotes} cotiz.
                    </Badge>
                  )}
                  <div className="ml-auto flex gap-1">
                    {s.whatsapp && (
                      <a
                        href={`https://wa.me/${s.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MessageCircle className="h-4 w-4 text-emerald-600" />
                        </Button>
                      </a>
                    )}
                    {s.email && (
                      <a href={`mailto:${s.email}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    {s.website && (
                      <a href={`https://${s.website}`} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Globe className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {selected?.id === s.id && s.rating?.review && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs italic text-muted-foreground">
                    “{s.rating.review}”
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 w-full text-xs"
                  onClick={() => setSelected(selected?.id === s.id ? null : s)}
                >
                  {selected?.id === s.id ? 'Ver menos' : 'Ver detalle'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* NAIOS insight */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Análisis de NAIOS</p>
            <p className="mt-1 text-muted-foreground">
              Los proveedores con score superior a 85 presentan menor variabilidad en tiempos de entrega.
              Diversifica el riesgo marcando como “lista negra” a proveedores con score bajo o inconvenientes
              de comunicación recurrentes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form dialog */}
      <SupplierFormDialog open={formOpen} onOpenChange={setFormOpen} supplier={editing} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará a <strong>{deleteTarget?.companyName}</strong> (soft delete). El
              proveedor se marcará como inactivo y no aparecerá en las listas activas. No se borrarán los
              registros históricos (cotizaciones, órdenes de compra, calificaciones).
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
