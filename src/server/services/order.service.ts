// NEXORA — Order Service (Sales)
// Business logic layer. Route handlers delegate here (per DOC-002 §7, §12 "Regla de Oro").
// Mirrors the pattern established by ProductService / PurchaseService.
import { db } from '@/lib/db'
import {
  CreateOrderInput,
  UpdateOrderInput,
  OrderQuery,
  OrderItemInput,
} from '@/lib/schemas/order.schema'

export interface OrderItemView {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  product: {
    id: string
    name: string
    sku: string
    imageUrl: string | null
    salePrice: number
  }
}

export interface OrderWithRelations {
  id: string
  number: string
  customerId: string
  userId: string | null
  status: string
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  total: number
  currencyCode: string
  paymentMethod: string | null
  trackingNumber: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  // computed
  itemCount: number
  // relations
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    city: string | null
  }
  items: OrderItemView[]
}

const INCLUDE = {
  customer: {
    select: { id: true, firstName: true, lastName: true, email: true, city: true },
  },
  items: {
    include: {
      product: {
        select: { id: true, name: true, sku: true, imageUrl: true, salePrice: true },
      },
    },
    orderBy: { id: 'asc' as const },
  },
} as const

type OrderWithIncludes = Record<string, unknown> & {
  id: string
  number: string
  customerId: string
  userId: string | null
  status: string
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  total: number
  currencyCode: string
  paymentMethod: string | null
  trackingNumber: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  customer: {
    id: string
    firstName: string
    lastName: string
    email: string
    city: string | null
  }
  items: OrderItemWithProduct[]
}

interface OrderItemWithProduct {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  product: {
    id: string
    name: string
    sku: string
    imageUrl: string | null
    salePrice: number
  }
}

function enrich(o: OrderWithIncludes): OrderWithRelations {
  return {
    id: o.id,
    number: o.number,
    customerId: o.customerId,
    userId: o.userId,
    status: o.status,
    subtotal: o.subtotal,
    shippingCost: o.shippingCost,
    tax: o.tax,
    discount: o.discount,
    total: o.total,
    currencyCode: o.currencyCode,
    paymentMethod: o.paymentMethod,
    trackingNumber: o.trackingNumber,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    itemCount: o.items.length,
    customer: o.customer,
    items: o.items.map((it: OrderItemWithProduct) => ({
      id: it.id,
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discount: 0, // per-line discount not persisted on OrderItem model; kept for view parity
      total: it.total,
      product: it.product,
    })),
  }
}

function buildOrderBy(sort: OrderQuery['sort']) {
  switch (sort) {
    case 'created':
      return { createdAt: 'asc' as const }
    case 'total':
      return { total: 'asc' as const }
    case 'total_desc':
      return { total: 'desc' as const }
    case 'status':
      return { status: 'asc' as const }
    default:
      return { createdAt: 'desc' as const }
  }
}

// Line total: (unitPrice * quantity) * (1 - discount/100)
function computeLineTotal(item: OrderItemInput): number {
  const gross = item.unitPrice * item.quantity
  const discountAmount = gross * ((item.discount ?? 0) / 100)
  return Math.max(0, gross - discountAmount)
}

// Gross subtotal = sum of (unitPrice * quantity) — BEFORE any discount
function computeGrossSubtotal(items: OrderItemInput[]): number {
  return items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
}

// Order-level discount = sum of line discounts (in currency units)
function computeOrderDiscount(items: OrderItemInput[]): number {
  return items.reduce((s, i) => {
    const gross = i.unitPrice * i.quantity
    return s + gross * ((i.discount ?? 0) / 100)
  }, 0)
}

// Shipping: free if gross subtotal > 200, else 12 USD
function computeShipping(grossSubtotal: number): number {
  return grossSubtotal > 200 ? 0 : 12
}

// Tax: 19% on taxable base (gross subtotal − discount)
function computeTax(grossSubtotal: number, discount: number): number {
  return Math.max(0, (grossSubtotal - discount) * 0.19)
}

// Generate sequential order number ORD-XXXX with 1001 prefix
async function generateOrderNumber(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
): Promise<string> {
  const count = await tx.order.count()
  const seq = 1001 + count
  return `ORD-${seq}`
}

export class OrderService {
  static async list(query: OrderQuery): Promise<OrderWithRelations[]> {
    const where: Record<string, unknown> = {}
    if (query.q) {
      where.OR = [
        { number: { contains: query.q } },
        { trackingNumber: { contains: query.q } },
        { notes: { contains: query.q } },
        { customer: { firstName: { contains: query.q } } },
        { customer: { lastName: { contains: query.q } } },
        { customer: { email: { contains: query.q } } },
      ]
    }
    if (query.status) where.status = query.status
    if (query.customerId && query.customerId !== 'all') where.customerId = query.customerId

    const orders = await db.order.findMany({
      where,
      include: INCLUDE,
      orderBy: buildOrderBy(query.sort),
    })
    return orders.map(enrich)
  }

  static async getById(id: string): Promise<OrderWithRelations | null> {
    const o = await db.order.findUnique({ where: { id }, include: INCLUDE })
    return o ? enrich(o as unknown as OrderWithIncludes) : null
  }

  static async create(input: CreateOrderInput): Promise<OrderWithRelations> {
    // Verify customer exists
    const customer = await db.customer.findUnique({ where: { id: input.customerId } })
    if (!customer) throw new Error('Cliente no encontrado')

    // Verify all products exist
    const productIds = input.items.map((i) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: productIds } } })
    if (products.length !== productIds.length) {
      throw new Error('Uno o más productos no existen')
    }

    // Find an active warehouse for inventory movements
    const warehouse = await db.warehouse.findFirst({ where: { isActive: true } })
    if (!warehouse) throw new Error('No hay almacén activo disponible')

    // Compute totals (gross subtotal → discount → tax → shipping → total)
    const subtotal = computeGrossSubtotal(input.items)
    const discount = computeOrderDiscount(input.items)
    const shippingCost = computeShipping(subtotal)
    const tax = computeTax(subtotal, discount)
    const total = subtotal - discount + shippingCost + tax

    const paymentMethod =
      input.paymentMethod && input.paymentMethod.trim() ? input.paymentMethod.trim() : null
    const notes = input.notes && input.notes.trim() ? input.notes.trim() : null

    const result = await db.$transaction(async (tx) => {
      const number = await generateOrderNumber(tx)

      // 1. Create the Order + Items
      const order = await tx.order.create({
        data: {
          number,
          customerId: input.customerId,
          status: input.status,
          subtotal,
          shippingCost,
          tax,
          discount,
          total,
          currencyCode: 'USD',
          paymentMethod,
          notes,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: computeLineTotal(item),
            })),
          },
        },
        include: INCLUDE,
      })

      // 2. Create INCOME/SALES transaction
      await tx.transaction.create({
        data: {
          type: 'INCOME',
          category: 'SALES',
          description: `Venta ${number}`,
          amount: total,
          currencyCode: 'USD',
          reference: number,
          date: new Date(),
        },
      })

      // 3. Decrement inventory + create OUT movements
      for (const item of input.items) {
        const inv = await tx.inventory.findUnique({
          where: {
            productId_warehouseId: {
              productId: item.productId,
              warehouseId: warehouse.id,
            },
          },
        })

        if (inv) {
          await tx.inventory.update({
            where: { id: inv.id },
            data: { stock: { decrement: item.quantity } },
          })
        } else {
          // Create inventory row with negative stock (signals oversell) — still record movement
          await tx.inventory.create({
            data: {
              productId: item.productId,
              warehouseId: warehouse.id,
              stock: -item.quantity,
              reserved: 0,
              minStock: 0,
            },
          })
        }

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: warehouse.id,
            type: 'OUT',
            quantity: item.quantity,
            reason: 'VENTA',
            reference: number,
          },
        })
      }

      // 4. Update customer LTV + totalOrders
      await tx.customer.update({
        where: { id: input.customerId },
        data: {
          lifetimeValue: { increment: total },
          totalOrders: { increment: 1 },
        },
      })

      return order
    })

    return enrich(result as unknown as OrderWithIncludes)
  }

  static async update(id: string, input: UpdateOrderInput): Promise<OrderWithRelations> {
    const existing = await db.order.findUnique({
      where: { id },
      include: INCLUDE,
    })
    if (!existing) throw new Error('Pedido no encontrado')
    if (existing.status === 'CANCELLED') throw new Error('No se puede editar un pedido cancelado')
    if (existing.status === 'DELIVERED') throw new Error('No se puede editar un pedido entregado')

    // If items provided, verify products + recompute totals
    let newSubtotal: number | undefined
    let newDiscount: number | undefined
    let newShipping: number | undefined
    let newTax: number | undefined
    let newTotal: number | undefined
    const itemsInput = input.items

    if (itemsInput) {
      const productIds = itemsInput.map((i) => i.productId)
      const products = await db.product.findMany({ where: { id: { in: productIds } } })
      if (products.length !== productIds.length) {
        throw new Error('Uno o más productos no existen')
      }
      newSubtotal = computeGrossSubtotal(itemsInput)
      newDiscount = computeOrderDiscount(itemsInput)
      newShipping = computeShipping(newSubtotal)
      newTax = computeTax(newSubtotal, newDiscount)
      newTotal = newSubtotal - newDiscount + newShipping + newTax
    }

    const paymentMethod =
      input.paymentMethod !== undefined
        ? input.paymentMethod && input.paymentMethod.trim()
          ? input.paymentMethod.trim()
          : null
        : undefined
    const notes =
      input.notes !== undefined
        ? input.notes && input.notes.trim()
          ? input.notes.trim()
          : null
        : undefined

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          ...(input.customerId ? { customerId: input.customerId } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(paymentMethod !== undefined ? { paymentMethod } : {}),
          ...(notes !== undefined ? { notes } : {}),
          ...(newSubtotal !== undefined ? { subtotal: newSubtotal } : {}),
          ...(newDiscount !== undefined ? { discount: newDiscount } : {}),
          ...(newShipping !== undefined ? { shippingCost: newShipping } : {}),
          ...(newTax !== undefined ? { tax: newTax } : {}),
          ...(newTotal !== undefined ? { total: newTotal } : {}),
        },
        include: INCLUDE,
      })

      // Sync items if provided
      if (itemsInput) {
        await tx.orderItem.deleteMany({ where: { orderId: id } })
        if (itemsInput.length > 0) {
          await tx.orderItem.createMany({
            data: itemsInput.map((item) => ({
              orderId: id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: computeLineTotal(item),
            })),
          })
        }
        // Update the linked INCOME/SALES transaction amount if total changed
        if (newTotal !== undefined) {
          await tx.transaction.updateMany({
            where: { reference: existing.number, category: 'SALES', type: 'INCOME' },
            data: { amount: newTotal },
          })
        }
      }

      return tx.order.findUnique({ where: { id }, include: INCLUDE })
    })

    return enrich(result as unknown as OrderWithIncludes)
  }

  // Cancel: status → CANCELLED + restore inventory + reverse transaction + decrement customer LTV
  static async cancel(id: string): Promise<OrderWithRelations> {
    const existing = await db.order.findUnique({
      where: { id },
      include: INCLUDE,
    })
    if (!existing) throw new Error('Pedido no encontrado')
    if (existing.status === 'CANCELLED') throw new Error('El pedido ya está cancelado')

    const warehouse = await db.warehouse.findFirst({ where: { isActive: true } })

    await db.$transaction(async (tx) => {
      // 1. Mark as CANCELLED
      await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })

      // 2. Reverse the INCOME/SALES transaction (delete by reference)
      await tx.transaction.deleteMany({
        where: { reference: existing.number, category: 'SALES', type: 'INCOME' },
      })

      // 3. Restore inventory + create IN movements
      if (warehouse) {
        for (const item of existing.items) {
          const inv = await tx.inventory.findUnique({
            where: {
              productId_warehouseId: {
                productId: item.productId,
                warehouseId: warehouse.id,
              },
            },
          })

          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: { stock: { increment: item.quantity } },
            })
          } else {
            await tx.inventory.create({
              data: {
                productId: item.productId,
                warehouseId: warehouse.id,
                stock: item.quantity,
                reserved: 0,
                minStock: 0,
              },
            })
          }

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              warehouseId: warehouse.id,
              type: 'IN',
              quantity: item.quantity,
              reason: 'CANCELACIÓN',
              reference: existing.number,
            },
          })
        }
      }

      // 4. Decrement customer LTV + totalOrders
      await tx.customer.update({
        where: { id: existing.customerId },
        data: {
          lifetimeValue: { decrement: existing.total },
          totalOrders: { decrement: 1 },
        },
      })
    })

    const refreshed = await db.order.findUnique({ where: { id }, include: INCLUDE })
    return enrich(refreshed as unknown as OrderWithIncludes)
  }

  // Hard delete (only allowed for CANCELLED orders to keep history consistent)
  static async delete(id: string): Promise<void> {
    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) throw new Error('Pedido no encontrado')
    if (existing.status !== 'CANCELLED') {
      throw new Error('Solo se pueden eliminar pedidos cancelados. Cancela primero.')
    }
    await db.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } })
      await tx.order.delete({ where: { id } })
    })
  }

  // Stats for the header cards
  static async stats() {
    const [total, pending, paid, shipped, delivered, cancelled, revenueAgg] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { status: 'PAID' } }),
      db.order.count({ where: { status: 'SHIPPED' } }),
      db.order.count({ where: { status: 'DELIVERED' } }),
      db.order.count({ where: { status: 'CANCELLED' } }),
      db.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
    ])
    return {
      total,
      pending,
      paid,
      shipped,
      delivered,
      cancelled,
      revenue: revenueAgg._sum.total ?? 0,
    }
  }
}
