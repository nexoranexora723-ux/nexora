import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Gift, Users, DollarSign, Share2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Programa de Referidos — NEXORA',
  description: 'Invita amigos y gana descuentos en tus importaciones.',
}

export default function ReferidosPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
              <span className="text-sm font-black">N</span>
            </div>
            <span className="font-bold">NEXORA</span>
          </div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <Gift className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-6 text-4xl font-bold">Programa de Referidos</h1>
          <p className="mt-3 text-lg text-muted-foreground">Invita amigos y ambos reciben $5 USD de descuento</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border p-6 text-center">
            <Share2 className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 font-semibold">1. Comparte tu link</h3>
            <p className="mt-1 text-sm text-muted-foreground">Envía tu enlace de referido a amigos por WhatsApp o redes</p>
          </div>
          <div className="rounded-2xl border p-6 text-center">
            <Users className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 font-semibold">2. Tu amigo compra</h3>
            <p className="mt-1 text-sm text-muted-foreground">Cuando haga su primera compra, el descuento se activa</p>
          </div>
          <div className="rounded-2xl border p-6 text-center">
            <DollarSign className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="mt-4 font-semibold">3. Ambos ganan</h3>
            <p className="mt-1 text-sm text-muted-foreground">$5 USD de descuento para ti y para tu amigo</p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-600/5 p-8 text-center">
          <h2 className="text-2xl font-bold">¿Listo para empezar?</h2>
          <p className="mt-2 text-muted-foreground">Inicia sesión para obtener tu código de referido único</p>
          <Button size="lg" className="mt-6">
            <Link href="/?login=1">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
