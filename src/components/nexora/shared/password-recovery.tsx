'use client'

/**
 * NEXORA — Password Recovery Dialog
 * Permite al usuario recuperar su contraseña via email.
 */
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle2, Loader2, KeyRound } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PasswordRecoveryProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordRecovery({ isOpen, onOpenChange }: PasswordRecoveryProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    // Llamar al API de recovery (cuando exista)
    try {
      await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      // ignore error, still show success message (security: don't leak if email exists)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset después de cerrar
    setTimeout(() => {
      setEmail('')
      setSent(false)
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Recuperar contraseña
          </DialogTitle>
          <DialogDescription>
            Te enviaremos un código a tu email para restablecer tu contraseña.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  ) : (
                    'Enviar código'
                  )}
                </Button>
              </DialogFooter>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center space-y-3"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold">Revisa tu email</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Si existe una cuenta con <strong>{email}</strong>,
                  recibirás un código de recuperación en los próximos minutos.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Recuerda revisar tu carpeta de spam.
              </p>
              <Button onClick={handleClose} className="w-full">
                Entendido
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
