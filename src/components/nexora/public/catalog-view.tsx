'use client'

import { useState, useMemo, useEffect } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Search, Package, Star, ShieldCheck, Truck, CheckCircle2, ShoppingCart, Flame, ArrowRight, TrendingUp, Loader2, Filter, Heart, Share2, Zap, Award, Clock, Minus, Plus, X } from 'lucide-react'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CartCounter, CartDrawer } from '@/components/nexora/public/cart-drawer'
import { WishlistCounter, WishlistDrawer } from '@/components/nexora/public/wishlist-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useWishlist } from '@/lib/wishlist-store'
import { useCart } from '@/lib/cart-store'
import { useToast } from '@/hooks/use-toast'

interface CatalogViewProps {
  onNavigate: (view: string) => void
  onLogin: () => void
  onRegister: () => void
  onProductClick?: (id: string) => void
}

const PAGE_SIZE = 24

export function CatalogView({ onNavigate, onRegister, onProductClick }: CatalogViewProps) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null) // null = all categories
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Fetch categories
  const { data: categoriesData } = useQuery<{ id: string; name: string; icon: string | null; productCount: number }[]>({
    queryKey: ['categories-list'],
    queryFn: async () => (await fetch('/api/categories')).json(),
  })
  const categories = categoriesData ?? []

  // CASCADE: Fetch brands for selected category (or all brands if no category selected)
  const { data: brandsData } = useQuery<{ id: string; name: string; productCount?: number }[] | { brands: { id: string; name: string }[] }>({
    queryKey: ['brands-list', categoryId],
    queryFn: async () => {
      if (categoryId) {
        // Cascade: get brands for this category only
        return await (await fetch(`/api/categories/${categoryId}/brands`)).json()
      }
      // No category selected: get all brands
      return await (await fetch('/api/brands')).json()
    },
    enabled: true,
  })
  // Normalize brands array (cascade returns array, /api/brands returns {brands: [...]})
  const brands = useMemo<{ id: string; name: string; productCount?: number }[]>(() => {
    if (!brandsData) return []
    if (Array.isArray(brandsData)) return brandsData
    return (brandsData.brands ?? []).map((b) => ({ id: b.id, name: b.name }))
  }, [brandsData])

  // Reset brand filter when category changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrandFilter('all')
  }, [categoryId])

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<{
    products: Product[]
    total: number
    page: number
    totalPages: number
  }>({
    queryKey: ['products-public-infinite', categoryId, brandFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      params.set('limit', String(PAGE_SIZE))
      params.set('page', String(pageParam))
      if (categoryId) params.set('categoryId', categoryId)
      if (brandFilter !== 'all') params.set('brandId', brandFilter)
      const res = await fetch(`/api/products?${params}`)
      return res.json()
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined
    },
  })

  // Flatten all pages into one array
  const allProducts = useMemo(() => {
    return data?.pages.flatMap((page) => page.products) ?? []
  }, [data])

  const total = data?.pages[0]?.total ?? 0

  // Client-side filter by search query only (category and brand are handled by API)
  const filtered = useMemo(() => {
    if (!query) return allProducts
    return allProducts.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase())
    )
  }, [allProducts, query])

  // Infinite scroll observer
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop <
        document.documentElement.offsetHeight - 500
      ) return
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
              <span className="text-sm font-black">N</span>
            </div>
            <span className="font-bold">NEXORA</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <WishlistCounter />
            <CartCounter />
            <ThemeToggle />
            <Button size="sm" onClick={onRegister}>Registrarse</Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero del catálogo */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent p-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="gap-1 bg-primary/15 text-primary"><Flame className="h-3 w-3" /> Productos más solicitados</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de productos importables</h1>
          <p className="mt-2 text-muted-foreground">Productos verificados desde China con precios de fabricante. Tú eliges, nosotros importamos.</p>
        </div>

        {/* Búsqueda */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar productos..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Filtros de categoría (cascade: al seleccionar, actualiza las marcas) */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Button 
            variant={!categoryId ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setCategoryId(null)}
          >📦 Todos</Button>
          {categories.map((c) => (
            <Button 
              key={c.id} 
              variant={categoryId === c.id ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setCategoryId(c.id)}
            >{c.icon} {c.name}</Button>
          ))}
        </div>

        {/* Filtro de marca (debajo de categorías, con mejor diseño) */}
        <div className="mb-4 flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4 text-primary" />
            <span>Filtrar por marca:</span>
          </div>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="h-9 w-[220px] border-primary/20 bg-background">
              <SelectValue placeholder={categoryId ? "Marcas en esta categoría" : "Todas las marcas"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{categoryId ? "Todas las marcas (categoría)" : "Todas las marcas"}</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}{b.productCount ? ` (${b.productCount})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {brandFilter !== 'all' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setBrandFilter('all')}
            >
              ✕ Quitar filtro
            </Button>
          )}
          {categoryId && (
            <span className="ml-auto text-xs text-muted-foreground">
              {brands.length} marca{brands.length !== 1 ? 's' : ''} disponible{brands.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Contador de resultados */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{total.toLocaleString()} productos disponibles</Badge>
          {brandFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {brands.find((b) => b.id === brandFilter)?.name}
              <button onClick={() => setBrandFilter('all')} className="ml-1 hover:text-foreground">✕</button>
            </Badge>
          )}
          {filtered.length < total && <span className="text-xs">Mostrando {filtered.length}...</span>}
        </div>

        {/* Grid de productos */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron productos</p>
            <Button className="mt-4" onClick={onRegister}>Solicitar producto personalizado</Button>
          </CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => onProductClick ? onProductClick(p.id) : setSelectedProduct(p)} />
              ))}
            </div>

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className="mt-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando más productos...</span>
              </div>
            )}

            {/* Load more button (fallback for scroll) */}
            {hasNextPage && !isFetchingNextPage && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => fetchNextPage()}>
                  Cargar más productos
                </Button>
              </div>
            )}

            {/* End of list */}
            {!hasNextPage && filtered.length > 0 && (
              <div className="mt-8 text-center text-sm text-muted-foreground">
                ✅ Has visto todos los {total.toLocaleString()} productos
              </div>
            )}
          </>
        )}
      </div>

      {/* Product detail dialog */}
      {selectedProduct && (
        <ProductDetailDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onRequest={onRegister} />
      )}

      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer />
    </div>
  )
}

// === Product Card — con favoritos, compartir, carrito ===
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const savings = product.estimatedCost && product.suggestedPrice
    ? Math.round(((product.suggestedPrice - product.estimatedCost) / product.suggestedPrice) * 100)
    : null
  
  const wishlist = useWishlist()
  const cart = useCart()
  const { toast } = useToast()
  const isInWishlist = wishlist.has(product.id)

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    wishlist.toggle({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.estimatedCost ?? 0,
      sku: product.sku,
    })
    toast({ title: isInWishlist ? 'Removido de favoritos' : 'Añadido a favoritos' })
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/producto/${product.id}`
    const text = `Mira este producto en NEXORA: ${product.name} - $${product.estimatedCost}`
    if (navigator.share) {
      navigator.share({ title: product.name, text, url })
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      toast({ title: 'Link copiado al portapapeles' })
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    cart.addItem({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.estimatedCost ?? 0,
      sku: product.sku,
    })
    toast({ title: 'Añadido al carrito' })
  }

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
      onClick={onClick}
    >
      {/* Imagen con badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">📦</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        
        {/* Botones flotantes (aparecen en hover) */}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleWishlist}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full shadow-lg backdrop-blur transition-colors',
              isInWishlist ? 'bg-rose-500 text-white' : 'bg-background/90 text-foreground hover:bg-background'
            )}
          >
            <Heart className={cn('h-4 w-4', isInWishlist && 'fill-white')} />
          </button>
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur transition-colors hover:bg-background"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* Badge de categoría */}
        {product.category?.icon && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
            <span>{product.category.icon}</span>
            <span className="text-foreground">{product.category.name}</span>
          </div>
        )}
        {savings && savings > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg group-hover:opacity-0">
            <TrendingUp className="h-3 w-3" /> {savings}% OFF
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            <Star className="h-3 w-3 fill-white" /> Destacado
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        {product.brand && <p className="text-xs font-medium text-muted-foreground">{product.brand.name}</p>}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
        {product.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>}
        
        {/* Precio */}
        <div className="mt-3 rounded-lg bg-muted/40 p-2">
          {product.estimatedCost ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">${product.estimatedCost}</span>
                <Badge variant="secondary" className="text-[9px]">USD</Badge>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Incluye: producto + envío + aduana + IVA + margen 50%
              </p>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Precio bajo consulta</span>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Verificado</span>
          <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-primary" /> DHL/FedEx</span>
        </div>

        {/* Botones de acción */}
        <div className="mt-3 flex items-center gap-2 border-t pt-3">
          <Button size="sm" variant="default" className="flex-1 gap-1.5" onClick={handleAddToCart}>
            <ShoppingCart className="h-3.5 w-3.5" /> Añadir
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onClick}>
            Ver <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// === Product Detail Dialog — completo con timeline, trust badges, specs ===
function ProductDetailDialog({ product, onClose, onRequest }: { product: Product; onClose: () => void; onRequest: () => void }) {
  const [quantity, setQuantity] = useState(1)
  const wishlist = useWishlist()
  const cart = useCart()
  const { toast } = useToast()
  const isInWishlist = wishlist.has(product.id)

  const savings = product.estimatedCost && product.suggestedPrice
    ? product.suggestedPrice - product.estimatedCost
    : null
  const savingsPct = savings && product.suggestedPrice
    ? Math.round((savings / product.suggestedPrice) * 100)
    : null

  const handleWishlist = () => {
    wishlist.toggle({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.estimatedCost ?? 0,
      sku: product.sku,
    })
    toast({ title: isInWishlist ? 'Removido de favoritos' : 'Añadido a favoritos' })
  }

  const handleShare = () => {
    const url = `${window.location.origin}/producto/${product.id}`
    const text = `Mira este producto en NEXORA: ${product.name} - $${product.estimatedCost}`
    if (navigator.share) {
      navigator.share({ title: product.name, text, url })
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      toast({ title: 'Link copiado al portapapeles' })
    }
  }

  const handleAddToCart = () => {
    cart.addItem({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.estimatedCost ?? 0,
      sku: product.sku,
    }, quantity)
    toast({ title: `${quantity} × ${product.name} añadido al carrito` })
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-3xl p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Columna izquierda: imagen */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/30 sm:aspect-auto">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">📦</div>
            )}
            {/* Badges sobre imagen */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {product.category?.icon && (
                <Badge className="w-fit bg-background/90 text-foreground shadow-sm backdrop-blur">
                  {product.category.icon} {product.category.name}
                </Badge>
              )}
              {product.isFeatured && (
                <Badge className="w-fit gap-1 bg-amber-500 text-white shadow-lg">
                  <Star className="h-3 w-3 fill-white" /> Destacado
                </Badge>
              )}
            </div>
            {savingsPct && savingsPct > 0 && (
              <div className="absolute right-4 top-4 rounded-full bg-rose-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                Ahorra {savingsPct}%
              </div>
            )}
            {/* Botones flotantes */}
            <div className="absolute right-4 bottom-4 flex gap-2">
              <button onClick={handleWishlist} className={cn('flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur transition-colors', isInWishlist ? 'bg-rose-500 text-white' : 'bg-background/90 text-foreground hover:bg-background')}>
                <Heart className={cn('h-5 w-5', isInWishlist && 'fill-white')} />
              </button>
              <button onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur transition-colors hover:bg-background">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Columna derecha: info */}
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

            {/* Precio destacado */}
            <div className="mt-4 flex items-baseline gap-3">
              {product.estimatedCost ? (
                <>
                  <span className="text-4xl font-bold text-foreground">${product.estimatedCost}</span>
                  <Badge variant="secondary" className="text-[10px]">USD</Badge>
                </>
              ) : (
                <span className="text-lg text-muted-foreground">Precio bajo consulta</span>
              )}
            </div>
            {savings && savings > 0 && (
              <p className="mt-1 text-sm font-medium text-emerald-600">
                ✅ Ahorras ${savings.toFixed(2)} vs precio de mercado
              </p>
            )}

            {/* Descripción */}
            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            )}

            {/* Trust badges */}
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="font-medium">Proveedor verificado</p>
                  <p className="text-muted-foreground">Calidad garantizada</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Truck className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Importación incluida</p>
                  <p className="text-muted-foreground">Desde China a tu puerta</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-medium">Cotización en 24h</p>
                  <p className="text-muted-foreground">Respuesta rápida</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Award className="h-4 w-4 text-violet-500" />
                <div>
                  <p className="font-medium">Garantía incluida</p>
                  <p className="text-muted-foreground">Soporte post-venta</p>
                </div>
              </div>
            </div>

            {/* Timeline de importación */}
            <div className="mt-4 rounded-xl border p-3">
              <p className="mb-2 text-xs font-semibold">⏱️ Tiempo estimado de entrega</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="text-center">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">1</div>
                  <p className="mt-1">Cotización</p>
                  <p className="font-medium text-foreground">24h</p>
                </div>
                <div className="h-0.5 flex-1 bg-primary/20" />
                <div className="text-center">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">2</div>
                  <p className="mt-1">Producción</p>
                  <p className="font-medium text-foreground">15d</p>
                </div>
                <div className="h-0.5 flex-1 bg-primary/20" />
                <div className="text-center">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">3</div>
                  <p className="mt-1">Envío</p>
                  <p className="font-medium text-foreground">7d</p>
                </div>
                <div className="h-0.5 flex-1 bg-primary/20" />
                <div className="text-center">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">4</div>
                  <p className="mt-1">Entrega</p>
                  <p className="font-medium text-foreground">✓</p>
                </div>
              </div>
              <p className="mt-2 text-center text-xs font-medium text-primary">Total: ~22 días</p>
            </div>

            {/* Selector de cantidad */}
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm font-medium">Cantidad:</span>
              <div className="flex items-center rounded-lg border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium tabular-nums">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {product.estimatedCost && (
                <span className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">${(product.estimatedCost * quantity).toFixed(2)}</span></span>
              )}
            </div>

            {/* CTA */}
            <div className="mt-auto pt-4">
              <div className="flex gap-2">
                <Button className="flex-1 gap-2 text-base" size="lg" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5" /> Añadir al carrito
                </Button>
                <Button variant="outline" size="lg" onClick={onRequest}>
                  Solicitar
                </Button>
              </div>
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
