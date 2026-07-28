'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatCard, PageHeader } from '@/components/nexora/stat-card'
import { StatusBadge, NaiosTypeBadge, SeverityDot } from '@/components/nexora/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardStats, ModuleKey, NaiosRecommendation } from '@/lib/types'
import { formatCurrency, formatCompact, formatNumber, timeAgo } from '@/lib/format'
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import {
  DollarSign, TrendingUp, ShoppingCart, AlertTriangle, Package,
  Users, Truck, ArrowUpRight, Sparkles, ChevronRight,
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', PAID: 'Pagado', SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', PAID: '#0ea5e9', SHIPPED: '#8b5cf6', DELIVERED: '#10b981', CANCELLED: '#f43f5e',
}

export function DashboardView({
  onNavigate,
  alerts,
  onAlertsChange,
}: {
  onNavigate: (k: ModuleKey) => void
  alerts: NaiosRecommendation[]
  onAlertsChange: () => void
}) {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      return res.json()
    },
  })

  const dismissAlert = async (id: string) => {
    await fetch('/api/naios/recommendations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'DISMISSED' }),
    })
    onAlertsChange()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visión general en tiempo real del negocio · NEXORA Commerce S.A.S."
        icon={Sparkles}
        action={
          <Button variant="default" className="gap-1.5" onClick={() => onNavigate('naios')}>
            <Sparkles className="h-4 w-4" /> Hablar con NAIOS
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard title="Ingresos" value={formatCurrency(stats.revenue)} icon={DollarSign} accent="emerald" trend={{ value: 18.4, positive: true }} subtitle="Acumulado del período" />
            <StatCard title="Utilidad neta" value={formatCurrency(stats.profit)} icon={TrendingUp} accent="sky" trend={{ value: 12.1, positive: true }} subtitle={`Margen ${stats.profitMargin.toFixed(1)}%`} />
            <StatCard title="Pedidos" value={formatNumber(stats.totalOrders)} icon={ShoppingCart} accent="violet" subtitle={`${stats.pendingOrders} pendientes`} />
            <StatCard title="Alertas de stock" value={formatNumber(stats.lowStockCount)} icon={AlertTriangle} accent={stats.lowStockCount > 0 ? 'rose' : 'emerald'} subtitle={`${stats.totalProducts} productos en catálogo`} />
          </>
        )}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Productos', value: stats?.totalProducts ?? 0, icon: Package, key: 'products' as ModuleKey },
          { label: 'Clientes', value: stats?.totalCustomers ?? 0, icon: Users, key: 'customers' as ModuleKey },
          { label: 'Proveedores activos', value: stats?.activeSuppliers ?? 0, icon: Truck, key: 'suppliers' as ModuleKey },
          { label: 'Pedidos pendientes', value: stats?.pendingOrders ?? 0, icon: ShoppingCart, key: 'orders' as ModuleKey },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => onNavigate(m.key)}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
              <m.icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold tabular-nums">{m.value}</div>
              <div className="truncate text-xs text-muted-foreground">{m.label}</div>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
              <CardDescription>Últimos 14 días</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Ingresos</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Gastos</span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || !stats ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stats.revenueByDay} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.62 0.14 162)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="oklch(0.62 0.14 162)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 240)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }} tickLine={false} axisLine={false} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} width={45} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.005 240)', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(v: number) => formatCurrency(v)}
                    labelFormatter={(l: string) => `Día ${l.slice(8)}`}
                  />
                  <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="oklch(0.62 0.14 162)" strokeWidth={2} fill="url(#rev)" />
                  <Area type="monotone" dataKey="expenses" name="Gastos" stroke="#f43f5e" strokeWidth={2} fill="url(#exp)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pedidos por estado</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !stats ? (
              <Skeleton className="h-64 w-full" />
            ) : stats.ordersByStatus.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={stats.ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>
                      {stats.ordersByStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number, _n, p) => [`${v} pedidos`, STATUS_LABELS[(p?.payload as { status: string })?.status] ?? '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid w-full grid-cols-2 gap-1.5">
                  {stats.ordersByStatus.map((s) => (
                    <div key={s.status} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.status] ?? '#94a3b8' }} />
                      <span className="text-muted-foreground">{STATUS_LABELS[s.status] ?? s.status}</span>
                      <span className="ml-auto font-semibold tabular-nums">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* NAIOS alerts + Top products */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* NAIOS alerts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Recomendaciones de NAIOS</CardTitle>
                <CardDescription>Análisis inteligente del negocio</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => onNavigate('naios')}>
              Ver todo <ChevronRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary/40" />
                No hay recomendaciones pendientes
              </div>
            ) : (
              alerts.slice(0, 4).map((r) => (
                <div key={r.id} className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40">
                  <div className="mt-0.5"><SeverityDot severity={r.severity} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <NaiosTypeBadge type={r.type} />
                      <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-snug">{r.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                    {r.action && (
                      <p className="mt-1 text-xs text-primary"><span className="font-medium">→ {r.action}</span></p>
                    )}
                  </div>
                  <button
                    onClick={() => dismissAlert(r.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-xs text-muted-foreground hover:text-foreground"
                    aria-label="Descartar"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top productos</CardTitle>
            <CardDescription>Por ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !stats || stats.topProducts.length === 0 ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-3">
                {stats.topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku} · {p.sold} vendidos</p>
                    </div>
                    <div className="text-sm font-semibold tabular-nums">{formatCompact(p.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category revenue bar chart */}
      {stats && stats.categoryRevenue.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ingresos por categoría</CardTitle>
            <CardDescription>Distribución de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.categoryRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 240)" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} width={45} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} cursor={{ fill: 'oklch(0.96 0.005 240)' }} />
                <Bar dataKey="revenue" name="Ingresos" fill="oklch(0.62 0.14 162)" radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
