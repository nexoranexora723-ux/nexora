'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/nexora/stat-card'
import { StatusBadge } from '@/components/nexora/status-badge'
import { Customer } from '@/lib/types'
import { formatCurrency, formatNumber, initials, timeAgo } from '@/lib/format'
import { Users, Plus, Crown, DollarSign, TrendingUp, Mail, MapPin, ShoppingBag, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CustomersView() {
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers')
      return res.json()
    },
  })

  const stats = useMemo(() => {
    const list = customers ?? []
    const vip = list.filter((c) => c.status === 'VIP').length
    const totalLtv = list.reduce((s, c) => s + c.lifetimeValue, 0)
    const totalOrders = list.reduce((s, c) => s + c.totalOrders, 0)
    const avgTicket = totalOrders > 0 ? totalLtv / totalOrders : 0
    return { total: list.length, vip, totalLtv, avgTicket }
  }, [customers])

  const sorted = useMemo(() => {
    const list = customers ?? []
    return [...list].sort((a, b) => b.lifetimeValue - a.lifetimeValue)
  }, [customers])

  const parseTags = (tags: string | null): string[] => {
    if (!tags) return []
    return tags
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="CRM y valor de vida del cliente"
        icon={Users}
        action={
          <Button className="gap-1.5">
            <Plus className="h-4 w-4" /> Nuevo cliente
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total clientes</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Clientes VIP</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{stats.vip}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Valor de vida total</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(stats.totalLtv)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Ticket promedio</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats.avgTicket)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer cards grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
        ) : sorted.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No hay clientes registrados
            </CardContent>
          </Card>
        ) : (
          sorted.map((c) => {
            const tags = parseTags(c.tags)
            const isVip = c.status === 'VIP'
            return (
              <Card key={c.id} className="transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm',
                        isVip
                          ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                          : 'bg-gradient-to-br from-primary to-emerald-700',
                      )}
                      aria-hidden
                    >
                      {initials(c.firstName, c.lastName)}
                    </div>

                    {/* Header */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold">
                          {c.firstName} {c.lastName}
                        </h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{c.email}</span>
                        </a>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {c.city ?? '—'}, {c.country ?? '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          {formatNumber(c.totalOrders)} pedidos
                        </span>
                      </div>
                    </div>

                    {/* LTV */}
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(c.lifetimeValue)}</p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">valor de vida</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
                      {tags.map((t, i) => (
                        <Badge key={`${t}-${i}`} variant="secondary" className="font-normal">
                          {t}
                        </Badge>
                      ))}
                      <span className="ml-auto text-[10px] text-muted-foreground">Cliente desde {timeAgo(c.createdAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* NAIOS insight card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Análisis de NAIOS · Clientes VIP</p>
            <p className="mt-1 text-muted-foreground">
              {stats.vip > 0 ? (
                <>
                  Detectamos <strong className="text-foreground">{stats.vip} cliente(s) VIP</strong> que representan una
                  proporción significativa del valor de vida total. NAIOS recomienda implementar un programa de
                  fidelización exclusivo con beneficios diferenciados (envío prioritario, soporte dedicado y acceso
                  anticipado a nuevos productos) para maximizar la retención y aumentar la frecuencia de compra.
                </>
              ) : (
                <>
                  Aún no se han identificado clientes VIP. NAIOS monitorea continuamente el valor de vida y la
                  frecuencia de compra para detectar candidatos a upgrade automático al estatus VIP.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
