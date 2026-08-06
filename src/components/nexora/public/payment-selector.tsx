'use client'

/**
 * NEXORA — Payment Method Selector
 * Componente visual para que el usuario elija cómo pagar.
 * Se integra en el checkout dialog.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Check, ExternalLink, Lock, Shield, CreditCard, MessageCircle, Banknote } from 'lucide-react'
import {
  PAYMENT_GATEWAYS, type PaymentGateway, isGatewayConfigured, createPaymentCheckout,
  type PaymentRequest
} from '@/lib/payment-gateway'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface PaymentSelectorProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  currency: 'COP' | 'USD'
  reference: string
  customer: { name: string; email: string; phone: string }
  onSuccess?: (gateway: PaymentGateway, transactionId?: string) => void
}

export function PaymentSelector({
  isOpen, onOpenChange, amount, currency, reference, customer, onSuccess
}: PaymentSelectorProps) {
  const [selected, setSelected] = useState<PaymentGateway>('whatsapp')
  const [processing, setProcessing] = useState(false)
  const [documentNumber, setDocumentNumber] = useState('')
  const { toast } = useToast()

  const handlePay = async () => {
    if (!documentNumber && (selected === 'wompi' || selected === 'payu')) {
      toast({
        title: 'Falta tu cédula',
        description: 'Las pasarelas de pago requieren tu número de documento.',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)

    const req: PaymentRequest = {
      gateway: selected,
      amount: currency === 'USD' ? Math.round(amount * 4100) : amount, // convertir a COP si es USD
      currency: 'COP',
      reference,
      description: `Pedido NEXORA ${reference}`,
      customer: {
        ...customer,
        documentNumber: documentNumber || 'N/A',
      },
      redirectUrl: `${window.location.origin}/pedidos`,
    }

    const result = createPaymentCheckout(req)

    if (result.success) {
      if (result.paymentUrl) {
        // Abrir URL de pago en nueva pestaña
        window.open(result.paymentUrl, '_blank', 'noopener,noreferrer')
      }
      toast({
        title: '✓ Redirigiendo al pago',
        description: selected === 'whatsapp'
          ? 'Abriendo WhatsApp para coordinar pago'
          : `Abriendo ${selected} para procesar tu pago`,
      })
      onSuccess?.(selected, result.transactionId)
      onOpenChange(false)
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      })
    }
    setProcessing(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Método de pago
          </DialogTitle>
          <DialogDescription>
            Total a pagar: <strong className="text-foreground">
              {currency === 'COP'
                ? `$${amount.toLocaleString('es-CO')} COP`
                : `$${amount.toFixed(2)} USD`}
            </strong>
            <span className="ml-2 text-xs">· Referencia: {reference}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {PAYMENT_GATEWAYS.map((g) => {
            const configured = isGatewayConfigured(g.id)
            const isSelected = selected === g.id
            return (
              <Card
                key={g.id}
                className={cn(
                  'p-4 cursor-pointer transition-all border-2',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-transparent hover:border-muted-foreground/20',
                  !configured && 'opacity-50'
                )}
                onClick={() => configured && setSelected(g.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{g.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{g.name}</p>
                      {g.recommended && (
                        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          Recomendado
                        </Badge>
                      )}
                      {!configured && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Próximamente
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{g.description}</p>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Campos extra para pasarelas que requieren cédula */}
        <AnimatePresence>
          {(selected === 'wompi' || selected === 'payu') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label htmlFor="doc">Número de cédula *</Label>
              <Input
                id="doc"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej. 12345678"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Requerido por la pasarela de pago para verificar identidad.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info de seguridad */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Shield className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-foreground mb-1">Pago 100% seguro</p>
            <p>Serás redirigido a la plataforma de pago seleccionada. NEXORA no almacena tus datos de tarjeta.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handlePay}
            disabled={processing}
            className="gap-2"
          >
            {processing ? (
              <>Procesando...</>
            ) : (
              <>
                {selected === 'whatsapp' ? (
                  <><MessageCircle className="h-4 w-4" /> Pagar por WhatsApp</>
                ) : selected === 'manual' ? (
                  <><Banknote className="h-4 w-4" /> Coordinar pago</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> Pagar ahora <ExternalLink className="h-3 w-3" /></>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
