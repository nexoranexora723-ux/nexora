'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  createWorkflowSchema,
  type CreateWorkflowInput,
  type WorkflowTrigger,
  type WorkflowActionType,
  type WorkflowConditionOperator,
} from '@/lib/schemas/workflow.schema'
import { useCreateWorkflow, useUpdateWorkflow } from '@/hooks/use-workflows'
import type { WorkflowView } from '@/server/services/workflow.service'
import { Loader2, Zap, Plus, Trash2, ArrowRight } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

interface WorkflowFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflow?: WorkflowView | null
  preset?: Partial<CreateWorkflowInput> | null
}

const TRIGGER_OPTIONS: { value: WorkflowTrigger; label: string; hint: string }[] = [
  { value: 'product_created', label: 'Producto creado', hint: 'Al dar de alta un producto' },
  { value: 'order_created', label: 'Pedido creado', hint: 'Al registrar una venta' },
  { value: 'inventory_low', label: 'Inventario bajo', hint: 'Stock ≤ mínimo' },
  { value: 'payment_received', label: 'Pago recibido', hint: 'Al confirmar un pago' },
  { value: 'customer_created', label: 'Cliente nuevo', hint: 'Al crear un cliente' },
  { value: 'supplier_created', label: 'Proveedor nuevo', hint: 'Al crear un proveedor' },
  { value: 'manual', label: 'Manual', hint: 'Ejecución bajo demanda' },
  { value: 'scheduled', label: 'Programado', hint: 'Cron / periódico' },
]

const OPERATOR_OPTIONS: { value: WorkflowConditionOperator; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'contains', label: 'contiene' },
  { value: 'in', label: 'en' },
]

const ACTION_OPTIONS: { value: WorkflowActionType; label: string; fields: string[] }[] = [
  { value: 'notify', label: 'Notificación', fields: ['channel', 'priority', 'message'] },
  { value: 'email', label: 'Email', fields: ['template', 'to'] },
  { value: 'create_task', label: 'Crear tarea', fields: ['title', 'assignee'] },
  { value: 'update_record', label: 'Actualizar registro', fields: ['entity', 'field', 'value'] },
  { value: 'api_call', label: 'Llamar API', fields: ['url', 'method'] },
]

export function WorkflowFormDialog({ open, onOpenChange, workflow, preset }: WorkflowFormDialogProps) {
  const isEdit = !!workflow
  const createMut = useCreateWorkflow()
  const updateMut = useUpdateWorkflow()

  const form = useForm<CreateWorkflowInput>({
    resolver: zodResolver(createWorkflowSchema) as never,
    defaultValues: useMemo(() => mapWorkflowToForm(workflow, preset), [workflow, preset]),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form

  const conditionsArr = useFieldArray({ control, name: 'conditions' })
  const actionsArr = useFieldArray({ control, name: 'actions' })

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (open) {
      reset(mapWorkflowToForm(workflow, preset))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerError('')
    }
  }, [open, workflow, preset, reset])

  const onSubmit = async (data: CreateWorkflowInput) => {
    setServerError('')
    try {
      if (isEdit && workflow) {
        await updateMut.mutateAsync({ id: workflow.id, input: data })
      } else {
        await createMut.mutateAsync(data)
      }
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const onError = () => {
    setServerError('Revisa los campos marcados. Hay errores de validación.')
  }

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {isEdit ? 'Editar automatización' : 'Nueva automatización'}
          </DialogTitle>
          <DialogDescription>
            Configura una regla IF-THEN: cuando ocurre un evento, ejecuta acciones.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
          {/* === SECCIÓN 1: Información básica === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">1</span>
              Información básica
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Nombre *</Label>
                <Input id="name" {...register('name')} className="h-9" placeholder="Aviso stock bajo" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs">Descripción</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  rows={2}
                  placeholder="¿Qué hace esta automatización?"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 2: Trigger === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">2</span>
              Disparador (cuándo)
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de disparador *</Label>
                <Controller
                  control={control}
                  name="triggerType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex flex-col">
                              <span>{opt.label}</span>
                              <span className="text-[10px] text-muted-foreground">{opt.hint}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="triggerConfig" className="text-xs">Configuración (JSON, opcional)</Label>
                <Input
                  id="triggerConfig"
                  {...register('triggerConfig')}
                  className="h-9 font-mono text-xs"
                  placeholder='{"threshold":"min_stock"}'
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 3: Conditions === */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">3</span>
                Condiciones (opcional)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => conditionsArr.append({ field: '', operator: 'eq', value: '' })}
              >
                <Plus className="h-3 w-3" /> Añadir
              </Button>
            </div>
            {conditionsArr.fields.length === 0 ? (
              <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                Sin condiciones — el workflow se ejecuta siempre que se dispare.
              </p>
            ) : (
              <div className="space-y-2">
                {conditionsArr.fields.map((c, idx) => (
                  <div key={c.id} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Campo</Label>
                      <Input
                        {...register(`conditions.${idx}.field` as const)}
                        className="h-9"
                        placeholder="order.status"
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Operador</Label>
                      <Controller
                        control={control}
                        name={`conditions.${idx}.operator` as const}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATOR_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Valor</Label>
                      <Input
                        {...register(`conditions.${idx}.value` as const)}
                        className="h-9"
                        placeholder="DELIVERED"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-rose-500"
                      onClick={() => conditionsArr.remove(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* === SECCIÓN 4: Actions === */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">4</span>
                Acciones (entonces)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => actionsArr.append({ type: 'notify', config: {} })}
              >
                <Plus className="h-3 w-3" /> Añadir
              </Button>
            </div>
            {errors.actions && typeof errors.actions.message === 'string' && (
              <p className="text-xs text-rose-500">{errors.actions.message}</p>
            )}
            {actionsArr.fields.length === 0 ? (
              <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                Debes añadir al menos una acción.
              </p>
            ) : (
              <div className="space-y-3">
                {actionsArr.fields.map((a, idx) => (
                  <ActionRow key={a.id} index={idx} control={control} register={register} onRemove={() => actionsArr.remove(idx)} />
                ))}
              </div>
            )}
          </section>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle /> {serverError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Crear automatización'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ActionRow({
  index,
  control,
  register,
  onRemove,
}: {
  index: number
  control: Parameters<typeof Controller>[0]['control']
  register: ReturnType<typeof useForm<CreateWorkflowInput>>['register']
  onRemove: () => void
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <Controller
          control={control}
          name={`actions.${index}.type` as const}
          render={({ field }) => {
            const opt = ACTION_OPTIONS.find((o) => o.value === field.value) ?? ACTION_OPTIONS[0]
            return (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }}
        />
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            <ArrowRight className="mr-1 h-3 w-3" /> Acción {index + 1}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-500"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Controller
          control={control}
          name={`actions.${index}.type` as const}
          render={({ field }) => {
            const opt = ACTION_OPTIONS.find((o) => o.value === field.value) ?? ACTION_OPTIONS[0]
            return (
              <>
                {opt.fields.map((f) => (
                  <div key={f} className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">{f}</Label>
                    <Input
                      {...register(`actions.${index}.config.${f}` as const, { setValueAs: (v: unknown) => v })}
                      className="h-8 text-xs"
                      placeholder={f === 'message' ? 'Stock bajo en {{product.name}}' : `valor de ${f}`}
                    />
                  </div>
                ))}
              </>
            )
          }}
        />
      </div>
    </div>
  )
}

// Lightweight inline AlertCircle to avoid extra import
function AlertCircle() {
  return <span className="inline-block h-4 w-4 shrink-0 rounded-full bg-rose-500 text-[10px] leading-4 text-white text-center">!</span>
}

function mapWorkflowToForm(
  workflow?: WorkflowView | null,
  preset?: Partial<CreateWorkflowInput> | null,
): CreateWorkflowInput {
  if (workflow) {
    return {
      name: workflow.name,
      description: workflow.description ?? '',
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig ? JSON.stringify(workflow.triggerConfig) : '',
      conditions: workflow.conditions ?? [],
      actions: workflow.actions ?? [],
      status: workflow.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    }
  }
  if (preset) {
    return {
      name: '',
      description: '',
      triggerType: 'manual',
      triggerConfig: '',
      conditions: [],
      actions: [{ type: 'notify', config: {} }],
      status: 'ACTIVE',
      ...preset,
    }
  }
  return {
    name: '',
    description: '',
    triggerType: 'manual',
    triggerConfig: '',
    conditions: [],
    actions: [{ type: 'notify', config: {} }],
    status: 'ACTIVE',
  }
}
