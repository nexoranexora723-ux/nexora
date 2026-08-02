import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Rastrear pedido — NEXORA',
  description: 'Rastrea el estado de tu pedido de importación.',
}

export default function TrackOrderPage() {
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

      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-6 text-3xl font-bold">Rastrear mi pedido</h1>
        <p className="mt-2 text-muted-foreground">Ingresa tu número de pedido para ver el estado de tu importación.</p>
        
        <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center" action="/track-order" method="GET">
          <input
            type="text"
            name="number"
            placeholder="NX-XXXXXXXXX"
            className="h-12 rounded-lg border bg-background px-4 text-center"
          />
          <Button type="submit" size="lg">Buscar pedido</Button>
        </form>

        <div className="mt-12 rounded-xl border p-6 text-left">
          <h2 className="text-lg font-semibold">Estados del pedido</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">1</div>
              <div>
                <p className="font-medium">Pendiente</p>
                <p className="text-sm text-muted-foreground">Pedido recibido, esperando confirmación de pago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">2</div>
              <div>
                <p className="font-medium">Confirmado</p>
                <p className="text-sm text-muted-foreground">Pago verificado, producto en producción</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">3</div>
              <div>
                <p className="font-medium">Enviado</p>
                <p className="text-sm text-muted-foreground">Producto en tránsito desde China</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">4</div>
              <div>
                <p className="font-medium">Entregado</p>
                <p className="text-sm text-muted-foreground">Producto entregado al cliente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
