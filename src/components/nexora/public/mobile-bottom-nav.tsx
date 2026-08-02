'use client'

import { Home, Package, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  onNavigate: (view: string) => void
  activeView: string
}

/**
 * MobileBottomNav — Bottom navigation bar visible only on mobile (md:hidden).
 * Provides quick access to Home, Catálogo, Carrito, Cuenta.
 * Respects iOS safe area insets via env(safe-area-inset-bottom).
 */
export function MobileBottomNav({ onNavigate, activeView }: MobileBottomNavProps) {
  const openCart = useCart((s) => s.openCart)

  const items = [
    { key: 'landing', label: 'Inicio', icon: Home, action: () => onNavigate('landing') },
    { key: 'catalog', label: 'Catálogo', icon: Package, action: () => onNavigate('catalog') },
    { key: 'cart', label: 'Carrito', icon: ShoppingCart, action: openCart },
    { key: 'account', label: 'Cuenta', icon: User, action: () => onNavigate('landing') },
  ]

  return (
    <nav
      aria-label="Navegación inferior"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {items.map((item) => {
        const Icon = item.icon
        const active = activeView === item.key
        return (
          <button
            key={item.key}
            onClick={item.action}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'scale-110')} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
