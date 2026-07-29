'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-store'
import { formatCurrency, timeAgo, initials } from '@/lib/format'
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/lib/types'
import type { ImportRequest, Product } from '@/lib/types'
import {
  LayoutDashboard, Package, Truck, User, LogOut, Plus, Sparkles,
  Search, ChevronRight, ShoppingBag, ArrowLeft, ShoppingCart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type View = 'dashboard' | 'catalog' | 'requests' | 'tracking' | 'profile'

interface PrefillData {
  name?: string
  category?: string
  description?: string
  referenceUrl?: string
}

export function ClientPortal() {
  const { user, logout } = useAuth()
  const [view, setView] = useState<View>('dashboard')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [prefillProduct, setPrefillProduct] = useState<PrefillData | null>(null)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
  }

  const openCreateWithProduct = (p: Product) => {
    setPrefillProduct({
      name: p.name,
      category: p.category?.name ?? '',
      description: p.description ?? '',
      referenceUrl: p.referenceUrl ?? '',
    })
    setCreateOpen(true)
  }

  const openCreateBlank = () => {
    setPrefillProduct(null)
    setCreateOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-sm">
            <span className="text-lg font-black">N</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-sidebar-foreground">NEXORA</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">Portal Cliente</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {[
            { key: 'dashboard' as View, icon: LayoutDashboard, label: 'Dashboard' },
            { key: 'catalog' as View, icon: ShoppingBag, label: 'Catálogo', badge: 'Explora' },
            { key: 'requests' as View, icon: Package, label: 'Mis solicitudes' },
            { key: 'tracking' as View, icon: Truck, label: 'Seguimiento' },
            { key: 'profile' as View, icon: User, label: 'Mi perfil' },
          ].map((item) => (
            <button key={item.key} onClick={() => setView(item.key)} className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              view === item.key ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60',
            )}>
              <item.icon className={cn('h-4 w-4', view === item.key ? 'text-primary' : 'text-sidebar-foreground/50')} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && <Badge className="bg-primary/20 text-primary text-[9px]">{item.badge}</Badge>}
            </button>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-xs font-bold text-primary-foreground">
              {initials(user?.firstName ?? '', user?.lastName)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-semibold">{user?.firstName} {user?.lastName}</div>
              <div className="text-[10px] text-muted-foreground">Cliente</div>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground">
              <span className="text-xs font-black">N</span>
            </div>
            <span className="font-bold">NEXORA</span>
          </div>
          <h1 className="hidden text-lg font-semibold lg:block">
            {view === 'dashboard' && 'Dashboard'}
            {view === 'catalog' && 'Catálogo de productos'}
            {view === 'requests' && 'Mis solicitudes'}
            {view === 'tracking' && 'Seguimiento'}
            {view === 'profile' && 'Mi perfil'}
          </h1>
          <Button size="sm" className="gap-1.5" onClick={openCreateBlank}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nueva solicitud</span>
          </Button>
        </header>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b px-4 py-2 lg:hidden">
          {[
            { key: 'dashboard' as View, label: 'Dashboard' },
            { key: 'catalog' as View, label: 'Catálogo' },
            { key: 'requests' as View, label: 'Solicitudes' },
            { key: 'tracking' as View, label: 'Seguimiento' },
            { key: 'profile' as View, label: 'Perfil' },
          ].map((item) => (
            <button key={item.key} onClick={() => setView(item.key)} className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              view === item.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}>
              {item.label}
            </button>
          ))}
        </div>

        <main className="nexora-scroll flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {view === 'dashboard' && <ClientDashboard onNewRequest={openCreateBlank} onViewRequest={(id) => { setSelectedRequest(id); setView('tracking') }} onNavigate={setView} />}
            {view === 'catalog' && <ClientCatalog onProductClick={(p) => setSelectedProduct(p)} />}
            {view === 'requests' && <ClientRequests onViewRequest={(id) => { setSelectedRequest(id); setView('tracking') }} />}
            {view === 'tracking' && <ClientTracking requestId={selectedRequest} />}
            {view === 'profile' && <ClientProfile />}
          </div>
        </main>
      </div>

      {/* Product detail dialog */}
      {selectedProduct && (
        <ProductDetailDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onRequest={(p) => { setSelectedProduct(null); openCreateWithProduct(p) }} />
      )}

      {/* Create request dialog */}
      <CreateRequestDialog open={createOpen} onOpenChange={setCreateOpen} prefill={prefillProduct} />
    </div>
  )
}

// === Client Dashboard ===
function ClientDashboard({ onNewRequest, onViewRequest, onNavigate }: { onNewRequest: () => void; onViewRequest: (id: string) => void; onNavigate: (v: View) => void }) {
  const { user } = useAuth()
  const { data: requests, isLoading } = useQuery<ImportRequest[]>({
    queryKey: ['client-requests'],
    queryFn: async () => (await fetch('/api/requests')).json(),
  })

  const stats = requests ? {
    total: requests.length,
    active: requests.filter((r) => !['ENTREGADO', 'CERRADO'].includes(r.status)).length,
    delivered: requests.filter((r) => r.status === 'ENTREGADO').length,
    new: requests.filter((r) => r.status === 'NUEVA').length,
  } : null

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent p-6">
        <h2 className="text-2xl font-bold">¡Hola, {user?.firstName}! 👋</h2>
        <p className="mt-1 text-muted-foreground">Importa cualquier producto desde China. Explora nuestro catálogo o solicita algo personalizado.</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => onNavigate('catalog')} className="gap-1.5"><ShoppingBag className="h-4 w-4" /> Explorar catálogo</Button>
          <Button variant="outline" onClick={onNewRequest} className="gap-1.5"><Plus className="h-4 w-4" /> Solicitar producto personalizado</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total solicitudes</p><p className="mt-1 text-2xl font-bold">{stats?.total ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">En proceso</p><p className="mt-1 text-2xl font-bold text-amber-600">{stats?.active ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Entregados</p><p className="mt-1 text-2xl font-bold text-emerald-600">{stats?.delivered ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Nuevos</p><p className="mt-1 text-2xl font-bold text-sky-600">{stats?.new ?? 0}</p></CardContent></Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Solicitudes recientes</h3>
          <Button variant="ghost" size="sm" onClick={onNewRequest} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Nueva</Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : (requests?.length ?? 0) === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">Aún no tienes solicitudes</p>
            <p className="text-xs text-muted-foreground">Explora el catálogo o solicita un producto personalizado</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onNavigate('catalog')} className="gap-1.5"><ShoppingBag className="h-4 w-4" /> Ver catálogo</Button>
              <Button size="sm" onClick={onNewRequest} className="gap-1.5"><Plus className="h-4 w-4" /> Nueva solicitud</Button>
            </div>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {requests!.slice(0, 5).map((r) => (
              <button key={r.id} onClick={() => onViewRequest(r.id)} className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-medium text-primary">{r.number}</code>
                    <Badge variant="outline" className={cn('text-[10px]', REQUEST_STATUS_COLORS[r.status])}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">{r.productName}</p>
                  <p className="text-xs text-muted-foreground">{r.quantity} unidades · {timeAgo(r.createdAt)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// === Client Catalog ===
function ClientCatalog({ onProductClick }: { onProductClick: (p: Product) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products-catalog'],
    queryFn: async () => (await fetch('/api/products')).json(),
  })

  const categories = products ? [...new Set(products.map((p) => p.category?.name).filter(Boolean))] : []
  const filtered = (products ?? []).filter((p) => {
    const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase())
    const matchesCat = category === 'all' || p.category?.name === category
    return matchesQuery && matchesCat
  })

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent p-6">
        <h2 className="text-xl font-bold">Catálogo de productos importables 🛍️</h2>
        <p className="mt-1 text-sm text-muted-foreground">Explora los productos que podemos importar para ti desde China. Click en cualquier producto para solicitar una importación.</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar productos..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button variant={category === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCategory('all')}>Todos</Button>
          {categories.map((c) => (
            <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)}>{c}</Button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No se encontraron productos</p>
          <p className="text-xs text-muted-foreground">Prueba con otra búsqueda o solicita un producto personalizado</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="group cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg" onClick={() => onProductClick(p)}>
              <div className="relative aspect-square overflow-hidden bg-muted">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
                )}
                {p.category?.icon && (
                  <Badge className="absolute left-2 top-2 bg-background/90 text-foreground shadow-sm backdrop-blur">{p.category.icon} {p.category.name}</Badge>
                )}
                {p.isFeatured && <Badge className="absolute right-2 top-2 bg-amber-500 text-white shadow-sm">★ Destacado</Badge>}
              </div>
              <CardContent className="p-4">
                <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                {p.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  {p.estimatedCost ? (
                    <p className="text-sm">Desde <span className="text-lg font-bold">${p.estimatedCost}</span></p>
                  ) : <span className="text-xs text-muted-foreground">Precio bajo consulta</span>}
                  <Badge variant="secondary" className="gap-1 text-[10px]"><ShoppingCart className="h-3 w-3" /> Importar</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// === Product Detail Dialog ===
function ProductDetailDialog({ product, onClose, onRequest }: { product: Product; onClose: () => void; onRequest: (p: Product) => void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">📦</div>
            )}
            {product.category?.icon && (
              <Badge className="absolute left-3 top-3 bg-background/90 text-foreground shadow-sm backdrop-blur">{product.category.icon} {product.category.name}</Badge>
            )}
          </div>
          <div className="flex flex-col">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="text-xl">{product.name}</DialogTitle>
              {product.brand && <p className="text-sm text-muted-foreground">{product.brand.name}</p>}
            </DialogHeader>
            <div className="mt-3 flex items-baseline gap-2">
              {product.estimatedCost ? (
                <>
                  <span className="text-3xl font-bold">${product.estimatedCost}</span>
                  <span className="text-sm text-muted-foreground">costo estimado</span>
                </>
              ) : <span className="text-sm text-muted-foreground">Precio bajo consulta</span>}
            </div>
            {product.suggestedPrice && (
              <p className="mt-1 text-xs text-muted-foreground">Precio de venta sugerido: <span className="font-medium text-foreground">${product.suggestedPrice}</span></p>
            )}
            {product.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>}
            {product.supplier && <p className="mt-2 text-xs text-muted-foreground">Proveedor: {product.supplier.companyName}</p>}
            {product.referenceUrl && (
              <a href={product.referenceUrl} target="_blank" rel="noreferrer" className="mt-2 text-xs text-primary hover:underline">Ver referencia original →</a>
            )}
            <div className="mt-auto pt-5">
              <Button className="w-full gap-1.5" size="lg" onClick={() => onRequest(product)}>
                <ShoppingCart className="h-4 w-4" /> Solicitar importación
              </Button>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">Sin compromiso. Recibirás una cotización sin costo.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// === Client Requests List ===
function ClientRequests({ onViewRequest }: { onViewRequest: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const { data: requests, isLoading } = useQuery<ImportRequest[]>({
    queryKey: ['client-requests'],
    queryFn: async () => (await fetch('/api/requests')).json(),
  })

  const filtered = (requests ?? []).filter((r) => !query || r.number.toLowerCase().includes(query.toLowerCase()) || r.productName.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar solicitud..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No se encontraron solicitudes</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <button key={r.id} onClick={() => onViewRequest(r.id)} className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-medium text-primary">{r.number}</code>
                  <Badge variant="outline" className={cn('text-[10px]', REQUEST_STATUS_COLORS[r.status])}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                </div>
                <p className="mt-1 truncate text-sm font-medium">{r.productName}</p>
                <p className="text-xs text-muted-foreground">{r.quantity} unidades · {r.budget ? formatCurrency(r.budget) : 'Sin presupuesto'} · {timeAgo(r.createdAt)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// === Client Tracking ===
function ClientTracking({ requestId }: { requestId: string | null }) {
  const { data: req, isLoading } = useQuery<ImportRequest>({
    queryKey: ['request', requestId],
    queryFn: async () => (await fetch(`/api/requests/${requestId}`)).json(),
    enabled: !!requestId,
  })

  if (!requestId) return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Selecciona una solicitud para ver el seguimiento</CardContent></Card>
  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!req) return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No encontrada</CardContent></Card>

  const statuses = ['NUEVA', 'BUSCANDO_PROVEEDOR', 'COTIZACION_ENVIADA', 'PAGO_RECIBIDO', 'COMPRA_REALIZADA', 'PRODUCCION', 'EN_TRANSITO', 'ENTREGADO']
  const currentIdx = statuses.indexOf(req.status)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <code className="text-sm font-medium text-primary">{req.number}</code>
          <Badge variant="outline" className={REQUEST_STATUS_COLORS[req.status]}>{REQUEST_STATUS_LABELS[req.status]}</Badge>
        </div>
        <h2 className="mt-1 text-2xl font-bold">{req.productName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{req.quantity} unidades · {req.budget ? `Presupuesto: ${formatCurrency(req.budget)}` : 'Sin presupuesto'}</p>
      </div>

      {req.description && <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Descripción</p><p className="mt-1 text-sm">{req.description}</p></CardContent></Card>}

      {req.naiosSummary && (
        <Card className="border-primary/20 bg-primary/5"><CardContent className="p-4">
          <div className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-xs font-semibold text-primary">Análisis de NAIOS</p><p className="mt-1 text-sm text-muted-foreground">{req.naiosSummary}</p></div></div>
        </CardContent></Card>
      )}

      <Card><CardContent className="p-6">
        <h3 className="mb-6 text-sm font-semibold">Progreso de tu importación</h3>
        <div className="space-y-4">
          {statuses.map((status, idx) => (
            <div key={status} className="flex items-center gap-3">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                idx <= currentIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {idx < currentIdx ? '✓' : idx + 1}
              </div>
              <div className="flex-1">
                <p className={cn('text-sm font-medium', idx <= currentIdx ? 'text-foreground' : 'text-muted-foreground')}>{REQUEST_STATUS_LABELS[status]}</p>
                {idx === currentIdx && <p className="text-xs text-primary">En progreso...</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent></Card>

      {req.quotes && req.quotes.length > 0 && (
        <Card><CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Cotizaciones</h3>
          {req.quotes.map((q) => (
            <div key={q.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <code className="text-xs text-primary">{q.number}</code>
                <Badge variant="outline" className="text-[10px]">{q.status}</Badge>
              </div>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(q.total)}</p>
              <p className="text-xs text-muted-foreground">{q.supplier.companyName} · {q.quantity}u × {formatCurrency(q.unitPrice)}</p>
            </div>
          ))}
        </CardContent></Card>
      )}
    </div>
  )
}

// === Client Profile ===
function ClientProfile() {
  const { user } = useAuth()
  return (
    <Card><CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-xl font-bold text-primary-foreground">
          {initials(user?.firstName ?? '', user?.lastName)}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
        <div><p className="text-xs text-muted-foreground">Teléfono</p><p className="text-sm font-medium">{user?.phone ?? '—'}</p></div>
        <div><p className="text-xs text-muted-foreground">Rol</p><p className="text-sm font-medium">{user?.role}</p></div>
      </div>
    </CardContent></Card>
  )
}

// === Create Request Dialog (with optional prefill from catalog) ===
function CreateRequestDialog({ open, onOpenChange, prefill }: { open: boolean; onOpenChange: (o: boolean) => void; prefill: PrefillData | null }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    productName: '', description: '', category: '', purpose: 'personal',
    quantity: 1, budget: '', referenceUrl: '', details: '', priority: 'MEDIUM',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Prefill from catalog product when dialog opens
  useEffect(() => {
    if (open && prefill) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((f) => ({
        ...f,
        productName: prefill.name ?? f.productName,
        description: prefill.description ?? f.description,
        category: prefill.category ?? f.category,
        referenceUrl: prefill.referenceUrl ?? f.referenceUrl,
      }))
    } else if (open && !prefill) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ productName: '', description: '', category: '', purpose: 'personal', quantity: 1, budget: '', referenceUrl: '', details: '', priority: 'MEDIUM' })
    }
  }, [open, prefill])

  const create = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-requests'] })
      onOpenChange(false)
      setForm({ productName: '', description: '', category: '', purpose: 'personal', quantity: 1, budget: '', referenceUrl: '', details: '', priority: 'MEDIUM' })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await create.mutateAsync({
        ...form,
        quantity: Number(form.quantity),
        budget: form.budget ? Number(form.budget) : undefined,
        currencyCode: 'USD',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> {prefill ? 'Solicitar importación' : 'Nueva solicitud de importación'}</DialogTitle>
          <DialogDescription>{prefill ? `Solicitando: ${prefill.name}` : 'Describe el producto que quieres importar desde China'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">¿Qué producto quieres importar? *</Label>
            <Input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Ej: AirPods Pro 2, Zapatillas Nike, Fundas iPhone..." required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="">Seleccionar...</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Hogar">Hogar</option>
                <option value="Moda">Moda</option>
                <option value="Belleza">Belleza</option>
                <option value="Herramientas">Herramientas</option>
                <option value="Mascotas">Mascotas</option>
                <option value="Automotriz">Automotriz</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">¿Para qué?</Label>
              <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option value="personal">Uso personal</option>
                <option value="resale">Reventa</option>
                <option value="business">Empresa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cantidad *</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Presupuesto (USD)</Label>
              <Input type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Link de referencia (Alibaba, AliExpress, etc.)</Label>
            <Input type="url" value={form.referenceUrl} onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descripción y detalles</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Color, talla, material, marca, empaque, cualquier detalle importante..." />
          </div>
          {error && <p className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="gap-1.5"><Sparkles className="h-4 w-4" /> Enviar solicitud</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
