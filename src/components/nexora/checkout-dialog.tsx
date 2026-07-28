'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { useCart, cartTotal } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { Loader2, CheckCircle2, ShoppingBag, CreditCard, Smartphone, Banknote, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const PAYMENT_METHODS = [
  { id: 'Tarjeta', label: 'Tarjeta de crédito/débito', icon: CreditCard },
  { id: 'Nequi', label: 'Nequi / Daviplata', icon: Smartphone },
  { id: 'PayPal', label: 'PayPal', icon: Wallet },
  { id: 'Contraentrega', label: 'Pago contra entrega', icon: Banknote },
]

interface CheckoutResult {
  success: boolean
  orderNumber: string
  total: number
  customerName: string
}

export function CheckoutDialog({ open, onOpenChange, onSuccess }: CheckoutDialogProps) {
  const { items, clear } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CheckoutResult | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    address: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('Tarjeta')
  const [error, setError] = useState('')

  const subtotal = cartTotal(items)
  const shipping = subtotal > 200 ? 0 : 12
  const tax = subtotal * 0.19
  const total = subtotal + shipping + tax

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.firstName || !form.lastName || !form.email) {
      setError('Nombre, apellido y correo son obligatorios')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { ...form, country: 'CO' },
          items: items.map((i) => ({
            id: i.id,
            sku: i.sku,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error en el checkout')
      setResult({
        success: true,
        orderNumber: data.orderNumber,
        total: data.total,
        customerName: data.customerName,
      })
      clear()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open && result) {
      // Reset on close after success
      setResult(null)
      setForm({ firstName: '', lastName: '', email: '', phone: '', city: '', address: '' })
      onSuccess()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="nexora-scroll max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {result ? (
          /* Success state */
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="mt-4 text-xl font-bold">¡Pedido confirmado!</h2>
            <p className="mt-1 text-sm text-muted-foreground">Gracias por tu compra, {result.customerName}</p>

            <div className="mt-5 w-full rounded-xl border bg-card p-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Número de pedido</span>
                <code className="text-base font-bold text-primary">{result.orderNumber}</code>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">Total pagado</span>
                <span className="text-base font-bold tabular-nums">{formatCurrency(result.total)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">Estado</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
                </span>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-xs text-muted-foreground">
              Hemos registrado tu pedido en el sistema. Recibirás confirmación por correo electrónico. Puedes hacer seguimiento desde el panel de pedidos.
            </p>

            <Button className="mt-5 w-full gap-1.5" onClick={() => handleClose(false)}>
              <ShoppingBag className="h-4 w-4" /> Seguir comprando
            </Button>
          </div>
        ) : (
          /* Checkout form */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Finalizar compra
              </DialogTitle>
              <DialogDescription>Completa tus datos para procesar el pedido</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs">Nombre *</Label>
                  <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs">Apellido *</Label>
                  <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="h-9" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Correo electrónico *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="h-9" placeholder="tu@correo.com" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs">Teléfono</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9" placeholder="+57 300..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs">Ciudad</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-9" placeholder="Bogotá" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs">Dirección de envío</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-9" placeholder="Calle 85 #12-34" />
              </div>

              {/* Payment method */}
              <div className="space-y-2">
                <Label className="text-xs">Método de pago</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <Label
                      key={m.id}
                      htmlFor={m.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs transition-all',
                        paymentMethod === m.id
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'text-muted-foreground hover:border-primary/40',
                      )}
                    >
                      <RadioGroupItem value={m.id} id={m.id} className="sr-only" />
                      <m.icon className="h-4 w-4 shrink-0" />
                      <span className="leading-tight">{m.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Order summary */}
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({items.length} items)</span><span className="tabular-nums">{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span className="tabular-nums">{shipping === 0 ? 'Gratis' : formatCurrency(shipping)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IVA (19%)</span><span className="tabular-nums">{formatCurrency(tax)}</span></div>
                  <div className="flex justify-between border-t pt-1 text-sm font-bold"><span>Total</span><span className="tabular-nums text-primary">{formatCurrency(total)}</span></div>
                </div>
              </div>

              {error && <p className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{error}</p>}

              <Button type="submit" className="w-full gap-1.5" size="lg" disabled={submitting || items.length === 0}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
                ) : (
                  <>Pagar {formatCurrency(total)}</>
                )}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">
                Al confirmar, aceptas los términos de compra de NEXORA
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
