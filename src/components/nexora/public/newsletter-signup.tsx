'use client'

/**
 * NEXORA — Newsletter Signup (con Mailchimp)
 * Formulario de suscripción al newsletter con validación.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { subscribeToNewsletter } from '@/lib/marketing'
import { motion, AnimatePresence } from 'framer-motion'

interface NewsletterSignupProps {
  compact?: boolean
}

export function NewsletterSignup({ compact = false }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setResult(null)

    // Llamar al API endpoint (no directo a Mailchimp para no exponer API key)
    try {
      const resp = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      })
      const data = await resp.json()
      setResult(data)
      if (data.success) {
        setEmail('')
        setName('')
      }
    } catch {
      setResult({
        success: false,
        message: 'Error de conexión. Intenta más tarde.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1"
          required
        />
        <Button type="submit" disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Suscribir'}
        </Button>
      </form>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary mb-2">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="font-semibold">Únete al newsletter</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Recibe ofertas exclusivas y nuevos productos antes que nadie
          </p>
        </div>

        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre (opcional)"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="pl-10"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Suscribir'
            )}
          </Button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`text-xs flex items-center gap-2 ${
                result.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              }`}
            >
              {result.success && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
              <span>{result.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-muted-foreground text-center">
          Al suscribirte aceptas recibir emails de NEXORA. Puedes darte de baja cuando quieras.
        </p>
      </form>
    </div>
  )
}
