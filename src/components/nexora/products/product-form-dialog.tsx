'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createProductSchema, type CreateProductInput } from '@/lib/schemas/product.schema'
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products'
import type { ProductWithRelations } from '@/server/services/product.service'
import { formatCurrency, marginPct } from '@/lib/format'
import { Loader2, Plus, Trash2, Image as ImageIcon, Video, Package, AlertCircle } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: ProductWithRelations | null
}

interface CatalogData {
  brands: { id: string; name: string }[]
  categories: { id: string; name: string; slug: string; children: { id: string; name: string; slug: string }[] }[]
  suppliers: { id: string; companyName: string }[]
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const isEdit = !!product
  const createMut = useCreateProduct()
  const updateMut = useUpdateProduct()
  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ['catalog'],
    queryFn: async () => (await fetch('/api/catalog')).json(),
  })

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: useMemo(() => mapProductToForm(product), [product]),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = form

  const imagesField = useFieldArray({ control, name: 'images' })
  const videosField = useFieldArray({ control, name: 'videos' })
  const variantsField = useFieldArray({ control, name: 'variants' })

  const [serverError, setServerError] = useState('')

  // Reset form when dialog opens or product changes
  useEffect(() => {
    if (open) {
      reset(mapProductToForm(product))
      setServerError('')
    }
  }, [open, product, reset])

  const purchasePrice = watch('purchasePrice') ?? 0
  const salePrice = watch('salePrice') ?? 0
  const margin = marginPct(purchasePrice, salePrice)

  const onSubmit = async (data: CreateProductInput) => {
    setServerError('')
    try {
      if (isEdit && product) {
        await updateMut.mutateAsync({ id: product.id, input: data })
      } else {
        await createMut.mutateAsync(data)
      }
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const onError = () => {
    setServerError('Revisa los campos marcados. Hay errores de validación.')
  }

  const submitting = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? `Modificando ${product?.sku}` : 'Completa la información del producto'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-5">
          {/* === SECCIÓN 1: Información básica === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">1</span>
              Información básica
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="name" className="text-xs">Nombre *</Label>
                <Input id="name" {...register('name')} className="h-9" placeholder="AirPods Pro 2" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku" className="text-xs">SKU *</Label>
                <Input id="sku" {...register('sku')} className="h-9 font-mono text-xs" placeholder="APL-APP-PRO2" disabled={isEdit} />
                {errors.sku && <p className="text-xs text-rose-500">{errors.sku.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="internalCode" className="text-xs">Código interno</Label>
                <Input id="internalCode" {...register('internalCode')} className="h-9" placeholder="INT-001" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="barcode" className="text-xs">Código de barras</Label>
                <Input id="barcode" {...register('barcode')} className="h-9" placeholder="7501234567890" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs">Estado</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="INACTIVE">Inactivo</SelectItem>
                        <SelectItem value="DISCONTINUED">Descontinuado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">Descripción</Label>
              <Textarea id="description" {...register('description')} rows={3} placeholder="Descripción del producto..." />
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 2: Clasificación === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">2</span>
              Clasificación
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Marca</Label>
                <Controller
                  control={control}
                  name="brandId"
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Sin marca" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin marca</SelectItem>
                        {catalog?.brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Categoría</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría</SelectItem>
                        {catalog?.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subcategoría</Label>
                <Controller
                  control={control}
                  name="subcategoryId"
                  render={({ field }) => {
                    const parentCat = catalog?.categories.find((c) => c.id === watch('categoryId'))
                    return (
                      <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)} disabled={!parentCat}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Sin subcategoría" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin subcategoría</SelectItem>
                          {parentCat?.children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Proveedor</Label>
                <Controller
                  control={control}
                  name="supplierId"
                  render={({ field }) => (
                    <Select value={field.value ?? 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin proveedor</SelectItem>
                        {catalog?.suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 3: Precios === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">3</span>
              Precios y margen
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice" className="text-xs">Precio compra *</Label>
                <Input id="purchasePrice" type="number" step="0.01" {...register('purchasePrice', { valueAsNumber: true })} className="h-9" />
                {errors.purchasePrice && <p className="text-xs text-rose-500">{errors.purchasePrice.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salePrice" className="text-xs">Precio venta *</Label>
                <Input id="salePrice" type="number" step="0.01" {...register('salePrice', { valueAsNumber: true })} className="h-9" />
                {errors.salePrice && <p className="text-xs text-rose-500">{errors.salePrice.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Margen</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3">
                  <Badge variant={margin >= 50 ? 'default' : margin >= 30 ? 'secondary' : 'destructive'} className="tabular-nums">
                    {margin.toFixed(1)}%
                  </Badge>
                  <span className="ml-2 text-xs text-muted-foreground">{formatCurrency(salePrice - purchasePrice)}</span>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 4: Atributos físicos === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">4</span>
              Atributos físicos
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="weight" className="text-xs">Peso (kg)</Label>
                <Input id="weight" type="number" step="0.001" {...register('weight', { valueAsNumber: true })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="length" className="text-xs">Largo (cm)</Label>
                <Input id="length" type="number" step="0.1" {...register('length', { valueAsNumber: true })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="width" className="text-xs">Ancho (cm)</Label>
                <Input id="width" type="number" step="0.1" {...register('width', { valueAsNumber: true })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="height" className="text-xs">Alto (cm)</Label>
                <Input id="height" type="number" step="0.1" {...register('height', { valueAsNumber: true })} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="color" className="text-xs">Color</Label>
                <Input id="color" {...register('color')} className="h-9" placeholder="Negro" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="material" className="text-xs">Material</Label>
                <Input id="material" {...register('material')} className="h-9" placeholder="Plástico" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="countryOfOrigin" className="text-xs">País origen</Label>
                <Input id="countryOfOrigin" {...register('countryOfOrigin')} className="h-9" placeholder="CN" maxLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="warranty" className="text-xs">Garantía</Label>
                <Input id="warranty" {...register('warranty')} className="h-9" placeholder="12 meses" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tags" className="text-xs">Etiquetas (separadas por coma)</Label>
              <Input id="tags" {...register('tags')} className="h-9" placeholder="premium, importado, best-seller" />
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 5: Multimedia === */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">5</span>
              Multimedia
            </h3>
            {/* Images */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs"><ImageIcon className="h-3.5 w-3.5" /> Imágenes</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => imagesField.append({ url: '', alt: '', position: imagesField.fields.length, isPrimary: imagesField.fields.length === 0 })}>
                  <Plus className="h-3 w-3" /> Añadir
                </Button>
              </div>
              {imagesField.fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`images.${idx}.url`)} placeholder="https://..." className="h-8 text-xs" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => imagesField.remove(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            {/* Videos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs"><Video className="h-3.5 w-3.5" /> Videos</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => videosField.append({ url: '', title: '', position: videosField.fields.length })}>
                  <Plus className="h-3 w-3" /> Añadir
                </Button>
              </div>
              {videosField.fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`videos.${idx}.url`)} placeholder="https://youtube.com/..." className="h-8 text-xs" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => videosField.remove(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* === SECCIÓN 6: Variantes === */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">6</span>
                Variantes (color, talla, capacidad...)
              </h3>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => variantsField.append({ sku: '', name: '', price: salePrice, stock: 0, status: 'ACTIVE' })}>
                <Plus className="h-3 w-3" /> Añadir variante
              </Button>
            </div>
            {variantsField.fields.length === 0 ? (
              <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                Sin variantes. Añade si el producto tiene opciones (color, talla, etc.)
              </p>
            ) : (
              <div className="space-y-2">
                {variantsField.fields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-2 gap-2 rounded-lg border p-2 sm:grid-cols-4">
                    <Input {...register(`variants.${idx}.sku`)} placeholder="SKU variante" className="h-8 text-xs font-mono" />
                    <Input {...register(`variants.${idx}.name`)} placeholder="Nombre" className="h-8 text-xs" />
                    <Input type="number" step="0.01" {...register(`variants.${idx}.price`, { valueAsNumber: true })} placeholder="Precio" className="h-8 text-xs" />
                    <div className="flex items-center gap-1">
                      <Input type="number" {...register(`variants.${idx}.stock`, { valueAsNumber: true })} placeholder="Stock" className="h-8 text-xs" />
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => variantsField.remove(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function mapProductToForm(product?: ProductWithRelations | null): CreateProductInput {
  if (!product) {
    return {
      sku: '',
      name: '',
      description: '',
      purchasePrice: 0,
      salePrice: 0,
      currencyCode: 'USD',
      status: 'ACTIVE',
      images: [],
      videos: [],
      variants: [],
    }
  }
  return {
    sku: product.sku,
    internalCode: product.internalCode ?? '',
    barcode: product.barcode ?? '',
    name: product.name,
    description: product.description ?? '',
    brandId: product.brandId ?? '',
    categoryId: product.categoryId ?? '',
    subcategoryId: product.subcategoryId ?? '',
    supplierId: product.supplierId ?? '',
    weight: product.weight ?? undefined,
    length: product.length ?? undefined,
    width: product.width ?? undefined,
    height: product.height ?? undefined,
    color: product.color ?? '',
    material: product.material ?? '',
    warranty: product.warranty ?? '',
    countryOfOrigin: product.countryOfOrigin ?? '',
    tags: product.tags ?? '',
    purchasePrice: product.purchasePrice,
    salePrice: product.salePrice,
    currencyCode: product.currencyCode,
    status: product.status as 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED',
    imageUrl: product.imageUrl ?? '',
    images: product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt ?? '', position: i.position, isPrimary: i.isPrimary })),
    videos: product.videos.map((v) => ({ id: v.id, url: v.url, title: v.title ?? '', position: v.position })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      option1: v.option1 ?? '',
      value1: v.value1 ?? '',
      price: v.price,
      stock: v.stock,
      status: v.status as 'ACTIVE' | 'INACTIVE',
    })),
  }
}
