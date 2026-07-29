'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-store'
import { LandingView } from '@/components/nexora/public/landing-view'
import { CatalogView } from '@/components/nexora/public/catalog-view'
import { HowItWorksView } from '@/components/nexora/public/how-it-works-view'
import { AuthDialog } from '@/components/nexora/shared/auth-dialog'
import { ClientPortal } from '@/components/nexora/client/client-portal'
import { AdminPortal } from '@/components/nexora/admin/admin-portal'
import { Loader2 } from 'lucide-react'

type View = 'landing' | 'catalog' | 'how-it-works' | 'about' | 'contact'

export default function NexoraPage() {
  const [view, setView] = useState<View>('landing')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuth()

  // Validate session on mount
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

  const openLogin = () => { setAuthMode('login'); setAuthOpen(true) }
  const openRegister = () => { setAuthMode('register'); setAuthOpen(true) }

  // Loading state
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

  // If authenticated, show portal based on role
  if (isAuthenticated && user) {
    if (user.role === 'CLIENT' || user.role === 'RESELLER') {
      return <ClientPortal />
    }
    return <AdminPortal />
  }

  // Public site
  return (
    <>
      {view === 'landing' && <LandingView onNavigate={setView} onLogin={openLogin} onRegister={openRegister} />}
      {view === 'catalog' && <CatalogView onNavigate={setView} onLogin={openLogin} onRegister={openRegister} />}
      {view === 'how-it-works' && <HowItWorksView onNavigate={setView} onLogin={openLogin} />}
      {(view === 'about' || view === 'contact') && <LandingView onNavigate={setView} onLogin={openLogin} onRegister={openRegister} />}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
    </>
  )
}
