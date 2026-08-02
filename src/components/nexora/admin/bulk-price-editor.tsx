'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Tags, Search, Save, Download, Upload, TrendingUp, TrendingDown, DollarSign,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Package, CheckCircle2,
  Loader2, Image as ImageIcon, AlertCircle,
} from 'lucide-react'

// === Types ===
interface PriceProduct {
  id: string
  sku: string
  name: string
  imageUrl: string | null
  estimatedCost: number | null
  suggestedPrice: number | null
  currencyCode: string
  status: string
  brand: { id: string; name: string } | null
  category: { id: string; name: string; icon: string | null } | null
}

interface PriceListResponse {
  products: PriceProduct[]
  total: number
  page: number
  totalPages: number
}

// === Main Component ===
export function BulkPriceEditor() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'name'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({})
  const [bulkDialogOpen, setBulkDialogOpen] = useState<null | 'increase' | 'decrease' | 'setBase'>(null)
  const [bulkValue, setBulkValue] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const limit = 50

  // Fetch categories for filter
  const { data: categories } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['categories-list'],
    queryFn: async () => (await fetch('/api/categories')).json(),
  })

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  // Fetch products
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  })
  if (debouncedSearch) queryParams.set('search', debouncedSearch)
  if (categoryId !== 'all') queryParams.set('categoryId', categoryId)

  const { data, isLoading, isFetching } = useQuery<PriceListResponse>({
    queryKey: ['price-editor', debouncedSearch, categoryId, sortBy, sortOrder, page],
    queryFn: async () => (await fetch(`/api/admin/products-list?${queryParams.toString()}`)).json(),
    placeholderData: (prev) => prev,
  })

  const products = data?.products ?? []

  // === Helpers ===
  const editedCount = Object.keys(editedPrices).filter((id) => {
    const p = products.find((x) => x.id === id)
    if (!p) return false
    const newVal = parseFloat(editedPrices[id])
    if (Number.isNaN(newVal)) return false
    return Math.abs(newVal - (p.suggestedPrice ?? 0)) > 0.001
  }).length

  const getDisplayPrice = (p: PriceProduct): number => {
    if (editedPrices[p.id] !== undefined) {
      const v = parseFloat(editedPrices[p.id])
      if (!Number.isNaN(v)) return v
    }
    return p.suggestedPrice ?? 0
  }

  // === Save mutation ===
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(editedPrices)
        .map(([id, val]) => {
          const price = parseFloat(val)
          if (Number.isNaN(price) || price < 0) return null
          return { id, estimatedCost: price }
        })
        .filter((u): u is { id: string; estimatedCost: number } => u !== null)

      if (updates.length === 0) throw new Error('No hay cambios para guardar')

      const res = await fetch('/api/admin/products/bulk-update-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error' }))
        throw new Error(err.error || 'Error al guardar')
      }
      return res.json()
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['price-editor'] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products-public'] })
      setEditedPrices({})
      toast({
        title: '✓ Precios actualizados',
        description: `${data.updated} producto(s) actualizado(s) correctamente`,
      })
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  // === Bulk actions ===
  const applyBulkAction = () => {
    const val = parseFloat(bulkValue)
    if (Number.isNaN(val) || val < 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' })
      return
    }
    if (products.length === 0) {
      toast({ title: 'No hay productos para aplicar', variant: 'destructive' })
      return
    }

    const newEdits: Record<string, string> = { ...editedPrices }
    for (const p of products) {
      const current = getDisplayPrice(p)
      let newPrice = current
      if (bulkDialogOpen === 'increase') {
        newPrice = current * (1 + val / 100)
      } else if (bulkDialogOpen === 'decrease') {
        newPrice = current * (1 - val / 100)
      } else if (bulkDialogOpen === 'setBase') {
        newPrice = val
      }
      newEdits[p.id] = newPrice.toFixed(2)
    }
    setEditedPrices(newEdits)
    setBulkDialogOpen(null)
    setBulkValue('')
    toast({
      title: 'Cambios aplicados (sin guardar)',
      description: `${products.length} producto(s) con precio modificado. Recuerda guardar.`,
    })
  }

  // === CSV Download ===
  const downloadCSV = () => {
    const headers = ['sku', 'name', 'brand', 'category', 'price']
    const rows = products.map((p) => [
      p.sku,
      p.name.replace(/,/g, ';'),
      p.brand?.name ?? '',
      p.category?.name ?? '',
      (getDisplayPrice(p)).toFixed(2),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `precios-nexora-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({ title: 'CSV descargado', description: `${products.length} productos` })
  }

  // === CSV Upload ===
  const handleUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (lines.length < 2) {
        toast({ title: 'CSV vacío', description: 'El archivo debe tener encabezado + filas', variant: 'destructive' })
        return
      }
      // Parse header
      const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase())
      const skuIdx = header.findIndex((h) => h === 'sku' || h === 'código' || h === 'codigo')
      const priceIdx = header.findIndex((h) => h === 'price' || h === 'precio' || h === 'estimatedcost')
      if (skuIdx < 0 || priceIdx < 0) {
        toast({ title: 'CSV inválido', description: 'Se requieren columnas "sku" y "price"', variant: 'destructive' })
        return
      }
      const updates: Array<{ sku: string; estimatedCost: number }> = []
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCSVLine(lines[i])
        const sku = cells[skuIdx]?.trim()
        const price = parseFloat(cells[priceIdx]?.trim() ?? '')
        if (sku && !Number.isNaN(price) && price >= 0) {
          updates.push({ sku, estimatedCost: price })
        }
      }
      if (updates.length === 0) {
        toast({ title: 'No se encontraron filas válidas', variant: 'destructive' })
        return
      }
      const res = await fetch('/api/admin/products/bulk-update-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) throw new Error('Error al subir CSV')
      const data = await res.json()
      qc.invalidateQueries({ queryKey: ['price-editor'] })
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      toast({ title: '✓ CSV procesado', description: `${data.updated} de ${updates.length} producto(s) actualizado(s)` })
    } catch (err) {
      toast({
        title: 'Error al procesar CSV',
        description: err instanceof Error ? err.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const toggleSort = (field: 'price' | 'name' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder(field === 'name' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* === Header === */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Editor masivo de precios</h2>
          <p className="text-sm text-muted-foreground">
            Edita precios en línea, aplica cambios masivos o sube un CSV.
          </p>
        </div>
        {editedCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-700 dark:text-amber-300">
              {editedCount} cambio(s) sin guardar
            </span>
          </div>
        )}
      </div>

      {/* === Toolbar === */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1) }}>
              <SelectTrigger className="h-9 w-full sm:w-48">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1.5 lg:ml-auto">
              {/* Bulk actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Tags className="h-4 w-4" /> Acciones masivas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => { setBulkDialogOpen('increase'); setBulkValue('10') }}>
                    <TrendingUp className="mr-2 h-3.5 w-3.5 text-emerald-600" /> Aumentar todos X%
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setBulkDialogOpen('decrease'); setBulkValue('10') }}>
                    <TrendingDown className="mr-2 h-3.5 w-3.5 text-rose-600" /> Disminuir todos X%
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setBulkDialogOpen('setBase'); setBulkValue('') }}>
                    <DollarSign className="mr-2 h-3.5 w-3.5" /> Aplicar precio base
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadCSV}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Subir CSV
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleUploadCSV}
              />
              <Button
                size="sm"
                className="gap-1.5"
                disabled={editedCount === 0 || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar ({editedCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === Table === */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No hay productos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || categoryId !== 'all'
                ? 'Prueba con otros filtros de búsqueda'
                : 'Crea productos primero para editar precios'}
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
                    <TableHead className="w-14">Imagen</TableHead>
                    <TableHead>
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort('name')}
                      >
                        Nombre
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio actual</TableHead>
                    <TableHead>
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort('price')}
                      >
                        Nuevo precio
                        {sortBy === 'price' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-16 text-center">Δ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const current = p.suggestedPrice ?? 0
                    const edited = editedPrices[p.id]
                    const newVal = edited !== undefined ? parseFloat(edited) : current
                    const diff = current > 0 ? ((newVal - current) / current) * 100 : 0
                    const hasEdit = edited !== undefined && !Number.isNaN(newVal) && Math.abs(newVal - current) > 0.001
                    return (
                      <TableRow key={p.id} className={cn(hasEdit && 'bg-amber-50/40 dark:bg-amber-950/20')}>
                        <TableCell>
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-10 w-10 rounded-md object-cover ring-1 ring-border"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/products/placeholder.svg' }}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="max-w-[220px] truncate text-sm font-medium">{p.name}</p>
                          <code className="text-[10px] text-muted-foreground">{p.sku}</code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.brand?.name ?? '—'}
                        </TableCell>
                        <TableCell>
                          {p.category && (
                            <Badge variant="outline" className="text-[10px]">
                              {p.category.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {current > 0 ? formatCurrency(current, p.currencyCode) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={current > 0 ? current.toFixed(2) : '0.00'}
                              value={edited ?? ''}
                              onChange={(e) =>
                                setEditedPrices((prev) => ({ ...prev, [p.id]: e.target.value }))
                              }
                              className="h-8 w-28 text-right tabular-nums"
                            />
                            {hasEdit && (
                              <button
                                onClick={() =>
                                  setEditedPrices((prev) => {
                                    const next = { ...prev }
                                    delete next[p.id]
                                    return next
                                  })
                                }
                                className="text-xs text-muted-foreground hover:text-rose-600"
                                title="Revertir"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasEdit && (
                            <span
                              className={cn(
                                'text-xs font-medium tabular-nums',
                                diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-muted-foreground',
                              )}
                            >
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                            </span>
                          )}
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
                {isFetching ? 'Cargando...' : `Mostrando ${products.length} de ${data?.total ?? 0} productos`}
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

      {/* === Bulk action dialog === */}
      <Dialog open={!!bulkDialogOpen} onOpenChange={(open) => !open && setBulkDialogOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bulkDialogOpen === 'increase' && '↑ Aumentar precios'}
              {bulkDialogOpen === 'decrease' && '↓ Disminuir precios'}
              {bulkDialogOpen === 'setBase' && '$ Aplicar precio base'}
            </DialogTitle>
            <DialogDescription>
              Se aplicará a los {products.length} productos visibles en la página actual.
              {bulkDialogOpen === 'setBase'
                ? ' Todos se establecerán al mismo precio.'
                : ' Los cambios no se guardan hasta que presiones "Guardar".'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-value">
              {bulkDialogOpen === 'increase' && 'Porcentaje a aumentar (%)'}
              {bulkDialogOpen === 'decrease' && 'Porcentaje a disminuir (%)'}
              {bulkDialogOpen === 'setBase' && 'Precio base'}
            </Label>
            <Input
              id="bulk-value"
              type="number"
              step={bulkDialogOpen === 'setBase' ? '0.01' : '1'}
              min="0"
              value={bulkValue}
              onChange={(e) => setBulkValue(e.target.value)}
              placeholder={bulkDialogOpen === 'setBase' ? '99.99' : '10'}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {bulkDialogOpen === 'increase' && 'Ej. 10 aumenta un 10% cada precio.'}
              {bulkDialogOpen === 'decrease' && 'Ej. 10 disminuye un 10% cada precio.'}
              {bulkDialogOpen === 'setBase' && 'Todos los productos visibles se setearán a este precio.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(null)}>Cancelar</Button>
            <Button onClick={applyBulkAction}>
              {bulkDialogOpen === 'increase' && <TrendingUp className="mr-1.5 h-4 w-4" />}
              {bulkDialogOpen === 'decrease' && <TrendingDown className="mr-1.5 h-4 w-4" />}
              {bulkDialogOpen === 'setBase' && <DollarSign className="mr-1.5 h-4 w-4" />}
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// === Helpers ===
function parseCSVLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && line[i + 1] === '"') {
      current += '"'
      i++
      continue
    }
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current)
  return cells
}
