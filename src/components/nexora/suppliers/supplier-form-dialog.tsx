'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { createSupplierSchema, type CreateSupplierInput } from '@/lib/schemas/supplier.schema'
import { useCreateSupplier, useUpdateSupplier } from '@/hooks/use-suppliers'
import type { SupplierWithRelations } from '@/server/services/supplier.service'
import { Loader2, Truck, AlertCircle, Star } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: SupplierWithRelations | null
}

const RATING_DIMENSIONS = [
  { key: 'communicationScore' as const, label: 'Comunicación' },
  { key: 'qualityScore' as const, label: 'Calidad' },
  { key: 'priceScore' as const, label: 'Precio' },
  { key: 'shippingScore' as const, label: 'Envío' },
  { key: 'warrantyScore' as const, label: 'Garantía' },
  { key: 'trustScore' as const, label: 'Confianza' },
]

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 70) return 'text-lime-600 dark:text-lime-400'
  if (score >= 55) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

export function SupplierFormDialog({ open, onOpenChange, supplier }: SupplierFormDialogProps) {
  const isEdit = !!supplier
  const createMut = useCreateSupplier()
  const updateMut = useUpdateSupplier()

  const form = useForm<CreateSupplierInput>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: useMemo(() => mapSupplierToForm(supplier), [supplier]),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = form

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (open) {
      reset(mapSupplierToForm(supplier))
      setServerError('')
    }
  }, [open, supplier, reset])

  const onSubmit = async (data: CreateSupplierInput) => {
    setServerError('')
    try {
      if (isEdit && supplier) {
        await updateMut.mutateAsync({ id: supplier.id, input: data })
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

  // Live overall rating preview
  const ratingWatch = watch('rating')
  const overallPreview = useMemo(() => {
    if (!ratingWatch) return 0
    const sum =
      (ratingWatch.communicationScore ?? 0) +
      (ratingWatch.qualityScore ?? 0) +
      (ratingWatch.priceScore ?? 0) +
      (ratingWatch.shippingScore ?? 0) +
      (ratingWatch.warrantyScore ?? 0) +
      (ratingWatch.trustScore ?? 0)
    return Math.round((sum / 6) * 10) / 10
  }, [ratingWatch])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? `Modificando ${supplier?.companyName}` : 'Completa la información del proveedor'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
          {/* === SECCIÓN 1: Información general === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">1</span>
              Información general
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="companyName" className="text-xs">Empresa *</Label>
                <Input id="companyName" {...register('companyName')} className="h-9" placeholder="Shenzhen TechLink Co., Ltd." />
                {errors.companyName && <p className="text-xs text-rose-500">{errors.companyName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactName" className="text-xs">Contacto</Label>
                <Input id="contactName" {...register('contactName')} className="h-9" placeholder="Wei Chen" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" {...register('email')} className="h-9" placeholder="sales@techlink.cn" />
                {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="text-xs">WhatsApp</Label>
                <Input id="whatsapp" {...register('whatsapp')} className="h-9" placeholder="+86 138 0013 8000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wechat" className="text-xs">WeChat</Label>
                <Input id="wechat" {...register('wechat')} className="h-9" placeholder="techlink_sales" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs">Sitio web</Label>
                <Input id="website" {...register('website')} className="h-9" placeholder="techlink.cn" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="yupoo" className="text-xs">Yupoo</Label>
                <Input id="yupoo" {...register('yupoo')} className="h-9" placeholder="x.yupoo.com/..." />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 2: Ubicación === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">2</span>
              Ubicación
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs">País (código ISO 2)</Label>
                <Input id="country" {...register('country')} className="h-9" placeholder="CN" maxLength={2} />
                {errors.country && <p className="text-xs text-rose-500">{errors.country.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs">Ciudad</Label>
                <Input id="city" {...register('city')} className="h-9" placeholder="Shenzhen" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs">Dirección</Label>
                <Input id="address" {...register('address')} className="h-9" placeholder="Huaqiangbei Rd" />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 3: Comercial === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">3</span>
              Comercial
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="moq" className="text-xs">MOQ (cant. mínima)</Label>
                <Input id="moq" type="number" step="1" {...register('moq', { valueAsNumber: true })} className="h-9" placeholder="50" />
                {errors.moq && <p className="text-xs text-rose-500">{errors.moq.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leadTime" className="text-xs">Lead time (días)</Label>
                <Input id="leadTime" type="number" step="1" {...register('leadTime', { valueAsNumber: true })} className="h-9" placeholder="7" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="productionTime" className="text-xs">Tiempo producción (días)</Label>
                <Input id="productionTime" type="number" step="1" {...register('productionTime', { valueAsNumber: true })} className="h-9" placeholder="15" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="paymentMethods" className="text-xs">Métodos de pago</Label>
                <Input id="paymentMethods" {...register('paymentMethods')} className="h-9" placeholder="T/T, Western Union, Alibaba" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shippingMethods" className="text-xs">Métodos de envío</Label>
                <Input id="shippingMethods" {...register('shippingMethods')} className="h-9" placeholder="DHL, FedEx, sea freight" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="warranty" className="text-xs">Garantía</Label>
              <Input id="warranty" {...register('warranty')} className="h-9" placeholder="12 meses" />
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="oem"
                  render={({ field }) => (
                    <Checkbox
                      id="oem"
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  )}
                />
                <Label htmlFor="oem" className="cursor-pointer text-xs font-normal">OEM (fabricación propia)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="odm"
                  render={({ field }) => (
                    <Checkbox
                      id="odm"
                      checked={!!field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  )}
                />
                <Label htmlFor="odm" className="cursor-pointer text-xs font-normal">ODM (diseño personalizado)</Label>
              </div>
              {errors.oem && <p className="text-xs text-rose-500">{errors.oem.message}</p>}
              {errors.odm && <p className="text-xs text-rose-500">{errors.odm.message}</p>}
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 4: Riesgo y estado === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">4</span>
              Riesgo y estado
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nivel de riesgo</Label>
                <Controller
                  control={control}
                  name="riskLevel"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Bajo</SelectItem>
                        <SelectItem value="MEDIUM">Medio</SelectItem>
                        <SelectItem value="HIGH">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="INACTIVE">Inactivo</SelectItem>
                        <SelectItem value="BLACKLISTED">Lista negra</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 5: Calificación NAIOS (opcional) === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">5</span>
              Calificación NAIOS (opcional)
            </h3>
            <p className="text-xs text-muted-foreground">
              Califica 6 dimensiones (0-100). El score global se calcula automáticamente. Si todas están en 0 no se creará calificación.
            </p>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium">Score global</span>
              </div>
              <Badge variant="outline" className={cn('tabular-nums text-sm', scoreColor(overallPreview))}>
                {overallPreview.toFixed(1)} / 100
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {RATING_DIMENSIONS.map((d) => (
                <Controller
                  key={d.key}
                  control={control}
                  name={`rating.${d.key}` as const}
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{d.label}</Label>
                        <span className={cn('text-xs font-semibold tabular-nums', scoreColor(field.value ?? 0))}>
                          {field.value ?? 0}
                        </span>
                      </div>
                      <Slider
                        value={[field.value ?? 0]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(v) => field.onChange(v[0])}
                      />
                    </div>
                  )}
                />
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rating.review" className="text-xs">Reseña</Label>
              <Textarea
                id="rating.review"
                {...register('rating.review')}
                rows={2}
                placeholder="Comentarios adicionales sobre el proveedor..."
              />
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
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function mapSupplierToForm(supplier?: SupplierWithRelations | null): CreateSupplierInput {
  const base = {
    companyName: supplier?.companyName ?? '',
    contactName: supplier?.contactName ?? '',
    whatsapp: supplier?.whatsapp ?? '',
    wechat: supplier?.wechat ?? '',
    email: supplier?.email ?? '',
    website: supplier?.website ?? '',
    yupoo: supplier?.yupoo ?? '',
    country: supplier?.country ?? 'CN',
    city: supplier?.city ?? '',
    address: supplier?.address ?? '',
    moq: supplier?.moq ?? undefined,
    paymentMethods: supplier?.paymentMethods ?? '',
    shippingMethods: supplier?.shippingMethods ?? '',
    warranty: supplier?.warranty ?? '',
    leadTime: supplier?.leadTime ?? undefined,
    productionTime: supplier?.productionTime ?? undefined,
    oem: supplier?.oem ?? false,
    odm: supplier?.odm ?? false,
    riskLevel: (supplier?.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH') ?? 'MEDIUM',
    status: (supplier?.status as 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED') ?? 'ACTIVE',
  }
  if (!supplier) return base
  if (!supplier.rating) {
    return {
      ...base,
      rating: {
        communicationScore: 0,
        qualityScore: 0,
        priceScore: 0,
        shippingScore: 0,
        warrantyScore: 0,
        trustScore: 0,
        review: '',
      },
    }
  }
  return {
    ...base,
    rating: {
      communicationScore: supplier.rating.communicationScore,
      qualityScore: supplier.rating.qualityScore,
      priceScore: supplier.rating.priceScore,
      shippingScore: supplier.rating.shippingScore,
      warrantyScore: supplier.rating.warrantyScore,
      trustScore: supplier.rating.trustScore,
      review: supplier.rating.review ?? '',
    },
  }
}
