'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCart, cartTotal, cartCount } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CartDrawerProps {
  onCheckout: () => void
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, isOpen, setOpen, removeItem, updateQuantity } = useCart()
  const subtotal = cartTotal(items)
  const shipping = subtotal > 200 || subtotal === 0 ? 0 : 12
  const tax = subtotal * 0.19
  const total = subtotal + shipping + tax
  const count = cartCount(items)

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <div>
              <SheetTitle className="text-base">Tu carrito</SheetTitle>
              <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'artículo' : 'artículos'}</p>
            </div>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium">El carrito está vacío</p>
              <p className="mt-1 text-xs text-muted-foreground">Añade productos de la tienda para continuar</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Seguir comprando
            </Button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <div className="nexora-scroll flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-lg border bg-card p-3">
                    {/* Image */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-16 w-16 shrink-0 rounded-md object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-xl">📦</div>
                    )}

                    {/* Details */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-rose-500"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        {/* Quantity selector */}
                        <div className="flex items-center rounded-lg border">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                            aria-label="Disminuir"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Aumentar"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold tabular-nums">{formatCurrency(item.price * item.quantity)}</p>
                          <p className="text-[10px] text-muted-foreground">{formatCurrency(item.price)} c/u</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary + checkout */}
            <SheetFooter className="border-t bg-card px-5 py-4">
              <div className="mb-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Envío {shipping === 0 && <span className="text-emerald-600 dark:text-emerald-400">(gratis)</span>}</span>
                  <span className="tabular-nums">{shipping === 0 ? '—' : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA (19%)</span>
                  <span className="tabular-nums">{formatCurrency(tax)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
              <Button
                className="w-full gap-1.5"
                size="lg"
                onClick={onCheckout}
              >
                Finalizar compra <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">
                Envío gratis en compras superiores a $200
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
