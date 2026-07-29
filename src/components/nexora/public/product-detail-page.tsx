'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '@/components/nexora/shared/animations'
import {
  ArrowLeft, Star, ShieldCheck, Truck, Zap, CheckCircle2, TrendingUp,
  ShoppingCart, Award, Clock, Package, Minus, Plus, Play, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductDetail {
  id: string
  sku: string
  name: string
  description: string | null
  longDescription: string | null
  brand: { id: string; name: string } | null
  category: { id: string; name: string; icon: string | null } | null
  imageUrl: string | null
  images: string[]
  videoUrl: string | null
  estimatedCost: number | null
  suggestedPrice: number | null
  currencyCode: string
  isFeatured: boolean
  specs: { label: string; value: string }[]
  features: string[]
  rating: number
  reviewCount: number
  soldCount: number
}

interface ProductDetailPageProps {
  productId: string
  onBack: () => void
  onRequest: () => void
}

export function ProductDetailPage({ productId, onBack, onRequest }: ProductDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading } = useQuery<ProductDetail>({
    queryKey: ['product-detail', productId],
    queryFn: async () => (await fetch(`/api/products/${productId}`)).json(),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Skeleton className="mb-4 h-9 w-24" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-12 w-1/3" /><Skeleton className="h-32 w-full" /></div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-center"><Package className="mx-auto h-12 w-12 text-muted-foreground/40" /><p className="mt-3 text-sm">Producto no encontrado</p><Button className="mt-4" onClick={onBack}>Volver</Button></div></div>
  }

  const savings = product.estimatedCost && product.suggestedPrice ? product.suggestedPrice - product.estimatedCost : null
  const savingsPct = savings && product.suggestedPrice ? Math.round((savings / product.suggestedPrice) * 100) : null
  const allImages = product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : [])
  const youtubeId = product.videoUrl?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 text-sm sm:px-6">
          <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al catálogo
          </button>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-muted-foreground">{product.category?.name ?? 'Producto'}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          <span className="truncate font-medium text-foreground">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* === COLUMNA IZQUIERDA: Galería === */}
          <div className="space-y-3">
            {/* Imagen principal o video */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/30">
              {showVideo && youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={product.name}
                />
              ) : allImages[selectedImage] ? (
                <img src={allImages[selectedImage]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-7xl">📦</div>
              )}

              {/* Badges sobre imagen */}
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {product.category?.icon && (
                  <Badge className="w-fit bg-background/90 text-foreground shadow-sm backdrop-blur">{product.category.icon} {product.category.name}</Badge>
                )}
                {product.isFeatured && (
                  <Badge className="w-fit gap-1 bg-amber-500 text-white shadow-lg"><Star className="h-3 w-3 fill-white" /> Destacado</Badge>
                )}
              </div>
              {savingsPct && savingsPct > 0 && (
                <div className="absolute right-4 top-4 rounded-full bg-rose-500 px-3 py-1.5 text-sm font-bold text-white shadow-lg">{savingsPct}% OFF</div>
              )}

              {/* Botón de video */}
              {product.videoUrl && !showVideo && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur transition-colors hover:bg-background"
                >
                  <Play className="h-4 w-4 fill-primary text-primary" /> Ver video
                </button>
              )}
              {showVideo && (
                <button
                  onClick={() => setShowVideo(false)}
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur transition-colors hover:bg-background"
                >
                  Ver fotos
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && !showVideo && (
              <div className="flex gap-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all',
                      selectedImage === i ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30',
                    )}
                  >
                    <img src={img} alt={`Vista ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
                {product.videoUrl && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className="relative flex h-16 w-16 items-center justify-center rounded-lg border-2 border-transparent bg-muted transition-all hover:border-muted-foreground/30"
                  >
                    <Play className="h-5 w-5 text-primary" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* === COLUMNA DERECHA: Info (sticky en desktop) === */}
          <div className="flex flex-col lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            {/* Marca + título */}
            {product.brand && <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand.name}</p>}
            <h1 className="mt-0.5 text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={cn('h-4 w-4', i <= Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted')} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} · {product.reviewCount} reseñas · {product.soldCount} vendidos
              </span>
            </div>

            {/* Precio */}
            <div className="mt-5 flex items-baseline gap-3">
              {product.estimatedCost ? (
                <>
                  <span className="text-4xl font-bold">${product.estimatedCost}</span>
                  {product.suggestedPrice && <span className="text-xl text-muted-foreground line-through">${product.suggestedPrice}</span>}
                </>
              ) : <span className="text-xl text-muted-foreground">Precio bajo consulta</span>}
            </div>
            {savings && savings > 0 && (
              <p className="mt-1 text-sm font-medium text-emerald-600">✅ Ahorras ${savings.toFixed(2)} vs precio de mercado ({savingsPct}%)</p>
            )}

            {/* Descripción corta */}
            {product.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>}

            {/* Features destacados */}
            {product.features.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {product.features.slice(0, 6).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" /> {f}
                  </div>
                ))}
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-xs"><ShieldCheck className="h-4 w-4 text-emerald-500" /><div><p className="font-medium">Proveedor verificado</p><p className="text-muted-foreground">Calidad garantizada</p></div></div>
              <div className="flex items-center gap-2 text-xs"><Truck className="h-4 w-4 text-primary" /><div><p className="font-medium">Importación incluida</p><p className="text-muted-foreground">Desde China a tu puerta</p></div></div>
              <div className="flex items-center gap-2 text-xs"><Zap className="h-4 w-4 text-amber-500" /><div><p className="font-medium">Cotización en 24h</p><p className="text-muted-foreground">Respuesta rápida</p></div></div>
              <div className="flex items-center gap-2 text-xs"><Award className="h-4 w-4 text-violet-500" /><div><p className="font-medium">Garantía incluida</p><p className="text-muted-foreground">Soporte post-venta</p></div></div>
            </div>

            {/* Timeline de entrega */}
            <div className="mt-4 rounded-xl border p-3">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Tiempo estimado de entrega</p>
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

            {/* Selector de cantidad */}
            <div className="mt-5 flex items-center gap-4">
              <span className="text-sm font-medium">Cantidad:</span>
              <div className="flex items-center rounded-lg border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="h-4 w-4" /></button>
                <span className="w-12 text-center text-sm font-medium tabular-nums">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
              </div>
              {product.estimatedCost && (
                <span className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">${(product.estimatedCost * quantity).toFixed(2)}</span></span>
              )}
            </div>

            {/* CTA */}
            <div className="mt-5">
              <Button className="w-full gap-2 text-base" size="lg" onClick={onRequest}>
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

        {/* === SECCIÓN INFERIOR: Descripción larga + specs === */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Descripción larga */}
          {product.longDescription && (
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold">Descripción del producto</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {product.longDescription.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Features completas */}
              {product.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold">Características destacadas</h3>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {product.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Especificaciones técnicas */}
          {product.specs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold">Especificaciones</h3>
                <Card className="mt-3"><CardContent className="p-0">
                  <table className="w-full text-sm">
                    <tbody>
                      {product.specs.map((spec, i) => (
                        <tr key={i} className={cn(i % 2 === 0 ? 'bg-muted/30' : '')}>
                          <td className="px-4 py-2.5 font-medium text-muted-foreground">{spec.label}</td>
                          <td className="px-4 py-2.5 font-medium">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent></Card>
              </div>
            )}
        </div>
      </div>

      {/* === PRODUCTOS RELACIONADOS === */}
      <RelatedProducts currentProductId={product.id} category={product.category?.id ?? null} onRequest={onRequest} />
    </div>
  )
}

// === Related Products ===
interface RelatedProduct {
  id: string
  name: string
  imageUrl: string | null
  estimatedCost: number | null
  suggestedPrice: number | null
  isFeatured: boolean
  category: { id: string; name: string; icon: string | null } | null
  brand: { id: string; name: string } | null
}

function RelatedProducts({ currentProductId, category, onRequest }: { currentProductId: string; category: string | null; onRequest: () => void }) {
  const { data: products } = useQuery<RelatedProduct[]>({
    queryKey: ['related-products', category],
    queryFn: async () => (await fetch('/api/products')).json(),
    staleTime: 60000,
  })

  const related = useMemo(() => {
    if (!products) return []
    return products
      .filter((p) => p.id !== currentProductId && (!category || p.category?.id === category))
      .slice(0, 4)
  }, [products, currentProductId, category])

  if (related.length === 0) return null

  return (
    <div className="mt-16 border-t pt-12">
      <h2 className="text-xl font-bold tracking-tight">Productos relacionados</h2>
      <p className="mt-1 text-sm text-muted-foreground">También te puede interesar</p>
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {related.map((p) => {
          const savings = p.estimatedCost && p.suggestedPrice ? Math.round(((p.suggestedPrice - p.estimatedCost) / p.suggestedPrice) * 100) : null
          return (
            <motion.div key={p.id} variants={staggerItem}>
              <div className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg" onClick={onRequest}>
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
                  )}
                  {savings && savings > 0 && (
                    <div className="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">{savings}% OFF</div>
                  )}
                </div>
                <div className="p-3">
                  {p.brand && <p className="text-[10px] text-muted-foreground">{p.brand.name}</p>}
                  <p className="line-clamp-2 text-xs font-medium">{p.name}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    {p.estimatedCost ? (
                      <>
                        <span className="text-base font-bold">${p.estimatedCost}</span>
                        {p.suggestedPrice && <span className="text-[10px] text-muted-foreground line-through">${p.suggestedPrice}</span>}
                      </>
                    ) : <span className="text-[10px] text-muted-foreground">Consulta</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
