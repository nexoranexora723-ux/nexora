'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { fireConfetti, SuccessOverlay } from '@/components/nexora/shared/animations'
import {
  Package, Plus, Search, MoreHorizontal, Pencil, Trash2, Power, PowerOff,
  Copy, Star, Upload, X, GripVertical, ChevronUp, ChevronDown, Image as ImageIcon,
  Video, FileText, Settings, CheckCircle2, Loader2, AlertCircle,
} from 'lucide-react'

interface AdminProduct {
  id: string
  sku: string
  name: string
  description: string | null
  longDescription: string | null
  brand: { id: string; name: string } | null
  category: { id: string; name: string; icon: string | null } | null
  supplier: { id: string; companyName: string } | null
  imageUrl: string | null
  images: string[]
  videoUrl: string | null
  estimatedCost: number | null
  suggestedPrice: number | null
  currencyCode: string
  status: string
  isFeatured: boolean
  specs: { label: string; value: string }[]
  features: string[]
  rating: number
  reviewCount: number
  soldCount: number
}

interface CatalogData {
  brands: { id: string; name: string }[]
  categories: { id: string; name: string; slug: string; icon: string | null }[]
  suppliers: { id: string; companyName: string }[]
}

export function AdminProducts() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)

  const { toast } = useToast()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ products: AdminProduct[]; total: number; page: number; totalPages: number }>({
    queryKey: ['admin-products'],
    queryFn: async () => (await fetch('/api/admin/products-list?limit=20')).json(),
  })
  const products = data?.products ?? []

  const deleteMut = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products-public'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      toast({ title: 'Producto eliminado' })
      setDeleteTarget(null)
    },
  })

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products-public'] })
    },
  })

  const toggleFeatured = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFeatured }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products-public'] })
    },
  })

  const duplicate = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      toast({ title: 'Producto duplicado', description: 'Se creó una copia inactiva' })
    },
  })

  const filtered = useMemo(() => {
    if (!products) return []
    return products.filter((p) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [products, query, statusFilter])

  const stats = products ? {
    total: data?.total ?? products.length,
    active: products.filter((p) => p.status === 'ACTIVE').length,
    featured: products.filter((p) => p.isFeatured).length,
    inactive: products.filter((p) => p.status === 'INACTIVE').length,
  } : null

  const handleEdit = (p: AdminProduct) => { setEditing(p); setFormOpen(true) }
  const handleNew = () => { setEditing(null); setFormOpen(true) }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total productos</p><p className="mt-1 text-2xl font-bold">{stats?.total ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Activos</p><p className="mt-1 text-2xl font-bold text-emerald-600">{stats?.active ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Destacados</p><p className="mt-1 text-2xl font-bold text-amber-600">{stats?.featured ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Inactivos</p><p className="mt-1 text-2xl font-bold text-zinc-500">{stats?.inactive ?? 0}</p></CardContent></Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o SKU..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'ACTIVE', 'INACTIVE'].map((s) => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'Todos' : s === 'ACTIVE' ? 'Activos' : 'Inactivos'}
                </Button>
              ))}
            </div>
            <Button className="ml-auto gap-1.5" onClick={handleNew}><Plus className="h-4 w-4" /> Nuevo producto</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Package className="mx-auto h-10 w-10 text-muted-foreground/40" /><p className="mt-3 text-sm font-medium">No hay productos</p><Button className="mt-4 gap-1.5" onClick={handleNew}><Plus className="h-4 w-4" /> Crear primer producto</Button></CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="nexora-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="text-right">Venta</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const margin = p.estimatedCost && p.suggestedPrice ? ((p.suggestedPrice - p.estimatedCost) / p.suggestedPrice) * 100 : 0
                  return (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Package className="h-4 w-4 text-muted-foreground" /></div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <div className="flex items-center gap-1">
                              {p.isFeatured && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                              <p className="text-xs text-muted-foreground">{p.brand?.name ?? 'Sin marca'}</p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><code className="text-xs">{p.sku}</code></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.category?.name ?? '—'}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{p.estimatedCost ? formatCurrency(p.estimatedCost) : '—'}</TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">{p.suggestedPrice ? formatCurrency(p.suggestedPrice) : '—'}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn('text-xs font-medium tabular-nums', margin >= 50 ? 'text-emerald-600' : margin >= 30 ? 'text-amber-600' : 'text-rose-600')}>
                          {margin > 0 ? formatPercent(margin) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', p.status === 'ACTIVE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' : 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400')}>
                          {p.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(p)}><Pencil className="mr-2 h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleFeatured.mutate({ id: p.id, isFeatured: !p.isFeatured })}>
                              <Star className={cn('mr-2 h-3.5 w-3.5', p.isFeatured && 'fill-amber-400 text-amber-400')} /> {p.isFeatured ? 'Quitar destacado' : 'Destacar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus.mutate({ id: p.id, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
                              {p.status === 'ACTIVE' ? <><PowerOff className="mr-2 h-3.5 w-3.5" /> Desactivar</> : <><Power className="mr-2 h-3.5 w-3.5" /> Activar</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicate.mutate(p.id)}><Copy className="mr-2 h-3.5 w-3.5" /> Duplicar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600" onClick={() => setDeleteTarget(p)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      )}

      {/* Form dialog */}
      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará permanentemente <strong>{deleteTarget?.name}</strong> ({deleteTarget?.sku}). Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)} className="bg-rose-600 hover:bg-rose-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// === Product Form Dialog with tabs ===
function ProductFormDialog({ open, onOpenChange, product }: { open: boolean; onOpenChange: (o: boolean) => void; product: AdminProduct | null }) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const isEdit = !!product

  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ['admin-catalog'],
    queryFn: async () => (await fetch('/api/admin/catalog')).json(),
  })

  // Form state
  const [form, setForm] = useState({
    sku: '', name: '', description: '', longDescription: '',
    brandId: '', categoryId: '', supplierId: '',
    imageUrl: '', images: [] as string[], videoUrl: '',
    estimatedCost: '', suggestedPrice: '', currencyCode: 'USD',
    status: 'ACTIVE', isFeatured: false,
    specs: [] as { label: string; value: string }[],
    features: [] as string[],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [newFeature, setNewFeature] = useState('')
  const [newSpecLabel, setNewSpecLabel] = useState('')
  const [newSpecValue, setNewSpecValue] = useState('')

  // Sync form when dialog opens
  useEffect(() => {
    if (open) {
      setError('')
      if (product) {
        setForm({
          sku: product.sku, name: product.name,
          description: product.description ?? '', longDescription: product.longDescription ?? '',
          brandId: product.brand?.id ?? '', categoryId: product.category?.id ?? '', supplierId: product.supplier?.id ?? '',
          imageUrl: product.imageUrl ?? '', images: product.images, videoUrl: product.videoUrl ?? '',
          estimatedCost: product.estimatedCost?.toString() ?? '', suggestedPrice: product.suggestedPrice?.toString() ?? '',
          currencyCode: product.currencyCode, status: product.status, isFeatured: product.isFeatured,
          specs: product.specs, features: product.features,
        })
      } else {
        setForm({
          sku: '', name: '', description: '', longDescription: '',
          brandId: '', categoryId: '', supplierId: '',
          imageUrl: '', images: [], videoUrl: '',
          estimatedCost: '', suggestedPrice: '', currencyCode: 'USD',
          status: 'ACTIVE', isFeatured: false, specs: [], features: [],
        })
      }
      setActiveTab('basic')
    }
  }, [open, product])

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
        suggestedPrice: form.suggestedPrice ? Number(form.suggestedPrice) : null,
        brandId: form.brandId || null,
        categoryId: form.categoryId || null,
        supplierId: form.supplierId || null,
      }
      const url = isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      qc.invalidateQueries({ queryKey: ['products-public'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      if (!isEdit) fireConfetti()
      setShowSuccess(true)
    },
  })

  const handleSubmit = async () => {
    setError('')
    if (!form.sku.trim() || !form.name.trim()) { setError('SKU y nombre son obligatorios'); setActiveTab('basic'); return }
    setLoading(true)
    try {
      await save.mutateAsync()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Upload handler
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm((f) => ({ ...f, imageUrl: data.url, images: [...f.images, data.url] }))
      toast({ title: 'Imagen subida', description: data.url })
    } catch (err) {
      toast({ title: 'Error al subir', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const addImageUrl = (url: string) => {
    if (url.trim()) {
      setForm((f) => ({ ...f, images: [...f.images, url.trim()], imageUrl: f.imageUrl || url.trim() }))
    }
  }

  const removeImage = (idx: number) => {
    setForm((f) => {
      const newImages = f.images.filter((_, i) => i !== idx)
      return { ...f, images: newImages, imageUrl: newImages[0] ?? '' }
    })
  }

  const moveImage = (idx: number, dir: 'up' | 'down') => {
    setForm((f) => {
      const newImages = [...f.images]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= newImages.length) return f
      ;[newImages[idx], newImages[target]] = [newImages[target], newImages[idx]]
      return { ...f, images: newImages, imageUrl: newImages[0] ?? '' }
    })
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setForm((f) => ({ ...f, features: [...f.features, newFeature.trim()] }))
      setNewFeature('')
    }
  }

  const addSpec = () => {
    if (newSpecLabel.trim() && newSpecValue.trim()) {
      setForm((f) => ({ ...f, specs: [...f.specs, { label: newSpecLabel.trim(), value: newSpecValue.trim() }] }))
      setNewSpecLabel(''); setNewSpecValue('')
    }
  }

  return (
    <>
      <Dialog open={open && !showSuccess} onOpenChange={onOpenChange}>
        <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> {isEdit ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>{isEdit ? `Modificando ${product?.sku}` : 'Completa la información del producto'}</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
              <TabsTrigger value="basic" className="text-xs">Info</TabsTrigger>
              <TabsTrigger value="price" className="text-xs">Precio</TabsTrigger>
              <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
              <TabsTrigger value="desc" className="text-xs">Texto</TabsTrigger>
              <TabsTrigger value="specs" className="text-xs">Specs</TabsTrigger>
              <TabsTrigger value="features" className="text-xs">Features</TabsTrigger>
            </TabsList>

            {/* Tab: Info básica */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">SKU *</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="APL-APP-PRO2" disabled={isEdit} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Estado</Label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="AirPods Pro 2 (OEM)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Marca</Label>
                  <select value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">Sin marca</option>
                    {catalog?.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoría</Label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">Sin categoría</option>
                    {catalog?.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Proveedor</Label>
                <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                  <option value="">Sin proveedor</option>
                  {catalog?.suppliers.map((s) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="h-4 w-4 rounded border-border" />
                <Label htmlFor="featured" className="text-xs flex items-center gap-1"><Star className="h-3 w-3" /> Producto destacado (aparece con badge especial)</Label>
              </div>
            </TabsContent>

            {/* Tab: Precio */}
            <TabsContent value="price" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Precio de costo (USD)</Label>
                  <Input type="number" step="0.01" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} placeholder="68.50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Precio sugerido (USD)</Label>
                  <Input type="number" step="0.01" value={form.suggestedPrice} onChange={(e) => setForm({ ...form, suggestedPrice: e.target.value })} placeholder="129.00" />
                </div>
              </div>
              {form.estimatedCost && form.suggestedPrice && (
                <div className="rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="text-muted-foreground">Margen: <span className="font-bold text-emerald-600">{formatPercent(((Number(form.suggestedPrice) - Number(form.estimatedCost)) / Number(form.suggestedPrice)) * 100)}</span></p>
                  <p className="text-muted-foreground">Ganancia por unidad: <span className="font-bold">{formatCurrency(Number(form.suggestedPrice) - Number(form.estimatedCost))}</span></p>
                </div>
              )}
            </TabsContent>

            {/* Tab: Media */}
            <TabsContent value="media" className="space-y-4">
              {/* Upload from computer */}
              <div className="rounded-lg border-2 border-dashed p-4 text-center">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Subiendo...' : 'Subir desde computadora'}
                </Button>
                <p className="mt-2 text-[10px] text-muted-foreground">JPG, PNG, WebP · Máximo 5MB</p>
              </div>

              {/* Add by URL */}
              <div className="flex gap-2">
                <Input
                  placeholder="O pega una URL de imagen..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = (e.target as HTMLInputElement).value; if (v.trim()) { addImageUrl(v); (e.target as HTMLInputElement).value = '' } } }}
                />
                <Button variant="outline" size="sm" onClick={() => {
                  const input = document.querySelector('input[placeholder*="URL de imagen"]') as HTMLInputElement
                  if (input?.value?.trim()) { addImageUrl(input.value); input.value = '' }
                }}><Plus className="h-4 w-4" /></Button>
              </div>

              {/* Image gallery with reorder */}
              {form.images.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">Galería de imágenes ({form.images.length})</Label>
                  <div className="space-y-2">
                    {form.images.map((img, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border p-2">
                        <div className="flex flex-col">
                          <button onClick={() => moveImage(i, 'up')} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                          <button onClick={() => moveImage(i, 'down')} disabled={i === form.images.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                        </div>
                        <img
                          src={img || '/products/placeholder.svg'}
                          alt={`Imagen del producto ${i + 1}`}
                          className="h-12 w-12 rounded-md object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/products/placeholder.svg' }}
                        />
                        <Input value={img} onChange={(e) => { const newImgs = [...form.images]; newImgs[i] = e.target.value; setForm({ ...form, images: newImgs, imageUrl: newImgs[0] }) }} className="h-8 text-xs" />
                        {i === 0 && <Badge className="bg-primary text-[9px]">Principal</Badge>}
                        <button onClick={() => removeImage(i)} className="text-rose-500 hover:text-rose-700"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video URL */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Video className="h-3 w-3" /> URL de video (YouTube)</Label>
                <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
              </div>
            </TabsContent>

            {/* Tab: Descripciones */}
            <TabsContent value="desc" className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Descripción corta (catálogo)</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="AirPods Pro 2 OEM con cancelación de ruido activa. Calidad premium." />
                <p className="text-[10px] text-muted-foreground">Aparece en las cards del catálogo. Máx 150 caracteres recomendado.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descripción larga (página de detalle)</Label>
                <Textarea value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} rows={8} placeholder="Descripción detallada del producto. Separa párrafos con doble enter." />
                <p className="text-[10px] text-muted-foreground">Aparece en la página de detalle del producto. Separa párrafos con línea en blanco.</p>
              </div>
            </TabsContent>

            {/* Tab: Specs */}
            <TabsContent value="specs" className="space-y-4">
              <Label className="text-xs">Especificaciones técnicas</Label>
              <div className="flex gap-2">
                <Input value={newSpecLabel} onChange={(e) => setNewSpecLabel(e.target.value)} placeholder="Ej: Batería" className="h-8 text-xs" />
                <Input value={newSpecValue} onChange={(e) => setNewSpecValue(e.target.value)} placeholder="Ej: 6h + 24h estuche" className="h-8 text-xs" />
                <Button variant="outline" size="sm" onClick={addSpec}><Plus className="h-4 w-4" /></Button>
              </div>
              {form.specs.length > 0 && (
                <div className="space-y-1">
                  {form.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border p-2">
                      <span className="flex-1 text-xs font-medium">{spec.label}</span>
                      <span className="flex-1 text-xs text-muted-foreground">{spec.value}</span>
                      <button onClick={() => setForm({ ...form, specs: form.specs.filter((_, idx) => idx !== i) })} className="text-rose-500"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              {form.specs.length === 0 && <p className="text-xs text-muted-foreground">Sin especificaciones. Añade para mostrar tabla técnica.</p>}
            </TabsContent>

            {/* Tab: Features */}
            <TabsContent value="features" className="space-y-4">
              <Label className="text-xs">Características destacadas</Label>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }} placeholder="Ej: Cancelación de ruido activa" className="h-8 text-xs" />
                <Button variant="outline" size="sm" onClick={addFeature}><Plus className="h-4 w-4" /></Button>
              </div>
              {form.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {f}
                      <button onClick={() => setForm({ ...form, features: form.features.filter((_, idx) => idx !== i) })} className="text-rose-500 hover:text-rose-700"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              {form.features.length === 0 && <p className="text-xs text-muted-foreground">Sin características. Añade para mostrar checkmarks en el detalle.</p>}
            </TabsContent>
          </Tabs>

          {error && <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success overlay */}
      <SuccessOverlay show={showSuccess} title={isEdit ? '¡Producto actualizado! ✅' : '¡Producto creado! 🎉'} subtitle={isEdit ? 'Los cambios están visibles en el catálogo' : 'Ya está disponible en el catálogo'} onDone={() => { setShowSuccess(false); onOpenChange(false) }} />
    </>
  )
}

