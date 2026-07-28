'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/nexora/stat-card'
import { StatusBadge, RiskBadge } from '@/components/nexora/status-badge'
import { RatingBars } from '@/components/nexora/rating-bars'
import { Supplier } from '@/lib/types'
import {
  Truck, MapPin, MessageCircle, Mail, Globe, Clock, Shield,
  Star, TrendingUp, AlertTriangle, Award, Plus,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function SuppliersView() {
  const [selected, setSelected] = useState<Supplier | null>(null)
  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/suppliers')
      return res.json()
    },
  })

  const sorted = suppliers
    ? [...suppliers].sort((a, b) => (b.rating?.overallScore ?? 0) - (a.rating?.overallScore ?? 0))
    : []

  const avgScore = suppliers && suppliers.length > 0
    ? suppliers.reduce((s, x) => s + (x.rating?.overallScore ?? 0), 0) / suppliers.length
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Abastecimiento internacional con calificación multifactor por NAIOS"
        icon={Truck}
        action={<Button className="gap-1.5"><Plus className="h-4 w-4" /> Nuevo proveedor</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Truck className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Proveedores</p></div><p className="mt-1 text-2xl font-bold">{suppliers?.length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /><p className="text-xs text-muted-foreground">Score promedio</p></div><p className="mt-1 text-2xl font-bold">{avgScore.toFixed(1)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Award className="h-4 w-4 text-emerald-500" /><p className="text-xs text-muted-foreground">Bajo riesgo</p></div><p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{suppliers?.filter((s) => s.riskLevel === 'LOW').length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-500" /><p className="text-xs text-muted-foreground">Alto riesgo</p></div><p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">{suppliers?.filter((s) => s.riskLevel === 'HIGH').length ?? 0}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)
        ) : (
          sorted.map((s) => (
            <Card key={s.id} className={cn('transition-all hover:shadow-md', selected?.id === s.id && 'ring-2 ring-primary')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{s.companyName}</h3>
                      <RiskBadge level={s.riskLevel} />
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.contactName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.city ?? '—'}, {s.country}</span>
                      {s.leadTime && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{s.leadTime}d lead</span>}
                      {s.warranty && <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" />{s.warranty}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-3xl font-bold tabular-nums', (s.rating?.overallScore ?? 0) >= 85 ? 'text-emerald-600 dark:text-emerald-400' : (s.rating?.overallScore ?? 0) >= 70 ? 'text-lime-600 dark:text-lime-400' : (s.rating?.overallScore ?? 0) >= 55 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')}>
                      {(s.rating?.overallScore ?? 0).toFixed(1)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">score</div>
                  </div>
                </div>

                {/* Rating bars */}
                <div className="mt-4">
                  <RatingBars rating={s.rating ?? null} compact={!selected || selected.id !== s.id} />
                </div>

                {/* Tags & products */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
                  <Badge variant="secondary" className="gap-1 font-normal"><Award className="h-3 w-3" /> {s.productCount} productos</Badge>
                  {s.oem && <Badge variant="outline" className="font-normal">OEM</Badge>}
                  {s.odm && <Badge variant="outline" className="font-normal">ODM</Badge>}
                  {s.moq && <Badge variant="outline" className="font-normal">MOQ {s.moq}</Badge>}
                  <div className="ml-auto flex gap-1">
                    {s.whatsapp && (
                      <a href={`https://wa.me/${s.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MessageCircle className="h-4 w-4 text-emerald-600" /></Button>
                      </a>
                    )}
                    {s.email && (
                      <a href={`mailto:${s.email}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Mail className="h-4 w-4" /></Button>
                      </a>
                    )}
                    {s.website && (
                      <a href={`https://${s.website}`} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Globe className="h-4 w-4" /></Button>
                      </a>
                    )}
                  </div>
                </div>

                {selected?.id === s.id && s.rating?.review && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs italic text-muted-foreground">
                    “{s.rating.review}”
                  </div>
                )}

                <Button variant="ghost" size="sm" className="mt-2 h-7 w-full text-xs" onClick={() => setSelected(selected?.id === s.id ? null : s)}>
                  {selected?.id === s.id ? 'Ver menos' : 'Ver detalle'}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* NAIOS insight */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Análisis de NAIOS</p>
            <p className="mt-1 text-muted-foreground">
              Shenzhen TechLink lidera con un score de 92.0 (bajo riesgo). Yiwu Luxury Bags presenta el mayor riesgo (62.0) por baja garantía y calidad inconsistente — NAIOS recomienda diversificar compras hacia Shanghai TimeMaster para mitigar dependencia.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
