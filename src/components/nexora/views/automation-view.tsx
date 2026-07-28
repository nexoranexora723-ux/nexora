'use client'

import { useState, useMemo } from 'react'
import {
  useWorkflows,
  useDeleteWorkflow,
  useToggleWorkflow,
  useExecuteWorkflow,
  useWorkflowExecutions,
} from '@/hooks/use-workflows'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
import { StatusBadge } from '@/components/nexora/status-badge'
import { WorkflowFormDialog } from '@/components/nexora/automation/workflow-form-dialog'
import { WORKFLOW_TEMPLATES, type WorkflowTemplate, type WorkflowView } from '@/server/services/workflow.service'
import type { CreateWorkflowInput } from '@/lib/schemas/workflow.schema'
import { formatNumber, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Zap, Search, Plus, MoreHorizontal, Pencil, Trash2, Play,
  AlertTriangle, UserPlus, PackageCheck, CreditCard, ShoppingCart,
  Activity, CheckCircle2, XCircle, Loader2, ArrowRight, History,
} from 'lucide-react'

const TEMPLATE_ICONS: Record<string, typeof AlertTriangle> = {
  AlertTriangle,
  UserPlus,
  PackageCheck,
  CreditCard,
  ShoppingCart,
}

const TRIGGER_LABELS: Record<string, string> = {
  product_created: 'Producto creado',
  order_created: 'Pedido creado',
  inventory_low: 'Inventario bajo',
  payment_received: 'Pago recibido',
  customer_created: 'Cliente nuevo',
  supplier_created: 'Proveedor nuevo',
  manual: 'Manual',
  scheduled: 'Programado',
}

const ACTION_LABELS: Record<string, string> = {
  notify: 'Notificar',
  email: 'Email',
  create_task: 'Crear tarea',
  update_record: 'Actualizar registro',
  api_call: 'Llamar API',
}

export function AutomationView() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WorkflowView | null>(null)
  const [preset, setPreset] = useState<Partial<CreateWorkflowInput> | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkflowView | null>(null)
  const [historyFor, setHistoryFor] = useState<WorkflowView | null>(null)

  const { toast } = useToast()
  const deleteMut = useDeleteWorkflow()
  const toggleMut = useToggleWorkflow()
  const executeMut = useExecuteWorkflow()

  const { data, isLoading } = useWorkflows({
    q: query || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })

  const items = data?.items ?? []
  const stats = data?.stats ?? { total: 0, active: 0, inactive: 0, runsToday: 0, errors: 0 }

  const handleNew = () => {
    setEditing(null)
    setPreset(null)
    setFormOpen(true)
  }

  const handleEdit = (w: WorkflowView) => {
    setEditing(w)
    setPreset(null)
    setFormOpen(true)
  }

  const handleTemplate = (tpl: WorkflowTemplate) => {
    setEditing(null)
    setPreset({
      name: tpl.label,
      description: tpl.description,
      triggerType: tpl.triggerType,
      triggerConfig: tpl.triggerConfig ? JSON.stringify(tpl.triggerConfig) : '',
      conditions: tpl.conditions,
      actions: tpl.actions,
    })
    setFormOpen(true)
  }

  const handleToggle = async (w: WorkflowView) => {
    try {
      await toggleMut.mutateAsync(w.id)
      toast({
        title: 'Estado actualizado',
        description: `${w.name} → ${w.status === 'ACTIVE' ? 'Inactiva' : 'Activa'}`,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo cambiar el estado',
        variant: 'destructive',
      })
    }
  }

  const handleExecute = async (w: WorkflowView) => {
    try {
      const exec = await executeMut.mutateAsync(w.id)
      toast({
        title: 'Ejecución completada',
        description: `${w.name} → ${exec.status === 'COMPLETED' ? 'OK' : 'Falló'}`,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo ejecutar',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Automatización eliminada', description: deleteTarget.name })
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
        title="Automatización"
        description="Workflows y reglas IF-THEN · Ejecuta acciones automáticas"
        icon={Zap}
        action={
          <Button className="gap-1.5" onClick={handleNew}>
            <Plus className="h-4 w-4" /> Nueva automatización
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Activas" value={formatNumber(stats.active)} icon={Zap} accent="emerald" subtitle={`${stats.total} total`} />
        <StatCard title="Inactivas" value={formatNumber(stats.inactive)} icon={Zap} accent="zinc" />
        <StatCard title="Ejecuciones hoy" value={formatNumber(stats.runsToday)} icon={Activity} accent="sky" />
        <StatCard title="Errores" value={formatNumber(stats.errors)} icon={AlertTriangle} accent={stats.errors > 0 ? 'rose' : 'emerald'} />
      </div>

      {/* Templates gallery */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles /> Plantillas rápidas
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Haz clic en una plantilla para pre-rellenar el formulario.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {WORKFLOW_TEMPLATES.map((tpl) => {
              const Icon = TEMPLATE_ICONS[tpl.icon] ?? Zap
              return (
                <button
                  key={tpl.key}
                  onClick={() => handleTemplate(tpl)}
                  className="group flex flex-col gap-2 rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{tpl.label}</span>
                  </div>
                  <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {tpl.description}
                  </p>
                  <div className="mt-auto flex items-center gap-1 text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="h-3 w-3" /> Crear desde plantilla
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar automatizaciones..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'Todas' : s === 'ACTIVE' ? 'Activas' : 'Inactivas'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflows list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No hay automatizaciones</p>
            <p className="text-xs text-muted-foreground">
              Crea una desde cero o usa una plantilla de arriba
            </p>
            <Button className="mt-4 gap-1.5" onClick={handleNew}>
              <Plus className="h-4 w-4" /> Nueva automatización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((w) => (
            <WorkflowCard
              key={w.id}
              workflow={w}
              onEdit={() => handleEdit(w)}
              onToggle={() => handleToggle(w)}
              onExecute={() => handleExecute(w)}
              onDelete={() => setDeleteTarget(w)}
              onHistory={() => setHistoryFor(w)}
              busy={executeMut.isPending && executeMut.variables === w.id}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <WorkflowFormDialog open={formOpen} onOpenChange={setFormOpen} workflow={editing} preset={preset} />

      {/* History dialog */}
      <ExecutionHistoryDialog workflow={historyFor} open={!!historyFor} onOpenChange={(o) => !o && setHistoryFor(null)} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar automatización?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.name}</strong> y todo su historial de ejecuciones.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function WorkflowCard({
  workflow,
  onEdit,
  onToggle,
  onExecute,
  onDelete,
  onHistory,
  busy,
}: {
  workflow: WorkflowView
  onEdit: () => void
  onToggle: () => void
  onExecute: () => void
  onDelete: () => void
  onHistory: () => void
  busy: boolean
}) {
  const isActive = workflow.status === 'ACTIVE'
  return (
    <Card className={cn('transition-all', isActive && 'ring-1 ring-primary/20')}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: name + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{workflow.name}</h3>
              <StatusBadge status={workflow.status} />
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Activity className="h-3 w-3" /> {workflow.runCount} ejec.
              </Badge>
              {workflow.lastRunAt && (
                <span className="text-[10px] text-muted-foreground">
                  Última: {timeAgo(workflow.lastRunAt)}
                </span>
              )}
            </div>
            {workflow.description && (
              <p className="mt-1 text-xs text-muted-foreground">{workflow.description}</p>
            )}

            {/* Visual flow: trigger → conditions → actions */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <FlowChip label="CUANDO" tone="violet">
                {TRIGGER_LABELS[workflow.triggerType] ?? workflow.triggerType}
              </FlowChip>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              {workflow.conditions.length > 0 ? (
                <>
                  <FlowChip label="SI" tone="amber">
                    {workflow.conditions.length} condición(es)
                  </FlowChip>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </>
              ) : null}
              <FlowChip label="ENTONCES" tone="emerald">
                {workflow.actions.map((a) => ACTION_LABELS[a.type] ?? a.type).join(' + ')}
              </FlowChip>
            </div>
          </div>

          {/* Right: switch + dropdown */}
          <div className="flex items-center gap-2 lg:shrink-0">
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={onToggle} aria-label="Activar/desactivar" />
              <span className="text-[10px] font-medium uppercase text-muted-foreground">
                {isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExecute} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5" />}
                  Ejecutar ahora
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onHistory}>
                  <History className="mr-2 h-3.5 w-3.5" /> Ver ejecuciones
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-rose-600" onClick={onDelete}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FlowChip({
  label,
  tone,
  children,
}: {
  label: string
  tone: 'violet' | 'amber' | 'emerald'
  children: React.ReactNode
}) {
  const tones = {
    violet: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
  }[tone]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1', tones)}>
      <span className="text-[9px] uppercase tracking-wide opacity-70">{label}</span>
      <span>{children}</span>
    </span>
  )
}

function ExecutionHistoryDialog({
  workflow,
  open,
  onOpenChange,
}: {
  workflow: WorkflowView | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { data, isLoading } = useWorkflowExecutions(workflow?.id ?? null)
  const items = data?.items ?? []
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Ejecuciones — {workflow?.name}
          </DialogTitle>
          <DialogDescription>
            Últimas 50 ejecuciones del workflow.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay ejecuciones. Pulsa "Ejecutar ahora" para lanzar una.
          </div>
        ) : (
          <div className="max-h-[55vh] space-y-2 overflow-y-auto nexora-scroll">
            {items.map((e) => (
              <div key={e.id} className="flex items-start gap-2 rounded-lg border p-2.5">
                <div className="mt-0.5">
                  {e.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : e.status === 'FAILED' ? (
                    <XCircle className="h-4 w-4 text-rose-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{e.status}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(e.startedAt)}</span>
                  </div>
                  {e.error && <p className="text-[11px] text-rose-500">{e.error}</p>}
                  {e.result && (
                    <p className="text-[11px] text-muted-foreground">
                      {e.result.actionsExecuted ?? 0} acción(es) · {e.result.durationMs ?? 0} ms
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Inline Sparkles icon (avoid extra import)
function Sparkles() {
  return (
    <span className="text-base" aria-hidden>✨</span>
  )
}
