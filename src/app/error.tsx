'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react'

/**
 * Error boundary global de NEXORA.
 *
 * Next.js envuelve cada segmento de ruta en un error boundary. Cuando un
 * componente (client o server) lanza una excepción no controlada, React
 * suspende el árbol y renderiza este componente en su lugar.
 *
 * Es obligatorio que sea un Client Component ('use client') porque usa
 * `useEffect` y `reset` de react-error-boundary.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // En producción esto lo captura el logger del servidor; en desarrollo
    // también lo vemos en consola para depurar más rápido.
    console.error('NEXORA error boundary:', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

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

        {/* Icon */}
        <div className="mt-12 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <AlertTriangle className="h-10 w-10" />
          </div>
        </div>

        {/* Mensaje */}
        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">Algo salió mal</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Ocurrió un error inesperado. Puedes intentar recargar la página o volver al inicio. Si el problema persiste,
          contáctanos a <span className="font-medium text-foreground">info@nexora.co</span>.
        </p>

        {/* Detalles del error (solo en desarrollo) */}
        {isDev && (
          <details className="mt-6 rounded-lg border bg-muted/40 p-4 text-left">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              Ver detalles del error (solo desarrollo)
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-foreground/80">
              {error.message}
              {error.digest ? `\n\ndigest: ${error.digest}` : ''}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="gap-2" onClick={() => reset()}>
            <RefreshCw className="h-4 w-4" /> Recargar página
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" /> Volver al inicio
            </Link>
          </Button>
        </div>

        {/* Volver */}
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
