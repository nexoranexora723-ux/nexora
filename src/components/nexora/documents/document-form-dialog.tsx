'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  createDocumentSchema,
  type CreateDocumentInput,
  type DocumentCategory,
  type DocumentEntityType,
} from '@/lib/schemas/document.schema'
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-documents'
import type { DocumentView } from '@/server/services/document.service'
import { Loader2, FileText, AlertCircle, Link2 } from 'lucide-react'

interface DocumentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: DocumentView | null
}

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'invoice', label: 'Factura' },
  { value: 'contract', label: 'Contrato' },
  { value: 'catalog', label: 'Catálogo' },
  { value: 'proforma', label: 'Proforma' },
  { value: 'guarantee', label: 'Garantía' },
  { value: 'manual', label: 'Manual' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Otro' },
]

const ENTITY_TYPES: { value: DocumentEntityType; label: string }[] = [
  { value: 'product', label: 'Producto' },
  { value: 'order', label: 'Pedido' },
  { value: 'supplier', label: 'Proveedor' },
  { value: 'customer', label: 'Cliente' },
  { value: 'purchase', label: 'Orden de compra' },
]

export function DocumentFormDialog({ open, onOpenChange, document: doc }: DocumentFormDialogProps) {
  const isEdit = !!doc
  const createMut = useCreateDocument()
  const updateMut = useUpdateDocument()
  const [serverError, setServerError] = useState('')

  const form = useForm<CreateDocumentInput>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: useMemo(() => mapDocToForm(doc), [doc]),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form

  useEffect(() => {
    if (open) {
      reset(mapDocToForm(doc))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerError('')
    }
  }, [open, doc, reset])

  const onSubmit = async (data: CreateDocumentInput) => {
    setServerError('')
    try {
      if (isEdit && doc) {
        await updateMut.mutateAsync({ id: doc.id, input: data })
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
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isEdit ? 'Editar documento' : 'Nuevo documento'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Modificando ${doc?.name} · v${doc?.version}`
              : 'Registra un documento en el gestor documental'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
          {/* === SECCIÓN 1: Información básica === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">1</span>
              Información básica
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Nombre *</Label>
              <Input
                id="name"
                {...register('name')}
                className="h-9"
                placeholder="Factura 2024-001 — Tech Supplier"
              />
              {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="url" className="flex items-center gap-1 text-xs">
                <Link2 className="h-3 w-3" /> URL del documento *
              </Label>
              <Input
                id="url"
                {...register('url')}
                className="h-9"
                placeholder="https://drive.google.com/..."
              />
              {errors.url && <p className="text-xs text-rose-500">{errors.url.message}</p>}
              <p className="text-[11px] text-muted-foreground">
                Enlace directo al archivo (Google Drive, Dropbox, S3, etc.)
              </p>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 2: Clasificación === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">2</span>
              Clasificación
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoría</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tags" className="text-xs">Etiquetas (coma)</Label>
                <Input
                  id="tags"
                  {...register('tags')}
                  className="h-9"
                  placeholder="2024, anual, fiscal"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 3: Relación opcional === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">3</span>
              Relación con entidad (opcional)
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de entidad</Label>
                <Controller
                  control={control}
                  name="entityType"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? '' : (v as DocumentEntityType))}
                    >
                      <SelectTrigger className="h-9"><SelectValue placeholder="Sin relación" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin relación</SelectItem>
                        {ENTITY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entityId" className="text-xs">ID de entidad</Label>
                <Input
                  id="entityId"
                  {...register('entityId')}
                  className="h-9 font-mono text-xs"
                  placeholder="cm..."
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Vincula el documento a un producto, pedido, proveedor, cliente u orden de compra.
            </p>
          </section>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Crear documento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function mapDocToForm(doc?: DocumentView | null): CreateDocumentInput {
  if (!doc) {
    return {
      name: '',
      url: '',
      category: 'general',
      tags: '',
      entityType: '',
      entityId: '',
    }
  }
  return {
    name: doc.name,
    url: doc.url,
    category: doc.category as DocumentCategory,
    tags: doc.tags ?? '',
    entityType: (doc.entityType ?? '') as DocumentEntityType | '',
    entityId: doc.entityId ?? '',
  }
}
