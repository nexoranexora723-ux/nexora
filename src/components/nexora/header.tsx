'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, Search, Bell, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Sidebar } from './sidebar'
import { ModuleKey } from '@/lib/types'
import { NAV_MAP } from './nav-config'
import { Input } from '@/components/ui/input'

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
          <Sidebar active={active} onNavigate={(k) => { onNavigate(k); setMobileOpen(false) }} alertCount={alertCount} />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb / title */}
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden text-muted-foreground sm:inline">NEXORA</span>
        <span className="hidden text-muted-foreground sm:inline">/</span>
        <span className="font-semibold">{current?.label ?? 'Dashboard'}</span>
      </div>

      {/* Search */}
      <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar productos, pedidos..."
          className="h-9 bg-muted/50 pl-9 text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5 md:ml-3">
        {/* NAIOS quick access */}
        <Button
          variant="default"
          size="sm"
          onClick={onOpenNaios}
          className="gap-1.5 shadow-sm"
        >
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Cambiar tema"
          suppressHydrationWarning
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </Button>

        {/* User avatar */}
        <div className="ml-1 flex items-center gap-2.5 rounded-lg border bg-card px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-xs font-bold text-primary-foreground">
            AD
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-xs font-semibold">Adrián</div>
            <div className="text-[10px] text-muted-foreground">CEO</div>
          </div>
        </div>
      </div>
    </header>
  )
}
