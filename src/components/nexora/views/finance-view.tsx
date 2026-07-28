'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/nexora/stat-card'
import { Transaction } from '@/lib/types'
import { formatCurrency, formatCompact, formatDate, formatPercent } from '@/lib/format'
import { Wallet, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinanceSummary {
  income: number
  expenses: number
  profit: number
  balance: number
}

interface FinanceData {
  transactions: Transaction[]
  summary: FinanceSummary
  expensesByCategory: { category: string; amount: number }[]
  monthly: { month: string; income: number; expenses: number }[]
}

type Filter = 'all' | 'income' | 'expense'

// Category → color mapping for the bars
const CATEGORY_COLORS = [
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-lime-500',
  'bg-orange-500',
  'bg-teal-500',
]

export function FinanceView() {
  const [filter, setFilter] = useState<Filter>('all')

  const { data, isLoading } = useQuery<FinanceData>({
    queryKey: ['finance'],
    queryFn: async () => {
      const res = await fetch('/api/finance')
      return res.json()
    },
  })

  const summary = data?.summary
  const margin = summary && summary.income > 0 ? (summary.profit / summary.income) * 100 : 0

  const filteredTransactions = useMemo(() => {
    const list = data?.transactions ?? []
    if (filter === 'income') return list.filter((t) => t.type === 'INCOME')
    if (filter === 'expense') return list.filter((t) => t.type === 'EXPENSE')
    return list
  }, [data?.transactions, filter])

  const maxCategoryAmount = useMemo(() => {
    const list = data?.expensesByCategory ?? []
    return list.length > 0 ? Math.max(...list.map((c) => c.amount)) : 0
  }, [data?.expensesByCategory])

  return (
    <div className="space-y-6">
      <PageHeader title="Finanzas" description="Ingresos, gastos y flujo de caja" icon={Wallet} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Ingresos</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {summary ? formatCurrency(summary.income) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              <p className="text-xs text-muted-foreground">Gastos</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {summary ? formatCurrency(summary.expenses) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Utilidad</p>
            </div>
            <p
              className={cn(
                'mt-1 text-2xl font-bold tabular-nums',
                (summary?.profit ?? 0) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {summary ? formatCurrency(summary.profit) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Margen</p>
            </div>
            <p
              className={cn(
                'mt-1 text-2xl font-bold tabular-nums',
                margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {summary ? formatPercent(margin) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash flow chart + expenses by category */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Flujo de caja</CardTitle>
              <CardDescription>Ingresos vs gastos · últimos 6 meses</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'oklch(0.62 0.14 162)' }} /> Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Gastos
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.005 240)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'oklch(0.5 0.01 240)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatCompact(v)}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid oklch(0.91 0.005 240)',
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    formatter={(v: number) => formatCurrency(v)}
                    cursor={{ fill: 'oklch(0.96 0.005 240)' }}
                  />
                  <Bar dataKey="income" name="Ingresos" fill="oklch(0.62 0.14 162)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expenses" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expenses by category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Gastos por categoría
            </CardTitle>
            <CardDescription>Distribución del período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading || !data ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (data.expensesByCategory.length ?? 0) === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Sin gastos registrados</div>
            ) : (
              data.expensesByCategory.map((c, i) => {
                const pct = maxCategoryAmount > 0 ? (c.amount / maxCategoryAmount) * 100 : 0
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{c.category}</span>
                      <span className="tabular-nums text-muted-foreground">{formatCurrency(c.amount)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full transition-all', color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions table */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Transacciones</h3>
              <p className="text-xs text-muted-foreground">{filteredTransactions.length} registros</p>
            </div>
            <div className="flex gap-1.5">
              {(
                [
                  ['all', 'Todos'],
                  ['income', 'Ingresos'],
                  ['expense', 'Gastos'],
                ] as [Filter, string][]
              ).map(([f, label]) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="nexora-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No hay transacciones que mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((t) => {
                    const isIncome = t.type === 'INCOME'
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(t.date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'font-medium',
                              isIncome
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
                            )}
                          >
                            {isIncome ? 'Ingreso' : 'Gasto'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {t.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-sm">{t.description}</p>
                        </TableCell>
                        <TableCell>
                          {t.reference ? <code className="text-xs">{t.reference}</code> : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right text-sm font-semibold tabular-nums',
                            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                          )}
                        >
                          {isIncome ? '+' : '−'}
                          {formatCurrency(t.amount, t.currencyCode)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
