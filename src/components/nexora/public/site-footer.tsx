'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Mail, MessageCircle, MapPin, Send, Loader2, ShieldCheck } from 'lucide-react'

/**
 * SiteFooter — Pie de página completo y reutilizable para todas las páginas
 * públicas (landing, catálogo, cuenta, pedidos, etc.).
 *
 * - Columna 1: Logo + descripción + íconos sociales (IG, FB, WhatsApp, TikTok, Email)
 * - Columna 2: "Plataforma" — Catálogo, Cómo funciona, Nosotros, Blog
 * - Columna 3: "Legal" — Términos, Privacidad, Devoluciones, FAQ
 * - Columna 4: "Contacto" — email, teléfono, WhatsApp, Instagram
 * - Columna 5: Newsletter signup (email input + button, guarda en localStorage)
 * - Bottom bar: © 2025 NEXORA Importaciones S.A.S. NIT 901.234.567-8
 *
 * Si se pasa `onNavigate`, los links de "Plataforma" usan navegación client-side
 * (útil en landing-view/catalog-view que son SPA). Si no, son <a href="/">.
 */
interface SiteFooterProps {
  onNavigate?: (view: string) => void
}

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/nexora.importaciones',
    handle: '@nexora.importaciones',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/nexora.importaciones',
    handle: 'NEXORA Importaciones',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/573105550100',
    handle: '+57 310 555 0100',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@nexora.importaciones',
    handle: '@nexora.importaciones',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
      </svg>
    ),
  },
  {
    name: 'Email',
    href: 'mailto:info@nexora.co',
    handle: 'info@nexora.co',
    icon: <Mail className="h-4 w-4" />,
  },
] as const

export function SiteFooter({ onNavigate }: SiteFooterProps) {
  const { toast } = useToast()
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    try {
      // Store emails in localStorage for now (no backend email service configured)
      const KEY = 'nexora-newsletter'
      const existing: string[] = JSON.parse(localStorage.getItem(KEY) || '[]')
      if (!existing.includes(email.toLowerCase())) {
        existing.push(email.toLowerCase())
        localStorage.setItem(KEY, JSON.stringify(existing))
      }
      toast({
        title: '¡Suscripción exitosa!',
        description: 'Te mantendremos al tanto de las mejores ofertas y novedades.',
      })
      setEmail('')
    } catch {
      toast({ title: 'No se pudo suscribir', description: 'Intenta de nuevo más tarde.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {/* ===== Column 1: Brand + Socials ===== */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="mb-3 inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm">
                <span className="text-sm font-black">N</span>
              </div>
              <span className="font-bold tracking-tight">NEXORA</span>
            </Link>
            <p className="mb-4 max-w-xs text-sm text-muted-foreground">
              Plataforma inteligente de importación desde China. Tú eliges el producto, nosotros nos encargamos del resto: proveedores, logística, aduana y entrega.
            </p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={`${s.name} — ${s.handle}`}
                  className="flex size-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* ===== Column 2: Plataforma ===== */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                {onNavigate ? (
                  <button onClick={() => onNavigate('catalog')} className="text-left hover:text-foreground">Catálogo</button>
                ) : (
                  <Link href="/?view=catalog" className="hover:text-foreground">Catálogo</Link>
                )}
              </li>
              <li>
                {onNavigate ? (
                  <button onClick={() => onNavigate('how-it-works')} className="text-left hover:text-foreground">Cómo funciona</button>
                ) : (
                  <Link href="/?view=how-it-works" className="hover:text-foreground">Cómo funciona</Link>
                )}
              </li>
              <li>
                {onNavigate ? (
                  <button onClick={() => onNavigate('about')} className="text-left hover:text-foreground">Nosotros</button>
                ) : (
                  <Link href="/?view=about" className="hover:text-foreground">Nosotros</Link>
                )}
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground">Blog</Link>
              </li>
            </ul>
          </div>

          {/* ===== Column 3: Legal ===== */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terminos" className="hover:text-foreground">Términos y condiciones</Link></li>
              <li><Link href="/privacidad" className="hover:text-foreground">Política de privacidad</Link></li>
              <li><Link href="/devoluciones" className="hover:text-foreground">Devoluciones y garantías</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">Preguntas frecuentes</Link></li>
            </ul>
          </div>

          {/* ===== Column 4: Contacto ===== */}
          <div>
            <h4 className="mb-3 text-sm font-semibold">Contacto</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="mailto:info@nexora.co" className="flex items-center gap-2 hover:text-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> info@nexora.co
                </a>
              </li>
              <li>
                <a href="https://wa.me/573105550100" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" /> +57 310 555 0100
                </a>
              </li>
              <li>
                <a href="https://instagram.com/nexora.importaciones" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground">
                  <span className="text-base leading-none">📷</span> @nexora.importaciones
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" /> Bogotá, Colombia
              </li>
            </ul>
          </div>

          {/* ===== Column 5: Newsletter ===== */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="mb-3 text-sm font-semibold">Newsletter</h4>
            <p className="mb-3 text-sm text-muted-foreground">
              Ofertas, novedades y guías de importación directo en tu correo.
            </p>
            <form onSubmit={handleNewsletter} className="space-y-2">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email para newsletter"
                className="h-9"
              />
              <Button type="submit" size="sm" className="w-full gap-1.5" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Suscribiendo…</>
                ) : (
                  <>Suscribirse <Send className="h-3.5 w-3.5" /></>
                )}
              </Button>
            </form>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Sin spam. Cancela cuando quieras.
            </p>
          </div>
        </div>

        {/* ===== Bottom bar ===== */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>© 2025 NEXORA Importaciones S.A.S. — NIT 901.234.567-8. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            {gaId ? 'Sitio seguro con analítica activa' : 'Sitio seguro'}
          </p>
        </div>
      </div>
    </footer>
  )
}
