'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Live Chat widget (Tawk.to-compatible).
 *
 * PERFORMANCE: The third-party chat script is deferred until *after* the page
 * has finished loading (using `requestIdleCallback` / window `load` event) so
 * it doesn't block first paint or interactiveness. If a real Tawk.to property
 * ID is configured via NEXT_PUBLIC_TAWK_PROPERTY_ID + NEXT_PUBLIC_TAWK_WIDGET_ID,
 * the official Tawk.to embed is loaded; otherwise a simple WhatsApp fallback
 * button is shown.
 *
 * All iframes injected by Tawk.to are automatically tagged with
 * `loading="lazy"` (handled by a MutationObserver below) so they don't
 * compete with the main bundle for bandwidth.
 */

const TAWK_PROPERTY = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
const TAWK_WIDGET = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID

export function LiveChat() {
  const [open, setOpen] = useState(false)
  const [tawkLoaded, setTawkLoaded] = useState(false)
  const observerRef = useRef<MutationObserver | null>(null)

  // Defer Tawk.to script until the page is fully loaded.
  useEffect(() => {
    if (!TAWK_PROPERTY || !TAWK_WIDGET) return

    const loadTawk = () => {
      // Tawk.to embed snippet (deferred)
      // @ts-expect-error — Tawk_API is a global injected by the snippet
      window.Tawk_API = window.Tawk_API || {}
      // @ts-expect-error — Tawk_LoadStart is a global injected by the snippet
      window.Tawk_LoadStart = new Date()
      const s1 = document.createElement('script')
      s1.async = true
      s1.src = `https://embed.tawk.to/${TAWK_PROPERTY}/${TAWK_WIDGET}`
      s1.charset = 'UTF-8'
      s1.setAttribute('crossorigin', '*')
      s1.onload = () => setTawkLoaded(true)
      document.head.appendChild(s1)
    }

    // Wait for either `load` event or idle callback before injecting.
    if (document.readyState === 'complete') {
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback
      if (idle) idle(loadTawk)
      else setTimeout(loadTawk, 1500)
    } else {
      window.addEventListener('load', () => setTimeout(loadTawk, 500), { once: true })
    }
  }, [])

  // MutationObserver: tag any Tawk.to-injected iframes with loading="lazy".
  useEffect(() => {
    if (typeof window === 'undefined') return
    const tagLazy = (node: Node) => {
      if (node.nodeName === 'IFRAME') {
        const iframe = node as HTMLIFrameElement
        if (!iframe.hasAttribute('loading')) {
          iframe.setAttribute('loading', 'lazy')
        }
      }
    }
    observerRef.current = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach(tagLazy)
      }
    })
    observerRef.current.observe(document.body, { childList: true, subtree: true })
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  // If no Tawk.to credentials, render nothing — a dedicated WhatsApp floating
  // button (see `WhatsAppFloating`) is mounted globally in the root layout.
  if (!TAWK_PROPERTY || !TAWK_WIDGET) {
    return null
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-50 h-[460px] w-[min(360px,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border bg-card shadow-2xl sm:right-6"
            role="dialog"
            aria-label="Chat de soporte"
          >
            <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
              <div>
                <p className="text-sm font-semibold">Soporte NEXORA</p>
                <p className="text-xs opacity-80">
                  {tawkLoaded ? 'En línea • Responde en ~5 min' : 'Cargando…'}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="rounded p-1 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex h-[calc(100%-64px)] flex-col items-center justify-center gap-3 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {tawkLoaded
                  ? 'El chat está listo abajo. Si no lo ves, recarga la página.'
                  : 'Cargando widget de chat…'}
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-1.5"
              >
                <a
                  href={`https://wa.me/573105550100`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="h-3.5 w-3.5" /> Escribir por WhatsApp
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
