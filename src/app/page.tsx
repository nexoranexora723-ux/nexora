'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-store'
import { LandingView } from '@/components/nexora/public/landing-view'
import { CatalogView } from '@/components/nexora/public/catalog-view'
import { HowItWorksView } from '@/components/nexora/public/how-it-works-view'
import { AboutView } from '@/components/nexora/public/about-view'
import { ContactView } from '@/components/nexora/public/contact-view'
import { RegisterPage } from '@/components/nexora/public/register-page'
import { ProductDetailPage } from '@/components/nexora/public/product-detail-page'
import { AuthDialog } from '@/components/nexora/shared/auth-dialog'
import { ClientPortal } from '@/components/nexora/client/client-portal'
import { AdminPortal } from '@/components/nexora/admin/admin-portal'
import { AiChatbot } from '@/components/nexora/public/ai-chatbot'
import { LiveChat } from '@/components/nexora/public/live-chat'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type View = 'landing' | 'catalog' | 'how-it-works' | 'about' | 'contact' | 'register' | 'product-detail'

const VALID_VIEWS: View[] = ['landing', 'catalog', 'how-it-works', 'about', 'contact']

export default function NexoraPage() {
  const [view, setView] = useState<View>('landing')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuth()

  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => (await fetch('/api/auth/session')).json(),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (session) {
      setUser(session.user)
    } else if (session !== undefined) {
      setLoading(false)
    }
  }, [session, setUser, setLoading])

  // Apply deep-link query params once on mount (only when not authenticated).
  // Used by /cuenta and /pedidos login CTAs and the SiteFooter links:
  //   ?view=catalog | ?view=about | ?login=1 | ?register=1
  useEffect(() => {
    if (isAuthenticated) return
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const v = params.get('view')
    if (v && VALID_VIEWS.includes(v as View)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(v as View)
    }
    if (params.get('login') === '1') {
      setAuthMode('login')
      setAuthOpen(true)
    } else if (params.get('register') === '1') {
      setAuthMode('register')
      setAuthOpen(true)
    }
  }, [isAuthenticated])

  const openLogin = () => { setAuthMode('login'); setAuthOpen(true) }
  const openRegister = () => { setAuthMode('register'); setAuthOpen(true) }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-lg">
            <span className="text-xl font-black">N</span>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Cargando NEXORA...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    // Allow authenticated users to view public catalog if they explicitly navigate to it
    if (view === 'catalog' || view === 'product-detail') {
      // Fall through to public views below
    } else if (user.role === 'CLIENT' || user.role === 'RESELLER') {
      return <ClientPortal />
    } else {
      return <AdminPortal />
    }
  }

  if (view === 'register') return <RegisterPage onBack={() => setView('landing')} onLogin={openLogin} />

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {view === 'landing' && <LandingView onNavigate={(view) => setView(view as View)} onLogin={openLogin} onRegister={openRegister} />}
          {view === 'catalog' && <CatalogView onNavigate={(view) => setView(view as View)} onLogin={openLogin} onRegister={openRegister} onProductClick={(id) => { setSelectedProductId(id); setView('product-detail') }} />}
          {view === 'product-detail' && selectedProductId && (
            <ProductDetailPage productId={selectedProductId} onBack={() => setView('catalog')} onRequest={openRegister} />
          )}
          {view === 'how-it-works' && <HowItWorksView onNavigate={(view) => setView(view as View)} onLogin={openLogin} />}
          {view === 'about' && <AboutView onNavigate={(view) => setView(view as View)} onLogin={openLogin} />}
          {view === 'contact' && <ContactView onNavigate={(view) => setView(view as View)} onLogin={openLogin} />}
        </motion.div>
      </AnimatePresence>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
      {/* Floating AI chatbot + live chat — visible on all public views */}
      <AiChatbot onNavigate={(v) => setView(v as View)} />
      <LiveChat />
    </>
  )
}
