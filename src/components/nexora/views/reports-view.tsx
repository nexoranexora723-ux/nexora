'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { formatCurrency, formatCompact, formatNumber, formatPercent } from '@/lib/format'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Users,
  ShoppingCart, Truck, Wallet, FileText, Activity, Download,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f43f5e', '#14b8a6']

interface ReportData {
  summary: {
    revenue: number
    expenses: number
    profit: number
    profitMargin: number
    totalOrders: number
    totalProducts: number
    totalCustomers: number
    totalSuppliers: number
    lowStockCount: number
    avgOrderValue: number
  }
  monthlyRevenue: { month: string; revenue: number; expenses: number }[]
  topProducts: { name: string; sku: string; sold: number; revenue: number }[]
  ordersByStatus: { status: string; count: number }[]
  categoryRevenue: { category: string; revenue: number }[]
  recentTransactions: { id: string; description: string; amount: number; type: string; date: string }[]
}

export function ReportsView() {
  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      const dashboard = await res.json()
      const finRes = await fetch('/api/finance')
      const finance = await finRes.json()
      return {
        summary: {
          revenue: dashboard.revenue,
          expenses: dashboard.expenses,
          profit: dashboard.profit,
          profitMargin: dashboard.profitMargin,
          totalOrders: dashboard.totalOrders,
          totalProducts: dashboard.totalProducts,
          totalCustomers: dashboard.totalCustomers,
          totalSuppliers: dashboard.activeSuppliers,
          lowStockCount: dashboard.lowStockCount,
          avgOrderValue: dashboard.totalOrders > 0 ? dashboard.revenue / dashboard.totalOrders : 0,
        },
        monthlyRevenue: finance.monthly ?? [],
        topProducts: dashboard.topProducts ?? [],
        ordersByStatus: dashboard.ordersByStatus ?? [],
        categoryRevenue: dashboard.categoryRevenue ?? [],
        recentTransactions: (finance.transactions ?? []).slice(0, 10),
      }
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Intelligence"
        description="Centro de inteligencia empresarial · Análisis consolidado de todos los módulos"
        icon={BarChart3}
        action={
          <button className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted/40">
            <Download className="h-3.5 w-3.5" /> Exportar
          </button>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {isLoading || !data ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard title="Ingresos" value={formatCurrency(data.summary.revenue)} icon={DollarSign} accent="emerald" />
            <StatCard title="Utilidad" value={formatCurrency(data.summary.profit)} icon={TrendingUp} accent={data.summary.profit >= 0 ? 'sky' : 'rose'} subtitle={`Margen ${formatPercent(data.summary.profitMargin)}`} />
            <StatCard title="Ticket promedio" value={formatCurrency(data.summary.avgOrderValue)} icon={ShoppingCart} accent="violet" />
            <StatCard title="Productos" value={formatNumber(data.summary.totalProducts)} icon={Package} accent="amber" subtitle={`${data.summary.lowStockCount} stock bajo`} />
            <StatCard title="Clientes" value={formatNumber(data.summary.totalCustomers)} icon={Users} accent="sky" />
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Monthly revenue vs expenses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ingresos vs Gastos · 6 meses</CardTitle>
            <CardDescription>Tendencia financiera mensual</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 240)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} width={45} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} cursor={{ fill: 'oklch(0.96 0.005 240)' }} />
                  <Bar dataKey="revenue" name="Ingresos" fill="oklch(0.62 0.14 162)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
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
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : data.ordersByStatus.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                    {data.ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top productos por ingresos</CardTitle>
            <CardDescription>Los más rentables</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 240)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }} tickFormatter={(v: number) => formatCompact(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'oklch(0.5 0.01 240)' }} width={100} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} cursor={{ fill: 'oklch(0.96 0.005 240)' }} />
                  <Bar dataKey="revenue" fill="oklch(0.62 0.14 162)" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ingresos por categoría</CardTitle>
            <CardDescription>Distribución de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.categoryRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 240)" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'oklch(0.5 0.01 240)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }} tickFormatter={(v: number) => formatCompact(v)} width={45} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} cursor={{ fill: 'oklch(0.96 0.005 240)' }} />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" /> Movimientos recientes
          </CardTitle>
          <CardDescription>Últimas transacciones financieras</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="nexora-scroll overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Descripción</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((t) => (
                    <tr key={t.id} className="border-b last:border-b-0">
                      <td className="py-2 text-sm">{t.description}</td>
                      <td className="py-2">
                        <Badge variant={t.type === 'INCOME' ? 'default' : 'destructive'} className="text-[10px]">
                          {t.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                        </Badge>
                      </td>
                      <td className={`py-2 text-right text-sm font-semibold tabular-nums ${t.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
