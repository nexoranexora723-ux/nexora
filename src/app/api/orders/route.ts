import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Sales Orders endpoint
export async function GET() {
  const orders = await db.order.findMany({
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true, city: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      customer: o.customer,
      items: o.items.map((it) => ({
        id: it.id,
        product: it.product,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })),
      subtotal: o.subtotal,
      shippingCost: o.shippingCost,
      tax: o.tax,
      discount: o.discount,
      total: o.total,
      currencyCode: o.currencyCode,
      paymentMethod: o.paymentMethod,
      trackingNumber: o.trackingNumber,
      createdAt: o.createdAt.toISOString(),
    })),
  )
}
