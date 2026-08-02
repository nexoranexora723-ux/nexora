'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('NEXORA error boundary:', error)
    // Auto-recover on mount by calling reset after a short delay
    const timer = setTimeout(() => {
      window.location.href = '/'
    }, 3000)
    return () => clearTimeout(timer)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-lg text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-lg">
            <span className="text-xl font-black">N</span>
          </div>
          <span className="text-xl font-bold tracking-tight">NEXORA</span>
        </Link>
        <div className="mt-12 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <AlertTriangle className="h-10 w-10" />
          </div>
        </div>
        <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">Algo salió mal</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Redirigiéndote al inicio automáticamente... Si no te redirige, haz clic abajo.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="gap-2" onClick={() => { reset(); window.location.reload() }}>
            <RefreshCw className="h-4 w-4" /> Recargar página
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" /> Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
