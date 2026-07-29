'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calculator, ArrowRight, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

interface CalculatorProps {
  onRequestQuote: () => void
}

export function ImportCalculator({ onRequestQuote }: CalculatorProps) {
  const [productCost, setProductCost] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [shippingCost, setShippingCost] = useState('80')
  const [customsRate, setCustomsRate] = useState('15')
  const [margin, setMargin] = useState('50')

  const cost = Number(productCost) || 0
  const qty = Number(quantity) || 1
  const shipping = Number(shippingCost) || 0
  const customs = Number(customsRate) || 0
  const marginPct = Number(margin) || 0

  const productTotal = cost * qty
  const customsCost = productTotal * (customs / 100)
  const totalCost = productTotal + shipping + customsCost
  const costPerUnit = totalCost / qty
  const suggestedPrice = costPerUnit * (1 + marginPct / 100)
  const totalRevenue = suggestedPrice * qty
  const profit = totalRevenue - totalCost

  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Calculadora de importación</h3>
            <p className="text-xs text-muted-foreground">Estima el costo real de importar desde China</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Costo del producto (USD/u)</Label>
            <Input type="number" value={productCost} onChange={(e) => setProductCost(e.target.value)} placeholder="68.50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cantidad</Label>
            <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Envío internacional (USD)</Label>
            <Input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Aduana (%)</Label>
            <Input type="number" value={customsRate} onChange={(e) => setCustomsRate(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Margen deseado (%)</Label>
            <Input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} />
          </div>
        </div>

        {/* Results */}
        <div className="mt-4 space-y-2 rounded-xl bg-muted/40 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Costo producto ({qty}u)</span>
            <span className="font-medium tabular-nums">{formatCurrency(productTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Envío internacional</span>
            <span className="font-medium tabular-nums">{formatCurrency(shipping)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Aduana ({customs}%)</span>
            <span className="font-medium tabular-nums">{formatCurrency(customsCost)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-sm font-bold">
            <span>Costo total</span>
            <span className="tabular-nums">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Costo por unidad</span>
            <span className="font-medium tabular-nums">{formatCurrency(costPerUnit)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Precio sugerido ({marginPct}% margen)</span>
            <span className="font-medium tabular-nums text-primary">{formatCurrency(suggestedPrice)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-sm font-bold">
            <span>Utilidad estimada</span>
            <span className="tabular-nums text-emerald-600">{formatCurrency(profit)}</span>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>Esta es una estimación. Los costos reales pueden variar según el proveedor, método de envío y regulaciones aduaneras. Solicita una cotización exacta.</p>
        </div>

        <Button className="mt-4 w-full gap-1.5" onClick={onRequestQuote}>
          Solicitar cotización exacta <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
