'use client'

import { useState, useMemo } from 'react'
import {
  useIntegrations,
  useDeleteIntegration,
  useConnectIntegration,
  useTestIntegration,
  useIntegrationLogs,
} from '@/hooks/use-integrations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { IntegrationFormDialog } from '@/components/nexora/integrations/integration-form-dialog'
import {
  PROVIDERS,
  PROVIDERS_BY_CATEGORY,
  getProviderMeta,
  type ProviderMeta,
  type IntegrationView,
} from '@/server/services/integration.service'
import type { IntegrationCategory } from '@/lib/schemas/integration.schema'
import { formatNumber, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Plug, Search, MoreHorizontal, Trash2, Settings, Unplug, History,
  Activity, AlertTriangle, CheckCircle2, Loader2, FlaskConical,
} from 'lucide-react'

type CategoryTab = 'all' | IntegrationCategory

const CATEGORY_TABS: { value: CategoryTab; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'payments', label: 'Pagos' },
  { value: 'logistics', label: 'Logística' },
  { value: 'messaging', label: 'Mensajería' },
  { value: 'email', label: 'Email' },
  { value: 'ai', label: 'IA' },
  { value: 'storage', label: 'Storage' },
]

const CATEGORY_LABELS: Record<string, string> = {
  ecommerce: 'E-commerce',
  payments: 'Pagos',
  logistics: 'Logística',
  messaging: 'Mensajería',
  email: 'Email',
  ai: 'IA',
  storage: 'Storage',
}

const STATUS_STYLES: Record<string, string> = {
  CONNECTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  DISCONNECTED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  ERROR: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900',
}

const STATUS_LABELS: Record<string, string> = {
  CONNECTED: 'Conectada',
  DISCONNECTED: 'Desconectada',
  ERROR: 'Error',
}

export function IntegrationsView() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<CategoryTab>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<IntegrationView | null>(null)
  const [providerPreset, setProviderPreset] = useState<ProviderMeta | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IntegrationView | null>(null)
  const [logsFor, setLogsFor] = useState<IntegrationView | null>(null)

  const { toast } = useToast()
  const deleteMut = useDeleteIntegration()
  const connectMut = useConnectIntegration()
  const testMut = useTestIntegration()

  const { data, isLoading } = useIntegrations({
    q: query || undefined,
    category: tab === 'all' ? undefined : tab,
  })

  const items = data?.items ?? []
  const stats = data?.stats ?? { total: 0, active: 0, errors: 0, byCategory: [], syncsToday: 0 }

  // Compute "My integrations" (already connected) vs marketplace providers
  const myIntegrations = useMemo(() => items, [items])
  const connectedProviderKeys = useMemo(
    () => new Set(items.map((i) => i.provider)),
    [items],
  )
  const marketplaceProviders = useMemo(() => {
    if (tab === 'all') return PROVIDERS
    return PROVIDERS_BY_CATEGORY[tab] ?? []
  }, [tab])

  const handleConnect = (p: ProviderMeta) => {
    setEditing(null)
    setProviderPreset(p)
    setFormOpen(true)
  }

  const handleConfigure = (i: IntegrationView) => {
    setEditing(i)
    setProviderPreset(getProviderMeta(i.provider) ?? null)
    setFormOpen(true)
  }

  const handleToggleConnect = async (i: IntegrationView) => {
    const action = i.status === 'CONNECTED' ? 'disconnect' : 'connect'
    try {
      await connectMut.mutateAsync({ id: i.id, action })
      toast({
        title: action === 'connect' ? 'Integración conectada' : 'Integración desconectada',
        description: i.name,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Operación fallida',
        variant: 'destructive',
      })
    }
  }

  const handleTest = async (i: IntegrationView) => {
    try {
      const r = await testMut.mutateAsync(i.id)
      toast({
        title: r.ok ? 'Conexión OK' : 'Falló la prueba',
        description: r.message,
        variant: r.ok ? 'default' : 'destructive',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo probar',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Integración eliminada', description: deleteTarget.name })
      setDeleteTarget(null)
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
        title="Integraciones"
        description="Conecta NEXORA con servicios externos · Shopify, Stripe, DHL y más"
        icon={Plug}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Activas" value={formatNumber(stats.active)} icon={Plug} accent="emerald" subtitle={`${stats.total} total`} />
        <StatCard title="Errores" value={formatNumber(stats.errors)} icon={AlertTriangle} accent={stats.errors > 0 ? 'rose' : 'emerald'} />
        <StatCard title="Categorías" value={formatNumber(stats.byCategory.length)} icon={Settings} accent="violet" subtitle="con integraciones" />
        <StatCard title="Sincronizaciones hoy" value={formatNumber(stats.syncsToday)} icon={Activity} accent="sky" />
      </div>

      {/* Toolbar + tabs */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar integraciones..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as CategoryTab)}>
              <TabsList className="nexora-scroll w-full overflow-x-auto">
                {CATEGORY_TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* My integrations (connected ones) */}
      {myIntegrations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Mis integraciones
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {myIntegrations.length} integración(es) configuradas
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myIntegrations.map((i) => (
                <IntegrationCard
                  key={i.id}
                  integration={i}
                  onConfigure={() => handleConfigure(i)}
                  onToggle={() => handleToggleConnect(i)}
                  onTest={() => handleTest(i)}
                  onLogs={() => setLogsFor(i)}
                  onDelete={() => setDeleteTarget(i)}
                  testing={testMut.isPending && testMut.variables === i.id}
                  toggling={connectMut.isPending && connectMut.variables?.id === i.id}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketplace providers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plug className="h-4 w-4 text-primary" /> Catálogo de conectores
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {marketplaceProviders.length} proveedores disponibles
            {tab !== 'all' && ` en ${CATEGORY_LABELS[tab] ?? tab}`}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {marketplaceProviders.map((p) => {
                const isConnected = connectedProviderKeys.has(p.provider)
                return (
                  <ProviderCard
                    key={p.provider}
                    meta={p}
                    isConnected={isConnected}
                    onConnect={() => handleConnect(p)}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form dialog */}
      <IntegrationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        integration={editing}
        providerMeta={providerPreset}
      />

      {/* Logs dialog */}
      <LogsDialog integration={logsFor} open={!!logsFor} onOpenChange={(o) => !o && setLogsFor(null)} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar integración?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.name}</strong> y todos sus logs.
              Esta acción no se puede deshacer.
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

function IntegrationCard({
  integration,
  onConfigure,
  onToggle,
  onTest,
  onLogs,
  onDelete,
  testing,
  toggling,
}: {
  integration: IntegrationView
  onConfigure: () => void
  onToggle: () => void
  onTest: () => void
  onLogs: () => void
  onDelete: () => void
  testing: boolean
  toggling: boolean
}) {
  const meta = getProviderMeta(integration.provider)
  const status = integration.status
  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl" aria-hidden>{meta?.icon ?? '🔌'}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{integration.name}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {meta?.displayName ?? integration.provider}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onConfigure}>
                <Settings className="mr-2 h-3.5 w-3.5" /> Configurar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTest} disabled={testing}>
                {testing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="mr-2 h-3.5 w-3.5" />}
                Probar conexión
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogs}>
                <History className="mr-2 h-3.5 w-3.5" /> Ver logs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle} disabled={toggling}>
                {status === 'CONNECTED' ? (
                  <><Unplug className="mr-2 h-3.5 w-3.5" /> Desconectar</>
                ) : (
                  <><Plug className="mr-2 h-3.5 w-3.5" /> Conectar</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-600" onClick={onDelete}>
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn('text-[10px]', STATUS_STYLES[status] ?? STATUS_STYLES.DISCONNECTED)}>
            {STATUS_LABELS[status] ?? status}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {CATEGORY_LABELS[integration.category] ?? integration.category}
          </Badge>
          {integration._count && integration._count.logs > 0 && (
            <Badge variant="outline" className="text-[10px]">
              <History className="mr-1 h-3 w-3" /> {integration._count.logs} logs
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          {integration.lastSyncAt ? (
            <span className="inline-flex items-center gap-1">
              <Activity className="h-3 w-3" /> Última sync: {timeAgo(integration.lastSyncAt)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Activity className="h-3 w-3" /> Sin sincronizar
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-3">
          {status === 'CONNECTED' ? (
            <>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onTest} disabled={testing}>
                {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <FlaskConical className="h-3 w-3" />}
                Probar
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onConfigure}>
                <Settings className="h-3 w-3" /> Configurar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onLogs}>
                <History className="h-3 w-3" /> Logs
              </Button>
            </>
          ) : (
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={onToggle} disabled={toggling}>
              {toggling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />}
              Conectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ProviderCard({
  meta,
  isConnected,
  onConnect,
}: {
  meta: ProviderMeta
  isConnected: boolean
  onConnect: () => void
}) {
  return (
    <Card className="group flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl" aria-hidden>{meta.icon}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{meta.displayName}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[meta.category] ?? meta.category}
              </p>
            </div>
          </div>
          {isConnected && (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Conectado
            </Badge>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {meta.description}
        </p>
        <div className="mt-auto pt-3">
          {isConnected ? (
            <Button variant="outline" size="sm" className="h-7 w-full gap-1 text-xs" disabled>
              <CheckCircle2 className="h-3 w-3" /> Ya conectado
            </Button>
          ) : (
            <Button size="sm" className="h-7 w-full gap-1 text-xs" onClick={onConnect}>
              <Plug className="h-3 w-3" /> Conectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LogsDialog({
  integration,
  open,
  onOpenChange,
}: {
  integration: IntegrationView | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { data, isLoading } = useIntegrationLogs(integration?.id ?? null)
  const items = data?.items ?? []
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Logs — {integration?.name}
          </DialogTitle>
          <DialogDescription>
            Últimos 50 logs de la integración.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay logs. Ejecuta una prueba de conexión para generar uno.
          </div>
        ) : (
          <div className="max-h-[55vh] space-y-2 overflow-y-auto nexora-scroll">
            {items.map((l) => (
              <div key={l.id} className="rounded-lg border p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {l.status === 'SUCCESS' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                    )}
                    <span className="text-xs font-medium">{l.status}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {l.direction === 'in' ? 'Entrada' : 'Salida'}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(l.createdAt)}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  {l.statusCode && (
                    <Badge variant="secondary" className="text-[10px]">HTTP {l.statusCode}</Badge>
                  )}
                  {l.duration != null && (
                    <span className="tabular-nums">{l.duration} ms</span>
                  )}
                </div>
                {l.error && <p className="mt-1 text-[11px] text-rose-500">{l.error}</p>}
                {l.response && (
                  <pre className="mt-1.5 overflow-x-auto rounded bg-muted p-2 text-[10px]">
                    {JSON.stringify(l.response, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
