'use client'

import * as React from 'react'
import { Heart, Trash2, ShoppingCart, HeartCrack } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWishlist, selectWishlistCount } from '@/lib/wishlist-store'
import { useCart } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/format'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * WishlistCounter — Navbar button that shows the heart icon with a live count badge.
 * Clicking it opens the wishlist drawer (driven by the Zustand store).
 *
 * Renders a stable placeholder until mounted to avoid hydration mismatches.
 */
export function WishlistCounter() {
  const count = useWishlist(selectWishlistCount)
  const openWishlist = useWishlist((s) => s.openWishlist)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const display = mounted ? count : 0

  return (
    <button
      type="button"
      onClick={openWishlist}
      aria-label={`Lista de deseos, ${display} productos`}
      className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Heart className="size-4.5" />
      <AnimatePresence>
        {display > 0 && (
          <motion.span
            key={display}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className={cn(
              'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm',
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
 * WishlistDrawer — Side sheet that lists wishlist items.
 * Items can be moved to the cart or removed. Visibility is controlled
 * by the Zustand store so any component can open it.
 */
export function WishlistDrawer() {
  const isOpen = useWishlist((s) => s.isOpen)
  const setOpen = useWishlist((s) => s.setOpen)
  const items = useWishlist((s) => s.items)
  const removeItem = useWishlist((s) => s.removeItem)
  const clear = useWishlist((s) => s.clear)
  const addItemToCart = useCart((s) => s.addItem)
  const openCart = useCart((s) => s.openCart)
  const { toast } = useToast()

  const moveToCart = (item: (typeof items)[number]) => {
    addItemToCart({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
      currencyCode: item.currencyCode,
      sku: item.sku,
    })
    removeItem(item.id)
    toast({
      title: 'Agregado al carrito',
      description: item.name,
    })
  }

  const moveAllToCart = () => {
    if (items.length === 0) return
    items.forEach((item) => {
      addItemToCart({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        currencyCode: item.currencyCode,
        sku: item.sku,
      })
    })
    clear()
    toast({
      title: 'Todos los productos agregados',
      description: `${items.length} producto(s) movidos al carrito.`,
    })
    setOpen(false)
    openCart()
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <Heart className="size-4" />
            </div>
            <div>
              <SheetTitle className="text-base">Lista de deseos</SheetTitle>
              <SheetDescription className="text-xs">
                {items.length === 0
                  ? 'Aún no hay productos guardados'
                  : `${items.length} producto${items.length === 1 ? '' : 's'} guardado${items.length === 1 ? '' : 's'}`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <HeartCrack className="size-7" />
            </div>
            <div>
              <p className="text-sm font-medium">Tu lista de deseos está vacía</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Guarda productos que te interesen para importarlos después.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="mt-2">
              Explorar catálogo
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
                          aria-label={`Eliminar ${item.name} de la lista de deseos`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {item.sku && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">SKU: {item.sku}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-sm font-semibold">
                          {formatCurrency(item.price, item.currencyCode)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 px-2.5 text-xs"
                          onClick={() => moveToCart(item)}
                        >
                          <ShoppingCart className="size-3.5" /> Al carrito
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <SheetFooter className="border-t p-4">
              <Button onClick={moveAllToCart} className="w-full gap-2">
                <ShoppingCart className="size-4" /> Mover todo al carrito
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
