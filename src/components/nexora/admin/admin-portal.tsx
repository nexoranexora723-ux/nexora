'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-store'
import { formatCurrency, formatNumber, timeAgo, initials } from '@/lib/format'
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/lib/types'
import type { ImportRequest, DashboardStats, Supplier, Quote, Import } from '@/lib/types'
import {
  LayoutDashboard, Package, Truck, Users, Wallet, Sparkles, Settings,
  LogOut, Search, MoreHorizontal, ChevronRight, TrendingUp, AlertCircle,
  FileText, Bell, Globe, ShieldCheck, Plus, ArrowRight, Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { NotificationBell } from '@/components/nexora/shared/notification-bell'
import { AdminProducts } from '@/components/nexora/admin/admin-products'
import { AnimatedCounter, staggerContainer, staggerItem, BreathingAvatar, NaiosTyping, messageSlideIn } from '@/components/nexora/shared/animations'
import { motion, AnimatePresence } from 'framer-motion'

type View = 'dashboard' | 'requests' | 'products' | 'suppliers' | 'quotes' | 'imports' | 'finance' | 'naios'

export function AdminPortal() {
  const { user, logout } = useAuth()
  const [view, setView] = useState<View>('dashboard')
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-sm">
            <span className="text-lg font-black">N</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-sidebar-foreground">NEXORA</div>
            <div className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/50">ERP Admin</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Principal</p>
          {[
            { key: 'dashboard' as View, icon: LayoutDashboard, label: 'Dashboard' },
            { key: 'requests' as View, icon: Package, label: 'Solicitudes' },
            { key: 'naios' as View, icon: Sparkles, label: 'NAIOS' },
          ].map((item) => (
            <button key={item.key} onClick={() => setView(item.key)} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all', view === item.key ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60')}>
              <item.icon className={cn('h-4 w-4', view === item.key ? 'text-primary' : 'text-sidebar-foreground/50')} />
              {item.label}
            </button>
          ))}
          <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Operación</p>
          {[
            { key: 'products' as View, icon: Package, label: 'Productos' },
            { key: 'suppliers' as View, icon: Truck, label: 'Proveedores' },
            { key: 'quotes' as View, icon: FileText, label: 'Cotizaciones' },
            { key: 'imports' as View, icon: Globe, label: 'Importaciones' },
            { key: 'finance' as View, icon: Wallet, label: 'Finanzas' },
          ].map((item) => (
            <button key={item.key} onClick={() => setView(item.key)} className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all', view === item.key ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60')}>
              <item.icon className={cn('h-4 w-4', view === item.key ? 'text-primary' : 'text-sidebar-foreground/50')} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-700 text-xs font-bold text-primary-foreground">
              {initials(user?.firstName ?? '', user?.lastName)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-semibold">{user?.firstName} {user?.lastName}</div>
              <div className="text-[10px] text-muted-foreground">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6">
          <h1 className="text-lg font-semibold">
            {view === 'dashboard' && 'Dashboard'}
            {view === 'requests' && 'Solicitudes de Importación'}
            {view === 'products' && 'Productos'}
            {view === 'suppliers' && 'Proveedores'}
            {view === 'quotes' && 'Cotizaciones'}
            {view === 'imports' && 'Importaciones'}
            {view === 'finance' && 'Finanzas'}
            {view === 'naios' && 'NAIOS — Copiloto de Importaciones'}
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button size="sm" variant="outline" onClick={() => setView('naios')} className="gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" /> NAIOS
            </Button>
          </div>
        </header>

        <main className="nexora-scroll flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {view === 'dashboard' && <AdminDashboard onViewRequest={(id) => { setSelectedRequest(id); setView('requests') }} onNavigate={setView} />}
            {view === 'requests' && <AdminRequests selectedId={selectedRequest} onSelect={setSelectedRequest} />}
            {view === 'products' && <AdminProducts />}
            {view === 'suppliers' && <AdminSuppliers />}
            {view === 'quotes' && <AdminQuotes />}
            {view === 'imports' && <AdminImports />}
            {view === 'finance' && <AdminFinance />}
            {view === 'naios' && <AdminNaios />}
          </div>
        </main>
      </div>
    </div>
  )
}

// === Admin Dashboard ===
function AdminDashboard({ onViewRequest, onNavigate }: { onViewRequest: (id: string) => void; onNavigate: (v: View) => void }) {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await fetch('/api/dashboard')).json(),
  })

  if (isLoading || !stats) {
    return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Solicitudes nuevas</p><Package className="h-5 w-5 text-sky-500" /></div>
          <p className="mt-2 text-2xl font-bold text-sky-600"><AnimatedCounter value={stats.newRequests} /></p>
          <p className="text-xs text-muted-foreground">{stats.activeRequests} activas</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Cotizaciones pendientes</p><FileText className="h-5 w-5 text-amber-500" /></div>
          <p className="mt-2 text-2xl font-bold text-amber-600"><AnimatedCounter value={stats.pendingQuotes} /></p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Importaciones activas</p><Globe className="h-5 w-5 text-violet-500" /></div>
          <p className="mt-2 text-2xl font-bold text-violet-600"><AnimatedCounter value={stats.activeImports} /></p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Utilidad</p><TrendingUp className="h-5 w-5 text-emerald-500" /></div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(stats.profit)}</p>
          <p className="text-xs text-muted-foreground">Ing: {formatCurrency(stats.revenue)}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button onClick={() => onNavigate('suppliers')} className="rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm">
          <Truck className="h-5 w-5 text-muted-foreground" /><p className="mt-2 text-xl font-bold">{stats.activeSuppliers}</p><p className="text-xs text-muted-foreground">Proveedores activos</p>
        </button>
        <div className="rounded-xl border bg-card p-4">
          <Users className="h-5 w-5 text-muted-foreground" /><p className="mt-2 text-xl font-bold">{stats.totalClients}</p><p className="text-xs text-muted-foreground">Clientes</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Wallet className="h-5 w-5 text-muted-foreground" /><p className="mt-2 text-xl font-bold">{formatCurrency(stats.expenses)}</p><p className="text-xs text-muted-foreground">Gastos</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <Package className="h-5 w-5 text-muted-foreground" /><p className="mt-2 text-xl font-bold">{stats.activeRequests}</p><p className="text-xs text-muted-foreground">Solicitudes activas</p>
        </div>
      </div>

      {/* Recent requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Solicitudes recientes</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => onNavigate('requests')}>Ver todas <ChevronRight className="h-3 w-3" /></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.recentRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin solicitudes</p>
          ) : (
            stats.recentRequests.map((r) => (
              <button key={r.id} onClick={() => onViewRequest(r.id)} className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-medium text-primary">{r.number}</code>
                    <Badge variant="outline" className={cn('text-[10px]', REQUEST_STATUS_COLORS[r.status])}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm font-medium">{r.productName}</p>
                  <p className="text-xs text-muted-foreground">{r.client.firstName} {r.client.lastName} · {r.quantity}u · {timeAgo(r.createdAt)}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// === Admin Requests ===
function AdminRequests({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { data: requests, isLoading } = useQuery<ImportRequest[]>({
    queryKey: ['admin-requests', query, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      return (await fetch(`/api/requests?${params}`)).json()
    },
  })

  if (selectedId) return <RequestDetail id={selectedId} onBack={() => onSelect('')} />

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por número o producto..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'NUEVA', 'BUSCANDO_PROVEEDOR', 'COTIZACION_ENVIADA', 'PAGO_RECIBIDO', 'EN_TRANSITO', 'ENTREGADO'].map((s) => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'Todas' : REQUEST_STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (requests?.length ?? 0) === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No hay solicitudes</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="nexora-scroll overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Número</TableHead><TableHead>Producto</TableHead><TableHead>Cliente</TableHead>
                <TableHead className="text-right">Cant.</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead className="w-12"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {requests!.map((r) => (
                  <TableRow key={r.id} className="group cursor-pointer" onClick={() => onSelect(r.id)}>
                    <TableCell><code className="text-xs font-medium text-primary">{r.number}</code></TableCell>
                    <TableCell><p className="truncate text-sm font-medium">{r.productName}</p></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.client.firstName} {r.client.lastName}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{r.quantity}</TableCell>
                    <TableCell><Badge variant="outline" className={cn('text-[10px]', REQUEST_STATUS_COLORS[r.status])}>{REQUEST_STATUS_LABELS[r.status]}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</TableCell>
                    <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      )}
    </div>
  )
}

// === Request Detail ===
function RequestDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient()
  const { data: req, isLoading } = useQuery<ImportRequest>({
    queryKey: ['request', id],
    queryFn: async () => (await fetch(`/api/requests/${id}`)).json(),
  })
  const [statusOpen, setStatusOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')

  const updateStatus = useMutation({
    mutationFn: async () => {
      await fetch(`/api/requests/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['request', id] })
      qc.invalidateQueries({ queryKey: ['admin-requests'] })
      setStatusOpen(false)
      setNotes('')
    },
  })

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!req) return <Card><CardContent className="py-12 text-center">No encontrada</CardContent></Card>

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">← Volver</button>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-medium text-primary">{req.number}</code>
            <Badge variant="outline" className={REQUEST_STATUS_COLORS[req.status]}>{REQUEST_STATUS_LABELS[req.status]}</Badge>
          </div>
          <h2 className="mt-1 text-2xl font-bold">{req.productName}</h2>
          <p className="text-sm text-muted-foreground">Cliente: {req.client.firstName} {req.client.lastName} ({req.client.email})</p>
        </div>
        <Button onClick={() => { setNewStatus(req.status); setStatusOpen(true) }}>Cambiar estado</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Información de la solicitud</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Cantidad</p><p className="font-medium">{req.quantity} unidades</p></div>
            <div><p className="text-xs text-muted-foreground">Presupuesto</p><p className="font-medium">{req.budget ? formatCurrency(req.budget) : '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Categoría</p><p className="font-medium">{req.category ?? '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Propósito</p><p className="font-medium">{req.purpose ?? '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Prioridad</p><p className="font-medium">{req.priority}</p></div>
            <div><p className="text-xs text-muted-foreground">Asignado a</p><p className="font-medium">{req.assignee ? `${req.assignee.firstName} ${req.assignee.lastName}` : 'Sin asignar'}</p></div>
          </div>
          {req.description && <div className="mt-4"><p className="text-xs text-muted-foreground">Descripción</p><p className="mt-1 text-sm">{req.description}</p></div>}
          {req.details && <div className="mt-2"><p className="text-xs text-muted-foreground">Detalles</p><p className="mt-1 text-sm">{req.details}</p></div>}
          {req.referenceUrl && <div className="mt-2"><p className="text-xs text-muted-foreground">Referencia</p><a href={req.referenceUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{req.referenceUrl}</a></div>}
        </CardContent></Card>

        {req.naiosSummary && (
          <Card className="border-primary/20 bg-primary/5"><CardContent className="p-5">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-primary">Análisis NAIOS</h3></div>
            <p className="mt-3 text-sm text-muted-foreground">{req.naiosSummary}</p>
            {req.naiosCategory && <p className="mt-2 text-xs"><span className="text-muted-foreground">Categoría IA:</span> <span className="font-medium">{req.naiosCategory}</span></p>}
            {req.naiosPriority && <p className="text-xs"><span className="text-muted-foreground">Prioridad IA:</span> <span className="font-medium">{req.naiosPriority}</span></p>}
          </CardContent></Card>
        )}
      </div>

      {(req.quotes?.length ?? 0) > 0 && (
        <Card><CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Cotizaciones ({req.quotes.length})</h3>
          <div className="space-y-2">
            {req.quotes!.map((q) => (
              <div key={q.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <code className="text-xs text-primary">{q.number}</code>
                  <Badge variant="outline" className="text-[10px]">{q.status}</Badge>
                </div>
                <p className="mt-1 text-sm">{q.supplier.companyName}</p>
                <p className="text-sm font-semibold">{formatCurrency(q.total)} <span className="text-xs font-normal text-muted-foreground">({q.quantity}u × {formatCurrency(q.unitPrice)})</span></p>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {/* Status change dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Cambiar estado de la solicitud</DialogTitle><DialogDescription>{req.number} — {req.productName}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              {Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Input placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStatusOpen(false)}>Cancelar</Button><Button onClick={() => updateStatus.mutate()} disabled={updateStatus.isPending}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// === Admin Suppliers ===
function AdminSuppliers() {
  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => (await fetch('/api/suppliers')).json(),
  })

  const sorted = suppliers ? [...suppliers].sort((a, b) => (b.rating?.overallScore ?? 0) - (a.rating?.overallScore ?? 0)) : []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Proveedores</p><p className="mt-1 text-2xl font-bold">{suppliers?.length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Bajo riesgo</p><p className="mt-1 text-2xl font-bold text-emerald-600">{suppliers?.filter((s) => s.riskLevel === 'LOW').length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Riesgo medio</p><p className="mt-1 text-2xl font-bold text-amber-600">{suppliers?.filter((s) => s.riskLevel === 'MEDIUM').length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Alto riesgo</p><p className="mt-1 text-2xl font-bold text-rose-600">{suppliers?.filter((s) => s.riskLevel === 'HIGH').length ?? 0}</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((s) => (
            <Card key={s.id}><CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.companyName}</h3>
                  <p className="text-xs text-muted-foreground">{s.contactName} · {s.city}, {s.country}</p>
                </div>
                <div className="text-right">
                  <div className={cn('text-2xl font-bold', (s.rating?.overallScore ?? 0) >= 85 ? 'text-emerald-600' : (s.rating?.overallScore ?? 0) >= 70 ? 'text-amber-600' : 'text-rose-600')}>
                    {(s.rating?.overallScore ?? 0).toFixed(1)}
                  </div>
                  <Badge variant="outline" className={cn('text-[10px]', s.riskLevel === 'LOW' ? 'border-emerald-200 text-emerald-700' : s.riskLevel === 'MEDIUM' ? 'border-amber-200 text-amber-700' : 'border-rose-200 text-rose-700')}>
                    {s.riskLevel === 'LOW' ? 'Bajo riesgo' : s.riskLevel === 'MEDIUM' ? 'Riesgo medio' : 'Alto riesgo'}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {s.moq && <span>MOQ: {s.moq}</span>}
                {s.leadTime && <span>Lead: {s.leadTime}d</span>}
                {s.warranty && <span>Garantía: {s.warranty}</span>}
                {s.oem && <span>OEM</span>}
                {s.odm && <span>ODM</span>}
              </div>
              {s.rating && (
                <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                  <div><span className="text-muted-foreground">Calidad</span> <span className="font-medium">{s.rating.qualityScore}</span></div>
                  <div><span className="text-muted-foreground">Precio</span> <span className="font-medium">{s.rating.priceScore}</span></div>
                  <div><span className="text-muted-foreground">Confianza</span> <span className="font-medium">{s.rating.trustScore}</span></div>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}

// === Admin Quotes ===
function AdminQuotes() {
  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ['quotes'],
    queryFn: async () => (await fetch('/api/quotes')).json(),
  })

  return (
    <div className="space-y-4">
      {isLoading ? <Skeleton className="h-96 w-full" /> : (quotes?.length ?? 0) === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No hay cotizaciones</CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="nexora-scroll overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Número</TableHead><TableHead>Proveedor</TableHead><TableHead>Producto</TableHead>
                <TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {quotes!.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell><code className="text-xs text-primary">{q.number}</code></TableCell>
                    <TableCell className="text-sm">{q.supplier.companyName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{q.quantity}u × {formatCurrency(q.unitPrice)}</TableCell>
                    <TableCell className="text-right text-sm font-semibold">{formatCurrency(q.total)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{q.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(q.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent></Card>
      )}
    </div>
  )
}

// === Admin Imports ===
function AdminImports() {
  const { data: imports, isLoading } = useQuery<Import[]>({
    queryKey: ['imports'],
    queryFn: async () => (await fetch('/api/imports')).json(),
  })

  const statusLabels: Record<string, string> = {
    COMPRA_REALIZADA: 'Compra realizada', PRODUCCION: 'En producción', ENVIADO: 'Enviado',
    EN_TRANSITO: 'En tránsito', EN_ADUANA: 'En aduana', RECIBIDO_BODEGA: 'En bodega',
    ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
  }
  const statusColors: Record<string, string> = {
    COMPRA_REALIZADA: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    PRODUCCION: 'border-orange-200 text-orange-700 bg-orange-50',
    ENVIADO: 'border-blue-200 text-blue-700 bg-blue-50',
    EN_TRANSITO: 'border-blue-200 text-blue-700 bg-blue-50',
    ENTREGADO: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    CANCELADO: 'border-rose-200 text-rose-700 bg-rose-50',
  }

  return (
    <div className="space-y-4">
      {isLoading ? <Skeleton className="h-96 w-full" /> : (imports?.length ?? 0) === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No hay importaciones</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {imports!.map((imp) => (
            <Card key={imp.id}><CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-medium text-primary">{imp.number}</code>
                    <Badge variant="outline" className={cn('text-[10px]', statusColors[imp.status] ?? '')}>{statusLabels[imp.status] ?? imp.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm">{imp.supplier.companyName}</p>
                  {imp.carrier && <p className="text-xs text-muted-foreground">{imp.carrier} · {imp.trackingNumber ?? '—'}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(imp.profit)}</p>
                  <p className="text-xs text-muted-foreground">Utilidad</p>
                  <p className="mt-1 text-xs text-muted-foreground">Venta: {formatCurrency(imp.salePrice)}</p>
                  <p className="text-xs text-muted-foreground">Costo: {formatCurrency(imp.totalCost)}</p>
                </div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}

// === Admin Finance ===
function AdminFinance() {
  const { data, isLoading } = useQuery<{ transactions: { id: string; type: string; description: string; amount: number; reference: string | null; date: string }[]; summary: { income: number; expenses: number; profit: number } }>({
    queryKey: ['finance'],
    queryFn: async () => (await fetch('/api/finance')).json(),
  })

  if (isLoading || !data) return <Skeleton className="h-96 w-full" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Ingresos</p><p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(data.summary.income)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Gastos</p><p className="mt-2 text-2xl font-bold text-rose-600">{formatCurrency(data.summary.expenses)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Utilidad</p><p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(data.summary.profit)}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <div className="nexora-scroll max-h-96 overflow-y-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{t.description}</TableCell>
                  <TableCell><Badge variant={t.type === 'INCOME' ? 'default' : 'destructive'} className="text-[10px]">{t.type === 'INCOME' ? 'Ingreso' : 'Gasto'}</Badge></TableCell>
                  <TableCell className={cn('text-right text-sm font-semibold tabular-nums', t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600')}>{t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{timeAgo(t.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent></Card>
    </div>
  )
}

// === Admin NAIOS ===
function AdminNaios() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const { data: briefing } = useQuery<{ briefing: string }>({
    queryKey: ['naios-briefing'],
    queryFn: async () => (await fetch('/api/naios/insights')).json(),
    staleTime: 5 * 60 * 1000,
  })
  const { data: recs } = useQuery({
    queryKey: ['naios-recs'],
    queryFn: async () => (await fetch('/api/naios/recommendations')).json(),
  })
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await fetch('/api/dashboard')).json(),
  })

  const buildContext = () => {
    if (!stats) return 'Datos no disponibles.'
    return `- Solicitudes: ${stats.newRequests} nuevas, ${stats.activeRequests} activas
- Cotizaciones pendientes: ${stats.pendingQuotes}
- Importaciones activas: ${stats.activeImports}
- Utilidad: ${formatCurrency(stats.profit)}`
  }

  const send = async () => {
    if (!input.trim() || sending) return
    const userMsg = { role: 'user', content: input }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/naios/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], businessContext: buildContext() }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.response }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Error de conexión.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Briefing */}
      <Card className="border-primary/20 bg-primary/5"><CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground"><Sparkles className="h-4 w-4" /></div><div><h3 className="text-base font-semibold">Briefing ejecutivo</h3><p className="text-xs text-muted-foreground">Resumen generado por IA</p></div></div>
        <div className="naios-markdown rounded-lg bg-muted/40 p-4 text-sm"><ReactMarkdown>{briefing?.briefing ?? 'Cargando...'}</ReactMarkdown></div>
      </CardContent></Card>

      {/* Recommendations */}
      {recs && recs.length > 0 && (
        <Card><CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Recomendaciones ({recs.length})</h3>
          <div className="space-y-2">
            {recs.map((r: { id: string; type: string; severity: string; title: string; description: string; action: string | null }) => (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-[10px]', r.severity === 'CRITICAL' ? 'border-rose-200 text-rose-700' : r.severity === 'HIGH' ? 'border-orange-200 text-orange-700' : 'border-amber-200 text-amber-700')}>{r.type}</Badge>
                  <span className="text-xs text-muted-foreground">{r.severity}</span>
                </div>
                <p className="mt-1 text-sm font-medium">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
                {r.action && <p className="mt-1 text-xs text-primary">→ {r.action}</p>}
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {/* Chat */}
      <Card className="overflow-hidden"><CardContent className="p-0">
        <div className="border-b bg-gradient-to-r from-primary/5 to-transparent p-4">
          <div className="flex items-center gap-2">
            <BreathingAvatar className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground"><Bot className="h-4 w-4" /><span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" /></BreathingAvatar>
            <div><h3 className="text-base font-semibold">Conversación con NAIOS</h3><p className="text-xs text-muted-foreground">Tu copiloto de importaciones</p></div>
          </div>
        </div>
        <div className="nexora-scroll h-80 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles className="mb-2 h-10 w-10 text-primary/40" />
              <p className="text-sm font-medium">Pregúntame sobre tus importaciones</p>
              <div className="mt-4 grid w-full max-w-md grid-cols-1 gap-2">
                {['¿Qué solicitudes necesitan atención?', '¿Cuál es el estado de mis importaciones?', '¿Qué proveedores tienen mejor rating?'].map((p) => (
                  <button key={p} onClick={() => { setInput(p); }} className="rounded-lg border bg-card p-2.5 text-left text-xs transition-colors hover:bg-muted/40">{p}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <motion.div key={i} variants={messageSlideIn} initial="hidden" animate="visible" className={cn('flex gap-2', m.role === 'user' && 'flex-row-reverse')}>
                  <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', m.role === 'assistant' ? 'bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground' : 'bg-muted')}>
                    {m.role === 'assistant' ? <Bot className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                  </div>
                  <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm', m.role === 'assistant' ? 'rounded-tl-sm bg-muted/60' : 'rounded-tr-sm bg-primary text-primary-foreground')}>
                    {m.role === 'assistant' ? <div className="naios-markdown"><ReactMarkdown>{m.content}</ReactMarkdown></div> : <p className="whitespace-pre-wrap">{m.content}</p>}
                  </div>
                </motion.div>
              ))}
              {sending && <div className="flex gap-2"><BreathingAvatar className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground"><Bot className="h-3.5 w-3.5" /></BreathingAvatar><NaiosTyping /></div>}
            </div>
          )}
        </div>
        <div className="border-t p-3">
          <div className="flex items-end gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Pregunta a NAIOS..." disabled={sending} />
            <Button onClick={send} disabled={!input.trim() || sending} size="icon" className="h-9 w-9 shrink-0"><Sparkles className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent></Card>
    </div>
  )
}
