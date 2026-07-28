'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/nexora/sidebar'
import { Header } from '@/components/nexora/header'
import { Footer } from '@/components/nexora/footer'
import { CartDrawer } from '@/components/nexora/cart-drawer'
import { CheckoutDialog } from '@/components/nexora/checkout-dialog'
import { LoginDialog } from '@/components/nexora/auth/login-dialog'
import { StoreView } from '@/components/nexora/views/store-view'
import { DashboardView } from '@/components/nexora/views/dashboard-view'
import { ProductsView } from '@/components/nexora/views/products-view'
import { InventoryView } from '@/components/nexora/views/inventory-view'
import { SuppliersView } from '@/components/nexora/views/suppliers-view'
import { PurchasesView } from '@/components/nexora/views/purchases-view'
import { OrdersView } from '@/components/nexora/views/orders-view'
import { CustomersView } from '@/components/nexora/views/customers-view'
import { FinanceView } from '@/components/nexora/views/finance-view'
import { NaiosView } from '@/components/nexora/views/naios-view'
import { UsersView } from '@/components/nexora/views/users-view'
import { RolesView } from '@/components/nexora/views/roles-view'
import { SettingsView } from '@/components/nexora/views/settings-view'
import { useAuth } from '@/lib/auth-store'
import { ModuleKey, NaiosRecommendation } from '@/lib/types'
import { Loader2 } from 'lucide-react'

export default function NexoraPage() {
  const [active, setActive] = useState<ModuleKey>('dashboard')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading, user } = useAuth()

  // Validate session on mount
  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const res = await fetch('/api/auth/session')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  // Update auth store when session resolves
  useEffect(() => {
    if (session) {
      useAuth.getState().setUser(session.user, session.user ? undefined : [])
    }
  }, [session])

  // Show login dialog if not authenticated (but allow store browsing)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && active !== 'store') {
      // Allow store view without auth; prompt login for admin modules
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoginOpen(true)
    }
  }, [isLoading, isAuthenticated, active])

  // NAIOS alerts for the sidebar badge
  const { data: alerts = [] } = useQuery<NaiosRecommendation[]>({
    queryKey: ['naios-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/naios/recommendations')
      if (!res.ok) return []
      return res.json()
    },
    enabled: isAuthenticated,
  })

  const refreshAlerts = () => queryClient.invalidateQueries({ queryKey: ['naios-alerts'] })

  const handleNavigate = (key: ModuleKey) => {
    setActive(key)
    if (typeof window !== 'undefined') {
      document.getElementById('nexora-main')?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const alertCount = alerts.filter((a) => a.type === 'ALERT' || a.type === 'RISK').length

  const renderView = () => {
    switch (active) {
      case 'store': return <StoreView />
      case 'dashboard': return <DashboardView onNavigate={handleNavigate} alerts={alerts} onAlertsChange={refreshAlerts} />
      case 'products': return <ProductsView />
      case 'inventory': return <InventoryView />
      case 'suppliers': return <SuppliersView />
      case 'purchases': return <PurchasesView />
      case 'orders': return <OrdersView />
      case 'customers': return <CustomersView />
      case 'finance': return <FinanceView />
      case 'naios': return <NaiosView alerts={alerts} onAlertsChange={refreshAlerts} />
      case 'users': return <UsersView />
      case 'roles': return <RolesView />
      case 'settings': return <SettingsView />
      default: return null
    }
  }

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 border-r lg:block">
          <Sidebar active={active} onNavigate={handleNavigate} alertCount={alertCount} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            active={active}
            onNavigate={handleNavigate}
            alertCount={alertCount}
            onOpenNaios={() => setActive('naios')}
          />
          <main id="nexora-main" className="nexora-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{renderView()}</div>
          </main>
          <Footer />
        </div>
      </div>

      <CartDrawer onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          queryClient.invalidateQueries({ queryKey: ['customers'] })
          queryClient.invalidateQueries({ queryKey: ['finance'] })
        }}
      />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
