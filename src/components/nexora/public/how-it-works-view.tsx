'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Search, FileSearch, CreditCard, Truck, ShieldCheck, Sparkles, Globe, Clock, Package } from 'lucide-react'

export function HowItWorksView({ onNavigate, onLogin }: { onNavigate: (v: string) => void; onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-background">
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

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Cómo funciona NEXORA</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">Importar desde China nunca fue tan simple. Te explicamos el proceso paso a paso.</p>
        </div>

        {/* Steps */}
        <div className="mt-16 space-y-8">
          {[
            { num: 1, icon: Search, title: 'Encuentra tu producto', desc: 'Busca en nuestro catálogo o envíanos un enlace de Alibaba, AliExpress, TikTok, Shein, Temu o cualquier plataforma. También puedes subir una foto.', color: 'from-sky-500 to-blue-600' },
            { num: 2, icon: FileSearch, title: 'NAIOS busca proveedores', desc: 'Nuestra inteligencia artificial analiza tu solicitud y busca los mejores fabricantes en China. Compara precios, calidad, tiempos de producción y reputación.', color: 'from-violet-500 to-purple-600' },
            { num: 3, icon: CreditCard, title: 'Recibe cotización y aprueba', desc: 'Te enviamos una cotización transparente con todos los costos: producto, envío internacional, aduana. Si te gusta, apruebas y pagas. Sin sorpresas.', color: 'from-amber-500 to-orange-600' },
            { num: 4, icon: Truck, title: 'Nosotros importamos', desc: 'Compramos al proveedor, gestionamos producción, coordinamos envío internacional, aduana y entrega final. Tú solo esperas.', color: 'from-emerald-500 to-green-600' },
          ].map((step) => (
            <div key={step.num} className="flex gap-6">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg`}>
                <step.icon className="h-8 w-8" />
              </div>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{step.num}</span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="mt-2 text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Seguro', desc: 'Proveedores verificados. Tu dinero protegido hasta que recibes tu producto.' },
            { icon: Clock, title: 'Rápido', desc: 'Optimizamos cada paso del proceso. Recibe tu producto en 15-30 días.' },
            { icon: Globe, title: 'Sin fronteras', desc: 'Acceso a cualquier fabricante de China. Sin barreras de idioma o logística.' },
          ].map((b) => (
            <Card key={b.title}><CardContent className="p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><b.icon className="h-6 w-6" /></div>
              <h3 className="font-semibold">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
            </CardContent></Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-gradient-to-br from-primary to-emerald-700 p-8 text-center text-primary-foreground sm:p-12">
          <Sparkles className="mx-auto mb-4 h-10 w-10" />
          <h2 className="text-2xl font-bold sm:text-3xl">¿Listo para empezar?</h2>
          <p className="mx-auto mt-3 max-w-md opacity-90">Crea tu cuenta y solicita tu primera importación hoy.</p>
          <Button size="lg" variant="secondary" className="mt-6 gap-2" onClick={onLogin}>
            <Package className="h-5 w-5" /> Crear cuenta gratuita
          </Button>
        </div>
      </div>
    </div>
  )
}
