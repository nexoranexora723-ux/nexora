'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/nexora/stat-card'
import { InventoryStatusBadge } from '@/components/nexora/status-badge'
import { InventoryItem } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { Warehouse, AlertTriangle, PackageX, Boxes, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InventoryView() {
  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await fetch('/api/inventory')
      return res.json()
    },
  })

  const stats = inventory
    ? {
        total: inventory.length,
        out: inventory.filter((i) => i.status === 'OUT').length,
        low: inventory.filter((i) => i.status === 'LOW').length,
        ok: inventory.filter((i) => i.status === 'OK').length,
        value: inventory.reduce((s, i) => s + i.stock * i.product.purchasePrice, 0),
        units: inventory.reduce((s, i) => s + i.stock, 0),
      }
    : null

  const alerts = inventory?.filter((i) => i.status !== 'OK') ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Existencias, ubicaciones y alertas de reposición"
        icon={Warehouse}
        action={<Button variant="outline" className="gap-1.5"><Boxes className="h-4 w-4" /> Ajustar stock</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Total unidades</p></div><p className="mt-1 text-2xl font-bold tabular-nums">{stats?.units ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Warehouse className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Valor inventario</p></div><p className="mt-1 text-2xl font-bold">{formatCurrency(stats?.value ?? 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><p className="text-xs text-muted-foreground">Stock bajo</p></div><p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.low ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><PackageX className="h-4 w-4 text-rose-500" /><p className="text-xs text-muted-foreground">Agotados</p></div><p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{stats?.out ?? 0}</p></CardContent></Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold">Alertas de reposición</h3>
              <span className="ml-auto text-xs text-muted-foreground">{alerts.length} productos requieren atención</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.product.name}</p>
                    <p className="text-xs text-muted-foreground">{a.product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">{a.stock}</p>
                    <p className="text-[10px] text-muted-foreground">mín. {a.minStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : (inventory?.length ?? 0) === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">Sin inventario registrado</TableCell></TableRow>
                ) : (
                  inventory?.map((i) => {
                    const pct = i.minStock > 0 ? Math.min(100, (i.stock / (i.minStock * 2)) * 100) : 100
                    const barColor = i.status === 'OUT' ? 'bg-rose-500' : i.status === 'LOW' ? 'bg-amber-500' : 'bg-emerald-500'
                    return (
                      <TableRow key={i.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {i.product.imageUrl ? (
                              <img src={i.product.imageUrl} alt="" className="h-9 w-9 rounded-md object-cover ring-1 ring-border" />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-xs">📦</div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{i.product.name}</p>
                              <p className="text-xs text-muted-foreground">{i.product.brand?.name ?? '—'} · {i.product.category?.name ?? '—'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><div className="text-xs"><div className="font-medium">{i.warehouse.name}</div><code className="text-muted-foreground">{i.warehouse.code}</code></div></TableCell>
                        <TableCell>{i.location ? <span className="inline-flex items-center gap-1 text-xs"><MapPin className="h-3 w-3 text-muted-foreground" />{i.location}</span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">{i.stock}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{i.reserved}</TableCell>
                        <TableCell className="text-right text-sm font-medium tabular-nums">{i.available}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2 [&>div]:bg-transparent" />
                            <div className={`h-2 w-2 shrink-0 rounded-full ${barColor}`} />
                          </div>
                        </TableCell>
                        <TableCell><InventoryStatusBadge status={i.status} /></TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
