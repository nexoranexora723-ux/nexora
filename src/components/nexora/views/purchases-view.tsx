'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/nexora/stat-card'
import { StatusBadge } from '@/components/nexora/status-badge'
import { PurchaseOrder } from '@/lib/types'
import { formatCurrency, timeAgo } from '@/lib/format'
import { ShoppingCart, Plus, Package, Clock, CheckCircle2, DollarSign } from 'lucide-react'

// Country → flag emoji
const COUNTRY_FLAGS: Record<string, string> = {
  CN: '🇨🇳',
  China: '🇨🇳',
  CO: '🇨🇴',
  Colombia: '🇨🇴',
  US: '🇺🇸',
  HK: '🇭🇰',
}

function flag(country: string | null): string {
  if (!country) return '🌍'
  return COUNTRY_FLAGS[country] ?? '🌍'
}

export function PurchasesView() {
  const { data: purchases, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchases'],
    queryFn: async () => {
      const res = await fetch('/api/purchases')
      return res.json()
    },
  })

  const stats = useMemo(() => {
    const list = purchases ?? []
    const pending = list.filter((p) => p.status === 'PENDING' || p.status === 'APPROVED').length
    const received = list.filter((p) => p.status === 'RECEIVED').length
    const invested = list.reduce((s, p) => s + p.total, 0)
    return { total: list.length, pending, received, invested }
  }, [purchases])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras"
        description="Órdenes de compra a proveedores"
        icon={ShoppingCart}
        action={
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Nueva orden
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total órdenes</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Recibidas</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.received}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Invertido</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(stats.invested)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Órdenes de compra</h3>
            <span className="text-xs text-muted-foreground">{stats.total} registros</span>
          </div>
          <div className="nexora-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Envío</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (purchases?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No hay órdenes de compra registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases?.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <code className="text-xs font-medium">{p.number}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none" aria-hidden>{flag(p.supplier.country)}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{p.supplier.companyName}</p>
                            <p className="text-xs text-muted-foreground">{p.supplier.country ?? '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          {p.items.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {formatCurrency(p.subtotal, p.currencyCode)}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {formatCurrency(p.shippingCost, p.currencyCode)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">
                        {formatCurrency(p.total, p.currencyCode)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{timeAgo(p.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
