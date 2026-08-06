'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User,
  Truck,
  CreditCard,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Tag,
  X,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  Copy,
  PartyPopper,
  LogIn,
} from 'lucide-react'
import { useCart, selectCartCount, selectCartTotal, selectVolumeDiscountPct, selectVolumeDiscountAmount, selectDiscountedSubtotal } from '@/lib/cart-store'
import { useCoupon, computeCouponDiscount, type AppliedCoupon } from '@/lib/coupon-store'
import { useAuth } from '@/lib/auth-store'
import { ShippingCalculator, computeShippingQuote, COLOMBIAN_CITIES, getCityShipping } from '@/components/nexora/public/shipping-calculator'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// ============================================================================
// Constants
// ============================================================================

const TAX_RATE = 0.19 // 19% IVA Colombia

interface PaymentMethodDef {
  id: string
  name: string
  emoji: string
  accent: string
  summary: string
  instructions: string[]
  contact: string
  contactLabel: string
}

const PAYMENT_METHODS: PaymentMethodDef[] = [
  {
    id: 'nequi',
    name: 'Nequi',
    emoji: '💚',
    accent: 'border-pink-200 bg-pink-50 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-100 dark:border-pink-900/50 dark:bg-pink-950/30 dark:data-[state=checked]:border-pink-500 dark:data-[state=checked]:bg-pink-950/60',
    summary: 'Pago móvil al 324 758 3173',
    instructions: [
      'Abre la app de Nequi en tu celular.',
      'Ve a "Enviar dinero" → "A un número de celular".',
      'Envía el monto total al número: 324 758 3173.',
      'Nombre del beneficiario: NEXORA Importaciones.',
      'Toma captura del comprobante y envíala por WhatsApp al mismo número.',
    ],
    contact: '324 758 3173',
    contactLabel: 'Número Nequi',
  },
  {
    id: 'daviplata',
    name: 'Daviplata',
    emoji: '💜',
    accent: 'border-purple-200 bg-purple-50 data-[state=checked]:border-purple-500 data-[state=checked]:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/30 dark:data-[state=checked]:border-purple-500 dark:data-[state=checked]:bg-purple-950/60',
    summary: 'Pago móvil al 324 758 3173',
    instructions: [
      'Abre la app de Daviplata en tu celular.',
      'Ve a "Enviar dinero" → "A un número de celular".',
      'Envía el monto total al número: 324 758 3173.',
      'Toma captura del comprobante y envíala por WhatsApp al mismo número.',
    ],
    contact: '324 758 3173',
    contactLabel: 'Número Daviplata',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    emoji: '💙',
    accent: 'border-sky-200 bg-sky-50 data-[state=checked]:border-sky-500 data-[state=checked]:bg-sky-100 dark:border-sky-900/50 dark:bg-sky-950/30 dark:data-[state=checked]:border-sky-500 dark:data-[state=checked]:bg-sky-950/60',
    summary: 'Envío a pagos@nexora.co (USD)',
    instructions: [
      'Inicia sesión en tu cuenta de PayPal.',
      'Ve a "Enviar y solicitar" → "Enviar pago".',
      'Envía el monto total en USD al email: pagos@nexora.co.',
      'En el concepto, incluye tu número de pedido.',
      'Toma captura del comprobante y envíala por WhatsApp.',
    ],
    contact: 'pagos@nexora.co',
    contactLabel: 'Email PayPal',
  },
  {
    id: 'transferencia',
    name: 'Transferencia bancaria',
    emoji: '🏦',
    accent: 'border-amber-200 bg-amber-50 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:data-[state=checked]:border-amber-500 dark:data-[state=checked]:bg-amber-950/60',
    summary: 'Bancolombia · Cta. ahorros 001-123456-78',
    instructions: [
      'Banco: Bancolombia.',
      'Tipo de cuenta: Cuenta de ahorros.',
      'Número de cuenta: 001-123456-78.',
      'Titular: NEXORA Importaciones S.A.S.',
      'NIT: 901.234.567-8.',
      'Envía el comprobante por WhatsApp al 324 758 3173.',
    ],
    contact: '001-123456-78',
    contactLabel: 'Cuenta Bancolombia',
  },
]

const STEPS = [
  { id: 1, label: 'Tus datos', icon: User },
  { id: 2, label: 'Envío', icon: Truck },
  { id: 3, label: 'Pago', icon: CreditCard },
  { id: 4, label: 'Confirmar', icon: CheckCircle2 },
] as const

// ============================================================================
// Dialog
// ============================================================================

interface CheckoutDialogProps {
  /** Optional override for the open state. If omitted, reads from cart-store. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface CustomerForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  cityId: string
  address: string
}

const EMPTY_FORM: CustomerForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  cityId: '',
  address: '',
}

export function CheckoutDialog({ open: openProp, onOpenChange: onOpenChangeProp }: CheckoutDialogProps = {}) {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()

  const storeCheckoutOpen = useCart((s) => s.checkoutOpen)
  const setStoreCheckoutOpen = useCart((s) => s.setCheckoutOpen)
  // Prefer controlled props; fall back to the cart-store-driven state.
  const open = openProp !== undefined ? openProp : storeCheckoutOpen
  const onOpenChange = onOpenChangeProp ?? setStoreCheckoutOpen

  const items = useCart((s) => s.items)
  const clearCart = useCart((s) => s.clear)
  const cartCount = useCart(selectCartCount)
  const subtotal = useCart(selectCartTotal)
  const volumePct = useCart(selectVolumeDiscountPct)
  const volumeAmount = useCart(selectVolumeDiscountAmount)
  const discountedSubtotal = useCart(selectDiscountedSubtotal)

  const appliedCoupon = useCoupon((s) => s.applied)
  const applyCoupon = useCoupon((s) => s.apply)
  const removeCoupon = useCoupon((s) => s.remove)
  const clearCoupon = useCoupon((s) => s.clear)

  const [step, setStep] = React.useState(1)
  const [form, setForm] = React.useState<CustomerForm>(EMPTY_FORM)
  const [paymentMethodId, setPaymentMethodId] = React.useState<string>('')
  const [couponInput, setCouponInput] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [success, setSuccess] = React.useState<{ number: string; total: number } | null>(null)

  // Pre-fill form with user info when the dialog opens (authed users).
  React.useEffect(() => {
    if (open && user) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }))
    }
  }, [open, user])

  // Reset everything when the dialog closes.
  React.useEffect(() => {
    if (!open) {
      // small delay so the close animation doesn't jump
      const t = setTimeout(() => {
        setStep(1)
        setPaymentMethodId('')
        setCouponInput('')
        setSubmitting(false)
        setSuccess(null)
      }, 250)
      return () => clearTimeout(t)
    }
  }, [open])

  // Clear coupon when cart becomes empty (e.g. after a successful order).
  React.useEffect(() => {
    if (cartCount === 0 && open && !success) {
      clearCoupon()
    }
  }, [cartCount, open, success, clearCoupon])

  // Derived totals
  const couponDiscount = computeCouponDiscount(discountedSubtotal, appliedCoupon)
  const afterCoupon = discountedSubtotal - couponDiscount
  const shippingQuote = computeShippingQuote(form.cityId || null, afterCoupon)
  const shippingCost = shippingQuote.cost
  const tax = afterCoupon * TAX_RATE
  const total = afterCoupon + shippingCost + tax

  // ============================================================================
  // Validation
  // ============================================================================

  const isStep1Valid = React.useMemo(() => {
    return (
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      /\S+@\S+\.\S+/.test(form.email) &&
      form.phone.trim().length >= 7 &&
      form.cityId !== '' &&
      form.address.trim().length > 0
    )
  }, [form])

  const isStep2Valid = form.cityId !== ''
  const isStep3Valid = paymentMethodId !== ''

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) {
      toast({ title: 'Completa todos los campos', description: 'Revisa tus datos antes de continuar.', variant: 'destructive' })
      return
    }
    if (step === 2 && !isStep2Valid) {
      toast({ title: 'Selecciona tu ciudad', description: 'Necesitamos tu ciudad para calcular el envío.', variant: 'destructive' })
      return
    }
    if (step === 3 && !isStep3Valid) {
      toast({ title: 'Selecciona un método de pago', description: 'Elige cómo vas a pagar tu pedido.', variant: 'destructive' })
      return
    }
    setStep((s) => Math.min(4, s + 1))
  }

  const handleBack = () => setStep((s) => Math.max(1, s - 1))

  const handleApplyCoupon = () => {
    const code = couponInput.trim()
    if (!code) return
    const result = applyCoupon(code)
    if (result.ok) {
      toast({
        title: 'Cupón aplicado',
        description: `${result.coupon.percentage}% de descuento · ${result.coupon.description}`,
      })
      setCouponInput('')
    } else {
      toast({
        title: 'Cupón inválido o expirado',
        description: result.reason === 'expired'
          ? 'Este cupón no está vigente en este momento.'
          : 'Verifica el código e inténtalo de nuevo.',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
    toast({ title: 'Cupón removido' })
  }

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Inicia sesión para confirmar', description: 'Necesitas una cuenta para enviar tu pedido.', variant: 'destructive' })
      return
    }
    if (items.length === 0) return

    setSubmitting(true)
    try {
      const city = getCityShipping(form.cityId)
      const paymentMethod = PAYMENT_METHODS.find((p) => p.id === paymentMethodId)
      const shippingAddress = [
        `${form.firstName} ${form.lastName}`.trim(),
        `${form.email} · ${form.phone}`,
        `${form.address}, ${city.name}`,
      ].join('\n')

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            currencyCode: i.currencyCode ?? 'USD',
            sku: i.sku,
            imageUrl: i.imageUrl,
          })),
          paymentMethod: paymentMethod?.name ?? paymentMethodId,
          shippingAddress,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo crear el pedido')
      }

      // Success!
      setSuccess({ number: data.number ?? '', total })
      clearCart()
      clearCoupon()
      toast({
        title: '¡Pedido confirmado!',
        description: `Tu número de pedido es ${data.number ?? ''}`.trim(),
      })
    } catch (err) {
      toast({
        title: 'No se pudo crear el pedido',
        description: err instanceof Error ? err.message : 'Intenta de nuevo.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTrackOrder = () => {
    onOpenChange(false)
    router.push('/track-order')
  }

  // ============================================================================
  // Render
  // ============================================================================

  const paymentMethod = PAYMENT_METHODS.find((p) => p.id === paymentMethodId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="border-b bg-gradient-to-r from-primary/5 to-emerald-500/5 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {success ? (
              <><PartyPopper className="h-5 w-5 text-emerald-600" /> ¡Pedido confirmado!</>
            ) : (
              <><Package className="h-5 w-5 text-primary" /> Finalizar compra</>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {success
              ? 'Tu pedido ha sido registrado correctamente.'
              : `${cartCount} producto${cartCount === 1 ? '' : 's'} en tu carrito · ${items.length} línea${items.length === 1 ? '' : 's'}`}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        {success ? (
          <SuccessScreen
            orderNumber={success.number}
            total={success.total}
            paymentMethod={paymentMethod}
            onTrack={handleTrackOrder}
            onClose={() => onOpenChange(false)}
          />
        ) : !isAuthenticated ? (
          <UnauthenticatedScreen onLogin={() => { onOpenChange(false); router.push('/?login=1') }} />
        ) : (
          <>
            {/* Stepper */}
            <div className="border-b px-5 py-3">
              <div className="flex items-center justify-between">
                {STEPS.map((s, idx) => {
                  const Icon = s.icon
                  const active = step === s.id
                  const done = step > s.id
                  return (
                    <div key={s.id} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                            active && 'border-primary bg-primary text-primary-foreground',
                            done && 'border-emerald-500 bg-emerald-500 text-white',
                            !active && !done && 'border-muted-foreground/30 bg-background text-muted-foreground',
                          )}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <span className={cn(
                          'text-[10px] font-medium sm:text-xs',
                          (active || done) ? 'text-foreground' : 'text-muted-foreground',
                        )}>
                          {s.label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={cn(
                          'mx-2 h-0.5 flex-1 rounded-full transition-colors',
                          step > s.id ? 'bg-emerald-500' : 'bg-muted-foreground/20',
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="px-5 py-4">
                {step === 1 && (
                  <Step1CustomerInfo form={form} setForm={setForm} />
                )}
                {step === 2 && (
                  <Step2Shipping
                    form={form}
                    subtotal={afterCoupon}
                    cityId={form.cityId}
                    onCityChange={(cityId) => setForm((f) => ({ ...f, cityId }))}
                  />
                )}
                {step === 3 && (
                  <Step3Payment
                    paymentMethodId={paymentMethodId}
                    onSelect={setPaymentMethodId}
                    total={total}
                  />
                )}
                {step === 4 && (
                  <Step4Review
                    items={items}
                    subtotal={subtotal}
                    volumePct={volumePct}
                    volumeAmount={volumeAmount}
                    discountedSubtotal={discountedSubtotal}
                    appliedCoupon={appliedCoupon}
                    couponDiscount={couponDiscount}
                    couponInput={couponInput}
                    setCouponInput={setCouponInput}
                    onApplyCoupon={handleApplyCoupon}
                    onRemoveCoupon={handleRemoveCoupon}
                    shippingCost={shippingCost}
                    shippingFree={shippingQuote.free}
                    shippingEstimate={shippingQuote.estimate}
                    cityName={getCityShipping(form.cityId).name}
                    tax={tax}
                    total={total}
                    paymentMethodName={paymentMethod?.name}
                  />
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <DialogFooter className="border-t bg-muted/30 px-5 py-3">
              <div className="flex w-full items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={step === 1 || submitting}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Atrás
                </Button>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="text-base font-bold">{formatCurrency(total)}</span>
                </div>
                {step < 4 ? (
                  <Button onClick={handleNext} className="gap-1">
                    Continuar <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleConfirm}
                    disabled={submitting || items.length === 0}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4" /> Confirmar pedido</>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Step 1: Customer Info
// ============================================================================

function Step1CustomerInfo({
  form,
  setForm,
}: {
  form: CustomerForm
  setForm: React.Dispatch<React.SetStateAction<CustomerForm>>
}) {
  const update = (field: keyof CustomerForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Información de contacto</h3>
        <p className="text-xs text-muted-foreground">Te contactaremos para coordinar la entrega y el pago.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nombre" required>
          <Input
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            placeholder="Ej. María"
            autoComplete="given-name"
          />
        </Field>
        <Field label="Apellido" required>
          <Input
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            placeholder="Ej. Rodríguez"
            autoComplete="family-name"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Email" required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="tucorreo@email.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Teléfono / WhatsApp" required>
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="Ej. 324 758 3173"
            autoComplete="tel"
          />
        </Field>
      </div>

      <Field label="Ciudad" required>
        <CitySelect value={form.cityId} onChange={(v) => update('cityId', v)} />
      </Field>

      <Field label="Dirección de entrega" required>
        <Input
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder="Calle 00 # 00-00, barrio, detalles"
          autoComplete="street-address"
        />
      </Field>
    </div>
  )
}

// ============================================================================
// Step 2: Shipping
// ============================================================================

function Step2Shipping({
  form,
  subtotal,
  cityId,
  onCityChange,
}: {
  form: CustomerForm
  subtotal: number
  cityId: string
  onCityChange: (cityId: string) => void
}) {
  const quote = computeShippingQuote(cityId || null, subtotal)
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Método de envío</h3>
        <p className="text-xs text-muted-foreground">Enviamos a toda Colombia vía DHL / FedEx con seguimiento.</p>
      </div>

      <ShippingCalculator
        cityId={cityId || null}
        onCityChange={onCityChange}
        subtotal={subtotal}
      />

      {cityId && (
        <div className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Envío estándar · DHL / FedEx</p>
                <p className="text-xs text-muted-foreground">
                  Hacia <span className="font-medium text-foreground">{quote.city.name}</span>
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Entrega estimada: <span className="font-medium text-foreground">{quote.estimate}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              {quote.free ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-500">GRATIS</Badge>
              ) : (
                <span className="text-base font-bold">{formatCurrency(quote.cost)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span>
            Todos los envíos incluyen seguro y número de seguimiento. Recibirás el código por WhatsApp
            y email una vez despachado el pedido.
          </span>
        </p>
      </div>

      {!form.firstName && (
        <p className="text-xs text-amber-600">← Vuelve al paso anterior para completar tus datos.</p>
      )}
    </div>
  )
}

// ============================================================================
// Step 3: Payment
// ============================================================================

function Step3Payment({
  paymentMethodId,
  onSelect,
  total,
}: {
  paymentMethodId: string
  onSelect: (id: string) => void
  total: number
}) {
  const selected = PAYMENT_METHODS.find((p) => p.id === paymentMethodId)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Método de pago</h3>
        <p className="text-xs text-muted-foreground">
          Total a pagar: <span className="font-bold text-foreground">{formatCurrency(total)}</span>
        </p>
      </div>

      <RadioGroup
        value={paymentMethodId}
        onValueChange={onSelect}
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.id}
            htmlFor={`pm-${method.id}`}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all',
              method.accent,
              paymentMethodId === method.id ? 'ring-2 ring-offset-1' : '',
            )}
          >
            <RadioGroupItem value={method.id} id={`pm-${method.id}`} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{method.emoji}</span>
                <span className="text-sm font-semibold">{method.name}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{method.summary}</p>
            </div>
          </label>
        ))}
      </RadioGroup>

      {selected && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-base">{selected.emoji}</span>
            <p className="text-sm font-semibold">Cómo pagar con {selected.name}</p>
          </div>
          <ol className="ml-4 list-decimal space-y-1 text-xs text-muted-foreground">
            {selected.instructions.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ol>
          <div className="mt-3 flex items-center justify-between rounded-md border bg-background p-2">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{selected.contactLabel}</p>
              <p className="text-sm font-mono font-semibold">{selected.contact}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                navigator.clipboard?.writeText(selected.contact)
              }}
            >
              <Copy className="h-3 w-3" /> Copiar
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-amber-600">
            ⚠️ No cierres esta ventana hasta confirmar tu pedido en el siguiente paso.
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Step 4: Review & Confirm
// ============================================================================

function Step4Review({
  items,
  subtotal,
  volumePct,
  volumeAmount,
  discountedSubtotal,
  appliedCoupon,
  couponDiscount,
  couponInput,
  setCouponInput,
  onApplyCoupon,
  onRemoveCoupon,
  shippingCost,
  shippingFree,
  shippingEstimate,
  cityName,
  tax,
  total,
  paymentMethodName,
}: {
  items: Array<{ id: string; name: string; imageUrl: string | null; price: number; quantity: number; currencyCode?: string }>
  subtotal: number
  volumePct: number
  volumeAmount: number
  discountedSubtotal: number
  appliedCoupon: AppliedCoupon | null
  couponDiscount: number
  couponInput: string
  setCouponInput: (v: string) => void
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
  shippingCost: number
  shippingFree: boolean
  shippingEstimate: string
  cityName: string
  tax: number
  total: number
  paymentMethodName?: string
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Revisa y confirma tu pedido</h3>
        <p className="text-xs text-muted-foreground">Verifica que todo esté correcto antes de confirmar.</p>
      </div>

      {/* Items */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/30 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Productos ({items.length})
          </p>
        </div>
        <div className="max-h-48 divide-y overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded border bg-muted">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs">📦</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-medium">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {item.quantity} × {formatCurrency(item.price, item.currencyCode)}
                </p>
              </div>
              <span className="text-xs font-semibold">
                {formatCurrency(item.price * item.quantity, item.currencyCode)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Coupon */}
      <div className="rounded-lg border p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
          <Tag className="h-3.5 w-3.5" /> Código de descuento
        </p>
        {appliedCoupon ? (
          <div className="flex items-center justify-between gap-2 rounded-md bg-emerald-50 p-2 dark:bg-emerald-950/30">
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {appliedCoupon.code} · {appliedCoupon.percentage}% OFF
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{appliedCoupon.description}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onRemoveCoupon} className="h-7 gap-1 px-2 text-xs">
              <X className="h-3 w-3" /> Quitar
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Ej. BIENVENIDA10"
              className="font-mono text-xs uppercase"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onApplyCoupon() } }}
            />
            <Button type="button" variant="outline" onClick={onApplyCoupon} className="shrink-0">
              Aplicar
            </Button>
          </div>
        )}
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Cupones disponibles: <span className="font-mono">BIENVENIDA10</span>, <span className="font-mono">VIP25</span>, <span className="font-mono">BLACKFRIDAY20</span> (Nov), <span className="font-mono">NAVIDAD15</span> (Dic)
        </p>
      </div>

      {/* Totals */}
      <div className="space-y-1.5 rounded-lg border bg-muted/20 p-3 text-sm">
        <Row label="Subtotal" value={formatCurrency(subtotal)} muted />
        {volumePct > 0 && (
          <Row
            label={
              <span className="flex items-center gap-1 text-emerald-600">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  Volumen {volumePct}%
                </Badge>
                Descuento por volumen
              </span>
            }
            value={<span className="text-emerald-600">−{formatCurrency(volumeAmount)}</span>}
          />
        )}
        {appliedCoupon && (
          <Row
            label={<span className="text-emerald-600">Cupón {appliedCoupon.code} ({appliedCoupon.percentage}%)</span>}
            value={<span className="text-emerald-600">−{formatCurrency(couponDiscount)}</span>}
          />
        )}
        <Separator className="my-1" />
        <Row
          label={
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Envío a {cityName}
            </span>
          }
          value={
            shippingFree ? (
              <span className="font-semibold text-emerald-600">GRATIS</span>
            ) : (
              formatCurrency(shippingCost)
            )
          }
          muted={!shippingFree}
        />
        {shippingFree && (
          <p className="text-[11px] text-muted-foreground">Entrega: {shippingEstimate}</p>
        )}
        <Row label={`IVA (19%)`} value={formatCurrency(tax)} muted />
        <Separator className="my-1" />
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold">Total</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      {paymentMethodName && (
        <div className="flex items-center justify-between rounded-lg border p-2 text-xs">
          <span className="text-muted-foreground">Método de pago</span>
          <span className="font-semibold">{paymentMethodName}</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Success Screen
// ============================================================================

function SuccessScreen({
  orderNumber,
  total,
  paymentMethod,
  onTrack,
  onClose,
}: {
  orderNumber: string
  total: number
  paymentMethod?: PaymentMethodDef
  onTrack: () => void
  onClose: () => void
}) {
  return (
    <ScrollArea className="flex-1 overflow-y-auto">
      <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <div>
          <h2 className="text-xl font-bold">¡Pedido confirmado!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hemos registrado tu pedido y enviado la confirmación a tu email.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-lg border bg-muted/30 p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Número de pedido</p>
          <p className="font-mono text-lg font-bold tracking-tight text-primary">{orderNumber || '—'}</p>
          <Separator className="my-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold">{formatCurrency(total)}</span>
          </div>
          {paymentMethod && (
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pago</span>
              <span className="font-medium">{paymentMethod.emoji} {paymentMethod.name}</span>
            </div>
          )}
        </div>

        {paymentMethod && (
          <div className="w-full max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-3 text-left dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
              ⚠️ Completa tu pago
            </p>
            <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-500">
              Realiza el pago de <strong>{formatCurrency(total)}</strong> vía {paymentMethod.name} ({paymentMethod.contact})
              y envía el comprobante por WhatsApp al <strong>324 758 3173</strong> para confirmar tu pedido.
            </p>
          </div>
        )}

        <div className="flex w-full max-w-sm flex-col gap-2">
          <Button onClick={onTrack} className="gap-2">
            <Truck className="h-4 w-4" /> Rastrear mi pedido
          </Button>
          <Button variant="outline" onClick={onClose}>
            Seguir comprando
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

// ============================================================================
// Unauthenticated Screen
// ============================================================================

function UnauthenticatedScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LogIn className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-bold">Inicia sesión para continuar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Necesitas una cuenta para enviar tu pedido. Tu carrito se conservará.
        </p>
      </div>
      <Button onClick={onLogin} className="gap-2">
        <LogIn className="h-4 w-4" /> Iniciar sesión
      </Button>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

function Row({
  label,
  value,
  muted,
}: {
  label: React.ReactNode
  value: React.ReactNode
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-xs', muted ? 'text-muted-foreground' : 'text-foreground')}>{label}</span>
      <span className={cn('text-xs font-medium', muted ? 'text-muted-foreground' : 'text-foreground')}>{value}</span>
    </div>
  )
}

function CitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona tu ciudad" />
      </SelectTrigger>
      <SelectContent>
        {COLOMBIAN_CITIES.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
