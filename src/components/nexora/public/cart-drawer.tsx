'use client'

import * as React from 'react'
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useCart, selectCartCount, selectCartTotal } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * CartCounter — Navbar button that shows the cart icon with a live count badge.
 * Clicking it opens the cart drawer (driven by the Zustand store).
 *
 * Renders a stable placeholder until mounted to avoid hydration mismatches
 * (the persisted cart count is only known client-side).
 */
export function CartCounter() {
  const count = useCart(selectCartCount)
  const openCart = useCart((s) => s.openCart)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const display = mounted ? count : 0

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Carrito de compras, ${display} productos`}
      className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ShoppingCart className="size-4.5" />
      <AnimatePresence>
        {display > 0 && (
          <motion.span
            key={display}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className={cn(
              'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm',
            )}
          >
            {display > 9 ? '9+' : display}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

/**
 * CartDrawer — Side sheet that lists cart items with qty controls.
 * Visibility is fully controlled by the Zustand store so any component
 * (CartCounter, ProductCard, etc.) can open it.
 */
export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen)
  const setOpen = useCart((s) => s.setOpen)
  const items = useCart((s) => s.items)
  const total = useCart(selectCartTotal)
  const updateQuantity = useCart((s) => s.updateQuantity)
  const removeItem = useCart((s) => s.removeItem)
  const clear = useCart((s) => s.clear)
  const { toast } = useToast()

  const handleCheckout = () => {
    if (items.length === 0) return
    toast({
      title: '¡Carrito enviado!',
      description: `Solicitud de importación creada para ${items.length} producto(s). Te contactaremos pronto.`,
    })
    clear()
    setOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingCart className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base">Tu carrito</SheetTitle>
              <SheetDescription className="text-xs">
                {items.length === 0
                  ? 'Aún no hay productos'
                  : `${items.length} producto${items.length === 1 ? '' : 's'} en tu carrito`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <ShoppingBag className="size-7" />
            </div>
            <div>
              <p className="text-sm font-medium">Tu carrito está vacío</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Explora el catálogo y agrega productos para importar.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="mt-2">
              Seguir explorando
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-4">
                    <div className="size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">📦</div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {item.sku && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">SKU: {item.sku}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1 rounded-lg border">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Reducir cantidad"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex size-7 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatCurrency(item.price * item.quantity, item.currencyCode)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="border-t p-4">
              <div className="mb-3 space-y-1.5 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Envío e impuestos</span>
                  <span className="text-xs">Se calculan al cotizar</span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Total estimado</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <Button onClick={handleCheckout} className="w-full gap-2">
                Solicitar importación <ArrowRight className="size-4" />
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">
                Sin compromiso · Cotización gratis · Pago seguro
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
