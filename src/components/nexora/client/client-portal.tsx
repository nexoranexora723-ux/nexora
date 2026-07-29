'use client'

import { useState, useEffect, useRef } from 'react'
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
import type { ImportRequest, Product, Quote } from '@/lib/types'
import {
  LayoutDashboard, Package, Truck, User, LogOut, Plus, Sparkles,
  Search, ChevronRight, ShoppingBag, ArrowLeft, ShoppingCart,
  Check, X, CheckCircle2, CreditCard, Loader2,
  MessageCircle, Send, Star, TrendingUp, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/nexora/shared/notification-bell'
import { WizardDialog } from '@/components/nexora/client/wizard-dialog'
import { OnboardingTour, CommandPalette } from '@/components/nexora/shared/extra-features'
import { ProductDetailPage } from '@/components/nexora/public/product-detail-page'
import { fireConfetti, SuccessOverlay, LoadingOverlay, staggerContainer, staggerItem, AnimatedCounter, PulsingBadge, BreathingAvatar, NaiosTyping, messageSlideIn } from '@/components/nexora/shared/animations'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, Command as CommandIcon } from 'lucide-react'

type View = 'dashboard' | 'catalog' | 'requests' | 'tracking' | 'profile'

interface PrefillData {
  name?: string
  category?: string
  description?: string
  referenceUrl?: string
}

export function ClientPortal() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [view, setView] = useState<View>('dashboard')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [prefillProduct, setPrefillProduct] = useState<PrefillData | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [detailProductId, setDetailProductId] = useState<string | null>(null)

  // Onboarding on first visit
  useEffect(() => {
    const seen = localStorage.getItem('nexora-onboarding-seen')
    if (!seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowOnboarding(true)
      localStorage.setItem('nexora-onboarding-seen', '1')
    }
  }, [])

  // Command palette shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCmdOpen(true)} className="hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted sm:flex">
              <CommandIcon className="h-3 w-3" /> Buscar...
              <kbd className="rounded bg-muted px-1 text-[9px]">⌘K</kbd>
            </button>
            <NotificationBell />
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted" aria-label="Cambiar tema">
              <Sun className="hidden h-4 w-4 dark:block" />
              <Moon className="h-4 w-4 dark:hidden" />
            </button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setWizardOpen(true)}>
              <Sparkles className="h-4 w-4 text-primary" /> <span className="hidden sm:inline">Asistente</span>
            </Button>
            <Button size="sm" className="gap-1.5" onClick={openCreateBlank}>
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nueva solicitud</span>
            </Button>
          </div>
        </header>

        {/* Mobile bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 px-2 py-2 backdrop-blur-md lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}>
          {[
            { key: 'dashboard' as View, icon: LayoutDashboard, label: 'Inicio' },
            { key: 'catalog' as View, icon: ShoppingBag, label: 'Catálogo' },
            { key: 'requests' as View, icon: Package, label: 'Pedidos' },
            { key: 'tracking' as View, icon: Truck, label: 'Tracking' },
            { key: 'profile' as View, icon: User, label: 'Perfil' },
          ].map((item) => {
            const isActive = view === item.key
            return (
              <button key={item.key} onClick={() => setView(item.key)} className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}>
                <item.icon className={cn('h-5 w-5', isActive && 'fill-primary/10')} />
                <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{item.label}</span>
                {isActive && <div className="absolute -mt-1 h-1 w-1 rounded-full bg-primary" />}
              </button>
            )
          })}
        </div>

        <main className="nexora-scroll flex-1 overflow-y-auto p-4 pb-20 sm:p-6 lg:p-8 lg:pb-8">
          <div className="mx-auto max-w-5xl">
            {view === 'dashboard' && <ClientDashboard onNewRequest={openCreateBlank} onViewRequest={(id) => { setSelectedRequest(id); setView('tracking') }} onNavigate={setView} />}
            {view === 'catalog' && <ClientCatalog onProductClick={(p) => setDetailProductId(p.id)} />}
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

      {/* Product detail page (full page, not dialog) */}
      {detailProductId && (
        <ProductDetailPage
          productId={detailProductId}
          onBack={() => setDetailProductId(null)}
          onRequest={async () => {
            // Fetch product data and prefill the request form
            try {
              const res = await fetch(`/api/products/${detailProductId}`)
              const p = await res.json()
              setDetailProductId(null)
              openCreateWithProduct({
                name: p.name,
                category: p.category?.name ?? '',
                description: p.description ?? '',
                referenceUrl: p.referenceUrl ?? '',
              } as unknown as Product)
            } catch {
              setDetailProductId(null)
              openCreateBlank()
            }
          }}
        />
      )}

      {/* Wizard dialog */}
      <WizardDialog open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* Onboarding tour (#27) */}
      {showOnboarding && <OnboardingTour onClose={() => setShowOnboarding(false)} />}

      {/* Command palette (#29) */}
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onNavigate={(action) => {
        if (action === 'new') { openCreateBlank() }
        else if (action === 'wizard') { setWizardOpen(true) }
        else if (action === 'catalog' || action === 'dashboard' || action === 'requests' || action === 'tracking' || action === 'profile') { setView(action as View) }
      }} />

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
    queryFn: async () => {
      const res = await fetch('/api/requests')
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
  })

  const reqList = requests ?? []
  const stats = {
    total: reqList.length,
    active: reqList.filter((r) => !['ENTREGADO', 'CERRADO'].includes(r.status)).length,
    delivered: reqList.filter((r) => r.status === 'ENTREGADO').length,
    new: reqList.filter((r) => r.status === 'NUEVA').length,
  }

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

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div variants={staggerItem}><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total solicitudes</p><p className="mt-1 text-2xl font-bold"><AnimatedCounter value={stats.total} /></p></CardContent></Card></motion.div>
        <motion.div variants={staggerItem}><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">En proceso</p><p className="mt-1 text-2xl font-bold text-amber-600"><AnimatedCounter value={stats.active} /></p></CardContent></Card></motion.div>
        <motion.div variants={staggerItem}><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Entregados</p><p className="mt-1 text-2xl font-bold text-emerald-600"><AnimatedCounter value={stats.delivered} /></p></CardContent></Card></motion.div>
        <motion.div variants={staggerItem}><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Nuevos</p><p className="mt-1 text-2xl font-bold text-sky-600"><AnimatedCounter value={stats.new} /></p></CardContent></Card></motion.div>
      </motion.div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Solicitudes recientes</h3>
          <Button variant="ghost" size="sm" onClick={onNewRequest} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Nueva</Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : reqList.length === 0 ? (
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
            {reqList.slice(0, 5).map((r) => (
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
          {filtered.map((p) => {
            const savings = p.estimatedCost && p.suggestedPrice ? Math.round(((p.suggestedPrice - p.estimatedCost) / p.suggestedPrice) * 100) : null
            return (
              <div key={p.id} className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl" onClick={() => onProductClick(p)}>
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">📦</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  {p.category?.icon && (
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
                      <span>{p.category.icon}</span><span className="text-foreground">{p.category.name}</span>
                    </div>
                  )}
                  {savings && savings > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg"
                    >
                      <TrendingUp className="h-3 w-3" /> {savings}% OFF
                    </motion.div>
                  )}
                  {p.isFeatured && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                      <Star className="h-3 w-3 fill-white" /> Destacado
                    </div>
                  )}
                </div>
                <CardContent className="flex flex-1 flex-col p-4">
                  {p.brand && <p className="text-xs font-medium text-muted-foreground">{p.brand.name}</p>}
                  <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">{p.name}</h3>
                  {p.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                  <div className="mt-3 flex items-baseline gap-2">
                    {p.estimatedCost ? (
                      <>
                        <span className="text-2xl font-bold">${p.estimatedCost}</span>
                        {p.suggestedPrice && <span className="text-sm text-muted-foreground line-through">${p.suggestedPrice}</span>}
                      </>
                    ) : <span className="text-sm text-muted-foreground">Precio bajo consulta</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Verificado</span>
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-primary" /> Importación incluida</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                    <span className="text-xs font-medium text-primary">Ver detalles</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// === Product Detail Dialog ===
function ProductDetailDialog({ product, onClose, onRequest }: { product: Product; onClose: () => void; onRequest: (p: Product) => void }) {
  const savings = product.estimatedCost && product.suggestedPrice ? product.suggestedPrice - product.estimatedCost : null
  const savingsPct = savings && product.suggestedPrice ? Math.round((savings / product.suggestedPrice) * 100) : null

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-3xl p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Imagen */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/30 sm:aspect-auto">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">📦</div>
            )}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {product.category?.icon && (
                <Badge className="w-fit bg-background/90 text-foreground shadow-sm backdrop-blur">{product.category.icon} {product.category.name}</Badge>
              )}
              {product.isFeatured && (
                <Badge className="w-fit gap-1 bg-amber-500 text-white shadow-lg"><Star className="h-3 w-3 fill-white" /> Destacado</Badge>
              )}
            </div>
            {savingsPct && savingsPct > 0 && (
              <div className="absolute right-4 top-4 rounded-full bg-rose-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">Ahorra {savingsPct}%</div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col p-6">
            <DialogHeader className="p-0 text-left">
              {product.brand && <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>}
              <DialogTitle className="text-2xl font-bold leading-tight">{product.name}</DialogTitle>
            </DialogHeader>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={cn('h-3.5 w-3.5', i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted')} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">(4.0 · 127 importaciones)</span>
            </div>

            {/* Precio */}
            <div className="mt-4 flex items-baseline gap-3">
              {product.estimatedCost ? (
                <>
                  <span className="text-4xl font-bold">${product.estimatedCost}</span>
                  {product.suggestedPrice && <span className="text-lg text-muted-foreground line-through">${product.suggestedPrice}</span>}
                </>
              ) : <span className="text-lg text-muted-foreground">Precio bajo consulta</span>}
            </div>
            {savings && savings > 0 && <p className="mt-1 text-sm font-medium text-emerald-600">✅ Ahorras ${savings.toFixed(2)} vs precio de mercado</p>}

            {/* Descripción */}
            {product.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>}

            {/* Trust badges */}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-xs"><ShieldCheck className="h-4 w-4 text-emerald-500" /><div><p className="font-medium">Proveedor verificado</p><p className="text-muted-foreground">Calidad garantizada</p></div></div>
              <div className="flex items-center gap-2 text-xs"><Truck className="h-4 w-4 text-primary" /><div><p className="font-medium">Importación incluida</p><p className="text-muted-foreground">Desde China a tu puerta</p></div></div>
              <div className="flex items-center gap-2 text-xs"><Sparkles className="h-4 w-4 text-amber-500" /><div><p className="font-medium">Cotización en 24h</p><p className="text-muted-foreground">Respuesta rápida</p></div></div>
              <div className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-4 w-4 text-violet-500" /><div><p className="font-medium">Garantía incluida</p><p className="text-muted-foreground">Soporte post-venta</p></div></div>
            </div>

            {/* Timeline */}
            <div className="mt-4 rounded-xl border p-3">
              <p className="mb-2 text-xs font-semibold">⏱️ Tiempo estimado de entrega</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="text-center"><div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">1</div><p className="mt-1">Cotización</p><p className="font-medium text-foreground">24h</p></div>
                <div className="h-0.5 flex-1 bg-primary/20" />
                <div className="text-center"><div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">2</div><p className="mt-1">Producción</p><p className="font-medium text-foreground">15d</p></div>
                <div className="h-0.5 flex-1 bg-primary/20" />
                <div className="text-center"><div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">3</div><p className="mt-1">Envío</p><p className="font-medium text-foreground">7d</p></div>
                <div className="h-0.5 flex-1 bg-primary/20" />
                <div className="text-center"><div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">4</div><p className="mt-1">Entrega</p><p className="font-medium text-foreground">✓</p></div>
              </div>
              <p className="mt-2 text-center text-xs font-medium text-primary">Total: ~22 días</p>
            </div>

            {/* CTA */}
            <div className="mt-auto pt-4">
              <Button className="w-full gap-2 text-base" size="lg" onClick={() => onRequest(product)}>
                <ShoppingCart className="h-5 w-5" /> Lo quiero — Solicitar importación
              </Button>
              <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Sin compromiso</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Cotización gratis</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Pago seguro</span>
              </div>
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
    queryFn: async () => {
      const res = await fetch('/api/requests')
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
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
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!requestId,
  })

  if (!requestId) return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Selecciona una solicitud para ver el seguimiento</CardContent></Card>
  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!req || !req.id) return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No encontrada</CardContent></Card>

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

      {/* NAIOS analysis is INTERNAL — only shown in admin portal, NOT to clients */}

      <Card><CardContent className="p-6">
        <h3 className="mb-6 text-sm font-semibold">Progreso de tu importación</h3>
        {/* Horizontal timeline */}
        <div className="relative flex justify-between">
          {statuses.map((status, idx) => (
            <div key={status} className="flex flex-1 flex-col items-center">
              {/* Line */}
              {idx < statuses.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                  className={cn('absolute h-0.5 top-4 origin-left', idx < currentIdx ? 'bg-primary' : 'bg-muted')}
                  style={{ left: `${(idx / (statuses.length - 1)) * 100}%`, width: `${100 / (statuses.length - 1)}%` }}
                />
              )}
              {/* Dot */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: idx * 0.1 }}
                className={cn('relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all',
                idx < currentIdx ? 'border-primary bg-primary text-primary-foreground' :
                idx === currentIdx ? 'border-primary bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'border-muted bg-background text-muted-foreground')}>
                {idx < currentIdx ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </motion.div>
              {/* Label */}
              <span className={cn('mt-1.5 max-w-[80px] text-center text-[9px] leading-tight', idx <= currentIdx ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {REQUEST_STATUS_LABELS[status]}
              </span>
            </div>
          ))}
        </div>
        {/* Current status detail */}
        <div className="mt-6 rounded-lg bg-primary/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">Estado actual</p>
          <p className="mt-0.5 text-sm font-semibold text-primary">{REQUEST_STATUS_LABELS[req.status]}</p>
          {req.status === 'ENTREGADO' ? (
            <p className="mt-1 text-xs text-emerald-600">✓ Tu producto ha sido entregado</p>
          ) : req.status === 'EN_TRANSITO' ? (
            <p className="mt-1 text-xs text-muted-foreground">📦 Tu producto está en camino desde China</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Procesando tu solicitud...</p>
          )}
        </div>
      </CardContent></Card>

      {req.quotes && req.quotes.length > 0 && (
        <Card><CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Cotizaciones ({req.quotes.length})</h3>
          <div className="space-y-3">
            {req.quotes.map((q) => (
              <QuoteCard key={q.id} quote={q} requestId={req.id} requestStatus={req.status} />
            ))}
          </div>
        </CardContent></Card>
      )}

      {/* Payment section */}
      {req.status === 'ESPERANDO_APROBACION' && (
        <Card className="border-primary/20 bg-primary/5"><CardContent className="p-5">
          <h3 className="mb-2 text-sm font-semibold">Pago pendiente</h3>
          <p className="mb-4 text-xs text-muted-foreground">Has aprobado la cotización. Para continuar con la importación, realiza el pago.</p>
          <PaymentSection requestId={req.id} />
        </CardContent></Card>
      )}

      {/* Reference images */}
      {req.referenceImages && (() => {
        try {
          const imgs = JSON.parse(req.referenceImages)
          if (!Array.isArray(imgs) || imgs.length === 0) return null
          return (
            <Card><CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Imágenes de referencia</h3>
              <div className="flex flex-wrap gap-2">
                {imgs.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`Referencia ${i + 1}`} className="h-24 w-24 rounded-lg border object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </a>
                ))}
              </div>
            </CardContent></Card>
          )
        } catch { return null }
      })()}

      {/* Chat */}
      <RequestChat requestId={req.id} />
    </div>
  )
}

// === Request Chat ===
function RequestChat({ requestId }: { requestId: string }) {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: messages = [] } = useQuery({
    queryKey: ['request-messages', requestId],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/messages`)
      if (!res.ok) return []
      const d = await res.json()
      return Array.isArray(d) ? d : []
    },
    refetchInterval: 10000,
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = useMutation({
    mutationFn: async (content: string) => {
      await fetch(`/api/requests/${requestId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['request-messages', requestId] })
      setInput('')
    },
  })

  return (
    <Card><CardContent className="p-0">
      <div className="border-b p-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><MessageCircle className="h-4 w-4 text-primary" /> Conversación</h3></div>
      <div ref={scrollRef} className="nexora-scroll h-64 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
            <div><MessageCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" /><p>¿Tienes preguntas sobre tu solicitud?</p><p>Escribe un mensaje aquí.</p></div>
          </div>
        ) : (
          messages.map((m: { id: string; role: string; content: string; createdAt: string }) => (
            <div key={m.id} className={cn('flex', m.role === 'client' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                m.role === 'client' ? 'rounded-tr-sm bg-primary text-primary-foreground' :
                m.role === 'naios' ? 'rounded-tl-sm bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200' :
                'rounded-tl-sm bg-muted')}>
                {m.role === 'naios' && <p className="mb-0.5 text-[10px] font-semibold text-violet-500">NAIOS</p>}
                <p>{m.content}</p>
                <p className="mt-0.5 text-[9px] opacity-60">{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex items-center gap-2 border-t p-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { send.mutate(input.trim()) } }} placeholder="Escribe un mensaje..." className="h-9" />
        <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => input.trim() && send.mutate(input.trim())} disabled={!input.trim() || send.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </CardContent></Card>
  )
}

// === Quote Card (with approve/reject for client) ===
function QuoteCard({ quote, requestId, requestStatus }: { quote: Quote; requestId: string; requestStatus: string }) {
  const qc = useQueryClient()

  const approve = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quotes/${quote.id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('Error')
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['request', requestId] })
      qc.invalidateQueries({ queryKey: ['client-requests'] })
    },
  })

  const reject = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quotes/${quote.id}/reject`, { method: 'POST' })
      if (!res.ok) throw new Error('Error')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['request', requestId] }),
  })

  const statusLabels: Record<string, string> = {
    RECIBIDA: 'Recibida', ENVIADA_AL_CLIENTE: 'Enviada', APROBADA: 'Aprobada', RECHAZADA: 'Rechazada', EXPIRADA: 'Expirada',
  }
  const statusColors: Record<string, string> = {
    APROBADA: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    RECHAZADA: 'border-rose-200 bg-rose-50 text-rose-700',
    ENVIADA_AL_CLIENTE: 'border-amber-200 bg-amber-50 text-amber-700',
  }

  const canAct = quote.status === 'ENVIADA_AL_CLIENTE' && requestStatus === 'COTIZACION_ENVIADA'

  return (
    <div className={cn('rounded-lg border-2 p-4', quote.status === 'APROBADA' ? 'border-emerald-300 bg-emerald-50/50' : '')}>
      <div className="flex items-start justify-between">
        <div>
          <code className="text-xs font-medium text-primary">{quote.number}</code>
          <p className="mt-1 text-lg font-bold">{formatCurrency(quote.total)}</p>
          <p className="text-xs text-muted-foreground">{quote.supplier.companyName}</p>
        </div>
        <Badge variant="outline" className={cn('text-[10px]', statusColors[quote.status] ?? '')}>{statusLabels[quote.status] ?? quote.status}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-xs">
        <div><span className="text-muted-foreground">Cantidad:</span> <span className="font-medium">{quote.quantity}u</span></div>
        <div><span className="text-muted-foreground">Precio unit:</span> <span className="font-medium">{formatCurrency(quote.unitPrice)}</span></div>
        <div><span className="text-muted-foreground">Envío:</span> <span className="font-medium">{formatCurrency(quote.shippingCost)}</span></div>
        {quote.leadTime && <div><span className="text-muted-foreground">Tiempo:</span> <span className="font-medium">{quote.leadTime} días</span></div>}
        {quote.warranty && <div><span className="text-muted-foreground">Garantía:</span> <span className="font-medium">{quote.warranty}</span></div>}
      </div>
      {canAct && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1 gap-1" onClick={() => approve.mutate()} disabled={approve.isPending}>
            <Check className="h-3.5 w-3.5" /> Aprobar
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1 text-rose-600" onClick={() => reject.mutate()} disabled={reject.isPending}>
            <X className="h-3.5 w-3.5" /> Rechazar
          </Button>
        </div>
      )}
    </div>
  )
}

// === Payment Section (simulated) ===
function PaymentSection({ requestId }: { requestId: string }) {
  const qc = useQueryClient()
  const [method, setMethod] = useState('Tarjeta')
  const [paid, setPaid] = useState(false)

  const pay = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/pay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      })
      if (!res.ok) throw new Error('Error')
    },
    onSuccess: () => {
      setPaid(true)
      fireConfetti()
      qc.invalidateQueries({ queryKey: ['request', requestId] })
      qc.invalidateQueries({ queryKey: ['client-requests'] })
    },
  })

  if (paid) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex flex-col items-center gap-2 py-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950"
        >
          <motion.svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <motion.path d="M9 16 L14 21 L23 10" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.4, ease: 'easeInOut' }}
            />
          </motion.svg>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-sm font-semibold">¡Pago confirmado! ✅</motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-xs text-muted-foreground">Nuestro equipo iniciará la compra al proveedor.</motion.p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'Tarjeta', label: 'Tarjeta', icon: '💳' },
          { id: 'Nequi', label: 'Nequi', icon: '📱' },
          { id: 'PayPal', label: 'PayPal', icon: '🅿️' },
          { id: 'Contraentrega', label: 'Contraentrega', icon: '📦' },
        ].map((m) => (
          <button key={m.id} type="button" onClick={() => setMethod(m.id)} className={cn(
            'flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition-all',
            method === m.id ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground hover:border-primary/40',
          )}>
            <span className="text-base">{m.icon}</span> {m.label}
          </button>
        ))}
      </div>
      <Button className="w-full gap-1.5" onClick={() => pay.mutate()} disabled={pay.isPending}>
        {pay.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Pagar con {method}
      </Button>
      <p className="text-center text-[10px] text-muted-foreground">Pago simulado para demostración. En producción se integrará con Wompi/Bold.</p>
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
    quantity: 1, budget: '', referenceUrl: '', referenceImages: '', details: '', priority: 'MEDIUM',
  })
  const [imageInput, setImageInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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
      setForm({ productName: '', description: '', category: '', purpose: 'personal', quantity: 1, budget: '', referenceUrl: '', referenceImages: '', details: '', priority: 'MEDIUM' })
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
      fireConfetti()
      setShowSuccess(true)
      setForm({ productName: '', description: '', category: '', purpose: 'personal', quantity: 1, budget: '', referenceUrl: '', referenceImages: '', details: '', priority: 'MEDIUM' })
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
            <Label className="text-xs">Link de referencia (Alibaba, AliExpress, TikTok, etc.)</Label>
            <Input type="url" value={form.referenceUrl} onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })} placeholder="https://..." />
          </div>
          {/* Image references */}
          <div className="space-y-2">
            <Label className="text-xs">Imágenes de referencia (pega URLs de fotos del producto)</Label>
            <div className="flex gap-2">
              <Input
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="https://imagen.com/foto.jpg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (imageInput.trim()) {
                      const imgs = form.referenceImages ? JSON.parse(form.referenceImages) : []
                      imgs.push(imageInput.trim())
                      setForm({ ...form, referenceImages: JSON.stringify(imgs) })
                      setImageInput('')
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (imageInput.trim()) {
                    const imgs = form.referenceImages ? JSON.parse(form.referenceImages) : []
                    imgs.push(imageInput.trim())
                    setForm({ ...form, referenceImages: JSON.stringify(imgs) })
                    setImageInput('')
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* Image previews */}
            {form.referenceImages && (() => {
              const imgs = JSON.parse(form.referenceImages)
              if (!Array.isArray(imgs) || imgs.length === 0) return null
              return (
                <div className="flex flex-wrap gap-2">
                  {imgs.map((url: string, i: number) => (
                    <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border">
                      <img src={url} alt={`Referencia ${i + 1}`} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = imgs.filter((_: string, idx: number) => idx !== i)
                          setForm({ ...form, referenceImages: filtered.length > 0 ? JSON.stringify(filtered) : '' })
                        }}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )
            })()}
            <p className="text-[10px] text-muted-foreground">Pega URLs de imágenes del producto (Alibaba, Amazon, TikTok, etc.)</p>
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
      <SuccessOverlay show={showSuccess} title="¡Solicitud enviada! 🎉" subtitle="Nuestro equipo empezará a buscar el mejor proveedor" onDone={() => { setShowSuccess(false); onOpenChange(false) }} />
    </Dialog>
  )
}
