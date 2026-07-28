'use client'

import { cn } from '@/lib/utils'
import { NAV_GROUPS } from './nav-config'
import { ModuleKey } from '@/lib/types'
import { Sparkles, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  active: ModuleKey
  onNavigate: (key: ModuleKey) => void
  alertCount?: number
}

export function Sidebar({ active, onNavigate, alertCount = 0 }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-sm">
          <span className="text-lg font-black">N</span>
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight text-sidebar-foreground">NEXORA</div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">
            Business OS
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="nexora-scroll flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = active === item.key
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80',
                      )}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.key === 'naios' && alertCount > 0 && (
                      <Badge className="h-5 min-w-5 justify-center bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                        {alertCount}
                      </Badge>
                    )}
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* NAIOS card */}
      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-xl bg-gradient-to-br from-primary/15 via-sidebar-accent to-sidebar-accent p-3.5 ring-1 ring-primary/20">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold text-sidebar-foreground">NAIOS Activo</div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/60">
            Modo asesor. La decisión final siempre es tuya.
          </p>
        </div>
      </div>
    </div>
  )
}
