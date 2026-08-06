'use client'

/**
 * NEXORA — Coupons Showcase
 * Muestra los cupones disponibles para que el usuario los pueda copiar fácilmente.
 * Se muestra en el checkout y en la página de cuenta.
 */
import { useState } from 'react'
import { COUPONS, validateCoupon, useCoupon } from '@/lib/coupon-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tag, Check, Copy, X, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function CouponsShowcase({ compact = false }: { compact?: boolean }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const { apply, remove, applied } = useCoupon()
  const { toast } = useToast()

  const handleApply = () => {
    setError('')
    const result = apply(code)
    if (result.ok) {
      toast({
        title: '✓ Cupón aplicado',
        description: `${result.coupon.code} — ${result.coupon.percentage}% de descuento`,
      })
      setCode('')
    } else {
      const msg = result.reason === 'expired'
        ? 'Este cupón no está vigente en este mes'
        : 'Cupón no válido'
      setError(msg)
      toast({ title: '✗ Cupón inválido', description: msg, variant: 'destructive' })
    }
  }

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode)
    toast({
      title: 'Código copiado',
      description: `Cupón ${couponCode} copiado al portapapeles`,
    })
  }

  const currentMonth = new Date().getMonth() + 1
  // Mostrar primero los siempre vigentes y los del mes actual
  const sortedCoupons = [...COUPONS].sort((a, b) => {
    const aValid = !a.validMonth || a.validMonth === currentMonth
    const bValid = !b.validMonth || b.validMonth === currentMonth
    if (aValid && !bValid) return -1
    if (!aValid && bValid) return 1
    return b.percentage - a.percentage
  })

  return (
    <div className="space-y-4">
      {/* Input para aplicar cupón */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ingresa tu código"
              className="pl-10 uppercase"
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            />
          </div>
          <Button onClick={handleApply} disabled={!code.trim()}>
            Aplicar
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <AnimatePresence>
          {applied && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Badge className="gap-2 bg-emerald-500 hover:bg-emerald-600">
                <Check className="h-3 w-3" />
                {applied.code} — {applied.percentage}% aplicado
                <button onClick={remove} className="ml-1 hover:bg-emerald-700 rounded p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de cupones disponibles */}
      {!compact && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Cupones disponibles
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedCoupons.map((c) => {
              const isValidNow = !c.validMonth || c.validMonth === currentMonth
              const isApplied = applied?.code === c.code
              return (
                <Card
                  key={c.code}
                  className={`p-3 transition-all cursor-pointer hover:border-primary/40 ${
                    isValidNow ? 'opacity-100' : 'opacity-50'
                  } ${isApplied ? 'border-emerald-500 bg-emerald-500/5' : ''}`}
                  onClick={() => !isApplied && handleCopy(c.code)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-bold tracking-wider text-primary">
                          {c.code}
                        </code>
                        <Badge variant="secondary" className="text-xs">
                          {c.percentage}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {c.description}
                      </p>
                      {c.validMonth && (
                        <p className="text-[10px] mt-1 text-muted-foreground">
                          Válido en {MONTH_NAMES[c.validMonth]}
                          {isValidNow && ' ✓ vigente ahora'}
                        </p>
                      )}
                    </div>
                    {!isApplied && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(c.code)
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                    {isApplied && (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
