import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Storefront checkout
// Creates a real order + order items + transaction + decrements inventory
// This closes the loop: customer buys → order appears in admin Pedidos view
interface CheckoutItem {
  id: string
  sku: string
  name: string
  price: number
  quantity: number
}

interface CheckoutBody {
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    city?: string
    address?: string
    country?: string
  }
  items: CheckoutItem[]
  paymentMethod: string
  currencyCode?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody
    const { customer, items, paymentMethod, currencyCode = 'USD' } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
    }
    if (!customer.firstName || !customer.lastName || !customer.email) {
      return NextResponse.json({ error: 'Datos de cliente incompletos' }, { status: 400 })
    }

    // 1. Find or create customer by email
    let dbCustomer = await db.customer.findUnique({ where: { email: customer.email } })
    if (!dbCustomer) {
      const company = await db.company.findFirst()
      dbCustomer = await db.customer.create({
        data: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone ?? null,
          city: customer.city ?? null,
          address: customer.address ?? null,
          country: customer.country ?? 'CO',
          status: 'ACTIVE',
          companyId: company!.id,
        },
      })
    }

    // 2. Calculate order totals
    let subtotal = 0
    const orderItemsData: { productId: string; quantity: number; unitPrice: number; total: number }[] = []
    for (const item of items) {
      const product = await db.product.findUnique({ where: { id: item.id } })
      if (!product) continue
      const unitPrice = product.salePrice
      const total = unitPrice * item.quantity
      subtotal += total
      orderItemsData.push({ productId: product.id, quantity: item.quantity, unitPrice, total })
    }

    if (orderItemsData.length === 0) {
      return NextResponse.json({ error: 'No se pudo procesar ningún producto' }, { status: 400 })
    }

    const shippingCost = subtotal > 200 ? 0 : 12
    const tax = subtotal * 0.19
    const total = subtotal + shippingCost + tax

    // 3. Generate order number
    const orderCount = await db.order.count()
    const orderNumber = `ORD-${1000 + orderCount + 1}`

    // 4. Create order + items + transaction in a transaction
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          number: orderNumber,
          customerId: dbCustomer.id,
          status: 'PAID',
          subtotal,
          shippingCost,
          tax,
          discount: 0,
          total,
          currencyCode,
          paymentMethod,
          items: { create: orderItemsData },
        },
        include: { items: true },
      })

      // Create income transaction
      await tx.transaction.create({
        data: {
          type: 'INCOME',
          category: 'SALES',
          description: `Venta ${orderNumber} — Tienda NEXORA`,
          amount: total,
          currencyCode,
          reference: orderNumber,
          date: new Date(),
        },
      })

      // Decrement inventory for each item
      for (const item of orderItemsData) {
        const inv = await tx.inventory.findFirst({ where: { productId: item.productId } })
        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { stock: { decrement: item.quantity } },
          })
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              warehouseId: inv.warehouseId,
              type: 'OUT',
              quantity: item.quantity,
              reason: 'Venta tienda',
              reference: orderNumber,
            },
          })
        }
      }

      // Update customer LTV + order count
      await tx.customer.update({
        where: { id: dbCustomer.id },
        data: {
          lifetimeValue: { increment: total },
          totalOrders: { increment: 1 },
        },
      })

      return order
    })

    return NextResponse.json({
      success: true,
      orderNumber: result.number,
      orderId: result.id,
      total,
      customerName: `${dbCustomer.firstName} ${dbCustomer.lastName}`,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Error al procesar el pedido', detail: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    )
  }
}
