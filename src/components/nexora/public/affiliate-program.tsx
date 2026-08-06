'use client'

/**
 * NEXORA — Affiliate Program
 * Permite a usuarios registrarse como afiliados y obtener su código de referido.
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Users, DollarSign, Gift, Share2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateAffiliateCode, buildReferralUrl } from '@/lib/marketing'
import { motion } from 'framer-motion'

interface AffiliateSignupProps {
  onClose?: () => void
}

export function AffiliateProgram({ onClose }: AffiliateSignupProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleSignup = () => {
    if (!name.trim() || !email.trim()) {
      toast({
        title: 'Faltan datos',
        description: 'Por favor ingresa tu nombre y email',
        variant: 'destructive',
      })
      return
    }
    const newCode = generateAffiliateCode(name)
    setCode(newCode)
    toast({
      title: '✓ Código generado',
      description: `Tu código de afiliado es ${newCode}`,
    })
  }

  const referralUrl = code ? buildReferralUrl(code) : ''
  const commissionPct = 10 // 10% por defecto

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Código copiado', description: code })
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(referralUrl)
    toast({ title: 'Link copiado', description: 'Comparte tu link de referido' })
  }

  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NEXORA — Productos de lujo',
          text: `Compra productos de lujo en NEXORA con mi código ${code} y obtén descuentos!`,
          url: referralUrl,
        })
      } catch {
        // user cancelled
      }
    } else {
      copyUrl()
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-3">
          <Gift className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold">Programa de Afiliados</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gana <strong className="text-primary">{commissionPct}%</strong> de comisión por cada venta referida
        </p>
      </div>

      {!code ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aff-name">Nombre completo</Label>
            <Input
              id="aff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aff-email">Email</Label>
            <Input
              id="aff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <Button onClick={handleSignup} className="w-full gap-2">
            <Gift className="h-4 w-4" />
            Generar mi código de afiliado
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-1">Tu código de afiliado</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-2xl font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                {code}
              </code>
              <Button size="sm" variant="ghost" onClick={copyCode} className="h-8 w-8 p-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tu link de referido</Label>
            <div className="flex gap-2">
              <Input
                value={referralUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button size="sm" variant="outline" onClick={copyUrl} className="gap-2">
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </Button>
            </div>
          </div>

          <Button onClick={shareUrl} className="w-full gap-2">
            <Share2 className="h-4 w-4" />
            Compartir link
          </Button>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="rounded-lg bg-muted p-3 text-center">
              <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Referidos</p>
              <p className="text-lg font-bold">0</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Comisión</p>
              <p className="text-lg font-bold">{commissionPct}%</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <Gift className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Ganancias</p>
              <p className="text-lg font-bold">$0</p>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">¿Cómo funciona?</strong>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Comparte tu link con amigos y seguidores</li>
              <li>Cuando compren usando tu código, ganaste {commissionPct}%</li>
              <li>Recibe tus ganancias mensualmente por WhatsApp</li>
            </ol>
          </div>

          {onClose && (
            <Button variant="outline" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          )}
        </motion.div>
      )}
    </Card>
  )
}
