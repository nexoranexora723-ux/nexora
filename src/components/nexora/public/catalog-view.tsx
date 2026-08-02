'use client'

import * as React from 'react'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft, Search, Package, Star, ShieldCheck, Truck, CheckCircle2, ShoppingCart,
  Flame, ArrowRight, TrendingUp, Loader2, Filter, Heart, Share2, Zap, Award, Clock,
  Minus, Plus, X, ImageIcon, Sparkles, SlidersHorizontal, ChevronLeft, ChevronRight, ZoomIn,
} from 'lucide-react'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CartCounter, CartDrawer } from '@/components/nexora/public/cart-drawer'
import { WishlistCounter, WishlistDrawer } from '@/components/nexora/public/wishlist-button'
import { CompareToggleButton, CompareProducts } from '@/components/nexora/public/compare-products'
import { toCompareItem } from '@/lib/compare-store'
import { SiteFooter } from '@/components/nexora/public/site-footer'
import { MobileBottomNav } from '@/components/nexora/public/mobile-bottom-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { useWishlist } from '@/lib/wishlist-store'
import { useCart } from '@/lib/cart-store'
import { useToast } from '@/hooks/use-toast'
import { ReviewsSection } from '@/components/nexora/public/reviews-section'

interface CatalogViewProps {
  onNavigate: (view: string) => void
  onLogin: () => void
  onRegister: () => void
  onProductClick?: (id: string) => void
}

const PAGE_SIZE = 24

type PriceRangeKey = 'all' | '0-50' | '50-100' | '100-200' | '200+'
type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'recent'

const PRICE_RANGES: { key: PriceRangeKey; label: string }[] = [
  { key: 'all', label: 'Todos los precios' },
  { key: '0-50', label: 'Hasta $50' },
  { key: '50-100', label: '$50 - $100' },
  { key: '100-200', label: '$100 - $200' },
  { key: '200+', label: 'Más de $200' },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Relevancia' },
  { key: 'price-asc', label: 'Precio: menor a mayor' },
  { key: 'price-desc', label: 'Precio: mayor a menor' },
  { key: 'rating', label: 'Mejor calificados' },
  { key: 'recent', label: 'Más recientes' },
]

// === Highlight matching text ===
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const safe = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${safe})`, 'ig'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="rounded bg-amber-200/70 px-0.5 text-foreground dark:bg-amber-500/40">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  )
}

export function CatalogView({ onNavigate, onRegister, onProductClick }: CatalogViewProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<PriceRangeKey>('all')
  const [sort, setSort] = useState<SortKey>('relevance')
  const [onlyFullGallery, setOnlyFullGallery] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [imageSearching, setImageSearching] = useState(false)
  const [imageSearchInfo, setImageSearchInfo] = useState<{ description: string; keywords: string[]; count: number } | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // === Debounced search (300ms) ===
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

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
        return await (await fetch(`/api/categories/${categoryId}/brands`)).json()
      }
      return await (await fetch('/api/brands')).json()
    },
    enabled: true,
  })
  const brands = useMemo<{ id: string; name: string; productCount?: number }[]>(() => {
    if (!brandsData) return []
    if (Array.isArray(brandsData)) return brandsData
    return (brandsData.brands ?? []).map((b) => ({ id: b.id, name: b.name }))
  }, [brandsData])

  // Reset brand filter when category changes
  useEffect(() => {
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

  const allProducts = useMemo(() => {
    return data?.pages.flatMap((page) => page.products) ?? []
  }, [data])

  const total = data?.pages[0]?.total ?? 0

  // === Client-side filtering: search query + price range + gallery filter ===
  const filtered = useMemo(() => {
    let result = allProducts

    // Search by name, brand name, category name, description
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase()
      result = result.filter((p) => {
        const name = p.name?.toLowerCase() ?? ''
        const brand = p.brand?.name?.toLowerCase() ?? ''
        const category = p.category?.name?.toLowerCase() ?? ''
        const desc = p.description?.toLowerCase() ?? ''
        return name.includes(q) || brand.includes(q) || category.includes(q) || desc.includes(q)
      })
    }

    // Price range filter
    if (priceRange !== 'all') {
      result = result.filter((p) => {
        const price = p.estimatedCost ?? 0
        if (priceRange === '0-50') return price <= 50
        if (priceRange === '50-100') return price > 50 && price <= 100
        if (priceRange === '100-200') return price > 100 && price <= 200
        if (priceRange === '200+') return price > 200
        return true
      })
    }

    // Gallery filter: products with 5+ photos
    if (onlyFullGallery) {
      result = result.filter((p) => Array.isArray(p.images) && p.images.length >= 5)
    }

    // Sort
    const sorted = [...result]
    if (sort === 'price-asc') sorted.sort((a, b) => (a.estimatedCost ?? 0) - (b.estimatedCost ?? 0))
    else if (sort === 'price-desc') sorted.sort((a, b) => (b.estimatedCost ?? 0) - (a.estimatedCost ?? 0))
    else if (sort === 'rating') sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    else if (sort === 'recent') sorted.sort((a, b) => 0) // already by createdAt desc from API

    return sorted
  }, [allProducts, debouncedQuery, priceRange, onlyFullGallery, sort])

  // === Autocomplete suggestions (top 5 matching product names) ===
  const suggestions = useMemo(() => {
    if (!debouncedQuery.trim()) return []
    const q = debouncedQuery.trim().toLowerCase()
    const matches = allProducts
      .filter((p) => {
        const name = p.name?.toLowerCase() ?? ''
        const brand = p.brand?.name?.toLowerCase() ?? ''
        return name.includes(q) || brand.includes(q)
      })
      .slice(0, 5)
    return matches
  }, [allProducts, debouncedQuery])

  // === Active filter chips ===
  const activeFilters: { key: string; label: string; clear: () => void }[] = []
  if (categoryId) {
    const cat = categories.find((c) => c.id === categoryId)
    activeFilters.push({ key: 'cat', label: cat ? `${cat.icon ?? ''} ${cat.name}` : 'Categoría', clear: () => setCategoryId(null) })
  }
  if (brandFilter !== 'all') {
    const brand = brands.find((b) => b.id === brandFilter)
    activeFilters.push({ key: 'brand', label: brand?.name ?? 'Marca', clear: () => setBrandFilter('all') })
  }
  if (priceRange !== 'all') {
    const range = PRICE_RANGES.find((r) => r.key === priceRange)
    activeFilters.push({ key: 'price', label: range?.label ?? 'Precio', clear: () => setPriceRange('all') })
  }
  if (onlyFullGallery) {
    activeFilters.push({ key: 'gallery', label: 'Galería completa (5+ fotos)', clear: () => setOnlyFullGallery(false) })
  }
  if (debouncedQuery.trim()) {
    activeFilters.push({ key: 'q', label: `"${debouncedQuery.trim()}"`, clear: () => { setQuery(''); setDebouncedQuery('') } })
  }

  const clearAllFilters = () => {
    setCategoryId(null)
    setBrandFilter('all')
    setPriceRange('all')
    setOnlyFullGallery(false)
    setSort('relevance')
    setQuery('')
    setDebouncedQuery('')
  }

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

  const closeSuggestions = useCallback(() => setShowSuggestions(false), [])

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
              <img src="/icons/logo-official.png" alt="NEXORA" className="h-full w-full object-cover" />
            </div>
            <span className="font-bold">NEXORA</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <WishlistCounter />
            <CartCounter />
            <ThemeToggle />
            <Button size="sm" onClick={onRegister} className="hidden sm:inline-flex">Registrarse</Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero del catálogo */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent p-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="gap-1 bg-primary/15 text-primary"><Flame className="h-3 w-3" /> Productos más solicitados</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo de productos importables</h1>
          <p className="mt-2 text-muted-foreground">Productos verificados desde China con precios de fabricante. Tú eliges, nosotros importamos.</p>
        </div>

        {/* Búsqueda con autocomplete */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar por nombre, marca, categoría..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(closeSuggestions, 150)}
              className="pl-9 pr-9"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setDebouncedQuery(''); searchInputRef.current?.focus() }}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-background shadow-lg">
                <p className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Sugerencias</p>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={(e) => { e.preventDefault(); setQuery(s.name); setDebouncedQuery(s.name); setShowSuggestions(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="line-clamp-1">
                      <Highlight text={s.name} query={debouncedQuery} />
                    </span>
                    {s.brand && <Badge variant="outline" className="ml-auto text-[10px]">{s.brand.name}</Badge>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setImageSearching(true)
              setImageSearchInfo(null)
              try {
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(reader.result as string)
                  reader.onerror = reject
                  reader.readAsDataURL(file)
                })
                const res = await fetch('/api/search-by-image', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image: dataUrl }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error ?? 'Error en la búsqueda')
                setImageSearchInfo({
                  description: data.description ?? '',
                  keywords: data.keywords ?? [],
                  count: data.count ?? 0,
                })
                if (Array.isArray(data.keywords) && data.keywords.length > 0) {
                  setQuery(data.keywords[0])
                  setDebouncedQuery(data.keywords[0])
                }
                toast({
                  title: 'Búsqueda por imagen completada',
                  description: data.description ?? `${data.count ?? 0} productos encontrados`,
                })
              } catch (err) {
                toast({
                  title: 'Error en búsqueda por imagen',
                  description: err instanceof Error ? err.message : 'Intenta con otra imagen',
                  variant: 'destructive',
                })
              } finally {
                setImageSearching(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={imageSearching}
            onClick={() => fileInputRef.current?.click()}
          >
            {imageSearching ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analizando...</>
            ) : (
              <><ImageIcon className="h-3.5 w-3.5" /> Buscar por imagen</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 lg:hidden"
            onClick={() => setMobileFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
          </Button>
        </div>

        {/* Result info banner after image search */}
        {imageSearchInfo && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">{imageSearchInfo.description || 'Búsqueda por imagen'}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{imageSearchInfo.count} coincidencias</span>
            {imageSearchInfo.keywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {imageSearchInfo.keywords.slice(0, 6).map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-[10px]">{kw}</Badge>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 gap-1 text-xs text-muted-foreground"
              onClick={() => { setImageSearchInfo(null); setQuery(''); setDebouncedQuery('') }}
            >
              <X className="h-3 w-3" /> Limpiar
            </Button>
          </div>
        )}

        {/* Filtros de categoría */}
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

        {/* Filtro de marca + sort + advanced filters */}
        <div className={cn('mb-4 grid gap-3 rounded-xl border bg-muted/30 p-3', mobileFiltersOpen ? 'block' : 'hidden lg:block')}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4 text-primary" />
              <span>Marca:</span>
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="h-9 w-[220px] border-primary/20 bg-background">
                <SelectValue placeholder={categoryId ? 'Marcas en esta categoría' : 'Todas las marcas'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{categoryId ? 'Todas las marcas (categoría)' : 'Todas las marcas'}</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}{b.productCount ? ` (${b.productCount})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span>Ordenar:</span>
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-9 w-[200px] border-primary/20 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Checkbox
                id="gallery-filter"
                checked={onlyFullGallery}
                onCheckedChange={(v) => setOnlyFullGallery(v === true)}
              />
              <Label htmlFor="gallery-filter" className="cursor-pointer text-sm">
                Solo con galería completa (5+ fotos)
              </Label>
            </div>
          </div>

          {/* Price range radio buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Precio:</span>
            <RadioGroup
              value={priceRange}
              onValueChange={(v) => setPriceRange(v as PriceRangeKey)}
              className="flex flex-wrap items-center gap-2"
            >
              {PRICE_RANGES.map((r) => (
                <div key={r.key} className="flex items-center gap-1.5">
                  <RadioGroupItem value={r.key} id={`price-${r.key}`} />
                  <Label htmlFor={`price-${r.key}`} className="cursor-pointer text-sm">{r.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Filtros activos:</span>
            {activeFilters.map((f) => (
              <Badge key={f.key} variant="secondary" className="gap-1 py-1 pl-2 pr-1">
                {f.label}
                <button
                  onClick={f.clear}
                  aria-label={`Quitar filtro ${f.label}`}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" onClick={clearAllFilters}>
              <X className="h-3 w-3" /> Limpiar todo
            </Button>
          </div>
        )}

        {/* Contador de resultados */}
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">{total.toLocaleString()} productos disponibles</Badge>
          {filtered.length !== total && (
            <span className="text-xs">Mostrando {filtered.length} resultados</span>
          )}
        </div>

        {/* Grid de productos — 2 cols en mobile */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium">
                {debouncedQuery.trim() ? `No se encontraron resultados para "${debouncedQuery.trim()}"` : 'No se encontraron productos'}
              </p>
              {debouncedQuery.trim() && (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <span>Sugerencias:</span>
                  {['Jordan', 'Gucci', 'Dior', 'LV'].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); setDebouncedQuery(s) }}
                      className="rounded-full border bg-background px-2 py-0.5 hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <Button className="mt-4" onClick={onRegister}>Solicitar producto personalizado</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  query={debouncedQuery}
                  onClick={() => (onProductClick ? onProductClick(p.id) : setSelectedProduct(p))}
                />
              ))}
            </div>

            {isFetchingNextPage && (
              <div className="mt-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando más productos...</span>
              </div>
            )}

            {hasNextPage && !isFetchingNextPage && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => fetchNextPage()}>
                  Cargar más productos
                </Button>
              </div>
            )}

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

      {/* Footer */}
      <SiteFooter onNavigate={onNavigate} />

      {/* Bottom mobile navigation */}
      <MobileBottomNav onNavigate={onNavigate} activeView="catalog" />

      {/* Drawers */}
      <CartDrawer />
      <WishlistDrawer />

      {/* Product comparator */}
      <CompareProducts />
    </div>
  )
}

// === Product Card — premium feel like Amazon/Apple ===
function ProductCard({ product, query, onClick }: { product: Product; query: string; onClick: () => void }) {
  const savings = product.estimatedCost && product.suggestedPrice
    ? Math.round(((product.suggestedPrice - product.estimatedCost) / product.suggestedPrice) * 100)
    : null

  const wishlist = useWishlist()
  const cart = useCart()
  const { toast } = useToast()
  const isInWishlist = wishlist.has(product.id)
  const imageCount = Array.isArray(product.images) ? product.images.length : 0

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

  const inStock = (product.soldCount ?? 0) > -1 // treat as available for catalog (importable)
  const stockStatus = inStock ? 'Disponible' : 'Bajo pedido'

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      onClick={onClick}
    >
      {/* Image — 4:3 with hover zoom */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/products/placeholder.svg' }}
          />
        ) : (
          <img
            src="/products/placeholder.svg"
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Wishlist heart — ALWAYS visible */}
        <button
          onClick={handleWishlist}
          aria-label={isInWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          className={cn(
            'absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur transition-colors',
            isInWishlist ? 'bg-rose-500 text-white' : 'bg-background/90 text-foreground hover:bg-background',
          )}
        >
          <Heart className={cn('h-4 w-4', isInWishlist && 'fill-white')} />
        </button>

        {/* Share button — only on hover (desktop) */}
        <button
          onClick={handleShare}
          aria-label="Compartir"
          className="absolute right-2 top-12 hidden h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-lg backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100 sm:flex"
        >
          <Share2 className="h-4 w-4" />
        </button>

        {/* Compare toggle */}
        <div className="absolute right-2 top-24 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:block">
          <CompareToggleButton item={toCompareItem(product)} />
        </div>

        {/* Category badge */}
        {product.category?.icon && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium shadow-sm backdrop-blur">
            <span>{product.category.icon}</span>
            <span className="text-foreground">{product.category.name}</span>
          </div>
        )}

        {/* Discount badge */}
        {savings && savings > 0 && (
          <div className="absolute left-2 bottom-2 flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
            <TrendingUp className="h-3 w-3" /> {savings}% OFF
          </div>
        )}

        {/* Full gallery badge */}
        {imageCount >= 5 && (
          <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur">
            <ImageIcon className="h-3 w-3" /> {imageCount} fotos
          </div>
        )}

        {/* "Ver detalles" hover overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="flex items-center gap-1 rounded-full bg-foreground/90 px-3 py-1.5 text-xs font-medium text-background backdrop-blur">
            Ver detalles <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.brand && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{product.brand.name}</p>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">
          <Highlight text={product.name} query={query} />
        </h3>

        {/* Rating + delivery time */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn('h-2.5 w-2.5', i <= Math.round(product.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted')}
              />
            ))}
            <span className="ml-1 tabular-nums">({product.reviewCount ?? 0})</span>
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" /> 10-15 días
          </span>
        </div>

        {/* Price — larger, bold, USD badge */}
        <div className="mt-2">
          {product.estimatedCost ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">${product.estimatedCost.toFixed(0)}</span>
              <Badge variant="secondary" className="px-1 py-0 text-[9px] font-bold">USD</Badge>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Precio bajo consulta</span>
          )}
        </div>

        {/* Envío incluido + stock badges */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="gap-0.5 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
            <Truck className="h-2.5 w-2.5" /> Envío incluido
          </Badge>
          <Badge variant="outline" className="gap-0.5 border-primary/30 bg-primary/5 px-1.5 py-0 text-[9px] font-medium">
            {inStock ? (
              <><CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" /> {stockStatus}</>
            ) : (
              <><Clock className="h-2.5 w-2.5" /> {stockStatus}</>
            )}
          </Badge>
        </div>

        {/* Trust badges */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><ShieldCheck className="h-2.5 w-2.5 text-emerald-500" /> Verificado</span>
          <span className="flex items-center gap-0.5"><Zap className="h-2.5 w-2.5 text-amber-500" /> 24h</span>
        </div>

        {/* Add to cart button — ALWAYS visible */}
        <Button
          size="sm"
          variant="default"
          className="mt-3 w-full gap-1.5"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-3.5 w-3.5" /> Añadir al carrito
        </Button>
      </div>
    </div>
  )
}

// === Product Detail Dialog — gallery + thumbnails + zoom + sticky mobile CTA ===
function ProductDetailDialog({ product, onClose, onRequest }: { product: Product; onClose: () => void; onRequest: () => void }) {
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [zoom, setZoom] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 50, y: 50 })
  const wishlist = useWishlist()
  const cart = useCart()
  const { toast } = useToast()
  const isInWishlist = wishlist.has(product.id)

  // Gallery: combine primary image with extra images (dedupe)
  const gallery = useMemo(() => {
    const imgs: string[] = []
    if (product.imageUrl) imgs.push(product.imageUrl)
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && !imgs.includes(img)) imgs.push(img)
      }
    }
    return imgs.length > 0 ? imgs : ['/products/placeholder.svg']
  }, [product.imageUrl, product.images])

  // Related products (same brand or category, exclude self) — best-effort, fetch on mount
  const [related, setRelated] = useState<Product[]>([])
  useEffect(() => {
    let cancelled = false
    const fetchRelated = async () => {
      try {
        const params = new URLSearchParams({ limit: '5' })
        if (product.category?.id) params.set('categoryId', product.category.id)
        const res = await fetch(`/api/products?${params}`)
        const data = await res.json()
        if (cancelled) return
        const filtered = (data.products ?? []).filter((p: Product) => p.id !== product.id).slice(0, 4)
        setRelated(filtered)
      } catch {
        // ignore — related is enhancement only
      }
    }
    fetchRelated()
    return () => { cancelled = true }
  }, [product.id, product.category?.id])

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
  }

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoom({ active: true, x, y })
  }

  const prevImage = () => setActiveImage((i) => (i - 1 + gallery.length) % gallery.length)
  const nextImage = () => setActiveImage((i) => (i + 1) % gallery.length)

  // Stock status
  const stockStatus = product.soldCount !== undefined && product.soldCount >= 0
    ? { label: '✅ Disponible', tone: 'emerald' as const }
    : { label: '⏳ Bajo pedido', tone: 'amber' as const }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto p-0 sm:max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* === Image gallery (left column) === */}
          <div className="flex flex-col bg-muted/20">
            <div
              className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/30"
              onMouseMove={handleZoomMove}
              onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
            >
              <img
                src={gallery[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-200"
                style={zoom.active ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: 'scale(2)' } : undefined}
                loading="eager"
                decoding="async"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/products/placeholder.svg' }}
              />
              {/* Zoom hint */}
              <div className="pointer-events-none absolute bottom-2 right-2 hidden items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur md:flex">
                <ZoomIn className="h-3 w-3" /> Pasa el cursor para ampliar
              </div>
              {/* Badges sobre imagen */}
              <div className="absolute left-3 top-3 flex flex-col gap-2">
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
                <div className="absolute right-3 top-3 rounded-full bg-rose-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                  Ahorra {savingsPct}%
                </div>
              )}
              {/* Nav arrows (when multiple images) */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    aria-label="Imagen anterior"
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur transition-colors hover:bg-background"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Imagen siguiente"
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur transition-colors hover:bg-background"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              {/* Image counter */}
              {gallery.length > 1 && (
                <div className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
                  {activeImage + 1} / {gallery.length}
                </div>
              )}
            </div>
            {/* Thumbnail strip */}
            {gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {gallery.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    className={cn(
                      'relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                      i === activeImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                    )}
                  >
                    <img src={src} alt={`Miniatura ${i + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* === Info (right column) === */}
          <div className="flex flex-col p-6">
            <DialogHeader className="p-0 text-left">
              {product.brand && <p className="text-xs font-medium uppercase tracking-wide text-primary">{product.brand.name}</p>}
              <DialogTitle className="text-2xl font-bold leading-tight">{product.name}</DialogTitle>
              <DialogDescription className="sr-only">Detalles del producto {product.name}</DialogDescription>
            </DialogHeader>

            {/* Rating + stock */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={cn('h-3.5 w-3.5', i <= Math.round(product.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted')} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">({product.rating ?? 0} · {product.reviewCount ?? 0} opiniones)</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'gap-1 text-xs',
                  stockStatus.tone === 'emerald'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
                )}
              >
                {stockStatus.label}
              </Badge>
            </div>

            {/* Price destacado */}
            <div className="mt-4 flex items-baseline gap-3">
              {product.estimatedCost ? (
                <>
                  <span className="text-4xl font-bold text-foreground">${product.estimatedCost.toFixed(0)}</span>
                  <Badge variant="secondary" className="text-[10px] font-bold">USD</Badge>
                </>
              ) : (
                <span className="text-lg text-muted-foreground">Precio bajo consulta</span>
              )}
            </div>
            {product.estimatedCost && (
              <Badge variant="outline" className="mt-1 w-fit gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <Truck className="h-3 w-3" /> Envío incluido
              </Badge>
            )}
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

            {/* Especificaciones */}
            {(() => {
              const adminOnlySpecs = ['Costo China', 'Costo Total', 'Margen (50%)', 'Álbum ID', 'Precio Final']
              const clientSpecs = (product.specs || []).filter((s) => !adminOnlySpecs.includes(s.label))
              const catName = product.category?.name ?? ''
              const extraSpecs: { label: string; value: string }[] = [
                { label: 'Garantía', value: '30 días' },
              ]
              if (catName === 'Bolsos') extraSpecs.push({ label: 'Materiales', value: 'Cuero genuino / Lona' })
              else if (catName === 'Calzado') extraSpecs.push({ label: 'Materiales', value: 'Cuero / Tela / Suela de goma' })
              else if (catName === 'Ropa' || catName === 'Ropa de Dama') extraSpecs.push({ label: 'Materiales', value: 'Algodón / Poliéster / Mezcla' })
              else if (catName === 'Relojes') extraSpecs.push({ label: 'Materiales', value: 'Acero inoxidable / Cristal mineral' })
              else if (catName === 'Joyería') extraSpecs.push({ label: 'Materiales', value: 'Acero inoxidable / Oro / Plata' })
              else if (catName === 'Gafas') extraSpecs.push({ label: 'Materiales', value: 'Acetato / Metal / Lentes polarizadas' })
              else if (catName === 'Cinturones') extraSpecs.push({ label: 'Materiales', value: 'Cuero genuino / Hebilla de metal' })
              else extraSpecs.push({ label: 'Materiales', value: 'Material premium' })

              if (catName === 'Calzado') extraSpecs.push({ label: 'Tallas', value: '38-45 EU' })
              else if (catName === 'Ropa' || catName === 'Ropa de Dama') extraSpecs.push({ label: 'Tallas', value: 'S, M, L, XL, XXL' })
              else if (catName === 'Jerseys') extraSpecs.push({ label: 'Tallas', value: 'S, M, L, XL, XXL' })
              else if (catName === 'Relojes') extraSpecs.push({ label: 'Tallas', value: '42mm / 44mm' })
              else extraSpecs.push({ label: 'Tallas', value: 'Talla única' })

              const allSpecs = [...clientSpecs, ...extraSpecs]
              if (allSpecs.length === 0) return null

              return (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Especificaciones</p>
                  <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                      <tbody>
                        {allSpecs.map((spec, i) => (
                          <tr key={i} className={cn(i % 2 === 0 && 'bg-muted/30')}>
                            <td className="px-4 py-2 font-medium text-muted-foreground">{spec.label}</td>
                            <td className="px-4 py-2 font-medium">{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}

            {/* Selector de cantidad (desktop) */}
            <div className="mt-4 hidden items-center gap-4 md:flex">
              <span className="text-sm font-medium">Cantidad:</span>
              <div className="flex items-center rounded-lg border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Disminuir cantidad">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium tabular-nums">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Aumentar cantidad">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {product.estimatedCost && (
                <span className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">${(product.estimatedCost * quantity).toFixed(2)}</span></span>
              )}
            </div>

            {/* CTA (desktop) */}
            <div className="mt-auto hidden gap-2 pt-4 md:flex">
              <Button className="flex-1 gap-2 text-base" size="lg" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" /> Añadir al carrito
              </Button>
              <Button variant="outline" size="lg" onClick={handleWishlist} aria-label="Añadir a favoritos">
                <Heart className={cn('h-5 w-5', isInWishlist && 'fill-rose-500 text-rose-500')} />
              </Button>
              <Button variant="outline" size="lg" onClick={handleShare} aria-label="Compartir">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={onRequest}>
                Solicitar
              </Button>
            </div>
            <div className="mt-2 hidden items-center justify-center gap-4 text-[10px] text-muted-foreground md:flex">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Sin compromiso</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Cotización gratis</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Pago seguro</span>
            </div>
          </div>
        </div>

        {/* === Reviews section === */}
        <div className="px-6 pb-24 md:px-6 md:pb-6">
          <ReviewsSection productId={product.id} />
        </div>

        {/* === Related products === */}
        {related.length > 0 && (
          <div className="border-t px-6 py-6">
            <h3 className="mb-3 text-lg font-bold">Productos relacionados</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {related.map((rp) => (
                <button
                  key={rp.id}
                  onClick={() => {
                    // Swap the dialog product
                    onClose()
                    setTimeout(() => {
                      const evt = new CustomEvent('nexora-open-product', { detail: rp.id })
                      window.dispatchEvent(evt)
                    }, 50)
                  }}
                  className="group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {rp.imageUrl ? (
                      <img
                        src={rp.imageUrl}
                        alt={rp.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/products/placeholder.svg' }}
                      />
                    ) : (
                      <img src="/products/placeholder.svg" alt={rp.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="line-clamp-2 text-xs font-medium">{rp.name}</p>
                    {rp.estimatedCost && (
                      <p className="mt-1 text-sm font-bold">${rp.estimatedCost.toFixed(0)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* === Sticky mobile CTA === */}
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-2 border-t bg-background/95 p-3 backdrop-blur md:hidden">
          <div className="flex items-center rounded-lg border">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center text-muted-foreground" aria-label="Disminuir cantidad">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-medium tabular-nums">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="flex h-9 w-9 items-center justify-center text-muted-foreground" aria-label="Aumentar cantidad">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <Button className="flex-1 gap-2" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4" /> Añadir · ${product.estimatedCost ? (product.estimatedCost * quantity).toFixed(0) : '--'}
          </Button>
          <Button variant="outline" size="icon" onClick={handleWishlist} aria-label="Favorito">
            <Heart className={cn('h-4 w-4', isInWishlist && 'fill-rose-500 text-rose-500')} />
          </Button>
        </div>

        <DialogFooter className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
