'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/nexora/sidebar'
import { Header } from '@/components/nexora/header'
import { Footer } from '@/components/nexora/footer'
import { CartDrawer } from '@/components/nexora/cart-drawer'
import { CheckoutDialog } from '@/components/nexora/checkout-dialog'
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
import { SettingsView } from '@/components/nexora/views/settings-view'
import { ModuleKey, NaiosRecommendation } from '@/lib/types'

export default function NexoraPage() {
  const [active, setActive] = useState<ModuleKey>('store')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const queryClient = useQueryClient()

  // NAIOS alerts for the sidebar badge + dashboard/naios panels
  const { data: alerts = [], refetch: refetchAlerts } = useQuery<NaiosRecommendation[]>({
    queryKey: ['naios-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/naios/recommendations')
      if (!res.ok) return []
      return res.json()
    },
  })

  const refreshAlerts = () => {
    void queryClient.invalidateQueries({ queryKey: ['naios-alerts'] })
  }

  const handleNavigate = (key: ModuleKey) => {
    setActive(key)
    if (typeof window !== 'undefined') {
      document.getElementById('nexora-main')?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const alertCount = alerts.filter((a) => a.type === 'ALERT' || a.type === 'RISK').length

  const renderView = () => {
    switch (active) {
      case 'store':
        return <StoreView />
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigate} alerts={alerts} onAlertsChange={refreshAlerts} />
      case 'products':
        return <ProductsView />
      case 'inventory':
        return <InventoryView />
      case 'suppliers':
        return <SuppliersView />
      case 'purchases':
        return <PurchasesView />
      case 'orders':
        return <OrdersView />
      case 'customers':
        return <CustomersView />
      case 'finance':
        return <FinanceView />
      case 'naios':
        return <NaiosView alerts={alerts} onAlertsChange={refreshAlerts} />
      case 'settings':
        return <SettingsView />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r lg:block">
          <Sidebar active={active} onNavigate={handleNavigate} alertCount={alertCount} />
        </aside>

        {/* Main column */}
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

      {/* Global cart drawer + checkout — available from any view */}
      <CartDrawer onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onSuccess={() => {
          // Invalidate orders + dashboard queries so new order appears in admin
          void queryClient.invalidateQueries({ queryKey: ['orders'] })
          void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          void queryClient.invalidateQueries({ queryKey: ['inventory'] })
          void queryClient.invalidateQueries({ queryKey: ['customers'] })
          void queryClient.invalidateQueries({ queryKey: ['finance'] })
        }}
      />
    </div>
  )
}
