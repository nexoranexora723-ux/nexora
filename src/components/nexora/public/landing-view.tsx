'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Globe, Ship, Search, ShieldCheck, Zap, TrendingUp, Users, Package,
  ArrowRight, CheckCircle2, Sparkles, FileSearch,
  CreditCard, Truck, Menu, X, Star, Quote, Lock, Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { ImportCalculator } from '@/components/nexora/public/import-calculator'
import { CartCounter, CartDrawer } from '@/components/nexora/public/cart-drawer'
import { WishlistCounter, WishlistDrawer } from '@/components/nexora/public/wishlist-button'
import { SiteFooter } from '@/components/nexora/public/site-footer'
import { MobileBottomNav } from '@/components/nexora/public/mobile-bottom-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { motion } from 'framer-motion'

interface LandingViewProps {
  onNavigate: (view: string) => void
  onLogin: () => void
  onRegister: () => void
}

const TESTIMONIALS = [
  {
    name: 'Andrea Restrepo',
    role: 'Boutique owner, Medellín',
    rating: 5,
    text: 'Importé 50 bolsos con NEXORA y el proceso fue impecable. Desde la cotización hasta la entrega en mi tienda, todo transparente y sin sorpresas. Ahorré un 35% vs otros importadores.',
    initials: 'AR',
  },
  {
    name: 'Carlos Méndez',
    role: 'Reseller, Bogotá',
    rating: 5,
    text: 'El equipo de NEXORA encontró un proveedor que llevaba meses buscando. La calidad superó mis expectativas. Ya voy por mi tercera orden.',
    initials: 'CM',
  },
  {
    name: 'Laura Gómez',
    role: 'Emprendedora, Cali',
    rating: 4,
    text: 'Muy buena experiencia. La plataforma es fácil de usar y siempre supe en qué etapa estaba mi pedido. El envío tardó un poco más de lo previsto pero el producto llegó perfecto.',
    initials: 'LG',
  },
]

const TRUST_BADGES = [
  { icon: Lock, title: 'Pago Seguro', desc: 'Tu dinero está protegido hasta que apruebes la cotización' },
  { icon: ShieldCheck, title: 'Proveedores Verificados', desc: 'Calificamos calidad, comunicación, precio y envío de cada fabricante' },
  { icon: Award, title: 'Garantía Incluida', desc: 'Soporte post-venta y garantía en cada importación' },
  { icon: TrendingUp, title: 'Precios de Fabricante', desc: 'Acceso directo a mayoristas chinos sin intermediarios' },
]

const STATS = [
  { value: '64,000+', label: 'Productos disponibles', icon: Package },
  { value: '500+', label: 'Clientes activos', icon: Users },
  { value: '22 días', label: 'Entrega promedio', icon: Truck },
  { value: '4.8/5', label: 'Satisfacción', icon: Star },
]

export function LandingView({ onNavigate, onLogin, onRegister }: LandingViewProps) {
  const { data } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['products-public'],
    queryFn: async () => (await fetch('/api/products?featured=true&limit=20')).json(),
  })
  const products = data?.products ?? []

  const featured = products?.filter((p) => p.isFeatured).slice(0, 4) ?? []
  const showcase = products?.slice(0, 4) ?? []

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* ===== NAVBAR (responsive with hamburger) ===== */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden shadow-sm">
              <img src="/icons/logo-official.png" alt="NEXORA" className="h-full w-full object-cover" />
            </div>
            <span className="text-lg font-bold tracking-tight">NEXORA</span>
          </div>
          {/* Desktop menu */}
          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => onNavigate('catalog')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Catálogo</button>
            <button onClick={() => onNavigate('how-it-works')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Cómo Funciona</button>
            <button onClick={() => onNavigate('about')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Nosotros</button>
            <a href="/blog" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Blog</a>
            <button onClick={() => onNavigate('contact')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Contacto</button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <WishlistCounter />
            <CartCounter />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={onLogin} className="hidden sm:inline-flex">Iniciar sesión</Button>
            <Button size="sm" onClick={onRegister} className="hidden gap-1.5 sm:inline-flex">Registrarse <ArrowRight className="h-3.5 w-3.5" /></Button>
            {/* Hamburger menu button (mobile only) */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="border-t bg-background md:hidden">
            <div className="flex flex-col gap-1 p-4">
              <button onClick={() => { onNavigate('catalog'); setMobileMenuOpen(false) }} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                Catálogo <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => { onNavigate('how-it-works'); setMobileMenuOpen(false) }} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                Cómo Funciona <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={() => { onNavigate('about'); setMobileMenuOpen(false) }} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                Nosotros <ArrowRight className="h-4 w-4" />
              </button>
              <a href="/blog" className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                Blog <ArrowRight className="h-4 w-4" />
              </a>
              <button onClick={() => { onNavigate('contact'); setMobileMenuOpen(false) }} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted">
                Contacto <ArrowRight className="h-4 w-4" />
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { onLogin(); setMobileMenuOpen(false) }}>Iniciar sesión</Button>
                <Button onClick={() => { onRegister(); setMobileMenuOpen(false) }}>Registrarse</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO with gradient background ===== */}
      <section className="relative overflow-hidden">
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-emerald-500/5 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(oklch(0.5 0.01 240) 1px, transparent 1px), linear-gradient(90deg, oklch(0.5 0.01 240) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Floating gradient blobs */}
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <Badge className="mb-6 gap-1.5 bg-primary/10 text-primary hover:bg-primary/15">
              <ShieldCheck className="h-3 w-3" /> Importación segura y transparente
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Importa desde China
              <span className="block bg-gradient-to-r from-primary via-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                nunca había sido tan fácil
              </span>
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

            {/* Trust badges inline */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Proveedores verificados</span>
              <span className="flex items-center gap-1.5"><Ship className="h-4 w-4 text-primary" /> Logística completa</span>
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Proceso automatizado</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> +500 clientes</span>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-primary/10 bg-primary/5">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-3">Proceso simple</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Cómo funciona?</h2>
            <p className="mt-4 text-lg text-muted-foreground">En 4 simples pasos, tu producto llega desde China hasta tus manos.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Search, title: '1. Elige tu producto', desc: 'Busca en nuestro catálogo o solicita cualquier producto que encuentres en Alibaba, AliExpress, TikTok o cualquier otra plataforma.', color: 'from-sky-500 to-blue-600' },
              { icon: FileSearch, title: '2. Nuestro equipo busca proveedor', desc: 'Nuestro equipo de expertos en comercio internacional busca los mejores fabricantes en China, comparando precios, calidad y tiempos. La tecnología nos ayuda a ser más rápidos y precisos.', color: 'from-violet-500 to-purple-600' },
              { icon: CreditCard, title: '3. Aprueba y paga', desc: 'Recibe una cotización transparente. Aprueba, paga y nosotros nos encargamos de comprar y gestionar la importación.', color: 'from-amber-500 to-orange-600' },
              { icon: Truck, title: '4. Recibe tu producto', desc: 'Hacemos seguimiento completo: producción, envío internacional, aduana y entrega final. Tú solo esperas.', color: 'from-emerald-500 to-green-600' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative"
              >
                <div className={cn('mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', step.color)}>
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRODUCT SHOWCASE (4 featured) ===== */}
      {showcase.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-end justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-3">Showcase</Badge>
                <h2 className="text-3xl font-bold tracking-tight">Productos destacados</h2>
                <p className="mt-2 text-muted-foreground">Los más solicitados por nuestra comunidad</p>
              </div>
              <Button variant="outline" onClick={() => onNavigate('catalog')} className="gap-1.5">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {showcase.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <ShowcaseCard product={p} onClick={() => onNavigate('catalog')} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURES (Por qué elegir NEXORA) ===== */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-3">Ventajas</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Por qué elegir NEXORA?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Eliminamos toda la complejidad de importar desde China.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Proveedores verificados', desc: 'Trabajamos solo con fabricantes chinos previamente evaluados. Calificamos calidad, comunicación, precio, envío y confianza.' },
              { icon: Users, title: 'Equipo + tecnología', desc: 'Nuestro equipo de expertos gestiona cada importación personalmente. Usamos tecnología para ser más eficientes, pero las decisiones importantes siempre las toman personas reales.' },
              { icon: TrendingUp, title: 'Mejores precios', desc: 'Acceso a precios de fabricante. Sin intermediarios. Comparamos múltiples proveedores para darte el mejor costo.' },
              { icon: Ship, title: 'Logística completa', desc: 'Gestionamos producción, envío internacional, aduana y entrega final. Tú solo esperas recibir tu producto.' },
              { icon: Lock, title: 'Compra segura', desc: 'Tu dinero está protegido. Pagas solo cuando apruebas la cotización. Garantía en cada importación.' },
              { icon: Globe, title: 'Desde cualquier plataforma', desc: 'Viste un producto en Alibaba, AliExpress, TikTok, Shein o Temu? Pásanos el link y lo importamos por ti.' },
            ].map((f) => (
              <Card key={f.title} className="group transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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

      {/* ===== TRUST BADGES SECTION ===== */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_BADGES.map((b) => (
              <div key={b.title} className="flex flex-col items-center rounded-2xl border bg-card p-6 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold">{b.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <Badge variant="outline" className="mb-3">Testimonios</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Lo que dicen nuestros clientes</h2>
            <p className="mt-4 text-lg text-muted-foreground">Historias reales de empresarios que importan con NEXORA.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col p-6">
                    <Quote className="h-8 w-8 text-primary/30" />
                    <div className="mt-2 flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={cn('h-3.5 w-3.5', s < t.rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted')}
                        />
                      ))}
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground">"{t.text}"</p>
                    <div className="mt-4 flex items-center gap-3 border-t pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-sm font-bold text-primary-foreground">
                        {t.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Calculator ===== */}
      <section className="border-t py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="outline" className="mb-3">Calculadora</Badge>
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-700 to-emerald-800 px-8 py-16 text-center text-primary-foreground shadow-2xl sm:px-16">
            {/* Decorative blobs */}
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl" />
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
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
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs opacity-80">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Sin tarjeta de crédito</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Atención en español</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <SiteFooter onNavigate={onNavigate} />

      {/* ===== Bottom mobile navigation ===== */}
      <MobileBottomNav onNavigate={onNavigate} activeView="landing" />

      {/* ===== DRAWERS (cart + wishlist) ===== */}
      <CartDrawer />
      <WishlistDrawer />
    </div>
  )
}

function ShowcaseCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <Card className="group cursor-pointer overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg" onClick={onClick}>
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
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
        {product.category?.icon && (
          <Badge className="absolute left-2 top-2 bg-background/90 text-foreground shadow-sm backdrop-blur">
            {product.category.icon} {product.category.name}
          </Badge>
        )}
      </div>
      <CardContent className="p-3 sm:p-4">
        {product.brand && <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{product.brand.name}</p>}
        <p className="mt-0.5 line-clamp-2 text-sm font-medium">{product.name}</p>
        {product.estimatedCost && (
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg font-bold">${product.estimatedCost.toFixed(0)}</span>
            <Badge variant="secondary" className="px-1 py-0 text-[9px]">USD</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
