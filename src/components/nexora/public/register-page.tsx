'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/lib/auth-store'
import { Loader2, Mail, Lock, User, Phone, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, Globe, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegisterPageProps {
  onBack: () => void
  onLogin: () => void
}

export function RegisterPage({ onBack, onLogin }: RegisterPageProps) {
  const { setUser } = useAuth()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
    purpose: 'personal' as 'personal' | 'resale' | 'business',
    acceptTerms: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const passwordsMatch = form.password === form.confirmPassword
  const passwordStrong = form.password.length >= 8

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.acceptTerms) {
      setError('Debes aceptar los términos y condiciones')
      return
    }
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (!passwordStrong) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          password: form.password,
          purpose: form.purpose,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrarse')

      setSuccess(true)
      // Auto-login after 2 seconds
      setTimeout(() => {
        setUser(data.user)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-emerald-500/5 p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold">¡Cuenta creada exitosamente! 🎉</h1>
          <p className="mt-2 text-muted-foreground">
            Bienvenido a NEXORA, {form.firstName}. Tu cuenta está lista.
          </p>
          <div className="mt-6 rounded-xl border bg-card p-4 text-left">
            <p className="text-sm font-medium">¿Qué puedes hacer ahora?</p>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Explorar el catálogo de productos importables</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Solicitar tu primera importación</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Hacer seguimiento de tus pedidos</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Recibir cotizaciones de proveedores chinos</li>
            </ul>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirigiendo a tu panel...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
      {/* Nav */}
      <nav className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground">
              <span className="text-sm font-black">N</span>
            </div>
            <span className="font-bold">NEXORA</span>
          </div>
          <button onClick={onLogin} className="text-sm font-medium text-primary hover:underline">
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Left: Form */}
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta gratuita</h1>
            <p className="mt-2 text-muted-foreground">Empieza a importar productos desde China hoy mismo.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="pl-9" placeholder="Carlos" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Apellido *</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Rodríguez" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Correo electrónico *</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pl-9" placeholder="tu@correo.com" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Teléfono / WhatsApp</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pl-9" placeholder="+57 300 123 4567" />
              </div>
            </div>

            {/* Purpose selector */}
            <div className="space-y-2">
              <Label className="text-xs">¿Para qué quieres importar?</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'personal', label: 'Personal', icon: '👤' },
                  { value: 'resale', label: 'Reventa', icon: '📦' },
                  { value: 'business', label: 'Empresa', icon: '🏢' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, purpose: p.value as 'personal' | 'resale' | 'business' })}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-all',
                      form.purpose === p.value ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <span className="text-xl">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Contraseña *</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={cn('pl-9', form.password && !passwordStrong && 'border-rose-300')} placeholder="Mín. 8 caracteres" required />
                </div>
                {form.password && !passwordStrong && <p className="text-[10px] text-rose-500">Mínimo 8 caracteres</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Confirmar *</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={cn('pl-9', form.confirmPassword && !passwordsMatch && 'border-rose-300')} placeholder="Repite" required />
                </div>
                {form.confirmPassword && !passwordsMatch && <p className="text-[10px] text-rose-500">No coinciden</p>}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-2">
              <Checkbox id="terms" checked={form.acceptTerms} onCheckedChange={(v) => setForm({ ...form, acceptTerms: v === true })} className="mt-0.5" />
              <Label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
                Acepto los <a href="#" className="font-medium text-primary hover:underline">términos y condiciones</a> y la <a href="#" className="font-medium text-primary hover:underline">política de privacidad</a> de NEXORA.
              </Label>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Crear cuenta gratuita
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Sin costos ocultos. Sin tarjeta de crédito. Cancela cuando quieras.
            </p>
          </form>
        </div>

        {/* Right: Benefits */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-emerald-700 p-8 text-primary-foreground shadow-xl">
            <h2 className="text-2xl font-bold">Importa desde China con NEXORA</h2>
            <p className="mt-2 opacity-90">Únete a cientos de emprendedores que ya importan productos sin complicaciones.</p>

            <div className="mt-8 space-y-4">
              {[
                { icon: ShieldCheck, title: 'Proveedores verificados', desc: 'Trabajamos solo con fabricantes chinos previamente evaluados' },
                { icon: Zap, title: 'IA que trabaja por ti', desc: 'NAIOS busca el mejor proveedor y compara cotizaciones automáticamente' },
                { icon: Globe, title: 'Logística completa', desc: 'Desde la fábrica en China hasta tu puerta en Colombia' },
                { icon: Sparkles, title: 'Sin complicaciones', desc: 'Tú eliges el producto, nosotros nos encargamos del resto' },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{b.title}</p>
                    <p className="text-sm opacity-80">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl bg-primary-foreground/10 p-4">
              <p className="text-sm font-medium">⭐ "Importé 50 AirPods para mi tienda y el proceso fue súper fácil. NEXORA se encargó de todo."</p>
              <p className="mt-1 text-xs opacity-70">— Carlos E., emprendedor en Bogotá</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
