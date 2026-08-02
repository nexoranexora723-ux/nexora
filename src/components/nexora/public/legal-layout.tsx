import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, MessageCircle, Home as HomeIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

/**
 * Layout compartido para páginas legales/estáticas (Términos, Privacidad,
 * Devoluciones, FAQ). Incluye navbar sticky y footer con min-h-screen + flex
 * para que el footer quede pegado al fondo siempre.
 *
 * Es un Server Component por defecto (no usa 'use client').
 */
export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  title: string
  subtitle?: string
  lastUpdated?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm">
              <span className="text-sm font-black">N</span>
            </div>
            <span className="font-bold tracking-tight">NEXORA</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/">Ver catálogo</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ===== CONTENT ===== */}
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <header className="mb-10 border-b pb-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-3 text-base text-muted-foreground sm:text-lg">{subtitle}</p>}
            {lastUpdated && (
              <p className="mt-3 text-xs text-muted-foreground">Última actualización: {lastUpdated}</p>
            )}
          </header>
          <div className="legal-content space-y-8 text-[15px] leading-relaxed text-foreground/90">{children}</div>
        </article>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t bg-muted/30 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
                  <span className="text-sm font-black">N</span>
                </div>
                <span className="font-bold">NEXORA</span>
              </div>
              <p className="max-w-xs text-sm text-muted-foreground">
                Plataforma inteligente de importación desde China. Tú eliges el producto, nosotros nos encargamos del resto.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/terminos" className="hover:text-foreground">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="hover:text-foreground">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/devoluciones" className="hover:text-foreground">
                    Devoluciones y garantías
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-foreground">
                    Preguntas frecuentes
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Contacto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> info@nexora.co
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5" /> +57 310 555 0100
                </li>
                <li className="flex items-center gap-2">
                  <HomeIcon className="h-3.5 w-3.5" /> Bogotá, Colombia
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            © 2025 NEXORA Importaciones S.A.S. — NIT 901.234.567-8. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ---------- Reusable subcomponents for legal content ---------- */

export function LegalSection({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-3 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-foreground/90">{children}</div>
    </section>
  )
}

export function LegalSubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

export function LegalList({ items, ordered = false }: { items: React.ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className={ordered ? 'list-decimal space-y-1.5 pl-6' : 'list-disc space-y-1.5 pl-6'}>
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </Tag>
  )
}
