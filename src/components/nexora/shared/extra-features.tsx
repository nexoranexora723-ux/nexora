'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Package, DollarSign, Percent, Download, Users, Award, Megaphone } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/format'

// #10 Panel de Revendedores
export function ResellerDashboard() {
  const stats = {
    totalOrders: 12,
    totalSpent: 4520,
    commissionEarned: 452,
    tier: 'Silver',
    discount: 15,
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Panel de Revendedor 🏆</h2>
            <p className="mt-1 text-sm text-muted-foreground">Gestiona tus compras mayoristas y comisiones</p>
          </div>
          <Badge className="gap-1 bg-amber-500 text-white"><Award className="h-3 w-3" /> {stats.tier}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><Package className="h-4 w-4 text-muted-foreground" /><p className="mt-2 text-2xl font-bold">{stats.totalOrders}</p><p className="text-xs text-muted-foreground">Pedidos totales</p></CardContent></Card>
        <Card><CardContent className="p-4"><DollarSign className="h-4 w-4 text-muted-foreground" /><p className="mt-2 text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p><p className="text-xs text-muted-foreground">Total comprado</p></CardContent></Card>
        <Card><CardContent className="p-4"><Percent className="h-4 w-4 text-emerald-500" /><p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(stats.commissionEarned)}</p><p className="text-xs text-muted-foreground">Comisión ganada</p></CardContent></Card>
        <Card><CardContent className="p-4"><TrendingUp className="h-4 w-4 text-primary" /><p className="mt-2 text-2xl font-bold text-primary">{stats.discount}%</p><p className="text-xs text-muted-foreground">Descuento mayorista</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Megaphone className="h-4 w-4 text-primary" /> Material comercial</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { name: 'Catálogo NEXORA 2025', type: 'PDF', size: '2.4 MB' },
              { name: 'Lista de precios mayorista', type: 'XLSX', size: '180 KB' },
              { name: 'Imágenes de productos', type: 'ZIP', size: '45 MB' },
              { name: 'Plantillas redes sociales', type: 'ZIP', size: '12 MB' },
              { name: 'Video promocional', type: 'MP4', size: '85 MB' },
              { name: 'Guía de venta', type: 'PDF', size: '1.2 MB' },
            ].map((f) => (
              <button key={f.name} className="flex items-center gap-2 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40">
                <Download className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{f.name}</p>
                  <p className="text-[10px] text-muted-foreground">{f.type} · {f.size}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> Programa de referidos (#13)</h3>
          <div className="rounded-lg bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Tu enlace de referido:</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-background px-3 py-2 text-xs">nexora.co/r/VALE8472</code>
              <Button size="sm" variant="outline">Copiar</Button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div><p className="text-lg font-bold">5</p><p className="text-[10px] text-muted-foreground">Referidos</p></div>
              <div><p className="text-lg font-bold text-emerald-600">$126</p><p className="text-[10px] text-muted-foreground">Ganado</p></div>
              <div><p className="text-lg font-bold text-amber-600">10%</p><p className="text-[10px] text-muted-foreground">Comisión</p></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// #12 Blog
export function BlogView() {
  const posts = [
    { id: 1, title: 'Cómo importar desde China por primera vez: Guía 2025', excerpt: 'Todo lo que necesitas saber para tu primera importación...', category: 'Guías', date: '2025-01-15', readTime: '8 min' },
    { id: 2, title: 'Top 10 productos más rentables para importar en 2025', excerpt: 'Descubre qué productos tienen mayor margen de ganancia...', category: 'Trending', date: '2025-01-10', readTime: '6 min' },
    { id: 3, title: 'AirPods OEM vs Originales: ¿Vale la pena?', excerpt: 'Comparamos calidad, precio y garantía...', category: 'Análisis', date: '2025-01-05', readTime: '5 min' },
    { id: 4, title: 'Cómo evitar estafas al importar desde China', excerpt: 'Señales de alerta y cómo proteger tu dinero...', category: 'Guías', date: '2024-12-28', readTime: '7 min' },
    { id: 5, title: 'NAIOS: Tu asistente de IA para importaciones', excerpt: 'Cómo la inteligencia artificial facilita tus importaciones...', category: 'NEXORA', date: '2024-12-20', readTime: '4 min' },
    { id: 6, title: 'Impuestos y aduana en Colombia: Guía completa', excerpt: 'Todo sobre aranceles, IVA y trámites aduaneros...', category: 'Guías', date: '2024-12-15', readTime: '10 min' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground"><span className="text-sm font-black">N</span></div>
            <span className="font-bold">NEXORA Blog</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => window.history.back()}>Volver</Button>
        </div>
      </nav>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Blog NEXORA</h1>
        <p className="mt-2 text-muted-foreground">Guías, análisis y tips sobre importación desde China</p>
        <div className="mt-8 space-y-4">
          {posts.map((p) => (
            <Card key={p.id} className="cursor-pointer transition-all hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                  <span className="text-xs text-muted-foreground">{p.date} · {p.readTime} lectura</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold hover:text-primary">{p.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// #27 Onboarding
export function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const steps = [
    { icon: '🛍️', title: 'Explora el catálogo', desc: 'Navega cientos de productos importables desde China' },
    { icon: '✨', title: 'Usa el Asistente IA', desc: 'Te guiamos paso a paso para solicitar cualquier producto' },
    { icon: '📦', title: 'Solicita tu importación', desc: 'NAIOS busca el mejor proveedor y te envía una cotización' },
    { icon: '🚢', title: 'Haz seguimiento', desc: 'Visualiza el progreso de tu pedido en tiempo real' },
  ]

  if (step >= steps.length) { onClose(); return null }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="text-center">
          <div className="mb-4 text-5xl">{steps[step].icon}</div>
          <h2 className="text-xl font-bold">{steps[step].title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{steps[step].desc}</p>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Saltar</button>
          <div className="flex gap-1">
            {steps.map((_, i) => <div key={i} className={`h-1.5 rounded-full ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`} />)}
          </div>
          <Button size="sm" onClick={() => setStep(step + 1)}>{step === steps.length - 1 ? 'Empezar' : 'Siguiente'}</Button>
        </div>
      </div>
    </div>
  )
}

// #29 Command Palette
export function CommandPalette({ open, onOpenChange, onNavigate }: { open: boolean; onOpenChange: (o: boolean) => void; onNavigate: (view: string) => void }) {
  const [query, setQuery] = useState('')
  const commands = [
    { label: 'Dashboard', action: 'dashboard', icon: '📊' },
    { label: 'Catálogo', action: 'catalog', icon: '🛍️' },
    { label: 'Mis solicitudes', action: 'requests', icon: '📦' },
    { label: 'Seguimiento', action: 'tracking', icon: '🚢' },
    { label: 'Mi perfil', action: 'profile', icon: '👤' },
    { label: 'Nueva solicitud', action: 'new', icon: '✨' },
    { label: 'Asistente IA', action: 'wizard', icon: '🤖' },
  ]
  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-24" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-lg rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar o escribir comando..."
          className="w-full border-b px-4 py-3 text-sm outline-none"
        />
        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.map((c) => (
            <button key={c.action} onClick={() => { onNavigate(c.action); onOpenChange(false) }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
              <span className="text-lg">{c.icon}</span> {c.label}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-3 py-4 text-center text-sm text-muted-foreground">Sin resultados</p>}
        </div>
      </div>
    </div>
  )
}
