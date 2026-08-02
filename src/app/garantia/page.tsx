import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Clock, RefreshCw, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Garantía — NEXORA',
  description: 'Política de garantía y devoluciones de NEXORA Importaciones.',
}

export default function GarantiaPage() {
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
        <ShieldCheck className="h-16 w-16 text-emerald-600" />
        <h1 className="mt-6 text-4xl font-bold">Garantía NEXORA</h1>
        <p className="mt-3 text-lg text-muted-foreground">Tu compra está protegida en cada paso del proceso.</p>

        <div className="mt-12 space-y-6">
          <div className="rounded-2xl border p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
              <h2 className="text-xl font-semibold">Garantía de 30 días</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Todos nuestros productos tienen garantía de 30 días desde la fecha de entrega. 
              Cubre defectos de fabricación, no cubre mal uso o desgaste normal.
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <h2 className="text-xl font-semibold">Garantía de entrega</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Si tu producto no llega en 60 días, te reembolsamos el 100% del valor pagado. 
              El tiempo estimado normal es de 22 días (cotización + producción + envío + entrega).
            </p>
          </div>

          <div className="rounded-2xl border p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-amber-500" />
              <h2 className="text-xl font-semibold">Devoluciones</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Tienes 48 horas desde la recepción para reportar defectos. 
              Si el producto viene defectuoso, te ofrecemos reembolso o cambio sin costo adicional.
            </p>
            <Link href="/devoluciones" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Ver política completa de devoluciones →
            </Link>
          </div>

          <div className="rounded-2xl border p-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-violet-500" />
              <h2 className="text-xl font-semibold">Soporte</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Para reclamos de garantía, escríbenos a info@nexora.co con tu número de pedido 
              y fotos del defecto. Respondemos en 24 horas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
