'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Search, Package, ArrowRight, Star, Zap, ShieldCheck, Truck, CheckCircle2, TrendingUp, Clock, ShoppingCart, Flame, Award } from 'lucide-react'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CatalogViewProps {
  onNavigate: (view: string) => void
  onLogin: () => void
  onRegister: () => void
  onProductClick?: (id: string) => void
}

export function CatalogView({ onNavigate, onRegister, onProductClick }: CatalogViewProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products-public'],
    queryFn: async () => (await fetch('/api/products')).json(),
  })

  const categories = products ? [...new Set(products.map((p) => p.category?.name).filter(Boolean))] : []
  const filtered = (products ?? []).filter((p) => {
    const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.description?.toLowerCase().includes(query.toLowerCase())
    const matchesCat = category === 'all' || p.category?.name === category
    return matchesQuery && matchesCat
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground">
              <span className="text-sm font-black">N</span>
            </div>
            <span className="font-bold">NEXORA</span>
          </div>
          <Button size="sm" onClick={onRegister}>Registrarse</Button>
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

        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => onProductClick ? onProductClick(p.id) : setSelectedProduct(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Product detail dialog */}
      {selectedProduct && (
        <ProductDetailDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onRequest={onRegister} />
      )}
    </div>
  )
}

// === Product Card — rediseñada premium ===
function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const savings = product.estimatedCost && product.suggestedPrice
    ? Math.round(((product.suggestedPrice - product.estimatedCost) / product.suggestedPrice) * 100)
    : null

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
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">📦</div>
        )}

        {/* Gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Badge de categoría */}
        {product.category?.icon && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur">
            <span>{product.category.icon}</span>
            <span className="text-foreground">{product.category.name}</span>
          </div>
        )}

        {/* Badge de descuento */}
        {savings && savings > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            <TrendingUp className="h-3 w-3" /> {savings}% OFF
          </div>
        )}

        {/* Badge de destacado */}
        {product.isFeatured && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            <Star className="h-3 w-3 fill-white" /> Destacado
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        {/* Marca */}
        {product.brand && (
          <p className="text-xs font-medium text-muted-foreground">{product.brand.name}</p>
        )}

        {/* Nombre */}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>

        {/* Descripción corta */}
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        )}

        {/* Precio */}
        <div className="mt-3 flex items-baseline gap-2">
          {product.estimatedCost ? (
            <>
              <span className="text-2xl font-bold text-foreground">${product.estimatedCost}</span>
              {product.suggestedPrice && (
                <span className="text-sm text-muted-foreground line-through">${product.suggestedPrice}</span>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Precio bajo consulta</span>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Verificado</span>
          <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-primary" /> Importación incluida</span>
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

// === Product Detail Dialog — rediseñado premium ===
function ProductDetailDialog({ product, onClose, onRequest }: { product: Product; onClose: () => void; onRequest: () => void }) {
  const savings = product.estimatedCost && product.suggestedPrice
    ? product.suggestedPrice - product.estimatedCost
    : null
  const savingsPct = savings && product.suggestedPrice
    ? Math.round((savings / product.suggestedPrice) * 100)
    : null

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-3xl p-0">
        {/* Layout 2 columnas */}
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
          </div>

          {/* Columna derecha: info */}
          <div className="flex flex-col p-6">
            <DialogHeader className="p-0 text-left">
              {product.brand && <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>}
              <DialogTitle className="text-2xl font-bold leading-tight">{product.name}</DialogTitle>
            </DialogHeader>

            {/* Rating simulado */}
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
                  {product.suggestedPrice && (
                    <span className="text-lg text-muted-foreground line-through">${product.suggestedPrice}</span>
                  )}
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

            {/* Especificaciones rápidas */}
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

            {/* CTA */}
            <div className="mt-auto pt-4">
              <Button className="w-full gap-2 text-base" size="lg" onClick={onRequest}>
                <ShoppingCart className="h-5 w-5" />
                Lo quiero — Solicitar importación
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
