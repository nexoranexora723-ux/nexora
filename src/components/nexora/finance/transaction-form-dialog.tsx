'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTransactionSchema, type CreateTransactionInput, type transactionCategorySchema, type transactionTypeSchema } from '@/lib/schemas/finance.schema'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/use-finance'
import type { TransactionView } from '@/server/services/finance.service'
import { formatCurrency } from '@/lib/format'
import { Loader2, AlertCircle, Wallet, TrendingUp, TrendingDown, ShoppingCart, Truck, Users, Megaphone, Building, Zap, Percent, FileText, Package } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { z } from 'zod'

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: TransactionView | null
  defaultType?: 'INCOME' | 'EXPENSE'
}

type CategoryKey = z.infer<typeof transactionCategorySchema>
type TypeKey = z.infer<typeof transactionTypeSchema>

const CATEGORY_META: Record<CategoryKey, { label: string; icon: typeof ShoppingCart }> = {
  SALES: { label: 'Ventas', icon: ShoppingCart },
  PURCHASES: { label: 'Compras', icon: Package },
  SHIPPING: { label: 'Envíos', icon: Truck },
  SALARY: { label: 'Nómina', icon: Users },
  MARKETING: { label: 'Marketing', icon: Megaphone },
  RENT: { label: 'Arriendo', icon: Building },
  UTILITY: { label: 'Servicios públicos', icon: Zap },
  COMMISSION: { label: 'Comisiones', icon: Percent },
  TAX: { label: 'Impuestos', icon: FileText },
  OTHER: { label: 'Otro', icon: FileText },
}

const CURRENCY_OPTIONS = ['USD', 'COP', 'EUR', 'MXN'] as const

export function TransactionFormDialog({ open, onOpenChange, transaction, defaultType = 'EXPENSE' }: TransactionFormDialogProps) {
  const isEdit = !!transaction
  const createMut = useCreateTransaction()
  const updateMut = useUpdateTransaction()

  const form = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: useMemo(
      () => mapTransactionToForm(transaction, defaultType),
      [transaction, defaultType],
    ),
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = form

  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (open) {
      reset(mapTransactionToForm(transaction, defaultType))
      setServerError('')
    }
  }, [open, transaction, defaultType, reset])

  const type = watch('type') ?? defaultType
  const amount = watch('amount') ?? 0

  const onSubmit = async (data: CreateTransactionInput) => {
    setServerError('')
    try {
      if (isEdit && transaction) {
        await updateMut.mutateAsync({ id: transaction.id, input: data })
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
      <DialogContent className="nexora-scroll max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {isEdit ? 'Editar transacción' : 'Nueva transacción'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modifica los datos de la transacción' : 'Registra un ingreso o gasto'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          {/* Type radio */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue('type', 'INCOME', { shouldValidate: true })}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors',
                      type === 'INCOME'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/40',
                    )}
                  >
                    <TrendingUp className="h-4 w-4" /> Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('type', 'EXPENSE', { shouldValidate: true })}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors',
                      type === 'EXPENSE'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/40',
                    )}
                  >
                    <TrendingDown className="h-4 w-4" /> Gasto
                  </button>
                </div>
              )}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs">Categoría</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => {
                const Icon = CATEGORY_META[field.value as CategoryKey]?.icon ?? FileText
                return (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9">
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CATEGORY_META) as CategoryKey[]).map((k) => {
                        const M = CATEGORY_META[k]
                        const MIcon = M.icon
                        return (
                          <SelectItem key={k} value={k}>
                            <span className="flex items-center gap-2">
                              <MIcon className="h-3.5 w-3.5" /> {M.label}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Descripción *</Label>
            <Input id="description" {...register('description')} className="h-9" placeholder="Ej: Venta orden ORD-1005" />
            {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
          </div>

          {/* Amount + currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="amount" className="text-xs">Monto *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min={0}
                className="h-9 tabular-nums"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && <p className="text-xs text-rose-500">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Moneda</Label>
              <Controller
                control={control}
                name="currencyCode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Reference + date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="reference" className="text-xs">Referencia</Label>
              <Input id="reference" {...register('reference')} className="h-9" placeholder="ORD-1005, FACT-001..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs">Fecha</Label>
              <Input id="date" type="date" {...register('date')} className="h-9" />
            </div>
          </div>

          {/* Live preview */}
          <div className={cn(
            'rounded-lg border p-3 text-sm',
            type === 'INCOME'
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
              : 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30',
          )}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Vista previa</span>
              <span className={cn(
                'font-bold tabular-nums',
                type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
              )}>
                {type === 'INCOME' ? '+' : '−'}{formatCurrency(Number(amount) || 0, watch('currencyCode') ?? 'USD')}
              </span>
            </div>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              {isEdit ? 'Guardar cambios' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function mapTransactionToForm(
  tx?: TransactionView | null,
  defaultType: 'INCOME' | 'EXPENSE' = 'EXPENSE',
): CreateTransactionInput {
  if (!tx) {
    const today = new Date().toISOString().slice(0, 10)
    return {
      type: defaultType,
      category: defaultType === 'INCOME' ? 'SALES' : 'OTHER',
      description: '',
      amount: 0,
      currencyCode: 'USD',
      reference: '',
      date: today,
    }
  }
  return {
    type: tx.type,
    category: tx.category as CreateTransactionInput['category'],
    description: tx.description,
    amount: tx.amount,
    currencyCode: tx.currencyCode,
    reference: tx.reference ?? '',
    date: tx.date.slice(0, 10),
  }
}
