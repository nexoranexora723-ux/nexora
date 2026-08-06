'use client'

/**
 * NEXORA — Filtros Avanzados
 * Panel de filtros con precio, marca, rating, categoría, envío gratis, etc.
 * Versión mejorada con UI más limpia y opciones adicionales.
 */
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion'
import {
  Filter, X, Star, Truck, Zap, RotateCcw, ChevronDown, Tags
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'popular'
export type PriceRange = [number, number]

export interface AdvancedFilters {
  priceRange: PriceRange
  minRating: number
  brands: string[]
  onlyFeatured: boolean
  onlyFreeShipping: boolean
  onlyDiscount: boolean
  sort: SortOption
}

export const DEFAULT_FILTERS: AdvancedFilters = {
  priceRange: [0, 500],
  minRating: 0,
  brands: [],
  onlyFeatured: false,
  onlyFreeShipping: false,
  onlyDiscount: false,
  sort: 'relevance',
}

interface AdvancedFiltersPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  filters: AdvancedFilters
  onFiltersChange: (filters: AdvancedFilters) => void
  availableBrands: Array<{ id: string; name: string; count: number }>
  maxPrice: number
  resultCount: number
}

export function AdvancedFiltersPanel({
  isOpen,
  onOpenChange,
  filters,
  onFiltersChange,
  availableBrands,
  maxPrice,
  resultCount,
}: AdvancedFiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters)

  const updateFilter = <K extends keyof AdvancedFilters>(
    key: K,
    value: AdvancedFilters[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const toggleBrand = (brandId: string) => {
    const current = localFilters.brands
    const newBrands = current.includes(brandId)
      ? current.filter(b => b !== brandId)
      : [...current, brandId]
    updateFilter('brands', newBrands)
  }

  const reset = () => {
    setLocalFilters(DEFAULT_FILTERS)
    onFiltersChange(DEFAULT_FILTERS)
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < maxPrice) count++
    if (localFilters.minRating > 0) count++
    if (localFilters.brands.length > 0) count++
    if (localFilters.onlyFeatured) count++
    if (localFilters.onlyFreeShipping) count++
    if (localFilters.onlyDiscount) count++
    if (localFilters.sort !== 'relevance') count++
    return count
  }, [localFilters, maxPrice])

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md overflow-y-auto">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Filter className="size-4" />
              </div>
              <div>
                <SheetTitle className="text-base">Filtros</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {resultCount} producto{resultCount === 1 ? '' : 's'}
                  {activeFiltersCount > 0 && ` · ${activeFiltersCount} filtro${activeFiltersCount === 1 ? '' : 's'} activo${activeFiltersCount === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1 text-xs">
                <RotateCcw className="h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <Accordion type="multiple" defaultValue={['price', 'sort']} className="px-4">
            {/* Ordenamiento */}
            <AccordionItem value="sort">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Tags className="h-4 w-4" /> Ordenar por
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Select
                  value={localFilters.sort}
                  onValueChange={(v) => updateFilter('sort', v as SortOption)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevancia</SelectItem>
                    <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="rating">Mejor calificados</SelectItem>
                    <SelectItem value="newest">Más recientes</SelectItem>
                    <SelectItem value="popular">Más vendidos</SelectItem>
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>

            {/* Rango de precio */}
            <AccordionItem value="price">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  💰 Precio
                  {localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < maxPrice ? (
                    <Badge variant="secondary" className="text-xs h-5">
                      ${localFilters.priceRange[0]} - ${localFilters.priceRange[1]}
                    </Badge>
                  ) : null}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 px-1">
                  <Slider
                    min={0}
                    max={maxPrice}
                    step={10}
                    value={localFilters.priceRange}
                    onValueChange={(v) => updateFilter('priceRange', v as PriceRange)}
                    className="mt-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>${localFilters.priceRange[0]}</span>
                    <span>${localFilters.priceRange[1]}{localFilters.priceRange[1] >= maxPrice ? '+' : ''}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Marcas */}
            <AccordionItem value="brands">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  ✨ Marca
                  {localFilters.brands.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-5">
                      {localFilters.brands.length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1 max-h-48 overflow-y-auto nexora-scroll">
                  {availableBrands.slice(0, 30).map((brand) => (
                    <label
                      key={brand.id}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-muted transition-colors',
                        localFilters.brands.includes(brand.id) && 'bg-primary/5'
                      )}
                    >
                      <span className="text-sm">{brand.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{brand.count}</span>
                        <Switch
                          checked={localFilters.brands.includes(brand.id)}
                          onCheckedChange={() => toggleBrand(brand.id)}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Rating mínimo */}
            <AccordionItem value="rating">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4" /> Calificación
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => updateFilter('minRating', rating)}
                      className={cn(
                        'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                        localFilters.minRating === rating && 'bg-primary/5 font-medium'
                      )}
                    >
                      {rating === 0 ? (
                        <span>Todos</span>
                      ) : (
                        <>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  'h-3.5 w-3.5',
                                  s <= Math.floor(rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground'
                                )}
                              />
                            ))}
                          </div>
                          <span>{rating}+ estrellas</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Filtros rápidos */}
            <AccordionItem value="quick">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Filtros rápidos
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-amber-400" />
                      Destacados
                    </span>
                    <Switch
                      checked={localFilters.onlyFeatured}
                      onCheckedChange={(v) => updateFilter('onlyFeatured', v)}
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-blue-500" />
                      Envío gratis
                    </span>
                    <Switch
                      checked={localFilters.onlyFreeShipping}
                      onCheckedChange={(v) => updateFilter('onlyFreeShipping', v)}
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-orange-500" />
                      Con descuento
                    </span>
                    <Switch
                      checked={localFilters.onlyDiscount}
                      onCheckedChange={(v) => updateFilter('onlyDiscount', v)}
                    />
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="border-t p-4 gap-2">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Ver {resultCount} producto{resultCount === 1 ? '' : 's'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
