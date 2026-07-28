'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/nexora/stat-card'
import { StatusBadge, InventoryStatusBadge } from '@/components/nexora/status-badge'
import { Product } from '@/lib/types'
import { formatCurrency, formatPercent, inventoryStatus } from '@/lib/format'
import { Package, Search, Plus, TrendingUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'

export function ProductsView() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'ok'>('all')

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      return res.json()
    },
  })

  const filtered = useMemo(() => {
    if (!products) return []
    return products.filter((p) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.brand?.name.toLowerCase().includes(q))
      const status = inventoryStatus(p.stock ?? 0, p.minStock ?? 0)
      const matchesFilter = filter === 'all' || (filter === 'low' && status !== 'OK') || (filter === 'ok' && status === 'OK')
      return matchesQuery && matchesFilter
    })
  }, [products, query, filter])

  const stats = useMemo(() => {
    if (!products) return { total: 0, avgMargin: 0, lowStock: 0, totalValue: 0 }
    const totalValue = products.reduce((s, p) => s + (p.stock ?? 0) * p.purchasePrice, 0)
    const avgMargin = products.reduce((s, p) => s + (p.marginPct ?? 0), 0) / (products.length || 1)
    const lowStock = products.filter((p) => inventoryStatus(p.stock ?? 0, p.minStock ?? 0) !== 'OK').length
    return { total: products.length, avgMargin, lowStock, totalValue }
  }, [products])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Catálogo, márgenes y disponibilidad de inventario"
        icon={Package}
        action={<Button className="gap-1.5"><Plus className="h-4 w-4" /> Nuevo producto</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total productos</p><p className="mt-1 text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Margen promedio</p><p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatPercent(stats.avgMargin)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Valor inventario</p><p className="mt-1 text-2xl font-bold">{formatCurrency(stats.totalValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Stock bajo</p><p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.lowStock}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, SKU o marca..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'low', 'ok'] as const).map((f) => (
                <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Todos' : f === 'low' ? 'Stock bajo' : 'Disponibles'}
                </Button>
              ))}
            </div>
          </div>

          <div className="nexora-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Compra</TableHead>
                  <TableHead className="text-right">Venta</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">No se encontraron productos</TableCell></TableRow>
                ) : (
                  filtered.map((p) => {
                    const status = inventoryStatus(p.stock ?? 0, p.minStock ?? 0)
                    return (
                      <TableRow key={p.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-md object-cover ring-1 ring-border" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Package className="h-4 w-4 text-muted-foreground" /></div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.supplier?.companyName ?? 'Sin proveedor'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><code className="text-xs">{p.sku}</code></TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal">{p.brand?.name ?? '—'}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.category?.name ?? '—'}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatCurrency(p.purchasePrice)}</TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrency(p.salePrice)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center gap-1 text-sm font-medium tabular-nums ${(p.marginPct ?? 0) >= 50 ? 'text-emerald-600 dark:text-emerald-400' : (p.marginPct ?? 0) >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            <TrendingUp className="h-3 w-3" />{formatPercent(p.marginPct ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-medium tabular-nums">{p.stock ?? 0}</span>
                          <span className="text-xs text-muted-foreground"> / {p.minStock ?? 0}</span>
                        </TableCell>
                        <TableCell><InventoryStatusBadge status={status} /></TableCell>
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
