'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-store'
import { Loader2, Mail, Lock, User, Phone, AlertCircle, Sparkles } from 'lucide-react'
import { LoadingOverlay } from '@/components/nexora/shared/animations'

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'login' | 'register'
  onModeChange: (mode: 'login' | 'register') => void
}

export function AuthDialog({ open, onOpenChange, mode, onModeChange }: AuthDialogProps) {
  const { setUser } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', purpose: 'personal' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setUser(data.user)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-lg">
              <span className="text-2xl font-black">N</span>
            </div>
          </div>
          <DialogTitle className="text-center text-xl">{isLogin ? 'Bienvenido a NEXORA' : 'Crea tu cuenta'}</DialogTitle>
          <DialogDescription className="text-center">
            {isLogin ? 'Inicia sesión para gestionar tus importaciones' : 'Regístrate y solicita tu primera importación'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="pl-9" required autoFocus />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Apellido *</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Correo electrónico *</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-9" placeholder="tu@correo.com" required autoFocus={isLogin} />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <Label className="text-xs">Teléfono</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pl-9" placeholder="+57 300..." />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Contraseña *</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="pl-9" placeholder="••••••••" required />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" className="w-full gap-1.5" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="border-t pt-3 text-center text-sm">
          {isLogin ? (
            <>¿No tienes cuenta? <button onClick={() => onModeChange('register')} className="font-medium text-primary hover:underline">Regístrate</button></>
          ) : (
            <>¿Ya tienes cuenta? <button onClick={() => onModeChange('login')} className="font-medium text-primary hover:underline">Inicia sesión</button></>
          )}
        </div>

        {isLogin && (
          <div className="rounded-lg bg-muted/50 p-3 text-center text-xs text-muted-foreground">
            <p className="mb-1 font-medium">Cuentas de demostración:</p>
            <p>Cliente: <code className="text-foreground">carlos@email.com</code> / nexora123</p>
            <p>Admin: <code className="text-foreground">admin@nexora.co</code> / nexora123</p>
          </div>
        )}
      </DialogContent>
      <LoadingOverlay show={loading} message="Iniciando sesión..." />
    </Dialog>
  )
}
