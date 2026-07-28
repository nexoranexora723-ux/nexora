'use client'

import { useState, useMemo } from 'react'
import { useInventory, useInventoryMovements } from '@/hooks/use-inventory'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { InventoryStatusBadge } from '@/components/nexora/status-badge'
import { AdjustDialog } from '@/components/nexora/inventory/adjust-dialog'
import { formatCurrency, formatNumber, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Warehouse, AlertTriangle, PackageX, Boxes, MapPin, Search,
  ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, Plus,
} from 'lucide-react'
import type { InventoryMovementWithRelations } from '@/server/services/inventory.service'

type StatusFilter = 'all' | 'LOW' | 'OUT' | 'OK'

const MOVEMENT_META: Record<string, { label: string; icon: typeof ArrowDownCircle; color: string }> = {
  IN: { label: 'Entrada', icon: ArrowDownCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' },
  OUT: { label: 'Salida', icon: ArrowUpCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' },
  ADJUST: { label: 'Ajuste', icon: SlidersHorizontal, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' },
}

export function InventoryView() {
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustPreset, setAdjustPreset] = useState<{ productId?: string; warehouseId?: string } | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'IN' | 'OUT' | 'ADJUST'>('all')

  const { data: inventory, isLoading } = useInventory({
    q: query || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })
  const { data: movements, isLoading: movementsLoading } = useInventoryMovements(
    movementTypeFilter === 'all' ? {} : { type: movementTypeFilter },
  )

  const stats = useMemo(() => {
    if (!inventory) return { total: 0, out: 0, low: 0, ok: 0, value: 0, units: 0 }
    return {
      total: inventory.length,
      out: inventory.filter((i) => i.status === 'OUT').length,
      low: inventory.filter((i) => i.status === 'LOW').length,
      ok: inventory.filter((i) => i.status === 'OK').length,
      value: inventory.reduce((s, i) => s + i.stock * i.product.purchasePrice, 0),
      units: inventory.reduce((s, i) => s + i.stock, 0),
    }
  }, [inventory])

  const alerts = inventory?.filter((i) => i.status !== 'OK') ?? []

  const openAdjust = (preset?: { productId?: string; warehouseId?: string }) => {
    setAdjustPreset(preset ?? null)
    setAdjustOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Existencias, ubicaciones, alertas de reposición y kardex de movimientos"
        icon={Warehouse}
        action={
          <Button className="gap-1.5" onClick={() => openAdjust()}>
            <Boxes className="h-4 w-4" /> Ajustar stock
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total unidades" value={formatNumber(stats.units)} icon={Boxes} accent="emerald" />
        <StatCard title="Valor inventario" value={formatCurrency(stats.value)} icon={Warehouse} accent="sky" />
        <StatCard
          title="Stock bajo"
          value={formatNumber(stats.low)}
          icon={AlertTriangle}
          accent="amber"
          subtitle={`${stats.low} productos`}
        />
        <StatCard
          title="Agotados"
          value={formatNumber(stats.out)}
          icon={PackageX}
          accent={stats.out > 0 ? 'rose' : 'emerald'}
        />
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory" className="gap-1.5">
            <Warehouse className="h-3.5 w-3.5" /> Inventario
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Movimientos (Kardex)
          </TabsTrigger>
        </TabsList>

        {/* === TAB: Inventario === */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Alerts */}
          {alerts.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-semibold">Alertas de reposición</h3>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {alerts.length} productos requieren atención
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {alerts.map((a) => (
                    <button
                      key={a.id}
                      className="group flex items-center justify-between rounded-lg border bg-card p-2.5 text-left transition-colors hover:border-primary/50"
                      onClick={() => openAdjust({ productId: a.productId, warehouseId: a.warehouseId })}
                      title="Ajustar stock de este producto"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium group-hover:text-primary">{a.product.name}</p>
                        <p className="text-xs text-muted-foreground">{a.product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-sm font-bold tabular-nums',
                            a.status === 'OUT' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400',
                          )}
                        >
                          {a.stock}
                        </p>
                        <p className="text-[10px] text-muted-foreground">mín. {a.minStock}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Toolbar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative max-w-sm flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o SKU..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'OK', 'LOW', 'OUT'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={statusFilter === s ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setStatusFilter(s)}
                    >
                      {s === 'all' ? 'Todos' : s === 'OK' ? 'Disponible' : s === 'LOW' ? 'Bajo' : 'Agotado'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory table */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="mb-3 text-sm font-semibold">Inventario por producto</h3>
              <div className="nexora-scroll overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Almacén</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Reservado</TableHead>
                      <TableHead className="text-right">Disponible</TableHead>
                      <TableHead className="w-32">Nivel</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 9 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (inventory?.length ?? 0) === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                          Sin inventario registrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      inventory?.map((i) => {
                        const pct = i.minStock > 0 ? Math.min(100, (i.stock / (i.minStock * 2)) * 100) : 100
                        const barColor =
                          i.status === 'OUT' ? 'bg-rose-500' : i.status === 'LOW' ? 'bg-amber-500' : 'bg-emerald-500'
                        return (
                          <TableRow key={i.id} className="group">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {i.product.imageUrl ? (
                                  <img
                                    src={i.product.imageUrl}
                                    alt=""
                                    className="h-9 w-9 rounded-md object-cover ring-1 ring-border"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-xs">
                                    📦
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{i.product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {i.product.brand?.name ?? '—'} · {i.product.category?.name ?? '—'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div className="font-medium">{i.warehouse.name}</div>
                                <code className="text-muted-foreground">{i.warehouse.code}</code>
                              </div>
                            </TableCell>
                            <TableCell>
                              {i.location ? (
                                <span className="inline-flex items-center gap-1 text-xs">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {i.location}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold tabular-nums">{i.stock}</TableCell>
                            <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                              {i.reserved}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium tabular-nums">{i.available}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={pct} className="h-2 [&>div]:bg-transparent" />
                                <div className={`h-2 w-2 shrink-0 rounded-full ${barColor}`} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <InventoryStatusBadge status={i.status} />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={() =>
                                  openAdjust({ productId: i.productId, warehouseId: i.warehouseId })
                                }
                                title="Ajustar stock"
                              >
                                <Boxes className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB: Movimientos (Kardex) === */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'IN', 'OUT', 'ADJUST'] as const).map((t) => (
                    <Button
                      key={t}
                      variant={movementTypeFilter === t ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => setMovementTypeFilter(t)}
                    >
                      {t === 'all' ? 'Todos' : MOVEMENT_META[t].label}
                    </Button>
                  ))}
                </div>
                <Button className="gap-1.5" onClick={() => openAdjust()}>
                  <Plus className="h-4 w-4" /> Nuevo movimiento
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="mb-3 text-sm font-semibold">Kardex · Últimos movimientos</h3>
              <div className="nexora-scroll max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Almacén</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementsLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (movements?.length ?? 0) === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                          Sin movimientos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements?.map((m) => <MovementRow key={m.id} m={m} />)
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust dialog */}
      <AdjustDialog open={adjustOpen} onOpenChange={setAdjustOpen} preset={adjustPreset} />
    </div>
  )
}

function MovementRow({ m }: { m: InventoryMovementWithRelations }) {
  const meta = MOVEMENT_META[m.type] ?? MOVEMENT_META.ADJUST
  const Icon = meta.icon
  const positive = m.quantity > 0
  return (
    <TableRow className="group">
      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
        {timeAgo(m.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {m.product.imageUrl ? (
            <img src={m.product.imageUrl} alt="" className="h-7 w-7 rounded-md object-cover ring-1 ring-border" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-[10px]">📦</div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{m.product.name}</p>
            <p className="text-xs text-muted-foreground">
              <code>{m.product.sku}</code>
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-xs">
        <div className="font-medium">{m.warehouse.name}</div>
        <code className="text-muted-foreground">{m.warehouse.code}</code>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn('gap-1 font-medium', meta.color)}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </Badge>
      </TableCell>
      <TableCell
        className={cn(
          'text-right text-sm font-bold tabular-nums',
          positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
        )}
      >
        {positive ? '+' : ''}
        {m.quantity}
      </TableCell>
      <TableCell className="max-w-xs">
        <span className="line-clamp-1 text-xs text-muted-foreground">{m.reason ?? '—'}</span>
      </TableCell>
      <TableCell>
        {m.reference ? (
          <code className="text-xs">{m.reference}</code>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  )
}
