'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { PageHeader, StatCard } from '@/components/nexora/stat-card'
import { StatusBadge } from '@/components/nexora/status-badge'
import { UserFormDialog } from '@/components/nexora/users/user-form-dialog'
import { useUsers, useDeleteUser, useToggleUserStatus, useRoles } from '@/hooks/use-auth'
import { formatNumber, timeAgo, initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Users as UsersIcon, Search, Plus, MoreHorizontal, Pencil, Trash2,
  Power, PowerOff, ShieldCheck, UserCheck, UserX, Activity, Clock,
} from 'lucide-react'
import type { UserWithRelations } from '@/server/services/user.service'

export function UsersView() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserWithRelations | null>(null)

  const { toast } = useToast()
  const deleteMut = useDeleteUser()
  const toggleMut = useToggleUserStatus()
  const { data: roles } = useRoles()

  const { data: users, isLoading } = useUsers({
    q: query || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    roleId: roleFilter === 'all' ? undefined : roleFilter,
  })

  const stats = useMemo(() => {
    if (!users) return { total: 0, active: 0, suspended: 0 }
    const active = users.filter((u) => u.status === 'ACTIVE').length
    const suspended = users.filter((u) => u.status === 'SUSPENDED').length
    return { total: users.length, active, suspended, inactive: users.length - active - suspended }
  }, [users])

  const handleEdit = (u: UserWithRelations) => { setEditing(u); setFormOpen(true) }
  const handleNew = () => { setEditing(null); setFormOpen(true) }

  const handleToggle = async (u: UserWithRelations) => {
    const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await toggleMut.mutateAsync({ id: u.id, status: newStatus })
      toast({ title: 'Estado actualizado', description: `${u.firstName} ${u.lastName} → ${newStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}` })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo cambiar el estado', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast({ title: 'Usuario eliminado', description: `${deleteTarget.firstName} ${deleteTarget.lastName}` })
      setDeleteTarget(null)
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'No se pudo eliminar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        description="Control de acceso · RBAC · Multi-tenant"
        icon={UsersIcon}
        action={<Button className="gap-1.5" onClick={handleNew}><Plus className="h-4 w-4" /> Nuevo usuario</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total usuarios" value={formatNumber(stats.total)} icon={UsersIcon} accent="emerald" />
        <StatCard title="Activos" value={formatNumber(stats.active)} icon={UserCheck} accent="sky" />
        <StatCard title="Inactivos" value={formatNumber(stats.inactive)} icon={UserX} accent="amber" />
        <StatCard title="Suspendidos" value={formatNumber(stats.suspended)} icon={ShieldCheck} accent={stats.suspended > 0 ? 'rose' : 'zinc'} />
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, email, cargo..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((s) => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" className="h-8 text-xs" onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'Todos' : s === 'ACTIVE' ? 'Activos' : s === 'INACTIVE' ? 'Inactivos' : 'Suspendidos'}
                </Button>
              ))}
            </div>
            {roles && (
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="ml-auto h-8 rounded-lg border bg-background px-3 text-xs">
                <option value="all">Todos los roles</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (users?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UsersIcon className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron usuarios</p>
            <Button className="mt-4 gap-1.5" onClick={handleNew}><Plus className="h-4 w-4" /> Nuevo usuario</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="nexora-scroll overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Sucursal</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último acceso</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users!.map((u) => (
                    <TableRow key={u.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                            u.status === 'ACTIVE' ? 'bg-gradient-to-br from-primary to-emerald-700' : 'bg-zinc-400',
                          )}>
                            {initials(u.firstName, u.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground">{u.position ?? '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.position ?? '—'}</TableCell>
                      <TableCell>
                        {u.roleName ? (
                          <Badge variant="secondary" className="font-normal">{u.roleName}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.branchName ?? '—'}</TableCell>
                      <TableCell><StatusBadge status={u.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.lastLoginAt ? (
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(u.lastLoginAt)}</span>
                        ) : (
                          <span className="text-muted-foreground/60">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(u)}><Pencil className="mr-2 h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(u)}>
                              {u.status === 'ACTIVE' ? <><PowerOff className="mr-2 h-3.5 w-3.5" /> Desactivar</> : <><Power className="mr-2 h-3.5 w-3.5" /> Activar</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600" onClick={() => setDeleteTarget(u)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará a <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ({deleteTarget?.email}). Se cerrarán todas sus sesiones activas. El registro se conservará para auditoría (soft delete).
            </AlertDialogDescription>
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
