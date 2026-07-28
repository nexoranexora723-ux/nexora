'use client'

import { Sparkles, Circle } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-background/60 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">NEXORA</span>
          <span className="text-muted-foreground/60">·</span>
          <span>Business Operating System v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
            <span>Sistema operativo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>NAIOS · modo asesor</span>
          </div>
          <span className="hidden sm:inline">© NEXORA Commerce S.A.S.</span>
        </div>
      </div>
    </footer>
  )
}
