'use client'

import { useState, useMemo, useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Search, Package, Star, ShieldCheck, Truck, CheckCircle2, ShoppingCart, Flame, ArrowRight, TrendingUp, Loader2 } from 'lucide-react'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CartCounter, CartDrawer } from '@/components/nexora/public/cart-drawer'
import { WishlistCounter, WishlistDrawer } from '@/components/nexora/public/wishlist-button'
import { ThemeToggle } from '@/components/theme-toggle'

interface CatalogViewProps {
  onNavigate: (view: string) => void
  onLogin: () => void
  onRegister: () => void
  onProductClick?: (id: string) => void
}

const PAGE_SIZE = 24

export function CatalogView({ onNavigate, onRegister, onProductClick }: CatalogViewProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

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
    queryKey: ['products-public-infinite', category],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      params.set('limit', String(PAGE_SIZE))
      params.set('page', String(pageParam))
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

  // Client-side filter by search query
  const filtered = useMemo(() => {
    if (!query) return allProducts
    return allProducts.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description?.toLowerCase().includes(query.toLowerCase())
    )
  }, [allProducts, query])

  // Extract categories from the first page
  const categories = useMemo(() => {
    const cats = new Set<string>()
    allProducts.forEach((p) => {
      if (p.category?.name) cats.add(p.category.name)
    })
    return Array.from(cats)
  }, [allProducts])

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

        {/* Filtros de categoría */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Button variant={category === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCategory('all')}>📦 Todos</Button>
          {categories.map((c) => (
            <Button key={c} variant={category === c ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)}>{c}</Button>
          ))}
        </div>

        {/* Contador de resultados */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{total.toLocaleString()} productos disponibles</Badge>
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

// === Product Card ===
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const savings = product.estimatedCost && product.suggestedPrice
    ? Math.round(((product.suggestedPrice - product.estimatedCost) / product.suggestedPrice) * 100)
    : null

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
      onClick={onClick}
    >
      {/* Imagen */}
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
        {product.category?.icon && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
            <span>{product.category.icon}</span>
            <span className="text-foreground">{product.category.name}</span>
          </div>
        )}
        {savings && savings > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
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

        {/* CTA */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-xs font-medium text-primary">Ver detalles</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  )
}

// === Product Detail Dialog ===
function ProductDetailDialog({ product, onClose, onRequest }: { product: Product; onClose: () => void; onRequest: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            {product.brand && <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>}
            <h2 className="text-2xl font-bold">{product.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="mt-4 w-full rounded-xl" />}
        {product.description && <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>}
        <div className="mt-4 text-3xl font-bold">${product.estimatedCost ?? '—'}</div>
        <Button className="mt-4 w-full gap-2" size="lg" onClick={onRequest}>
          <ShoppingCart className="h-5 w-5" /> Solicitar importación
        </Button>
      </div>
    </div>
  )
}
