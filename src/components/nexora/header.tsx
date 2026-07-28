'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, Search, Bell, Sparkles, ShoppingBag, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Sidebar } from './sidebar'
import { ModuleKey } from '@/lib/types'
import { NAV_MAP } from './nav-config'
import { Input } from '@/components/ui/input'
import { useCart, cartCount } from '@/lib/cart-store'
import { useAuth } from '@/lib/auth-store'
import { useLogout } from '@/hooks/use-auth'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { initials } from '@/lib/format'

interface HeaderProps {
  active: ModuleKey
  onNavigate: (key: ModuleKey) => void
  alertCount?: number
  onOpenNaios: () => void
}

export function Header({ active, onNavigate, alertCount = 0, onOpenNaios }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const current = NAV_MAP[active]
  const { user, isAuthenticated } = useAuth()
  const logoutMut = useLogout()

  const handleLogout = async () => {
    await logoutMut.mutateAsync()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menú de navegación</SheetTitle>
            <SheetDescription>Navegación principal de NEXORA</SheetDescription>
          </SheetHeader>
          <Sidebar active={active} onNavigate={(k) => { onNavigate(k); setMobileOpen(false) }} alertCount={alertCount} />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden text-muted-foreground sm:inline">NEXORA</span>
        <span className="hidden text-muted-foreground sm:inline">/</span>
        <span className="font-semibold">{current?.label ?? 'Dashboard'}</span>
      </div>

      {/* Search */}
      <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar..." className="h-9 bg-muted/50 pl-9 text-sm" />
      </div>

      <div className="ml-auto flex items-center gap-1.5 md:ml-3">
        {/* Cart */}
        <Button variant="ghost" size="icon" className="relative" onClick={() => useCart.getState().setOpen(true)}>
          <ShoppingBag className="h-4.5 w-4.5" />
          <CartBadge />
        </Button>

        {/* NAIOS */}
        <Button variant="default" size="sm" onClick={onOpenNaios} className="gap-1.5 shadow-sm">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">NAIOS</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" onClick={onOpenNaios}>
          <Bell className="h-4.5 w-4.5" />
          {alertCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {alertCount}
            </span>
          )}
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Cambiar tema">
          <Sun className="hidden h-4.5 w-4.5 dark:block" />
          <Moon className="h-4.5 w-4.5 dark:hidden" />
        </Button>

        {/* User menu */}
        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2.5 rounded-lg border bg-card px-2 py-1 transition-colors hover:bg-muted/50">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-xs font-bold text-primary-foreground">
                  {initials(user.firstName, user.lastName)}
                </div>
                <div className="hidden leading-tight sm:block">
                  <div className="text-xs font-semibold">{user.firstName} {user.lastName}</div>
                  <div className="text-[10px] text-muted-foreground">{user.roleName ?? user.role}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  {user.branchName && <span className="text-[10px] font-normal text-muted-foreground">{user.branchName}</span>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('users')}>Gestión de usuarios</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('roles')}>Roles y permisos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('settings')}>Configuración</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-3.5 w-3.5" /> Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}

function CartBadge() {
  const items = useCart((s) => s.items)
  const count = cartCount(items)
  if (count === 0) return null
  return (
    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {count}
    </span>
  )
}
