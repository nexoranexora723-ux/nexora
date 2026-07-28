'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/hooks/use-auth'
import { Loader2, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const loginMut = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await loginMut.mutateAsync({ email, password })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación')
    }
  }

  const fillDemo = (user: 'ceo' | 'admin' | 'compras') => {
    const emails = { ceo: 'adrian@nexora.co', admin: 'laura@nexora.co', compras: 'carlos@nexora.co' }
    setEmail(emails[user])
    setPassword('nexora123')
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-lg">
              <span className="text-2xl font-black">N</span>
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Bienvenido a NEXORA</DialogTitle>
          <DialogDescription className="text-center">
            Inicia sesión para acceder al Business Operating System
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Correo electrónico</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="tu@nexora.co" required autoFocus />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs">Contraseña</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" required />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" className="w-full gap-1.5" size="lg" disabled={loginMut.isPending}>
            {loginMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Iniciar sesión
          </Button>
        </form>

        {/* Demo accounts */}
        <div className="border-t pt-3">
          <p className="mb-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
            Cuentas de demostración (clave: nexora123)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => fillDemo('ceo')}>CEO</Button>
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => fillDemo('admin')}>Admin</Button>
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => fillDemo('compras')}>Compras</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
