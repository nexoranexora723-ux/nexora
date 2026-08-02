'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Globe, Ship, Search, ShieldCheck, Zap, TrendingUp, Users, Package,
  ArrowRight, CheckCircle2, Sparkles, FileSearch,
  CreditCard, Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { ImportCalculator } from '@/components/nexora/public/import-calculator'
import { CartCounter, CartDrawer } from '@/components/nexora/public/cart-drawer'
import { WishlistCounter, WishlistDrawer } from '@/components/nexora/public/wishlist-button'
import { SiteFooter } from '@/components/nexora/public/site-footer'
import { ThemeToggle } from '@/components/theme-toggle'
import { motion } from 'framer-motion'

interface LandingViewProps {
  onNavigate: (view: string) => void
  onLogin: () => void
  onRegister: () => void
}

export function LandingView({ onNavigate, onLogin, onRegister }: LandingViewProps) {
  const { data } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['products-public'],
    queryFn: async () => (await fetch('/api/products?featured=true&limit=20')).json(),
  })
  const products = data?.products ?? []

  const featured = products?.filter((p) => p.isFeatured).slice(0, 4) ?? []
  const allProducts = products?.slice(0, 8) ?? []

  return (
    <div className="min-h-screen bg-background">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden shadow-sm">
              <img src="/icons/logo-official.png" alt="NEXORA" className="h-full w-full object-cover" />
            </div>
            <span className="text-lg font-bold tracking-tight">NEXORA</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => onNavigate('catalog')} className="text-sm font-medium text-muted-foreground hover:text-foreground">Catálogo</button>
            <button onClick={() => onNavigate('how-it-works')} className="text-sm font-medium text-muted-foreground hover:text-foreground">Cómo Funciona</button>
            <button onClick={() => onNavigate('about')} className="text-sm font-medium text-muted-foreground hover:text-foreground">Nosotros</button>
            <a href="/blog" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Blog</a>
            <button onClick={() => onNavigate('contact')} className="text-sm font-medium text-muted-foreground hover:text-foreground">Contacto</button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <WishlistCounter />
            <CartCounter />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={onLogin} className="hidden sm:inline-flex">Iniciar sesión</Button>
            <Button size="sm" onClick={onRegister} className="gap-1.5">Registrarse <ArrowRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden gradient-mesh">
        {/* Grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(oklch(0.5 0.01 240) 1px, transparent 1px), linear-gradient(90deg, oklch(0.5 0.01 240) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-28">
          {/* Centered content */}
          <div className="flex flex-col items-center">
            <Badge className="mb-6 gap-1.5 bg-primary/10 text-primary hover:bg-primary/15">
              <ShieldCheck className="h-3 w-3" /> Importación segura y transparente
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Importa desde China
              <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">nunca había sido tan fácil</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Tú eliges el producto. Nosotros nos encargamos del resto: buscar proveedores, negociar, comprar, importar y entregar.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 shine-effect text-base shadow-lg shadow-primary/25" onClick={() => onNavigate('catalog')}>
                <Package className="h-5 w-5" /> Ver catálogo
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base" onClick={onRegister}>
                <Sparkles className="h-5 w-5" /> Solicitar producto personalizado
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Proveedores verificados</span>
              <span className="flex items-center gap-1.5"><Ship className="h-4 w-4 text-primary" /> Logística completa</span>
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Proceso automatizado</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> +500 clientes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Cómo funciona?</h2>
            <p className="mt-4 text-lg text-muted-foreground">En 4 simples pasos, tu producto llega desde China hasta tus manos.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, title: '1. Elige tu producto', desc: 'Busca en nuestro catálogo o solicita cualquier producto que encuentres en Alibaba, AliExpress, TikTok o cualquier otra plataforma.', color: 'from-sky-500 to-blue-600' },
              { icon: FileSearch, title: '2. Nuestro equipo busca proveedor', desc: 'Nuestro equipo de expertos en comercio internacional busca los mejores fabricantes en China, comparando precios, calidad y tiempos. La tecnología nos ayuda a ser más rápidos y precisos.', color: 'from-violet-500 to-purple-600' },
              { icon: CreditCard, title: '3. Aprueba y paga', desc: 'Recibe una cotización transparente. Aprueba, paga y nosotros nos encargamos de comprar y gestionar la importación.', color: 'from-amber-500 to-orange-600' },
              { icon: Truck, title: '4. Recibe tu producto', desc: 'Hacemos seguimiento completo: producción, envío internacional, aduana y entrega final. Tú solo esperas.', color: 'from-emerald-500 to-green-600' },
            ].map((step) => (
              <div key={step.title} className="group relative">
                <div className={cn('mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', step.color)}>
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      {featured.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Productos destacados</h2>
                <p className="mt-2 text-muted-foreground">Los más solicitados por nuestra comunidad</p>
              </div>
              <Button variant="outline" onClick={() => onNavigate('catalog')} className="gap-1.5">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => onNavigate('catalog')} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURES ===== */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Por qué elegir NEXORA?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Eliminamos toda la complejidad de importar desde China.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Proveedores verificados', desc: 'Trabajamos solo con fabricantes chinos previamente evaluados. Calificamos calidad, comunicación, precio, envío y confianza.' },
              { icon: ShieldCheck, title: 'Equipo + tecnología', desc: 'Nuestro equipo de expertos gestiona cada importación personalmente. Usamos tecnología para ser más eficientes, pero las decisiones importantes siempre las toman personas reales.' },
              { icon: TrendingUp, title: 'Mejores precios', desc: 'Acceso a precios de fabricante. Sin intermediarios. Comparamos múltiples proveedores para darte el mejor costo.' },
              { icon: Ship, title: 'Logística completa', desc: 'Gestionamos producción, envío internacional, aduana y entrega final. Tú solo esperas recibir tu producto.' },
              { icon: ShieldCheck, title: 'Compra segura', desc: 'Tu dinero está protegido. Pagas solo cuando apruebas la cotización. Garantía en cada importación.' },
              { icon: Globe, title: 'Desde cualquier plataforma', desc: 'Viste un producto en Alibaba, AliExpress, TikTok, Shein o Temu? Pásanos el link y lo importamos por ti.' },
            ].map((f) => (
              <Card key={f.title} className="group transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Calculator ===== */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Calcula tu importación</h2>
            <p className="mt-4 text-lg text-muted-foreground">Estima el costo real de importar desde China. Sin sorpresas.</p>
          </div>
          <div className="mx-auto max-w-xl">
            <ImportCalculator onRequestQuote={onRegister} />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-700 px-8 py-16 text-center text-primary-foreground shadow-2xl sm:px-16">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Listo para importar?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
                Crea tu cuenta gratuita y solicita tu primera importación hoy. Sin costos ocultos. Sin compromiso.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" variant="secondary" className="gap-2 text-base" onClick={onRegister}>
                  Crear cuenta gratuita <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => onNavigate('how-it-works')}>
                  Saber más
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <SiteFooter onNavigate={onNavigate} />

      {/* ===== DRAWERS (cart + wishlist) ===== */}
      <CartDrawer />
      <WishlistDrawer />
    </div>
  )
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <Card className="group cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg" onClick={onClick}>
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">📦</div>
        )}
        {product.category?.icon && (
          <Badge className="absolute left-2 top-2 bg-background/90 text-foreground shadow-sm backdrop-blur">
            {product.category.icon} {product.category.name}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
        {product.estimatedCost && (
          <p className="mt-2 text-xs text-muted-foreground">Desde <span className="font-semibold text-foreground">${product.estimatedCost}</span></p>
        )}
      </CardContent>
    </Card>
  )
}
