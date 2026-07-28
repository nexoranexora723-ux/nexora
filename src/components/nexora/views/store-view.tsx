'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCart } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import {
  Store, Search, ShoppingCart, Plus, Minus, Check, Package,
  Truck, ShieldCheck, Sparkles, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/nexora/stat-card'

interface StoreProduct {
  id: string
  sku: string
  name: string
  description: string | null
  brand: { id: string; name: string } | null
  category: { id: string; name: string } | null
  salePrice: number
  currencyCode: string
  imageUrl: string | null
  weight: number | null
  material: string | null
  warranty: string | null
  stock: number
  inStock: boolean
}

interface StoreData {
  products: StoreProduct[]
  categories: { id: string; name: string; slug: string }[]
  brands: { id: string; name: string }[]
}

export function StoreView() {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [selected, setSelected] = useState<StoreProduct | null>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState<string | null>(null)
  const { addItem } = useCart()

  const { data, isLoading } = useQuery<StoreData>({
    queryKey: ['store-products', categoryFilter, brandFilter, query],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      if (brandFilter !== 'all') params.set('brand', brandFilter)
      if (query) params.set('q', query)
      const res = await fetch(`/api/store/products?${params.toString()}`)
      return res.json()
    },
  })

  const products = data?.products ?? []

  const handleAdd = (p: StoreProduct, quantity = 1) => {
    addItem(
      {
        id: p.id,
        sku: p.sku,
        name: p.name,
        imageUrl: p.imageUrl,
        price: p.salePrice,
        currencyCode: p.currencyCode,
        stock: p.stock,
      },
      quantity,
    )
    setAdded(p.id)
    setTimeout(() => setAdded(null), 1500)
  }

  const openDetail = (p: StoreProduct) => {
    setSelected(p)
    setQty(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tienda NEXORA"
        description="Catálogo público · Compra directa con envío a todo el país"
        icon={Store}
      />

      {/* Hero banner */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <Badge className="mb-2 gap-1 bg-primary/15 text-primary hover:bg-primary/20">
              <Sparkles className="h-3 w-3" /> Envío gratis +$200
            </Badge>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Productos premium, precios directos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Technology, footwear y luxury goods · Garantía oficial · Pago seguro
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Truck className="h-5 w-5" /></div>
              <span className="text-[10px] font-medium text-muted-foreground">Envío rápido</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div>
              <span className="text-[10px] font-medium text-muted-foreground">Compra segura</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Package className="h-5 w-5" /></div>
              <span className="text-[10px] font-medium text-muted-foreground">Stock real</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('all')}
          >
            Todas
          </Button>
          {data?.categories.map((c) => (
            <Button
              key={c.id}
              variant={categoryFilter === c.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Brand filter chips */}
      {data && data.brands.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Marcas:</span>
          <Button
            variant={brandFilter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setBrandFilter('all')}
          >
            Todas
          </Button>
          {data.brands.map((b) => (
            <Button
              key={b.id}
              variant={brandFilter === b.id ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setBrandFilter(b.id)}
            >
              {b.name}
            </Button>
          ))}
        </div>
      )}

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron productos</p>
            <p className="text-xs text-muted-foreground">Prueba con otra búsqueda o filtro</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Card key={p.id} className="group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
              {/* Image */}
              <button
                onClick={() => openDetail(p)}
                className="relative aspect-square overflow-hidden bg-muted"
                aria-label={`Ver ${p.name}`}
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
                )}
                {/* Badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1">
                  {p.brand && (
                    <Badge className="bg-background/90 text-foreground shadow-sm backdrop-blur">{p.brand.name}</Badge>
                  )}
                </div>
                {!p.inStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                    <Badge variant="secondary" className="text-xs">Agotado</Badge>
                  </div>
                )}
              </button>

              {/* Content */}
              <CardContent className="flex flex-1 flex-col p-3.5">
                <button onClick={() => openDetail(p)} className="text-left">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</p>
                  {p.category && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.category.name}</p>
                  )}
                </button>

                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                  <div>
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(p.salePrice)}</p>
                    {p.inStock ? (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{p.stock} disponibles</p>
                    ) : (
                      <p className="text-[10px] text-rose-500">Sin stock</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className={cn('gap-1 transition-all', added === p.id && 'bg-emerald-600 hover:bg-emerald-600')}
                    disabled={!p.inStock || added === p.id}
                    onClick={() => handleAdd(p)}
                  >
                    {added === p.id ? (
                      <><Check className="h-3.5 w-3.5" /> Añadido</>
                    ) : (
                      <><Plus className="h-3.5 w-3.5" /> Añadir</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="nexora-scroll max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                {selected.imageUrl ? (
                  <img src={selected.imageUrl} alt={selected.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl">📦</div>
                )}
                {selected.brand && (
                  <Badge className="absolute left-3 top-3 bg-background/90 text-foreground shadow-sm backdrop-blur">
                    {selected.brand.name}
                  </Badge>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col">
                <DialogHeader className="p-0 text-left">
                  <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                  {selected.category && (
                    <p className="text-sm text-muted-foreground">{selected.category.name} · {selected.sku}</p>
                  )}
                </DialogHeader>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">{formatCurrency(selected.salePrice)}</span>
                  {selected.inStock ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
                      En stock
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400">
                      Agotado
                    </Badge>
                  )}
                </div>

                {selected.description && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{selected.description}</p>
                )}

                {/* Specs */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {selected.material && (
                    <div className="rounded-lg border p-2"><p className="text-muted-foreground">Material</p><p className="font-medium">{selected.material}</p></div>
                  )}
                  {selected.warranty && (
                    <div className="rounded-lg border p-2"><p className="text-muted-foreground">Garantía</p><p className="font-medium">{selected.warranty}</p></div>
                  )}
                  {selected.weight && (
                    <div className="rounded-lg border p-2"><p className="text-muted-foreground">Peso</p><p className="font-medium">{selected.weight} kg</p></div>
                  )}
                  <div className="rounded-lg border p-2"><p className="text-muted-foreground">SKU</p><p className="font-medium"><code>{selected.sku}</code></p></div>
                </div>

                {/* Quantity + add to cart */}
                <div className="mt-auto pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border">
                      <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Disminuir">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium tabular-nums">{qty}</span>
                      <button onClick={() => setQty(Math.min(selected.stock, qty + 1))} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={qty >= selected.stock} aria-label="Aumentar">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Button
                      className="flex-1 gap-1.5"
                      size="lg"
                      disabled={!selected.inStock}
                      onClick={() => {
                        handleAdd(selected, qty)
                        setSelected(null)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Añadir · {formatCurrency(selected.salePrice * qty)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
