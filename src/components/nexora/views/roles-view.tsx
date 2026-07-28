'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { StatusBadge } from '@/components/nexora/status-badge'
import { useRoles, usePermissions, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Shield, ShieldCheck, Plus, Lock, Pencil, Trash2,
  Users as UsersIcon, Check, Loader2, KeyRound,
} from 'lucide-react'
import type { RoleWithRelations } from '@/server/services/role.service'

const MODULE_LABELS: Record<string, string> = {
  products: 'Productos', orders: 'Pedidos', users: 'Usuarios', suppliers: 'Proveedores',
  inventory: 'Inventario', finance: 'Finanzas', customers: 'Clientes',
  purchases: 'Compras', settings: 'Configuración', naios: 'NAIOS',
}
const ACTION_LABELS: Record<string, string> = {
  view: 'Ver', create: 'Crear', edit: 'Editar', delete: 'Eliminar',
  export: 'Exportar', approve: 'Aprobar', configure: 'Configurar', admin: 'Administrar',
}

function groupPermissionsByModule(perms: { id: string; module: string; action: string }[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {}
  for (const p of perms) {
    if (!grouped[p.module]) grouped[p.module] = []
    grouped[p.module].push(p.action)
  }
  return grouped
}

export function RolesView() {
  const { data: roles, isLoading } = useRoles()
  const { toast } = useToast()
  const deleteMut = useDeleteRole()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RoleWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleWithRelations | null>(null)

  const stats = roles
    ? {
        total: roles.length,
        system: roles.filter((r) => r.isSystem).length,
        custom: roles.filter((r) => !r.isSystem).length,
        totalPermissions: roles.reduce((s, r) => s + r.permissions.length, 0),
      }
    : null

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Rol eliminado', description: deleteTarget.name })
      setDeleteTarget(null)
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles y Permisos"
        description="RBAC · Control granular por módulo y acción"
        icon={Shield}
        action={<Button className="gap-1.5" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="h-4 w-4" /> Nuevo rol</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total roles" value={formatNumber(stats?.total ?? 0)} icon={Shield} accent="emerald" />
        <StatCard title="Sistema" value={formatNumber(stats?.system ?? 0)} icon={Lock} accent="amber" subtitle="No editables" />
        <StatCard title="Personalizados" value={formatNumber(stats?.custom ?? 0)} icon={ShieldCheck} accent="sky" />
        <StatCard title="Permisos asignados" value={formatNumber(stats?.totalPermissions ?? 0)} icon={KeyRound} accent="violet" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : (roles?.length ?? 0) === 0 ? (
        <Card><CardContent className="py-16 text-center"><Shield className="mx-auto h-12 w-12 text-muted-foreground/40" /><p className="mt-3 text-sm font-medium">No hay roles configurados</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {roles!.map((r) => (
            <Card key={r.id} className="transition-all hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{r.name}</h3>
                      {r.isSystem && <Badge variant="outline" className="gap-1 font-normal"><Lock className="h-3 w-3" /> Sistema</Badge>}
                      <StatusBadge status={r.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.description ?? 'Sin descripción'}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(r); setFormOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!r.isSystem && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><UsersIcon className="h-3.5 w-3.5" /> {r.userCount} usuario(s)</span>
                  <span className="inline-flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> {r.permissions.length} permiso(s)</span>
                </div>
                <div className="mt-3 space-y-1.5 border-t pt-3">
                  {Object.entries(groupPermissionsByModule(r.permissions)).slice(0, 4).map(([mod, actions]) => (
                    <div key={mod} className="flex items-center gap-2 text-xs">
                      <span className="w-24 shrink-0 font-medium text-muted-foreground">{MODULE_LABELS[mod] ?? mod}</span>
                      <div className="flex flex-wrap gap-1">
                        {actions.map((a) => (
                          <Badge key={a} variant="secondary" className="px-1.5 py-0 font-normal text-[10px]">{ACTION_LABELS[a] ?? a}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(groupPermissionsByModule(r.permissions)).length > 4 && (
                    <p className="text-[10px] text-muted-foreground">+ {Object.keys(groupPermissionsByModule(r.permissions)).length - 4} módulos más...</p>
                  )}
                  {r.permissions.length === 0 && <p className="text-[10px] text-muted-foreground">Sin permisos asignados</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoleFormDialog open={formOpen} onOpenChange={setFormOpen} role={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará el rol <strong>{deleteTarget?.name}</strong>. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// === Role Form Dialog with permission matrix ===
function RoleFormDialog({ open, onOpenChange, role }: { open: boolean; onOpenChange: (o: boolean) => void; role: RoleWithRelations | null }) {
  const isEdit = !!role
  const createMut = useCreateRole()
  const updateMut = useUpdateRole()
  const { data: permissions } = usePermissions()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  // Sync when dialog opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('')
      if (role) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(role.name)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDescription(role.description ?? '')
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedPerms(new Set(role.permissions.map((p) => p.id)))
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName('')
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDescription('')
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedPerms(new Set())
      }
    }
  }, [open, role])

  const togglePerm = (id: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleModule = (permIds: { id: string }[]) => {
    const ids = permIds.map((p) => p.id)
    const allSelected = ids.every((id) => selectedPerms.has(id))
    setSelectedPerms((prev) => {
      const next = new Set(prev)
      if (allSelected) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { name, description, permissionIds: Array.from(selectedPerms) }
      if (isEdit && role) {
        await updateMut.mutateAsync({ id: role.id, input: payload })
      } else {
        await createMut.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> {isEdit ? 'Editar rol' : 'Nuevo rol'}</DialogTitle>
          <DialogDescription>Configura el rol y sus permisos por módulo</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">Nombre *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="VENTAS_PREMIUM" disabled={role?.isSystem} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Permisos seleccionados</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium tabular-nums">{selectedPerms.size}</div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Descripción</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Describe el propósito del rol..." />
          </div>

          {/* Permission matrix */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matriz de permisos</Label>
            <div className="rounded-lg border">
              {permissions &&
                Object.entries(permissions).map(([module, perms]) => {
                  const allSelected = perms.every((p) => selectedPerms.has(p.id))
                  const someSelected = perms.some((p) => selectedPerms.has(p.id))
                  return (
                    <div key={module} className="flex items-center gap-3 border-b p-2.5 last:border-b-0">
                      <button type="button" onClick={() => toggleModule(perms)} className="flex w-32 shrink-0 items-center gap-2 text-xs font-medium">
                        <div className={cn(
                          'flex h-5 w-5 items-center justify-center rounded border',
                          allSelected ? 'border-primary bg-primary text-primary-foreground' : someSelected ? 'border-primary bg-primary/30' : 'border-muted',
                        )}>
                          {allSelected && <Check className="h-3 w-3" />}
                        </div>
                        {MODULE_LABELS[module] ?? module}
                      </button>
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePerm(p.id)}
                            className={cn(
                              'rounded-md border px-2 py-1 text-[10px] font-medium transition-colors',
                              selectedPerms.has(p.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                            )}
                          >
                            {ACTION_LABELS[p.action] ?? p.action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {error && <p className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting || (role?.isSystem ?? false)} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Crear rol'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
