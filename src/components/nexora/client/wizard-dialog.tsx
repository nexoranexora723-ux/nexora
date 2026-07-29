'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Package, Sparkles, ChevronRight, ChevronLeft, Check, Loader2,
  ShoppingBag, Search, Link2, Image as ImageIcon, Send, Plus,
} from 'lucide-react'

interface WizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CATEGORIES = [
  { value: 'Tecnología', icon: '💻' }, { value: 'Hogar', icon: '🏠' },
  { value: 'Moda', icon: '👗' }, { value: 'Belleza', icon: '💄' },
  { value: 'Herramientas', icon: '🔧' }, { value: 'Mascotas', icon: '🐾' },
  { value: 'Automotriz', icon: '🚗' }, { value: 'Deportes', icon: '⚽' },
  { value: 'Otro', icon: '📦' },
]

const PURPOSES = [
  { value: 'personal', icon: '👤', label: 'Uso personal', desc: 'Para ti o un regalo' },
  { value: 'resale', icon: '📦', label: 'Reventa', desc: 'Para revender' },
  { value: 'business', icon: '🏢', label: 'Empresa', desc: 'Para tu negocio' },
]

export function WizardDialog({ open, onOpenChange }: WizardDialogProps) {
  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    productName: '', category: '', purpose: 'personal' as 'personal' | 'resale' | 'business',
    quantity: 1, budget: '', referenceUrl: '', referenceImages: '', details: '',
  })
  const [imageInput, setImageInput] = useState('')
  const [error, setError] = useState('')

  const create = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Error')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-requests'] })
      onOpenChange(false)
      setStep(1)
      setData({ productName: '', category: '', purpose: 'personal', quantity: 1, budget: '', referenceUrl: '', referenceImages: '', details: '' })
    },
  })

  const canProceed = () => {
    switch (step) {
      case 1: return data.category !== ''
      case 2: return data.purpose !== ''
      case 3: return data.quantity > 0
      case 4: return true // budget is optional
      case 5: return data.productName.trim() !== ''
      case 6: return true // details optional
      case 7: return true
      default: return false
    }
  }

  const handleSubmit = () => {
    setError('')
    if (!data.productName.trim()) {
      setError('Debes describir el producto')
      setStep(5)
      return
    }
    create.mutate({
      ...data,
      quantity: Number(data.quantity),
      budget: data.budget ? Number(data.budget) : undefined,
      currencyCode: 'USD',
      priority: 'MEDIUM',
    })
  }

  const next = () => { if (canProceed()) setStep((s) => Math.min(7, s + 1)) }
  const prev = () => setStep((s) => Math.max(1, s - 1))

  const steps = ['Categoría', 'Propósito', 'Cantidad', 'Presupuesto', 'Producto', 'Detalles', 'Confirmar']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Asistente de importación</DialogTitle>
          <DialogDescription>Te guiamos paso a paso para solicitar tu importación</DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all',
                i + 1 < step ? 'bg-primary text-primary-foreground' :
                i + 1 === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted text-muted-foreground',
              )}>
                {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('mt-1 hidden text-[9px] sm:block', i + 1 <= step ? 'font-medium text-foreground' : 'text-muted-foreground')}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[200px] py-4">
          {/* Step 1: Category */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">¿Qué deseas importar? 📦</h3>
                <p className="text-sm text-muted-foreground">Selecciona la categoría del producto</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.value} type="button" onClick={() => setData({ ...data, category: c.value })}
                    className={cn('flex flex-col items-center gap-1.5 rounded-xl border p-4 transition-all',
                      data.category === c.value ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:border-primary/40')}>
                    <span className="text-2xl">{c.icon}</span>
                    <span className="text-xs font-medium">{c.value}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Purpose */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">¿Es para? 🎯</h3>
                <p className="text-sm text-muted-foreground">Esto nos ayuda a buscar el mejor proveedor</p>
              </div>
              <div className="space-y-2">
                {PURPOSES.map((p) => (
                  <button key={p.value} type="button" onClick={() => setData({ ...data, purpose: p.value as 'personal' | 'resale' | 'business' })}
                    className={cn('flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all',
                      data.purpose === p.value ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:border-primary/40')}>
                    <span className="text-3xl">{p.icon}</span>
                    <div>
                      <p className="font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Quantity */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">¿Cuántas unidades? 🔢</h3>
                <p className="text-sm text-muted-foreground">Algunos proveedores tienen mínimo de orden (MOQ)</p>
              </div>
              <div className="flex items-center justify-center gap-4 py-8">
                <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={() => setData({ ...data, quantity: Math.max(1, data.quantity - 1) })}>
                  <span className="text-xl">−</span>
                </Button>
                <div className="text-center">
                  <Input type="number" min={1} value={data.quantity} onChange={(e) => setData({ ...data, quantity: Math.max(1, Number(e.target.value)) })} className="h-16 w-24 text-center text-3xl font-bold" />
                  <p className="mt-1 text-xs text-muted-foreground">unidades</p>
                </div>
                <Button type="button" variant="outline" size="icon" className="h-12 w-12" onClick={() => setData({ ...data, quantity: data.quantity + 1 })}>
                  <span className="text-xl">+</span>
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[1, 5, 10, 50, 100, 500].map((n) => (
                  <Button key={n} type="button" variant="outline" size="sm" onClick={() => setData({ ...data, quantity: n })}>{n}u</Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Budget */}
          {step === 4 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">¿Tienes un presupuesto? 💰</h3>
                <p className="text-sm text-muted-foreground">Opcional, pero nos ayuda a buscar mejores opciones</p>
              </div>
              <div className="py-8">
                <div className="relative mx-auto max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                  <Input type="number" min={0} value={data.budget} onChange={(e) => setData({ ...data, budget: e.target.value })} className="h-16 pl-10 text-center text-2xl font-bold" placeholder="0" />
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">USD · Total aproximado para todas las unidades</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[100, 500, 1000, 2000, 5000].map((n) => (
                  <Button key={n} type="button" variant="outline" size="sm" onClick={() => setData({ ...data, budget: String(n) })}>${n}</Button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Product + Reference */}
          {step === 5 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">Describe el producto 📝</h3>
                <p className="text-sm text-muted-foreground">Qué producto quieres importar</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Nombre del producto *</Label>
                <Input value={data.productName} onChange={(e) => setData({ ...data, productName: e.target.value })} placeholder="Ej: AirPods Pro 2, Zapatillas Nike..." autoFocus />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1"><Link2 className="h-3 w-3" /> Link de referencia (Alibaba, TikTok, etc.)</Label>
                <Input type="url" value={data.referenceUrl} onChange={(e) => setData({ ...data, referenceUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Imágenes de referencia</Label>
                <div className="flex gap-2">
                  <Input value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="https://imagen.com/foto.jpg" onKeyDown={(e) => {
                    if (e.key === 'Enter' && imageInput.trim()) {
                      e.preventDefault()
                      const imgs = data.referenceImages ? JSON.parse(data.referenceImages) : []
                      imgs.push(imageInput.trim())
                      setData({ ...data, referenceImages: JSON.stringify(imgs) })
                      setImageInput('')
                    }
                  }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    if (imageInput.trim()) {
                      const imgs = data.referenceImages ? JSON.parse(data.referenceImages) : []
                      imgs.push(imageInput.trim())
                      setData({ ...data, referenceImages: JSON.stringify(imgs) })
                      setImageInput('')
                    }
                  }}><Plus className="h-4 w-4" /></Button>
                </div>
                {data.referenceImages && (() => {
                  const imgs = JSON.parse(data.referenceImages)
                  return Array.isArray(imgs) && imgs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {imgs.map((url: string, i: number) => (
                        <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border">
                          <img src={url} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <button type="button" onClick={() => {
                            const filtered = imgs.filter((_: string, idx: number) => idx !== i)
                            setData({ ...data, referenceImages: filtered.length > 0 ? JSON.stringify(filtered) : '' })
                          }} className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white text-[8px] opacity-0 group-hover:opacity-100">✕</button>
                        </div>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          )}

          {/* Step 6: Details */}
          {step === 6 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">¿Algún detalle importante? 🔍</h3>
                <p className="text-sm text-muted-foreground">Color, talla, material, marca, empaque...</p>
              </div>
              <Textarea value={data.details} onChange={(e) => setData({ ...data, details: e.target.value })} rows={5} placeholder="Ej: Color negro, talla M, material cuero, con caja original, logo visible..." />
              <div className="flex flex-wrap gap-2">
                {['Color negro', 'Talla M', 'Material premium', 'Con empaque', 'Sin logo', 'OEM', 'Garantía 6+ meses'].map((t) => (
                  <button key={t} type="button" onClick={() => setData({ ...data, details: (data.details ? data.details + ', ' : '') + t })}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">+ {t}</button>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Confirm */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Confirma tu solicitud ✅</h3>
                <p className="text-sm text-muted-foreground">Revisa los datos antes de enviar</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Producto</dt><dd className="font-medium">{data.productName}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Categoría</dt><dd className="font-medium">{data.category}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Propósito</dt><dd className="font-medium">{data.purpose === 'personal' ? 'Personal' : data.purpose === 'resale' ? 'Reventa' : 'Empresa'}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Cantidad</dt><dd className="font-medium">{data.quantity} unidades</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Presupuesto</dt><dd className="font-medium">{data.budget ? `$${data.budget}` : 'Sin presupuesto'}</dd></div>
                  {data.details && <div className="flex justify-between gap-4"><dt className="shrink-0 text-muted-foreground">Detalles</dt><dd className="text-right font-medium">{data.details}</dd></div>}
                </dl>
              </div>
              <div className="rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
                <Sparkles className="mb-1 h-3.5 w-3.5 text-primary" />
                NAIOS analizará tu solicitud y buscará el mejor proveedor en China. Recibirás una cotización en breve.
              </div>
              {error && <p className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{error}</p>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button type="button" variant="ghost" onClick={prev} disabled={step === 1} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Atrás
          </Button>
          <span className="text-xs text-muted-foreground">Paso {step} de 7</span>
          {step < 7 ? (
            <Button type="button" onClick={next} disabled={!canProceed()} className="gap-1">
              Siguiente <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={create.isPending} className="gap-1">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar solicitud
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

