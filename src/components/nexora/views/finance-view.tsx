'use client'

import { useFinance, useDeleteTransaction } from '@/hooks/use-finance'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { PageHeader } from '@/components/nexora/stat-card'
import { TransactionFormDialog } from '@/components/nexora/finance/transaction-form-dialog'
import type { TransactionView } from '@/server/services/finance.service'
import { formatCurrency, formatCompact, formatDate, formatPercent } from '@/lib/format'
import { Wallet, TrendingUp, TrendingDown, DollarSign, PieChart, Plus, MoreHorizontal, Pencil, Trash2, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

type Filter = 'all' | 'income' | 'expense'

// Category label map (Spanish)
const CATEGORY_LABELS: Record<string, string> = {
  SALES: 'Ventas',
  PURCHASES: 'Compras',
  SHIPPING: 'Envíos',
  SALARY: 'Nómina',
  MARKETING: 'Marketing',
  RENT: 'Arriendo',
  UTILITY: 'Servicios',
  COMMISSION: 'Comisiones',
  TAX: 'Impuestos',
  OTHER: 'Otro',
}

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
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TransactionView | null>(null)
  const [defaultType, setDefaultType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [deleteTarget, setDeleteTarget] = useState<TransactionView | null>(null)

  const { toast } = useToast()
  const qc = useQueryClient()
  const deleteMut = useDeleteTransaction()

  const { data, isLoading } = useFinance()

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

  const handleNew = (type: 'INCOME' | 'EXPENSE' = 'EXPENSE') => {
    setEditing(null)
    setDefaultType(type)
    setFormOpen(true)
  }

  const handleEdit = (t: TransactionView) => {
    setEditing(t)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Transacción eliminada', description: deleteTarget.description })
      setDeleteTarget(null)
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo eliminar',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finanzas"
        description="Ingresos, gastos y flujo de caja · CRUD completo"
        icon={Wallet}
        action={
          <Button className="gap-1.5" onClick={() => handleNew('EXPENSE')}>
            <Plus className="h-4 w-4" /> Nueva transacción
          </Button>
        }
      />

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

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Button variant="outline" className="gap-1.5" onClick={() => handleNew('INCOME')}>
          <TrendingUp className="h-4 w-4 text-emerald-500" /> Registrar ingreso
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={() => handleNew('EXPENSE')}>
          <TrendingDown className="h-4 w-4 text-rose-500" /> Registrar gasto
        </Button>
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
                      <span className="font-medium">{CATEGORY_LABELS[c.category] ?? c.category}</span>
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
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-10 w-10 text-muted-foreground/40" />
                        <p>No hay transacciones que mostrar</p>
                        <Button className="mt-2 gap-1.5" size="sm" onClick={() => handleNew('EXPENSE')}>
                          <Plus className="h-4 w-4" /> Nueva transacción
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((t) => {
                    const isIncome = t.type === 'INCOME'
                    const isProtected = t.category === 'SALES' && t.reference?.startsWith('ORD-')
                    return (
                      <TableRow key={t.id} className="group">
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
                            {CATEGORY_LABELS[t.category] ?? t.category}
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
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(t)} disabled={isProtected}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-rose-600"
                                onClick={() => setDeleteTarget(t)}
                                disabled={isProtected}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Form dialog */}
      <TransactionFormDialog open={formOpen} onOpenChange={setFormOpen} transaction={editing} defaultType={defaultType} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.description}</strong> ({formatCurrency(deleteTarget?.amount ?? 0)}).
              Esta acción no se puede deshacer y afectará los totales del período.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
