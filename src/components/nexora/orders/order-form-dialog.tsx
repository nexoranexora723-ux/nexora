'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createOrderSchema, type CreateOrderInput } from '@/lib/schemas/order.schema'
import { useCreateOrder, useUpdateOrder } from '@/hooks/use-orders'
import type { OrderWithRelations } from '@/server/services/order.service'
import { formatCurrency } from '@/lib/format'
import { Loader2, Plus, Trash2, Receipt, AlertCircle, ShoppingCart, X } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: OrderWithRelations | null
}

interface CustomerLite {
  id: string
  firstName: string
  lastName: string
  email: string
  city: string | null
  status: string
}

interface ProductLite {
  id: string
  sku: string
  name: string
  salePrice: number
  currencyCode: string
  imageUrl: string | null
  stock: number
}

interface CatalogData {
  customers: CustomerLite[]
  products: ProductLite[]
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'SHIPPED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'REFUNDED', label: 'Reembolsado' },
] as const

const PAYMENT_OPTIONS = ['Tarjeta', 'Nequi', 'PayPal', 'Contraentrega'] as const

export function OrderFormDialog({ open, onOpenChange, order }: OrderFormDialogProps) {
  const isEdit = !!order
  const createMut = useCreateOrder()
  const updateMut = useUpdateOrder()
  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ['order-catalog'],
    queryFn: async () => {
      const [custRes, prodRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/products'),
      ])
      const customers = (await custRes.json()) as CustomerLite[]
      const products = (await prodRes.json()) as ProductLite[]
      return { customers, products }
    },
  })

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: useMemo(() => mapOrderToForm(order), [order]),
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
      reset(mapOrderToForm(order))
      setServerError('')
    }
  }, [open, order, reset])

  const watchedItems = watch('items') ?? []

  // Summary calculations (mirror service logic)
  const summary = useMemo(() => {
    const subtotal = watchedItems.reduce(
      (s, i) => s + (Number(i?.unitPrice ?? 0)) * (Number(i?.quantity ?? 0)),
      0,
    )
    const discount = watchedItems.reduce((s, i) => {
      const gross = Number(i?.unitPrice ?? 0) * Number(i?.quantity ?? 0)
      return s + gross * ((Number(i?.discount ?? 0)) / 100)
    }, 0)
    const shipping = subtotal > 200 ? 0 : 12
    const tax = Math.max(0, (subtotal - discount) * 0.19)
    const total = subtotal - discount + shipping + tax
    return { subtotal, discount, shipping, tax, total }
  }, [watchedItems])

  const onSubmit = async (data: CreateOrderInput) => {
    setServerError('')
    try {
      if (isEdit && order) {
        await updateMut.mutateAsync({ id: order.id, input: data })
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

  const onProductChange = (idx: number, productId: string) => {
    const product = catalog?.products.find((p) => p.id === productId)
    if (product) {
      setValue(`items.${idx}.productId`, productId, { shouldValidate: true })
      setValue(`items.${idx}.unitPrice`, product.salePrice, { shouldValidate: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            {isEdit ? `Editar pedido ${order?.number}` : 'Nuevo pedido'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modifica los datos del pedido' : 'Registra una nueva orden de venta'}
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
                <Label className="text-xs">Cliente *</Label>
                <Controller
                  control={control}
                  name="customerId"
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin cliente</SelectItem>
                        {catalog?.customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} {c.city ? `· ${c.city}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.customerId && <p className="text-xs text-rose-500">{errors.customerId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estado</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Método de pago</Label>
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Sin método" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin método</SelectItem>
                        {PAYMENT_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Notas</Label>
              <Textarea id="notes" {...register('notes')} rows={2} placeholder="Notas internas del pedido..." />
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 2: Items === */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">2</span>
                Productos
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => itemsField.append({ productId: '', quantity: 1, unitPrice: 0, discount: 0 })}
              >
                <Plus className="h-3 w-3" /> Añadir línea
              </Button>
            </div>

            {itemsField.fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-xs text-muted-foreground">Agrega al menos un producto al pedido</p>
                <Button type="button" variant="outline" size="sm" className="mt-3 h-7 gap-1 text-xs" onClick={() => itemsField.append({ productId: '', quantity: 1, unitPrice: 0, discount: 0 })}>
                  <Plus className="h-3 w-3" /> Añadir línea
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header (desktop) */}
                <div className="hidden grid-cols-12 gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                  <div className="col-span-5">Producto</div>
                  <div className="col-span-2 text-right">Cant.</div>
                  <div className="col-span-2 text-right">Precio</div>
                  <div className="col-span-1 text-right">Desc.%</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {itemsField.fields.map((field, idx) => {
                  const item = watchedItems[idx]
                  const lineTotal = (Number(item?.unitPrice ?? 0)) * (Number(item?.quantity ?? 0)) * (1 - (Number(item?.discount ?? 0)) / 100)
                  const selectedProduct = catalog?.products.find((p) => p.id === item?.productId)
                  return (
                    <div key={field.id} className="grid grid-cols-12 gap-2 rounded-lg border p-2">
                      {/* Product select */}
                      <div className="col-span-12 sm:col-span-5">
                        <Controller
                          control={control}
                          name={`items.${idx}.productId`}
                          render={({ field: f }) => (
                            <Select value={f.value ?? 'none'} onValueChange={(v) => onProductChange(idx, v === 'none' ? '' : v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— Sin producto —</SelectItem>
                                {catalog?.products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} · {formatCurrency(p.salePrice)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.items?.[idx]?.productId && (
                          <p className="mt-0.5 text-[10px] text-rose-500">{errors.items[idx]?.productId?.message}</p>
                        )}
                        {selectedProduct && (
                          <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
                            <code>{selectedProduct.sku}</code> · stock: {selectedProduct.stock}
                          </p>
                        )}
                      </div>
                      {/* Quantity */}
                      <div className="col-span-3 sm:col-span-2">
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          className="h-8 text-xs tabular-nums"
                          {...register(`items.${idx}.quantity`, { valueAsNumber: true })}
                        />
                      </div>
                      {/* Unit price */}
                      <div className="col-span-4 sm:col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          className="h-8 text-xs tabular-nums"
                          {...register(`items.${idx}.unitPrice`, { valueAsNumber: true })}
                        />
                      </div>
                      {/* Discount % */}
                      <div className="col-span-3 sm:col-span-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          className="h-8 text-xs tabular-nums"
                          {...register(`items.${idx}.discount`, { valueAsNumber: true })}
                        />
                      </div>
                      {/* Line total + remove */}
                      <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-2">
                        <span className="text-xs font-semibold tabular-nums">{formatCurrency(lineTotal)}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => itemsField.remove(idx)}>
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {errors.items && typeof errors.items.message === 'string' && (
              <p className="text-xs text-rose-500">{errors.items.message}</p>
            )}
          </section>

          <Separator />

          {/* === SECCIÓN 3: Summary === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">3</span>
              Resumen
            </h3>
            <div className="rounded-lg border bg-muted/30 p-3">
              <dl className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{formatCurrency(summary.subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Descuento</dt>
                  <dd className="tabular-nums text-rose-600 dark:text-rose-400">−{formatCurrency(summary.discount)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    Envío
                    {summary.shipping === 0 && <Badge variant="secondary" className="ml-1.5 text-[10px]">Gratis</Badge>}
                  </dt>
                  <dd className="tabular-nums">{formatCurrency(summary.shipping)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">IVA (19%)</dt>
                  <dd className="tabular-nums">{formatCurrency(summary.tax)}</dd>
                </div>
                <Separator className="my-1.5" />
                <div className="flex items-center justify-between text-base font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatCurrency(summary.total)}</dd>
                </div>
              </dl>
            </div>
          </section>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Crear pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function mapOrderToForm(order?: OrderWithRelations | null): CreateOrderInput {
  if (!order) {
    return {
      customerId: '',
      status: 'PENDING',
      paymentMethod: '',
      notes: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }],
    }
  }
  return {
    customerId: order.customerId,
    status: order.status as CreateOrderInput['status'],
    paymentMethod: order.paymentMethod ?? '',
    notes: order.notes ?? '',
    items: order.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: 0,
    })),
  }
}
