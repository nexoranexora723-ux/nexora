/**
 * Loading UI global de NEXORA.
 *
 * Next.js muestra este componente automáticamente mientras se carga
 * cualquier segmento de ruta (server components, data fetching, etc.).
 * Es un Server Component por simplicidad (sin 'use client').
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4">
        {/* Logo con pulse */}
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/30" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-lg">
            <span className="text-2xl font-black">N</span>
          </div>
        </div>

        <span className="text-lg font-bold tracking-tight">NEXORA</span>

        {/* Spinner */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg
            className="h-4 w-4 animate-spin text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Cargando…</span>
        </div>
      </div>
    </div>
  )
}
