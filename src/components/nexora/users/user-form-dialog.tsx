'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { createUserSchema, updateUserSchema, type CreateUserInput } from '@/lib/schemas/auth.schema'
import { useCreateUser, useUpdateUser, useRoles, useBranches } from '@/hooks/use-auth'
import type { UserWithRelations } from '@/server/services/user.service'
import { Loader2, User, Mail, Phone, Briefcase, KeyRound, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserWithRelations | null
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEdit = !!user
  const createMut = useCreateUser()
  const updateMut = useUpdateUser()
  const { data: roles } = useRoles()
  const { data: branches } = useBranches()

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
  })
  const { register, handleSubmit, control, reset, formState: { errors } } = form
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerError('')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      reset(
        user
          ? {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone ?? '',
              position: user.position ?? '',
              roleId: user.roleId ?? '',
              branchId: user.branchId ?? '',
              status: user.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
              timezone: user.timezone ?? 'America/Bogota',
              language: user.language ?? 'es',
            }
          : {
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              phone: '',
              position: '',
              roleId: '',
              status: 'ACTIVE',
              timezone: 'America/Bogota',
              language: 'es',
            },
      )
    }
  }, [open, user, reset])

  const onSubmit = async (data: CreateUserInput) => {
    setServerError('')
    try {
      if (isEdit && user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateMut.mutateAsync({ id: user.id, input: data as any })
      } else {
        await createMut.mutateAsync(data)
      }
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? `Modificando ${user?.email}` : 'Crea una nueva cuenta de usuario con rol y permisos'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Personal info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs">Nombre *</Label>
              <Input id="firstName" {...register('firstName')} className="h-9" />
              {errors.firstName && <p className="text-xs text-rose-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs">Apellido *</Label>
              <Input id="lastName" {...register('lastName')} className="h-9" />
              {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Correo electrónico *</Label>
            <Input id="email" type="email" {...register('email')} className="h-9" placeholder="usuario@nexora.co" />
            {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono</Label>
              <Input id="phone" {...register('phone')} className="h-9" placeholder="+57 300..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position" className="text-xs flex items-center gap-1"><Briefcase className="h-3 w-3" /> Cargo</Label>
              <Input id="position" {...register('position')} className="h-9" placeholder="Jefe de compras" />
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs flex items-center gap-1"><KeyRound className="h-3 w-3" /> Contraseña *</Label>
              <Input id="password" type="password" {...register('password')} className="h-9" placeholder="Mínimo 8 caracteres" />
              {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
            </div>
          )}

          <Separator />

          {/* Role & Branch */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Rol *</Label>
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Sin rol" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin rol</SelectItem>
                      {roles?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}{r.isSystem ? ' (sistema)' : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.roleId && <p className="text-xs text-rose-500">{errors.roleId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sucursal</Label>
              <Controller
                control={control}
                name="branchId"
                render={({ field }) => (
                  <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Sin sucursal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin sucursal</SelectItem>
                      {branches?.map((b: { id: string; name: string; code: string }) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                      <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Zona horaria</Label>
              <Controller
                control={control}
                name="timezone"
                render={({ field }) => (
                  <Select value={field.value ?? 'America/Bogota'} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Bogota">America/Bogota</SelectItem>
                      <SelectItem value="America/Mexico_City">America/Mexico_City</SelectItem>
                      <SelectItem value="America/Argentina/Buenos_Aires">America/Buenos_Aires</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
