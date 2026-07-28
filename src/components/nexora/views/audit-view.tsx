'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { formatNumber, timeAgo } from '@/lib/format'
import {
  Shield, Search, Activity, AlertTriangle, CheckCircle2, XCircle,
  LogIn, LogOut, FileEdit, Trash2, Plus, UserCog,
} from 'lucide-react'
import { useState } from 'react'

const ACTION_ICONS: Record<string, typeof LogIn> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE: Plus,
  UPDATE: FileEdit,
  DELETE: Trash2,
  STATUS_CHANGE: UserCog,
  PASSWORD_CHANGE: Shield,
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Inicio sesión',
  LOGOUT: 'Cerró sesión',
  CREATE: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
  STATUS_CHANGE: 'Cambió estado',
  PASSWORD_CHANGE: 'Cambió clave',
  REVOKE_SESSIONS: 'Revocó sesiones',
}

interface AuditEntry {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string | null
  result: string
  ipAddress: string | null
  metadata: string | null
  createdAt: string
}

export function AuditView() {
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const { data: logs, isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await fetch('/api/audit')
      if (!res.ok) return []
      return res.json()
    },
  })

  const filtered = (logs ?? []).filter((l) => {
    const matchesQuery = !query || l.entity.toLowerCase().includes(query.toLowerCase()) || l.action.toLowerCase().includes(query.toLowerCase())
    const matchesAction = actionFilter === 'all' || l.action === actionFilter
    return matchesQuery && matchesAction
  })

  const stats = logs
    ? {
        total: logs.length,
        success: logs.filter((l) => l.result === 'SUCCESS').length,
        failures: logs.filter((l) => l.result === 'FAILURE').length,
        logins: logs.filter((l) => l.action === 'LOGIN').length,
      }
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría y Seguridad"
        description="Registro completo de actividad del sistema · Trazabilidad total"
        icon={Shield}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total eventos" value={formatNumber(stats?.total ?? 0)} icon={Activity} accent="emerald" />
        <StatCard title="Exitosos" value={formatNumber(stats?.success ?? 0)} icon={CheckCircle2} accent="sky" />
        <StatCard title="Fallidos" value={formatNumber(stats?.failures ?? 0)} icon={XCircle} accent={stats?.failures ? 'rose' : 'zinc'} />
        <StatCard title="Inicios sesión" value={formatNumber(stats?.logins ?? 0)} icon={LogIn} accent="violet" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por entidad o acción..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE'].map((a) => (
                <Button key={a} variant={actionFilter === a ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setActionFilter(a)}>
                  {a === 'all' ? 'Todos' : ACTION_LABELS[a] ?? a}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="nexora-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No hay eventos de auditoría</TableCell></TableRow>
                ) : (
                  filtered.slice(0, 100).map((log) => {
                    const Icon = ACTION_ICONS[log.action] ?? Activity
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{ACTION_LABELS[log.action] ?? log.action}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">{log.entity}</Badge>
                          {log.entityId && <code className="ml-2 text-xs text-muted-foreground">{log.entityId.slice(-8)}</code>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.result === 'SUCCESS' ? 'default' : 'destructive'} className="text-[10px]">
                            {log.result === 'SUCCESS' ? '✓ Éxito' : '✗ Fallo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{log.ipAddress ?? '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{timeAgo(log.createdAt)}</TableCell>
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
