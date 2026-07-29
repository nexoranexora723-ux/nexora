'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, ShieldCheck, Users, Globe, Sparkles, Target, Eye, Heart,
  TrendingUp, Award, Leaf, HandshakeIcon,
} from 'lucide-react'

export function AboutView({ onNavigate, onLogin }: { onNavigate: (v: string) => void; onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
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
          <Button size="sm" variant="ghost" onClick={onLogin}>Iniciar sesión</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Badge className="mb-4 gap-1.5 bg-primary/10 text-primary"><Sparkles className="h-3 w-3" /> Sobre NEXORA</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Facilitamos el comercio<br />entre China y Latinoamérica
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            NEXORA nació para eliminar la complejidad de importar productos desde China.
            Conectamos a personas y empresas con fabricantes confiables, gestionando todo el proceso
            para que tú solo te preocupes por elegir el producto.
          </p>
        </div>
      </section>

      {/* Misión, Visión, Valores */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card><CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target className="h-6 w-6" /></div>
              <h3 className="text-lg font-semibold">Misión</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Facilitar el acceso a productos provenientes de China mediante una plataforma inteligente
                que automatiza y simplifica todo el proceso de importación para personas y empresas.
              </p>
            </CardContent></Card>

            <Card><CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Eye className="h-6 w-6" /></div>
              <h3 className="text-lg font-semibold">Visión</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Convertirnos en la plataforma líder de importaciones inteligentes en Latinoamérica,
                integrando tecnología, automatización y herramientas empresariales.
              </p>
            </CardContent></Card>

            <Card><CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Heart className="h-6 w-6" /></div>
              <h3 className="text-lg font-semibold">Valores</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Transparencia, confianza, innovación, honestidad y servicio.
                Creemos que la tecnología debe eliminar barreras, no crearlas.
              </p>
            </CardContent></Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <p className="text-4xl font-bold text-primary">500+</p>
              <p className="mt-1 text-sm text-muted-foreground">Clientes satisfechos</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">3+</p>
              <p className="mt-1 text-sm text-muted-foreground">Proveedores verificados</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">1,200+</p>
              <p className="mt-1 text-sm text-muted-foreground">Importaciones realizadas</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">98%</p>
              <p className="mt-1 text-sm text-muted-foreground">Satisfacción del cliente</p>
            </div>
          </div>
        </div>
      </section>

      {/* Por qué confiar */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight">¿Por qué confiar en NEXORA?</h2>
          <p className="mt-4 text-center text-muted-foreground">No somos una plataforma automatizada sin rostro. Somos un equipo real que trabaja contigo.</p>

          <div className="mt-12 space-y-6">
            {[
              { icon: Users, title: 'Equipo real detrás de cada importación', desc: 'Nuestro equipo de expertos en comercio internacional revisa personalmente cada solicitud. La tecnología nos hace más eficientes, pero las decisiones importantes siempre las toma nuestro equipo.' },
              { icon: ShieldCheck, title: 'Proveedores verificados personalmente', desc: 'Visitamos y evaluamos a cada fabricante chino con el que trabajamos. Calificamos su calidad, comunicación y confiabilidad antes de aceptarlo en nuestra red.' },
              { icon: Globe, title: 'Transparencia total en costos', desc: 'Te mostramos exactamente cuánto cuesta el producto, el envío y la aduana. Sin costos ocultos. Sin sorpresas. Sabes exactamente por qué pagas lo que pagas.' },
              { icon: Award, title: 'Garantía en cada importación', desc: 'Si algo sale mal con tu pedido, nos hacemos responsables. Tu dinero está protegido en cada etapa del proceso.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">¿Listo para empezar?</h2>
          <p className="mt-2 text-muted-foreground">Únete a cientos de emprendedores que ya importan con NEXORA.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button size="lg" onClick={() => onNavigate('register')} className="gap-1.5">Crear cuenta gratuita</Button>
            <Button size="lg" variant="outline" onClick={() => onNavigate('how-it-works')}>Cómo funciona</Button>
          </div>
        </div>
      </section>
    </div>
  )
}
