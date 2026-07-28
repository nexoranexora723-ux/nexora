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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { createCustomerSchema, type CreateCustomerInput } from '@/lib/schemas/customer.schema'
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers'
import type { CustomerWithRelations } from '@/server/services/customer.service'
import { Loader2, Users, AlertCircle, Info } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: CustomerWithRelations | null
}

const STATUS_OPTIONS: { value: CreateCustomerInput['status']; label: string }[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'VIP', label: 'VIP' },
]

export function CustomerFormDialog({ open, onOpenChange, customer }: CustomerFormDialogProps) {
  const isEdit = !!customer
  const createMut = useCreateCustomer()
  const updateMut = useUpdateCustomer()

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: useMemo(() => mapCustomerToForm(customer), [customer]),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = form

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (open) {
      reset(mapCustomerToForm(customer))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerError('')
    }
  }, [open, customer, reset])

  const onSubmit = async (data: CreateCustomerInput) => {
    setServerError('')
    try {
      if (isEdit && customer) {
        await updateMut.mutateAsync({ id: customer.id, input: data })
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
            <Users className="h-5 w-5 text-primary" />
            {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Modificando ${customer?.fullName}`
              : 'Agrega un cliente al CRM de NEXORA'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
          {/* === SECCIÓN 1: Identidad === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">1</span>
              Identidad
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs">Nombre *</Label>
                <Input id="firstName" {...register('firstName')} className="h-9" placeholder="Andrés" />
                {errors.firstName && <p className="text-xs text-rose-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs">Apellido *</Label>
                <Input id="lastName" {...register('lastName')} className="h-9" placeholder="Gómez" />
                {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input id="email" type="email" {...register('email')} className="h-9" placeholder="cliente@email.com" />
                {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Teléfono</Label>
                <Input id="phone" {...register('phone')} className="h-9" placeholder="+57 311 234 5678" />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 2: Empresa (no persistido) === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">2</span>
              Empresa (opcional)
            </h3>
            <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                Los campos <strong>Empresa</strong> y <strong>NIT</strong> se aceptan en el formulario
                pero no se persisten — el modelo Customer actual no incluye estas columnas. Se conservan
                para futura extensión del esquema.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs">Empresa</Label>
                <Input id="companyName" {...register('companyName')} className="h-9" placeholder="Acme Corp" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nit" className="text-xs">NIT / RUT</Label>
                <Input id="nit" {...register('nit')} className="h-9" placeholder="900.123.456-7" />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 3: Ubicación === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">3</span>
              Ubicación
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="country" className="text-xs">País (ISO 2)</Label>
                <Input id="country" {...register('country')} className="h-9" placeholder="CO" maxLength={2} />
                {errors.country && <p className="text-xs text-rose-500">{errors.country.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs">Ciudad</Label>
                <Input id="city" {...register('city')} className="h-9" placeholder="Bogotá" />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs">Estado</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs">Dirección</Label>
              <Textarea
                id="address"
                {...register('address')}
                rows={2}
                placeholder="Calle 85 #12-34, Chapinero"
              />
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 4: Etiquetas === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">4</span>
              Etiquetas y clasificación
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="tags" className="text-xs">Etiquetas (separadas por coma)</Label>
              <Input
                id="tags"
                {...register('tags')}
                className="h-9"
                placeholder="vip, frequent, wholesale"
              />
              <p className="text-[10px] text-muted-foreground">
                Ej: <code>vip, frequent, wholesale</code> — útiles para segmentar campañas y filtros.
              </p>
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
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function mapCustomerToForm(customer?: CustomerWithRelations | null): CreateCustomerInput {
  if (!customer) {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      nit: '',
      address: '',
      city: '',
      country: 'CO',
      status: 'ACTIVE',
      tags: '',
    }
  }
  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone ?? '',
    // companyName and nit not persisted — return empty for edit mode
    companyName: '',
    nit: '',
    address: customer.address ?? '',
    city: customer.city ?? '',
    country: customer.country ?? 'CO',
    status: customer.status as CreateCustomerInput['status'],
    tags: customer.tags ?? '',
  }
}
