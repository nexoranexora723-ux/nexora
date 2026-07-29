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
import { AuthDialog } from '@/components/nexora/shared/auth-dialog'
import { ClientPortal } from '@/components/nexora/client/client-portal'
import { AdminPortal } from '@/components/nexora/admin/admin-portal'
import { Loader2 } from 'lucide-react'

type View = 'landing' | 'catalog' | 'how-it-works' | 'about' | 'contact' | 'register'

export default function NexoraPage() {
  const [view, setView] = useState<View>('landing')
  const [authOpen, setAuthOpen] = useState(false)
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

  const openLogin = () => setAuthOpen(true)

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
    if (user.role === 'CLIENT' || user.role === 'RESELLER') return <ClientPortal />
    return <AdminPortal />
  }

  if (view === 'register') return <RegisterPage onBack={() => setView('landing')} onLogin={openLogin} />

  return (
    <>
      {view === 'landing' && <LandingView onNavigate={setView} onLogin={openLogin} onRegister={() => setView('register')} />}
      {view === 'catalog' && <CatalogView onNavigate={setView} onLogin={openLogin} onRegister={() => setView('register')} />}
      {view === 'how-it-works' && <HowItWorksView onNavigate={setView} onLogin={openLogin} />}
      {view === 'about' && <AboutView onNavigate={setView} onLogin={openLogin} />}
      {view === 'contact' && <ContactView onNavigate={setView} onLogin={openLogin} />}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode="login" onModeChange={() => {}} />
    </>
  )
}
