'use client'

import { useForm, Controller } from 'react-hook-form'
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
import { createIntegrationSchema, type CreateIntegrationInput } from '@/lib/schemas/integration.schema'
import { useCreateIntegration, useUpdateIntegration } from '@/hooks/use-integrations'
import type { IntegrationView, ProviderMeta } from '@/server/services/integration.service'
import { Loader2, Plug, AlertCircle } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

interface IntegrationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration?: IntegrationView | null
  providerMeta: ProviderMeta | null
}

export function IntegrationFormDialog({
  open,
  onOpenChange,
  integration,
  providerMeta,
}: IntegrationFormDialogProps) {
  const isEdit = !!integration
  const createMut = useCreateIntegration()
  const updateMut = useUpdateIntegration()

  const form = useForm<CreateIntegrationInput>({
    resolver: zodResolver(createIntegrationSchema) as never,
    defaultValues: useMemo(
      () => mapIntegrationToForm(integration, providerMeta),
      [integration, providerMeta],
    ),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = form

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (open) {
      reset(mapIntegrationToForm(integration, providerMeta))
      setServerError('')
    }
  }, [open, integration, providerMeta, reset])

  const onSubmit = async (data: CreateIntegrationInput) => {
    setServerError('')
    try {
      if (isEdit && integration) {
        await updateMut.mutateAsync({ id: integration.id, input: { config: data.config } })
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
  const configValues = watch('config') as Record<string, unknown>

  if (!providerMeta && !isEdit) {
    return null
  }

  const meta = providerMeta ?? {
    provider: integration?.provider ?? '',
    category: integration?.category ?? 'storage',
    displayName: integration?.provider ?? '',
    description: '',
    icon: '🔌',
    fields: [],
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>{meta.icon}</span>
            {isEdit ? `Configurar ${integration?.name}` : `Conectar ${meta.displayName}`}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Edita la configuración de la integración.'
              : meta.description || 'Configura las credenciales del proveedor.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          {/* Hidden selects to satisfy the schema */}
          <input type="hidden" {...register('provider')} />
          <input type="hidden" {...register('category')} />

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Nombre de la integración *</Label>
              <Input
                id="name"
                {...register('name')}
                className="h-9"
                placeholder={`${meta.displayName} — NEXORA`}
              />
              {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
            </div>
          )}

          {/* Provider fields */}
          {meta.fields.length > 0 ? (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">1</span>
                Credenciales
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {meta.fields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={`cfg-${f.key}`} className="text-xs">
                      {f.label}
                      {f.required && <span className="ml-1 text-rose-500">*</span>}
                    </Label>
                    <Controller
                      control={control}
                      name={`config.${f.key}` as const}
                      render={({ field }) => (
                        <Input
                          id={`cfg-${f.key}`}
                          type={f.type === 'password' ? 'password' : f.type === 'url' ? 'url' : 'text'}
                          value={(field.value as string) ?? ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-9"
                          placeholder={f.placeholder}
                        />
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              Este proveedor no requiere configuración adicional.
            </p>
          )}

          {/* Preview of config keys (debug) */}
          {Object.keys(configValues ?? {}).length > 0 && (
            <div className="rounded-lg bg-muted/40 p-2.5 text-[10px] text-muted-foreground">
              <strong>Campos configurados:</strong>{' '}
              {Object.keys(configValues).filter((k) => configValues[k]).join(', ') || 'ninguno aún'}
            </div>
          )}

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              {isEdit ? 'Guardar' : 'Conectar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function mapIntegrationToForm(
  integration?: IntegrationView | null,
  providerMeta?: ProviderMeta | null,
): CreateIntegrationInput {
  if (integration) {
    return {
      provider: integration.provider,
      category: integration.category,
      name: integration.name,
      config: integration.config ?? {},
    }
  }
  if (providerMeta) {
    const initConfig: Record<string, unknown> = {}
    for (const f of providerMeta.fields) initConfig[f.key] = ''
    return {
      provider: providerMeta.provider as CreateIntegrationInput['provider'],
      category: providerMeta.category as CreateIntegrationInput['category'],
      name: `${providerMeta.displayName} — NEXORA`,
      config: initConfig,
    }
  }
  return {
    provider: 'shopify',
    category: 'ecommerce',
    name: '',
    config: {},
  }
}
