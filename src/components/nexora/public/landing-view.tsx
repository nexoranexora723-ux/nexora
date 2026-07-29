'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Globe, Ship, Search, ShieldCheck, Zap, TrendingUp, Users, Package,
  ArrowRight, CheckCircle2, Sparkles, MessageCircle, FileSearch,
  CreditCard, Truck, Home as HomeIcon, ShoppingBag, Info, Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { ImportCalculator } from '@/components/nexora/public/import-calculator'
import { motion } from 'framer-motion'

interface LandingViewProps {
  onNavigate: (view: string) => void
  onLogin: () => void
  onRegister: () => void
}

export function LandingView({ onNavigate, onLogin, onRegister }: LandingViewProps) {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['products-public'],
    queryFn: async () => (await fetch('/api/products')).json(),
  })

  const featured = products?.filter((p) => p.isFeatured).slice(0, 4) ?? []
  const allProducts = products?.slice(0, 8) ?? []

  return (
    <div className="min-h-screen bg-background">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm">
              <span className="text-lg font-black">N</span>
            </div>
            <span className="text-lg font-bold tracking-tight">NEXORA</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => onNavigate('catalog')} className="text-sm font-medium text-muted-foreground hover:text-foreground">Catálogo</button>
            <button onClick={() => onNavigate('how-it-works')} className="text-sm font-medium text-muted-foreground hover:text-foreground">Cómo Funciona</button>
            <button onClick={() => onNavigate('about')} className="text-sm font-medium text-muted-foreground hover:text-foreground">Nosotros</button>
            <button onClick={() => onNavigate('contact')} className="text-sm font-medium text-muted-foreground hover:text-foreground">Contacto</button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onLogin}>Iniciar sesión</Button>
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
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              <Badge className="mb-6 gap-1.5 bg-primary/10 text-primary hover:bg-primary/15">
                <ShieldCheck className="h-3 w-3" /> Importación segura y transparente
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Importa desde China
                <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">nunca había sido tan fácil</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0">
                Tú eliges el producto. Nosotros nos encargamos del resto: buscar proveedores, negociar, comprar, importar y entregar.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button size="lg" className="gap-2 shine-effect text-base shadow-lg shadow-primary/25" onClick={() => onNavigate('catalog')}>
                  <Package className="h-5 w-5" /> Ver catálogo
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-base" onClick={onRegister}>
                  <Sparkles className="h-5 w-5" /> Solicitar producto personalizado
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground lg:justify-start">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Proveedores verificados</span>
                <span className="flex items-center gap-1.5"><Ship className="h-4 w-4 text-primary" /> Logística completa</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> +500 clientes</span>
              </div>
            </div>

            {/* Right: Product mockup */}
            <div className="relative hidden lg:block">
              <motion.div
                initial={{ opacity: 0, y: 30, rotateX: 5 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative"
              >
                {/* Glow behind mockup */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-emerald-500/10 blur-2xl" />

                {/* Browser window */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                  {/* Browser bar */}
                  <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-rose-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="ml-3 flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                      nexora.co/catalog
                    </div>
                  </div>

                  {/* Mockup content */}
                  <div className="space-y-3 p-4">
                    {/* Mock KPI bar */}
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg bg-primary/5 p-2">
                        <div className="h-2 w-16 rounded bg-primary/30" />
                        <div className="mt-1.5 h-4 w-12 rounded bg-primary/50" />
                      </div>
                      <div className="flex-1 rounded-lg bg-amber-500/5 p-2">
                        <div className="h-2 w-12 rounded bg-amber-500/30" />
                        <div className="mt-1.5 h-4 w-8 rounded bg-amber-500/50" />
                      </div>
                      <div className="flex-1 rounded-lg bg-violet-500/5 p-2">
                        <div className="h-2 w-14 rounded bg-violet-500/30" />
                        <div className="mt-1.5 h-4 w-10 rounded bg-violet-500/50" />
                      </div>
                    </div>

                    {/* Mock product cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 300 }}
                          className="overflow-hidden rounded-xl border"
                        >
                          <div className={cn(
                            'flex h-24 items-center justify-center text-3xl',
                            i === 1 && 'bg-gradient-to-br from-rose-500/20 to-rose-600/10',
                            i === 2 && 'bg-gradient-to-br from-sky-500/20 to-blue-600/10',
                            i === 3 && 'bg-gradient-to-br from-amber-500/20 to-orange-600/10',
                            i === 4 && 'bg-gradient-to-br from-violet-500/20 to-purple-600/10',
                          )}>
                            {i === 1 ? '🎧' : i === 2 ? '⌚' : i === 3 ? '👟' : '🕶️'}
                          </div>
                          <div className="space-y-1.5 p-2">
                            <div className="flex items-center justify-between">
                              <div className="h-2 w-20 rounded bg-foreground/20" />
                              <div className="flex items-center gap-0.5">
                                {[1,2,3,4].map((s) => <div key={s} className="h-2 w-2 rounded-sm bg-amber-400" />)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="h-3 w-12 rounded bg-primary/40" />
                              <div className="h-2 w-8 rounded bg-rose-400/60" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Mock progress bar */}
                    <div className="rounded-lg border p-2.5">
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-24 rounded bg-foreground/15" />
                        <div className="h-4 w-16 rounded bg-emerald-500/30" />
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <div className="h-1.5 flex-1 rounded-full bg-emerald-500" />
                        <div className="h-1.5 flex-1 rounded-full bg-emerald-500" />
                        <div className="h-1.5 flex-1 rounded-full bg-emerald-500/50" />
                        <div className="h-1.5 flex-1 rounded-full bg-muted" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
                  className="absolute -left-4 top-1/3 flex items-center gap-2 rounded-xl border bg-card p-3 shadow-xl"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">¡Solicitud aprobada!</p>
                    <p className="text-[10px] text-muted-foreground">Proveedor encontrado</p>
                  </div>
                </motion.div>

                {/* Floating badge 2 */}
                <motion.div
                  initial={{ opacity: 0, x: 20, y: -10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 1, type: 'spring', stiffness: 300 }}
                  className="absolute -right-4 bottom-1/4 flex items-center gap-2 rounded-xl border bg-card p-3 shadow-xl"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">En tránsito</p>
                    <p className="text-[10px] text-muted-foreground">ETA: 5 días</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Trust badges - full width below */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t pt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Proveedores verificados</span>
            <span className="flex items-center gap-1.5"><Ship className="h-4 w-4 text-primary" /> Logística internacional</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Proceso automatizado</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> +500 clientes felices</span>
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
      <footer className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
                  <span className="text-sm font-black">N</span>
                </div>
                <span className="font-bold">NEXORA</span>
              </div>
              <p className="max-w-xs text-sm text-muted-foreground">Plataforma inteligente de importación desde China. Tú eliges el producto, nosotros nos encargamos del resto.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => onNavigate('catalog')} className="hover:text-foreground">Catálogo</button></li>
                <li><button onClick={() => onNavigate('how-it-works')} className="hover:text-foreground">Cómo Funciona</button></li>
                <li><button onClick={() => onNavigate('about')} className="hover:text-foreground">Nosotros</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Contacto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> info@nexora.co</li>
                <li className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> +57 310 555 0100</li>
                <li className="flex items-center gap-2"><HomeIcon className="h-3.5 w-3.5" /> Bogotá, Colombia</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            © 2025 NEXORA Importaciones S.A.S. Todos los derechos reservados.
          </div>
        </div>
      </footer>
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
