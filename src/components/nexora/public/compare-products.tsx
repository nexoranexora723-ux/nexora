'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Bookmark,
  BookmarkCheck,
  GitCompareArrows,
  X,
  Star,
  Image as ImageIcon,
  CheckCircle2,
  MinusCircle,
} from 'lucide-react'
import { useCompare, type CompareItem, MAX_COMPARE } from '@/lib/compare-store'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * CompareToggleButton — bookmark-style toggle for product cards.
 *
 * Renders as a small floating button (similar to the wishlist heart).
 * Becomes filled/primary-colored when the product is in the compare set.
 */
export function CompareToggleButton({
  item,
  className,
}: {
  item: CompareItem
  className?: string
}) {
  const toggle = useCompare((s) => s.toggle)
  const has = useCompare((s) => s.has)
  const count = useCompare((s) => s.items.length)
  const { toast } = useToast()
  const isSelected = has(item.id)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!isSelected && count >= MAX_COMPARE) {
      toast({
        title: 'Máximo alcanzado',
        description: `Solo puedes comparar hasta ${MAX_COMPARE} productos a la vez.`,
        variant: 'destructive',
      })
      return
    }
    toggle(item)
    toast({
      title: isSelected ? 'Removido de comparación' : 'Añadido a comparación',
    })
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isSelected ? 'Quitar de comparación' : 'Añadir a comparación'}
      aria-pressed={isSelected}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full shadow-lg backdrop-blur transition-colors',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-background/90 text-foreground hover:bg-background',
        className,
      )}
    >
      {isSelected ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </button>
  )
}

/**
 * CompareFloatingButton — fixed button that appears when 2+ products
 * are selected. Shows a count badge and opens the CompareModal.
 */
export function CompareFloatingButton() {
  const items = useCompare((s) => s.items)
  const setOpen = useCompare((s) => s.setOpen)
  const [showModal, setShowModal] = useState(false)

  if (items.length === 0) return null

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 sm:bottom-6 sm:left-6"
        aria-label={`Comparar ${items.length} productos`}
      >
        <GitCompareArrows className="h-5 w-5" />
        <span className="text-sm font-semibold">Comparar</span>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-foreground px-1.5 text-xs font-bold text-primary">
          {items.length}
        </span>
      </motion.button>
      <CompareModal open={showModal} onOpenChange={setShowModal} />
    </>
  )
}

/**
 * CompareFloatingButtonWrapper — mounts the floating button + modal together
 * so callers only need to add one component to their layout.
 */
export function CompareProducts() {
  const items = useCompare((s) => s.items)
  const isOpen = useCompare((s) => s.isOpen)
  const setOpen = useCompare((s) => s.setOpen)

  return (
    <>
      <AnimatePresence>
        {items.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 left-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 sm:bottom-6 sm:left-6"
            aria-label={`Comparar ${items.length} productos`}
          >
            <GitCompareArrows className="h-5 w-5" />
            <span className="text-sm font-semibold">Comparar</span>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-foreground px-1.5 text-xs font-bold text-primary">
              {items.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      <CompareModal open={isOpen} onOpenChange={setOpen} />
    </>
  )
}

/**
 * CompareModal — side-by-side comparison table.
 *
 * Compares: image, name, brand, category, price, photo count, rating.
 * Highlights the best value in each numeric column (lowest price, highest rating).
 */
export function CompareModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const items = useCompare((s) => s.items)
  const removeItem = useCompare((s) => s.removeItem)
  const clear = useCompare((s) => s.clear)

  // Compute "best" values for highlight.
  const { bestPrice, bestRating } = useMemo(() => {
    if (items.length === 0) return { bestPrice: null, bestRating: null }
    const priced = items.filter((i) => i.estimatedCost != null)
    const rated = items.filter((i) => (i.rating ?? 0) > 0)
    return {
      bestPrice: priced.length
        ? Math.min(...priced.map((i) => i.estimatedCost as number))
        : null,
      bestRating: rated.length
        ? Math.max(...rated.map((i) => i.rating as number))
        : null,
    }
  }, [items])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            Comparar productos
            <Badge variant="secondary" className="ml-1">{items.length}/{MAX_COMPARE}</Badge>
          </DialogTitle>
          <DialogDescription>
            Compara hasta {MAX_COMPARE} productos lado a lado. Los mejores valores se resaltan automáticamente.
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GitCompareArrows className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No hay productos para comparar</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Usa el botón bookmark en las tarjetas de producto para añadirlos aquí.
            </p>
          </div>
        ) : (
          <div className="nexora-scroll overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-32 bg-background p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Característica
                  </th>
                  {items.map((item) => (
                    <th key={item.id} className="min-w-[180px] border-l bg-background p-3 text-left align-top">
                      <div className="relative">
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label="Quitar de comparación"
                          className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-muted">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
                          )}
                        </div>
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Precio */}
                <tr className="border-t">
                  <td className="sticky left-0 z-10 bg-background p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Precio
                  </td>
                  {items.map((item) => {
                    const isBest = item.estimatedCost != null && item.estimatedCost === bestPrice && items.length > 1
                    return (
                      <td key={item.id} className="border-l p-3 align-top">
                        {item.estimatedCost != null ? (
                          <div className="flex items-center gap-1.5">
                            <span className={cn('text-lg font-bold', isBest && 'text-emerald-600')}>
                              ${item.estimatedCost.toFixed(2)}
                            </span>
                            <Badge variant="secondary" className="text-[9px]">{item.currencyCode}</Badge>
                            {isBest && (
                              <span title="Mejor precio" className="text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
                {/* Marca */}
                <tr className="border-t bg-muted/30">
                  <td className="sticky left-0 z-10 bg-muted/30 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Marca
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="border-l p-3 align-top">
                      {item.brand ? (
                        <Badge variant="outline" className="text-xs">{item.brand.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                {/* Categoría */}
                <tr className="border-t">
                  <td className="sticky left-0 z-10 bg-background p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categoría
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="border-l p-3 align-top text-sm">
                      {item.category ? (
                        <span className="inline-flex items-center gap-1.5">
                          {item.category.icon && <span>{item.category.icon}</span>}
                          {item.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                {/* Fotos */}
                <tr className="border-t bg-muted/30">
                  <td className="sticky left-0 z-10 bg-muted/30 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    N° de fotos
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="border-l p-3 align-top">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.photoCount ?? 0}
                      </span>
                    </td>
                  ))}
                </tr>
                {/* Rating */}
                <tr className="border-t">
                  <td className="sticky left-0 z-10 bg-background p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Calificación
                  </td>
                  {items.map((item) => {
                    const isBest = (item.rating ?? 0) > 0 && item.rating === bestRating && items.length > 1
                    return (
                      <td key={item.id} className="border-l p-3 align-top">
                        {item.rating != null && item.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="inline-flex">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'h-3.5 w-3.5',
                                    i <= Math.round(item.rating as number)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-muted text-muted',
                                  )}
                                />
                              ))}
                            </span>
                            <span className={cn('text-xs font-medium', isBest && 'text-emerald-600')}>
                              {item.rating.toFixed(1)}
                            </span>
                            {item.reviewCount != null && item.reviewCount > 0 && (
                              <span className="text-xs text-muted-foreground">({item.reviewCount})</span>
                            )}
                            {isBest && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MinusCircle className="h-3.5 w-3.5" /> Sin reseñas
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
                {/* Ventas */}
                <tr className="border-t bg-muted/30">
                  <td className="sticky left-0 z-10 bg-muted/30 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vendidos
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="border-l p-3 align-top text-sm">
                      {item.soldCount != null && item.soldCount > 0
                        ? item.soldCount.toLocaleString()
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={clear}
            >
              <X className="h-4 w-4" /> Limpiar todo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
