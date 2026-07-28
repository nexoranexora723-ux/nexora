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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { createPurchaseSchema, type CreatePurchaseInput } from '@/lib/schemas/purchase.schema'
import { useCreatePurchase, useUpdatePurchase } from '@/hooks/use-purchases'
import type { PurchaseWithRelations } from '@/server/services/purchase.service'
import { useProducts } from '@/hooks/use-products'
import { useSuppliers } from '@/hooks/use-suppliers'
import { formatCurrency } from '@/lib/format'
import { Loader2, Plus, Trash2, ShoppingCart, AlertCircle, Package } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

interface PurchaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase?: PurchaseWithRelations | null
}

interface CatalogData {
  suppliers: { id: string; companyName: string }[]
}

const STATUS_OPTIONS: { value: CreatePurchaseInput['status']; label: string }[] = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'APPROVED', label: 'Aprobada' },
  { value: 'SHIPPED', label: 'En tránsito' },
  { value: 'RECEIVED', label: 'Recibida' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

// Compute line total: (unitCost * quantity) * (1 - discount/100)
function lineTotal(qty: number, unitCost: number, discount: number): number {
  const gross = qty * unitCost
  return Math.max(0, gross - gross * (discount / 100))
}

export function PurchaseFormDialog({ open, onOpenChange, purchase }: PurchaseFormDialogProps) {
  const isEdit = !!purchase
  const createMut = useCreatePurchase()
  const updateMut = useUpdatePurchase()

  const { data: products } = useProducts({ sort: 'name' })
  const { data: suppliers } = useSuppliers()
  const supplierList: CatalogData['suppliers'] = useMemo(
    () => (suppliers ?? []).map((s) => ({ id: s.id, companyName: s.companyName })),
    [suppliers],
  )

  const form = useForm<CreatePurchaseInput>({
    resolver: zodResolver(createPurchaseSchema),
    defaultValues: useMemo(() => mapPurchaseToForm(purchase), [purchase]),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = form

  const itemsField = useFieldArray({ control, name: 'items' })
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (open) {
      reset(mapPurchaseToForm(purchase))
      setServerError('')
    }
  }, [open, purchase, reset])

  // Watch items + shipping + tax to compute totals live
  const items = watch('items') ?? []
  const shippingCost = watch('shippingCost') ?? 0
  const tax = watch('tax') ?? 0

  const subtotal = useMemo(
    () =>
      items.reduce(
        (s, it) => s + lineTotal(it.quantity ?? 0, it.unitCost ?? 0, it.discount ?? 0),
        0,
      ),
    [items],
  )
  const total = subtotal + (shippingCost || 0) + (tax || 0)

  const onSubmit = async (data: CreatePurchaseInput) => {
    setServerError('')
    try {
      if (isEdit && purchase) {
        await updateMut.mutateAsync({ id: purchase.id, input: data })
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
  const isReadOnly = purchase?.status === 'RECEIVED' || purchase?.status === 'CANCELLED'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {isEdit ? `Editar ${purchase?.number}` : 'Nueva orden de compra'}
          </DialogTitle>
          <DialogDescription>
            {isReadOnly
              ? `Orden ${purchase?.status === 'RECEIVED' ? 'recibida' : 'cancelada'} — solo lectura`
              : isEdit
                ? 'Modifica los items y datos de la orden'
                : 'Genera una orden de compra a un proveedor'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
          {/* === SECCIÓN 1: General === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">1</span>
              Información general
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Proveedor *</Label>
                <Controller
                  control={control}
                  name="supplierId"
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin proveedor</SelectItem>
                        {supplierList.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.supplierId && <p className="text-xs text-rose-500">{errors.supplierId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estado</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isReadOnly}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expectedDate" className="text-xs">Fecha esperada de entrega</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  {...register('expectedDate')}
                  className="h-9"
                  disabled={isReadOnly}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Notas</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                rows={2}
                placeholder="Instrucciones especiales, condiciones comerciales..."
                disabled={isReadOnly}
              />
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 2: Items === */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">2</span>
                Items de la orden
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() =>
                  itemsField.append({ productId: '', quantity: 1, unitCost: 0, discount: 0 })
                }
                disabled={isReadOnly}
              >
                <Plus className="h-3 w-3" /> Añadir item
              </Button>
            </div>

            {itemsField.fields.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Sin items. Añade al menos un producto a la orden.
              </p>
            ) : (
              <div className="space-y-2">
                {itemsField.fields.map((field, idx) => {
                  const item = items[idx]
                  const qty = item?.quantity ?? 0
                  const unitCost = item?.unitCost ?? 0
                  const discount = item?.discount ?? 0
                  const lt = lineTotal(qty, unitCost, discount)
                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 rounded-lg border p-2.5"
                    >
                      {/* Product select */}
                      <div className="col-span-12 sm:col-span-5">
                        <Label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">Producto</Label>
                        <Controller
                          control={control}
                          name={`items.${idx}.productId`}
                          render={({ field: f }) => (
                            <Select
                              value={f.value || 'none'}
                              onValueChange={(v) => {
                                f.onChange(v === 'none' ? '' : v)
                                // Auto-fill unitCost from product's purchasePrice
                                const p = products?.find((x) => x.id === v)
                                if (p) setValue(`items.${idx}.unitCost`, p.purchasePrice)
                              }}
                              disabled={isReadOnly}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Selecciona..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">—</SelectItem>
                                {products?.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <span className="font-mono text-[10px] text-muted-foreground">{p.sku}</span>{' '}
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.items?.[idx]?.productId && (
                          <p className="mt-0.5 text-[10px] text-rose-500">{errors.items[idx]?.productId?.message}</p>
                        )}
                      </div>
                      {/* Quantity */}
                      <div className="col-span-3 sm:col-span-2">
                        <Label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">Cantidad</Label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                          className="h-8 text-xs tabular-nums"
                          disabled={isReadOnly}
                        />
                        {errors.items?.[idx]?.quantity && (
                          <p className="mt-0.5 text-[10px] text-rose-500">{errors.items[idx]?.quantity?.message}</p>
                        )}
                      </div>
                      {/* Unit cost */}
                      <div className="col-span-4 sm:col-span-2">
                        <Label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">Costo unit.</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          {...register(`items.${idx}.unitCost`, { valueAsNumber: true })}
                          className="h-8 text-xs tabular-nums"
                          disabled={isReadOnly}
                        />
                      </div>
                      {/* Discount */}
                      <div className="col-span-3 sm:col-span-1">
                        <Label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">Desc. %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          {...register(`items.${idx}.discount`, { valueAsNumber: true })}
                          className="h-8 text-xs tabular-nums"
                          disabled={isReadOnly}
                        />
                      </div>
                      {/* Line total + remove */}
                      <div className="col-span-2 flex flex-col items-end sm:col-span-2">
                        <Label className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">Subtotal</Label>
                        <div className="flex w-full items-center gap-1">
                          <div className="flex-1 text-right text-xs font-semibold tabular-nums">
                            {formatCurrency(lt)}
                          </div>
                          {!isReadOnly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => itemsField.remove(idx)}
                              aria-label="Eliminar item"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-xs text-rose-500">{errors.items.message}</p>
            )}
          </section>

          <Separator />

          {/* === SECCIÓN 3: Resumen === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">3</span>
              Resumen financiero
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="shippingCost" className="text-xs">Costo de envío</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('shippingCost', { valueAsNumber: true })}
                  className="h-9 tabular-nums"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax" className="text-xs">Impuesto (0%)</Label>
                <Input
                  id="tax"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register('tax', { valueAsNumber: true })}
                  className="h-9 tabular-nums"
                  disabled={isReadOnly}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Items en la orden</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3">
                  <Badge variant="secondary" className="gap-1 tabular-nums">
                    <Package className="h-3 w-3" /> {itemsField.fields.length}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Totales */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Subtotal (items)</span>
                <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Envío</span>
                <span className="font-medium tabular-nums">{formatCurrency(shippingCost || 0)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Impuesto</span>
                <span className="font-medium tabular-nums">{formatCurrency(tax || 0)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                {isEdit ? 'Guardar cambios' : 'Crear orden'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function mapPurchaseToForm(purchase?: PurchaseWithRelations | null): CreatePurchaseInput {
  if (!purchase) {
    return {
      supplierId: '',
      status: 'DRAFT',
      expectedDate: '',
      notes: '',
      shippingCost: 0,
      tax: 0,
      items: [{ productId: '', quantity: 1, unitCost: 0, discount: 0 }],
    }
  }
  return {
    supplierId: purchase.supplierId,
    status: purchase.status as CreatePurchaseInput['status'],
    expectedDate: purchase.expectedDate ? purchase.expectedDate.split('T')[0] : '',
    notes: purchase.notes ?? '',
    shippingCost: purchase.shippingCost,
    tax: purchase.tax,
    items:
      purchase.items.length > 0
        ? purchase.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitCost: it.unitCost,
            discount: it.discount ?? 0,
          }))
        : [{ productId: '', quantity: 1, unitCost: 0, discount: 0 }],
  }
}
