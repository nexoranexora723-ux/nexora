'use client'

import { useState, useMemo } from 'react'
import { useProducts, useDeleteProduct, useToggleProductStatus } from '@/hooks/use-products'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { StatusBadge, InventoryStatusBadge } from '@/components/nexora/status-badge'
import { ProductFormDialog } from '@/components/nexora/products/product-form-dialog'
import { formatCurrency, formatPercent, formatNumber, inventoryStatus, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import {
  Package, Search, Plus, LayoutGrid, Table as TableIcon, MoreHorizontal,
  Pencil, Trash2, Power, PowerOff, TrendingUp, AlertTriangle, Boxes, DollarSign,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { ProductWithRelations } from '@/server/services/product.service'

type SortKey = 'created_desc' | 'name' | 'name_desc' | 'price' | 'price_desc'

export function ProductsView() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'>('all')
  const [sort, setSort] = useState<SortKey>('created_desc')
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithRelations | null>(null)

  const { toast } = useToast()
  const qc = useQueryClient()
  const deleteMut = useDeleteProduct()
  const toggleMut = useToggleProductStatus()

  const { data: products, isLoading } = useProducts({
    q: query || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sort,
  })

  const stats = useMemo(() => {
    if (!products) return { total: 0, active: 0, lowStock: 0, totalValue: 0, avgMargin: 0 }
    const totalValue = products.reduce((s, p) => s + p.stock * p.purchasePrice, 0)
    const avgMargin = products.reduce((s, p) => s + p.marginPct, 0) / (products.length || 1)
    const lowStock = products.filter((p) => inventoryStatus(p.stock, p.minStock) !== 'OK').length
    const active = products.filter((p) => p.status === 'ACTIVE').length
    return { total: products.length, active, lowStock, totalValue, avgMargin }
  }, [products])

  const handleEdit = (p: ProductWithRelations) => {
    setEditing(p)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleToggle = async (p: ProductWithRelations) => {
    const newStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await toggleMut.mutateAsync({ id: p.id, status: newStatus })
      toast({ title: 'Estado actualizado', description: `${p.name} → ${newStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}` })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo cambiar el estado', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Producto eliminado', description: deleteTarget.name })
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestión profesional del catálogo · Base del ERP"
        icon={Package}
        action={<Button className="gap-1.5" onClick={handleNew}><Plus className="h-4 w-4" /> Nuevo producto</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total productos" value={formatNumber(stats.total)} icon={Package} accent="emerald" subtitle={`${stats.active} activos`} />
        <StatCard title="Valor inventario" value={formatCurrency(stats.totalValue)} icon={DollarSign} accent="sky" subtitle="A precio de compra" />
        <StatCard title="Margen promedio" value={formatPercent(stats.avgMargin)} icon={TrendingUp} accent="violet" />
        <StatCard title="Stock crítico" value={formatNumber(stats.lowStock)} icon={AlertTriangle} accent={stats.lowStock > 0 ? 'rose' : 'emerald'} subtitle="Bajo o agotado" />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, SKU, código..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'ACTIVE', 'INACTIVE', 'DISCONTINUED'] as const).map((s) => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'Todos' : s === 'ACTIVE' ? 'Activos' : s === 'INACTIVE' ? 'Inactivos' : 'Descontinuados'}
                </Button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Select className="hidden sm:block" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} />
              <div className="flex rounded-lg border">
                <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-r-none" onClick={() => setView('table')} aria-label="Vista tabla">
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button variant={view === 'cards' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 rounded-l-none" onClick={() => setView('cards')} aria-label="Vista tarjetas">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (products?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron productos</p>
            <p className="text-xs text-muted-foreground">Prueba con otra búsqueda o crea un nuevo producto</p>
            <Button className="mt-4 gap-1.5" onClick={handleNew}><Plus className="h-4 w-4" /> Nuevo producto</Button>
          </CardContent>
        </Card>
      ) : view === 'table' ? (
        <ProductsTable products={products!} onEdit={handleEdit} onToggle={handleToggle} onDelete={setDeleteTarget} />
      ) : (
        <ProductsCards products={products!} onEdit={handleEdit} onToggle={handleToggle} onDelete={setDeleteTarget} />
      )}

      {/* Form dialog */}
      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará <strong>{deleteTarget?.name}</strong> ({deleteTarget?.sku}). El producto se marcará como descontinuado (soft delete) y no aparecerá en el catálogo. No se borrarán los registros históricos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Inline sort select (lightweight)
function Select({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('h-8 rounded-lg border bg-background px-3 text-xs', className)}
    >
      <option value="created_desc">Más recientes</option>
      <option value="name">Nombre A-Z</option>
      <option value="name_desc">Nombre Z-A</option>
      <option value="price">Precio ↑</option>
      <option value="price_desc">Precio ↓</option>
    </select>
  )
}

// === TABLE VIEW ===
function ProductsTable({
  products, onEdit, onToggle, onDelete,
}: {
  products: ProductWithRelations[]
  onEdit: (p: ProductWithRelations) => void
  onToggle: (p: ProductWithRelations) => void
  onDelete: (p: ProductWithRelations) => void
}) {
  return (
    <Card>
      <CardContent className="p-0">
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
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const invStatus = inventoryStatus(p.stock, p.minStock)
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
                          <p className="text-xs text-muted-foreground">
                            {p.supplier?.companyName ?? 'Sin proveedor'}
                            {p.variants.length > 0 && ` · ${p.variants.length} variantes`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><code className="text-xs">{p.sku}</code></TableCell>
                    <TableCell>{p.brand ? <Badge variant="secondary" className="font-normal">{p.brand.name}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.category?.name ?? '—'}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatCurrency(p.purchasePrice)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrency(p.salePrice)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium tabular-nums', p.marginPct >= 50 ? 'text-emerald-600 dark:text-emerald-400' : p.marginPct >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>
                        <TrendingUp className="h-3 w-3" />{formatPercent(p.marginPct)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium tabular-nums">{p.stock}</span>
                      <span className="text-xs text-muted-foreground"> / {p.minStock}</span>
                    </TableCell>
                    <TableCell><InventoryStatusBadge status={invStatus} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(p)}><Pencil className="mr-2 h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggle(p)}>
                            {p.status === 'ACTIVE' ? <><PowerOff className="mr-2 h-3.5 w-3.5" /> Desactivar</> : <><Power className="mr-2 h-3.5 w-3.5" /> Activar</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-rose-600" onClick={() => onDelete(p)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
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
  )
}

// === CARDS VIEW ===
function ProductsCards({
  products, onEdit, onToggle, onDelete,
}: {
  products: ProductWithRelations[]
  onEdit: (p: ProductWithRelations) => void
  onToggle: (p: ProductWithRelations) => void
  onDelete: (p: ProductWithRelations) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const invStatus = inventoryStatus(p.stock, p.minStock)
        return (
          <Card key={p.id} className="group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className="relative aspect-square overflow-hidden bg-muted">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
              )}
              <div className="absolute left-2 top-2 flex flex-col gap-1">
                {p.brand && <Badge className="bg-background/90 text-foreground shadow-sm backdrop-blur">{p.brand.name}</Badge>}
              </div>
              <div className="absolute right-2 top-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/90 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(p)}><Pencil className="mr-2 h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggle(p)}>
                      {p.status === 'ACTIVE' ? <><PowerOff className="mr-2 h-3.5 w-3.5" /> Desactivar</> : <><Power className="mr-2 h-3.5 w-3.5" /> Activar</>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-rose-600" onClick={() => onDelete(p)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="flex flex-1 flex-col p-3.5">
              <button onClick={() => onEdit(p)} className="text-left">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground"><code>{p.sku}</code></p>
              </button>
              <div className="mt-auto pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold tabular-nums">{formatCurrency(p.salePrice)}</span>
                  <Badge variant={p.marginPct >= 50 ? 'default' : p.marginPct >= 30 ? 'secondary' : 'destructive'} className="text-[10px] tabular-nums">
                    {formatPercent(p.marginPct)}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <InventoryStatusBadge status={invStatus} />
                  <span className="text-xs text-muted-foreground">{p.stock} u.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
