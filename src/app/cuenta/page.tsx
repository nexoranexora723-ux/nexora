'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteFooter } from '@/components/nexora/public/site-footer'
import { useAuth } from '@/lib/auth-store'
import { formatCurrency, formatDate, initials } from '@/lib/format'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  Package,
  Heart,
  LogOut,
  Copy,
  Check,
  Gift,
  Loader2,
  ShieldCheck,
  Pencil,
  Save,
  X,
  ArrowRight,
  Lock,
} from 'lucide-react'

// ---------- Types ----------

interface SessionResponse {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    position: string | null
    phone: string | null
    avatarUrl: string | null
  } | null
  authenticated: boolean
}

interface ProfileResponse {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: string
  position: string | null
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
}

interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
  currencyCode?: string
}

interface OrderSummary {
  id: string
  number: string
  status: string
  createdAt: string
  total: number
  currencyCode: string
  itemsCount: number
  items?: OrderItem[]
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Cliente',
  RESELLER: 'Revendedor',
  EMPLOYEE: 'Empleado',
  ADMIN: 'Administrador',
  SUPER_ADMIN: 'Super Admin',
}

// ---------- Helpers ----------

/** Genera un código de referido determinista a partir del userId. */
function buildReferralCode(userId: string): string {
  const base = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)
  return `NEX-${base.padEnd(6, '0')}`
}

export default function CuentaPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { setUser, logout: logoutStore } = useAuth()
  const [editingPhone, setEditingPhone] = React.useState(false)
  const [phoneDraft, setPhoneDraft] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  // ----- Session check -----
  const { data: session, isLoading: sessionLoading } = useQuery<SessionResponse>({
    queryKey: ['auth-session'],
    queryFn: async () => (await fetch('/api/auth/session')).json(),
    staleTime: 60 * 1000,
  })

  // ----- Profile (createdAt, lastLoginAt, etc.) -----
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileResponse>({
    queryKey: ['auth-profile'],
    queryFn: async () => {
      const res = await fetch('/api/auth/profile')
      if (!res.ok) throw new Error('No profile')
      return res.json()
    },
    enabled: !!session?.authenticated,
  })

  // ----- Orders (for stats) -----
  const { data: orders } = useQuery<OrderSummary[]>({
    queryKey: ['my-orders'],
    queryFn: async () => (await fetch('/api/orders')).json(),
    enabled: !!session?.authenticated,
  })

  React.useEffect(() => {
    if (session?.user) {
      setUser(session.user)
      if (profile) {
        // Sync phone into the auth store if it changed
        setUser({ ...session.user, phone: profile.phone ?? session.user.phone })
      }
    }
  }, [session, profile])

  React.useEffect(() => {
    if (profile) setPhoneDraft(profile.phone ?? '')
  }, [profile])

  // ----- Update phone mutation -----
  const phoneMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['auth-profile'] })
      qc.invalidateQueries({ queryKey: ['auth-session'] })
      if (session?.user) setUser({ ...session.user, phone: data.phone ?? null })
      setEditingPhone(false)
      toast({ title: 'Teléfono actualizado', description: 'Tu número se guardó correctamente.' })
    },
    onError: (err: Error) => {
      toast({ title: 'No se pudo actualizar', description: err.message, variant: 'destructive' })
    },
  })

  // ----- Logout -----
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', { method: 'POST' })
    },
    onSuccess: () => {
      logoutStore()
      toast({ title: 'Sesión cerrada', description: 'Hasta pronto.' })
      window.location.href = '/'
    },
    onError: () => {
      logoutStore()
      window.location.href = '/'
    },
  })

  const handleCopyReferral = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast({ title: 'Código copiado', description: code })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'No se pudo copiar', variant: 'destructive' })
    }
  }

  // ---------- Loading state ----------
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AccountNavbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
          <Skeleton className="mb-6 h-9 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-48 md:col-span-1" />
            <Skeleton className="h-48 md:col-span-2" />
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // ---------- Not authenticated ----------
  if (!session?.authenticated || !session.user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AccountNavbar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="size-7" />
          </div>
          <h1 className="text-2xl font-bold">Inicia sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Necesitas una cuenta para ver tu perfil, pedidos y código de referido.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button asChild size="lg" className="gap-2">
              <Link href="/?login=1">Iniciar sesión</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/?register=1">Crear cuenta gratuita <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver al inicio
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const user = session.user
  const referralCode = buildReferralCode(user.id)
  const totalOrders = orders?.length ?? 0
  const totalSpent = (orders ?? []).reduce((s, o) => s + (o.total || 0), 0)
  const memberSince = profile?.createdAt ? formatDate(profile.createdAt) : '—'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AccountNavbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Mi cuenta</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu perfil, revisa tu actividad y comparte tu código de referido.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* ===== Left: Profile card ===== */}
          <Card className="md:col-span-1">
            <CardHeader className="items-center text-center">
              <Avatar className="size-20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-blue-700 text-xl font-bold text-primary-foreground">
                  {initials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{user.firstName} {user.lastName}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1.5 text-xs">
                  <Badge variant="secondary" className="gap-1">
                    <ShieldCheck className="size-3 text-emerald-500" /> {ROLE_LABELS[user.role] ?? user.role}
                  </Badge>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate" title={user.email}>{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <span>{user.phone || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="size-4 shrink-0 text-muted-foreground" />
                <span>Miembro desde {memberSince}</span>
              </div>
              <Separator className="my-2" />
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                Cerrar sesión
              </Button>
            </CardContent>
          </Card>

          {/* ===== Right: Details ===== */}
          <div className="space-y-6 md:col-span-2">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={<ShoppingBag className="size-5" />}
                label="Total pedidos"
                value={String(totalOrders)}
                hint={totalOrders === 0 ? 'Aún sin pedidos' : 'Pedidos realizados'}
              />
              <StatCard
                icon={<DollarSign className="size-5" />}
                label="Total invertido"
                value={formatCurrency(totalSpent, 'USD')}
                hint="Suma de pedidos"
              />
              <StatCard
                icon={<Calendar className="size-5" />}
                label="Miembro desde"
                value={memberSince}
                hint={profile?.lastLoginAt ? `Último login: ${formatDate(profile.lastLoginAt)}` : 'Sin logins recientes'}
              />
            </div>

            {/* Phone editor */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="size-4 text-primary" /> Teléfono
                  </CardTitle>
                  <CardDescription className="text-xs">Lo usamos para coordinar entregas y WhatsApp.</CardDescription>
                </div>
                {!editingPhone && (
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setPhoneDraft(profile?.phone ?? ''); setEditingPhone(true) }}>
                    <Pencil className="size-3.5" /> Editar
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : editingPhone ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); phoneMutation.mutate(phoneDraft) }}
                    className="flex flex-col gap-2 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="phone" className="text-xs">Número de teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneDraft}
                        onChange={(e) => setPhoneDraft(e.target.value)}
                        placeholder="+57 300 000 0000"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="gap-1.5" disabled={phoneMutation.isPending}>
                        {phoneMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                        Guardar
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingPhone(false)}>
                        <X className="size-3.5" /> Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm font-medium">{profile?.phone || <span className="text-muted-foreground">Sin teléfono — agrégalo para mejor coordinación</span>}</p>
                )}
              </CardContent>
            </Card>

            {/* Referral code */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/5 to-blue-700/5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gift className="size-4 text-primary" /> Código de referido
                </CardTitle>
                <CardDescription className="text-xs">
                  Compártelo con tus amigos. Cuando hagan su primer pedido, ambos reciben un beneficio.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Tu código</p>
                    <p className="font-mono text-2xl font-bold tracking-tight text-primary">{referralCode}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleCopyReferral(referralCode)}>
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    {copied ? 'Copiado' : 'Copiar código'}
                  </Button>
                </div>
                <Link href="/referidos" className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Ver programa de referidos <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>

            {/* Quick links */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <QuickLink
                href="/pedidos"
                icon={<Package className="size-5" />}
                title="Mis pedidos"
                desc="Historial y estado de tus importaciones"
              />
              <QuickLink
                href="/?view=catalog"
                icon={<Heart className="size-5" />}
                title="Favoritos"
                desc="Tu lista de productos guardados"
              />
              <QuickLink
                href="/?view=catalog"
                icon={<ShoppingBag className="size-5" />}
                title="Explorar catálogo"
                desc="Descubre nuevos productos para importar"
              />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

// ---------- Subcomponents ----------

function AccountNavbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Volver al inicio
        </Link>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm">
            <span className="text-sm font-black">N</span>
          </div>
          <span className="font-bold tracking-tight">NEXORA</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/pedidos">Mis pedidos</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight">{value}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  )
}
