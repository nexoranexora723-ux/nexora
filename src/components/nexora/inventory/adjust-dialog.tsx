'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { adjustStockSchema, type AdjustStockInput } from '@/lib/schemas/inventory.schema'
import { useAdjustStock, useInventory } from '@/hooks/use-inventory'
import { useProducts } from '@/hooks/use-products'
import { Loader2, Boxes, AlertCircle, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface AdjustDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preset?: { productId?: string; warehouseId?: string } | null
}

type AdjustType = 'IN' | 'OUT' | 'ADJUST'

const TYPE_META: Record<AdjustType, { label: string; desc: string; icon: typeof ArrowDownCircle; color: string }> = {
  IN: { label: 'Entrada', desc: 'Suma unidades al stock', icon: ArrowDownCircle, color: 'text-emerald-600' },
  OUT: { label: 'Salida', desc: 'Resta unidades al stock', icon: ArrowUpCircle, color: 'text-rose-600' },
  ADJUST: { label: 'Ajuste', desc: 'Corrige el stock (puede ser negativo)', icon: SlidersHorizontal, color: 'text-amber-600' },
}

export function AdjustDialog({ open, onOpenChange, preset }: AdjustDialogProps) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const adjustMut = useAdjustStock()

  const { data: products } = useProducts({ sort: 'name' })
  const { data: inventory } = useInventory()

  // Derive unique warehouses from existing inventory rows
  const warehouses = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>()
    for (const i of inventory ?? []) {
      if (!map.has(i.warehouse.id)) {
        map.set(i.warehouse.id, i.warehouse)
      }
    }
    return Array.from(map.values())
  }, [inventory])

  const [form, setForm] = useState<AdjustStockInput>({
    productId: '',
    warehouseId: '',
    type: 'IN',
    quantity: 0,
    reason: '',
    reference: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')

  // Reset on open + apply preset
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        productId: preset?.productId ?? '',
        warehouseId: preset?.warehouseId ?? '',
        type: 'IN',
        quantity: 0,
        reason: '',
        reference: '',
      })
      setErrors({})
      setServerError('')
    }
  }, [open, preset])

  // Current stock for the selected product+warehouse
  const currentStock = useMemo(() => {
    if (!form.productId || !form.warehouseId) return null
    return (
      inventory?.find(
        (i) => i.productId === form.productId && i.warehouseId === form.warehouseId,
      ) ?? null
    )
  }, [form.productId, form.warehouseId, inventory])

  // Projected stock preview
  const projectedStock = useMemo(() => {
    if (currentStock == null) return null
    let delta = form.quantity
    if (form.type === 'OUT') delta = -form.quantity
    // ADJUST: signed quantity
    return currentStock.stock + delta
  }, [currentStock, form.quantity, form.type])

  const onSubmit = async () => {
    setErrors({})
    setServerError('')
    const parsed = adjustStockSchema.safeParse(form)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }
    try {
      await adjustMut.mutateAsync(parsed.data)
      toast({
        title: 'Stock ajustado',
        description: `${parsed.data.type === 'IN' ? 'Entrada' : parsed.data.type === 'OUT' ? 'Salida' : 'Ajuste'} de ${Math.abs(parsed.data.quantity)} u.`,
      })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onOpenChange(false)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const TypeIcon = TYPE_META[form.type as AdjustType].icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            Ajustar stock
          </DialogTitle>
          <DialogDescription>
            Registra movimientos de inventario (entradas, salidas o ajustes). El cambio se aplica
            atómicamente en una transacción.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Producto *</Label>
            <Select
              value={form.productId || 'none'}
              onValueChange={(v) => setForm((f) => ({ ...f, productId: v === 'none' ? '' : v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="none">— Sin producto —</SelectItem>
                {products?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · <code className="text-xs">{p.sku}</code>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && <p className="text-xs text-rose-500">{errors.productId}</p>}
          </div>

          {/* Warehouse selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Almacén *</Label>
            <Select
              value={form.warehouseId || 'none'}
              onValueChange={(v) => setForm((f) => ({ ...f, warehouseId: v === 'none' ? '' : v }))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecciona un almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Sin almacén —</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} <code className="text-xs text-muted-foreground">({w.code})</code>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouseId && <p className="text-xs text-rose-500">{errors.warehouseId}</p>}
            {warehouses.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay almacenes con inventario. Se creará un registro nuevo al ajustar.
              </p>
            )}
          </div>

          {/* Current stock display */}
          {currentStock ? (
            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/30 p-3 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Stock actual</p>
                <p className="text-lg font-bold tabular-nums">{currentStock.stock}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Reservado</p>
                <p className="text-lg font-bold tabular-nums text-amber-600">{currentStock.reserved}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Disponible</p>
                <p className="text-lg font-bold tabular-nums text-emerald-600">{currentStock.available}</p>
              </div>
            </div>
          ) : form.productId && form.warehouseId ? (
            <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
              Este producto no tiene inventario en este almacén. Se creará un registro nuevo con stock
              inicial 0 al ajustar.
            </div>
          ) : null}

          {/* Movement type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de movimiento *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TYPE_META) as AdjustType[]).map((t) => {
                const Meta = TYPE_META[t]
                const Icon = Meta.icon
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-colors',
                      form.type === t
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/40',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', Meta.color)} />
                    <span className="text-xs font-medium">{Meta.label}</span>
                    <span className="text-[10px] text-muted-foreground">{Meta.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantity + projected */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs">
                Cantidad {form.type === 'ADJUST' && '(±)'} *
              </Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                value={form.quantity === 0 ? '' : form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: e.target.value === '' ? 0 : Number(e.target.value) }))
                }
                className="h-9"
                placeholder={form.type === 'ADJUST' ? '-5 o 10' : '10'}
              />
              {errors.quantity && <p className="text-xs text-rose-500">{errors.quantity}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stock resultante</Label>
              <div className="flex h-9 items-center justify-between rounded-md border bg-muted/40 px-3">
                {projectedStock != null ? (
                  <>
                    <Badge
                      variant={projectedStock < 0 ? 'destructive' : projectedStock === 0 ? 'secondary' : 'default'}
                      className="tabular-nums"
                    >
                      {projectedStock}
                    </Badge>
                    <TypeIcon className={cn('h-4 w-4', TYPE_META[form.type as AdjustType].color)} />
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              {projectedStock != null && projectedStock < 0 && (
                <p className="text-xs text-rose-500">⚠ Stock insuficiente</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Reason + reference */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs">Motivo</Label>
              <Textarea
                id="reason"
                rows={2}
                value={form.reason ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Ej.: Recepción de OC-1001, daño de mercancía, conteo físico..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference" className="text-xs">Referencia</Label>
              <Input
                id="reference"
                value={form.reference ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                className="h-9"
                placeholder="OC-1001, ORD-1029, AJE-2024-001..."
              />
            </div>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={adjustMut.isPending || projectedStock != null && projectedStock < 0}
            className="gap-1.5"
          >
            {adjustMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Boxes className="h-4 w-4" />
            )}
            Aplicar movimiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
