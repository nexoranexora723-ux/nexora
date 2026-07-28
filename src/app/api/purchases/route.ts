import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Purchase Orders endpoint
export async function GET() {
  const purchases = await db.purchaseOrder.findMany({
    include: {
      supplier: { select: { id: true, companyName: true, country: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    purchases.map((p) => ({
      id: p.id,
      number: p.number,
      status: p.status,
      supplier: p.supplier,
      items: p.items.map((it) => ({
        id: it.id,
        product: it.product,
        quantity: it.quantity,
        unitCost: it.unitCost,
        totalCost: it.totalCost,
      })),
      subtotal: p.subtotal,
      shippingCost: p.shippingCost,
      tax: p.tax,
      total: p.total,
      currencyCode: p.currencyCode,
      expectedDate: p.expectedDate?.toISOString() ?? null,
      receivedDate: p.receivedDate?.toISOString() ?? null,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
    })),
  )
}
