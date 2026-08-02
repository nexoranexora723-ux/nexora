import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Package, ArrowLeft, Compass } from 'lucide-react'

/**
 * Custom 404 — NEXORA
 * Profesional, con logo, mensaje en español y CTAs.
 * Es un Server Component (sin 'use client').
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-lg text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-lg">
            <span className="text-xl font-black">N</span>
          </div>
          <span className="text-xl font-bold tracking-tight">NEXORA</span>
        </Link>

        {/* Big 404 */}
        <div className="relative mt-12">
          <h1 className="select-none bg-gradient-to-br from-primary to-blue-700 bg-clip-text text-[120px] font-black leading-none tracking-tight text-transparent sm:text-[160px]">
            404
          </h1>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Compass className="h-24 w-24 animate-pulse text-primary/20 sm:h-32 sm:w-32" />
          </div>
        </div>

        {/* Mensaje */}
        <h2 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl">Página no encontrada</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          La página que buscas no existe o fue movida. Quizás escribiste mal la dirección o el enlace ya no está
          disponible.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" /> Volver al inicio
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/">
              <Package className="h-4 w-4" /> Ver catálogo
            </Link>
          </Button>
        </div>

        {/* Enlaces rápidos */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          <span className="text-muted-foreground/40">•</span>
          <Link href="/faq" className="hover:text-foreground">
            Preguntas frecuentes
          </Link>
          <span className="text-muted-foreground/40">•</span>
          <Link href="/terminos" className="hover:text-foreground">
            Términos
          </Link>
          <span className="text-muted-foreground/40">•</span>
          <Link href="/privacidad" className="hover:text-foreground">
            Privacidad
          </Link>
        </div>

        {/* Back link (browser history) */}
        <a
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a la página anterior
        </a>
      </div>
    </div>
  )
}
