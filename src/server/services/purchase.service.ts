// NEXORA — Purchase Order Service
// Business logic layer. Route handlers delegate here (per DOC-002 §7, §12 "Regla de Oro").
// Mirrors the pattern established by ProductService.
import { db } from '@/lib/db'
import {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  PurchaseQuery,
  PurchaseItemInput,
} from '@/lib/schemas/purchase.schema'

export interface PurchaseItemView {
  id: string
  productId: string
  quantity: number
  unitCost: number
  discount: number
  totalCost: number
  product: {
    id: string
    name: string
    sku: string
    imageUrl: string | null
    purchasePrice: number
  }
}

export interface PurchaseWithRelations {
  id: string
  number: string
  status: string
  supplierId: string
  userId: string | null
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  currencyCode: string
  expectedDate: string | null
  receivedDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  // computed
  itemCount: number
  // relations
  supplier: { id: string; companyName: string; country: string | null }
  items: PurchaseItemView[]
}

const INCLUDE = {
  supplier: { select: { id: true, companyName: true, country: true } },
  items: {
    include: {
      product: {
        select: { id: true, name: true, sku: true, imageUrl: true, purchasePrice: true },
      },
    },
    orderBy: { id: 'asc' as const },
  },
} as const

type PurchaseWithIncludes = Record<string, unknown> & {
  id: string
  number: string
  status: string
  supplierId: string
  userId: string | null
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  currencyCode: string
  expectedDate: Date | null
  receivedDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  supplier: { id: string; companyName: string; country: string | null }
  items: PurchaseItemWithProduct[]
}

function enrich(p: PurchaseWithIncludes): PurchaseWithRelations {
  return {
    id: p.id,
    number: p.number,
    status: p.status,
    supplierId: p.supplierId,
    userId: p.userId,
    subtotal: p.subtotal,
    shippingCost: p.shippingCost,
    tax: p.tax,
    total: p.total,
    currencyCode: p.currencyCode,
    expectedDate: p.expectedDate ? p.expectedDate.toISOString() : null,
    receivedDate: p.receivedDate ? p.receivedDate.toISOString() : null,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    itemCount: p.items.length,
    supplier: p.supplier,
    items: p.items.map((it: PurchaseItemWithProduct) => ({
      id: it.id,
      productId: it.productId,
      quantity: it.quantity,
      unitCost: it.unitCost,
      discount: 0, // discount stored on the item, but model has no column → kept at 0 in stored data
      totalCost: it.totalCost,
      product: it.product,
    })),
  }
}

interface PurchaseItemWithProduct {
  id: string
  purchaseOrderId: string
  productId: string
  quantity: number
  unitCost: number
  totalCost: number
  product: {
    id: string
    name: string
    sku: string
    imageUrl: string | null
    purchasePrice: number
  }
}

function buildOrderBy(sort: PurchaseQuery['sort']) {
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

// Compute line total: (unitCost * quantity) * (1 - discount/100)
function computeLineTotal(item: PurchaseItemInput): number {
  const gross = item.unitCost * item.quantity
  const discountAmount = gross * ((item.discount ?? 0) / 100)
  return Math.max(0, gross - discountAmount)
}

// Generate sequential purchase number PO-XXXX with 5001 prefix
async function generatePurchaseNumber(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]): Promise<string> {
  const count = await tx.purchaseOrder.count()
  const seq = 5001 + count
  return `PO-${seq}`
}

export class PurchaseService {
  static async list(query: PurchaseQuery): Promise<PurchaseWithRelations[]> {
    const where: Record<string, unknown> = {}
    if (query.q) {
      where.OR = [
        { number: { contains: query.q } },
        { notes: { contains: query.q } },
        { supplier: { companyName: { contains: query.q } } },
      ]
    }
    if (query.status) where.status = query.status
    if (query.supplierId && query.supplierId !== 'all') where.supplierId = query.supplierId

    const purchases = await db.purchaseOrder.findMany({
      where,
      include: INCLUDE,
      orderBy: buildOrderBy(query.sort),
    })
    return purchases.map(enrich)
  }

  static async getById(id: string): Promise<PurchaseWithRelations | null> {
    const p = await db.purchaseOrder.findUnique({ where: { id }, include: INCLUDE })
    return p ? enrich(p) : null
  }

  static async create(input: CreatePurchaseInput): Promise<PurchaseWithRelations> {
    // Verify supplier exists
    const supplier = await db.supplier.findUnique({ where: { id: input.supplierId } })
    if (!supplier) throw new Error('Proveedor no encontrado')

    // Verify all products exist
    const productIds = input.items.map((i) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: productIds } } })
    if (products.length !== productIds.length) {
      throw new Error('Uno o más productos no existen')
    }

    // Compute totals from items
    const subtotal = input.items.reduce((s, i) => s + computeLineTotal(i), 0)
    const shippingCost = input.shippingCost ?? 0
    const tax = input.tax ?? 0
    const total = subtotal + shippingCost + tax

    const result = await db.$transaction(async (tx) => {
      const number = await generatePurchaseNumber(tx)
      const purchase = await tx.purchaseOrder.create({
        data: {
          number,
          status: input.status,
          supplierId: input.supplierId,
          subtotal,
          shippingCost,
          tax,
          total,
          currencyCode: 'USD',
          expectedDate: input.expectedDate && input.expectedDate.trim() ? new Date(input.expectedDate) : null,
          notes: input.notes && input.notes.trim() ? input.notes.trim() : null,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: computeLineTotal(item),
            })),
          },
        },
        include: INCLUDE,
      })
      return purchase
    })

    return enrich(result)
  }

  static async update(id: string, input: UpdatePurchaseInput): Promise<PurchaseWithRelations> {
    const existing = await db.purchaseOrder.findUnique({ where: { id } })
    if (!existing) throw new Error('Orden de compra no encontrada')
    if (existing.status === 'RECEIVED') throw new Error('No se puede editar una orden ya recibida')
    if (existing.status === 'CANCELLED') throw new Error('No se puede editar una orden cancelada')

    // If items provided, verify and recompute
    let newSubtotal: number | undefined
    let newTotal: number | undefined
    const itemsInput = input.items

    if (itemsInput) {
      const productIds = itemsInput.map((i) => i.productId)
      const products = await db.product.findMany({ where: { id: { in: productIds } } })
      if (products.length !== productIds.length) {
        throw new Error('Uno o más productos no existen')
      }
      newSubtotal = itemsInput.reduce((s, i) => s + computeLineTotal(i), 0)
      const shipping = input.shippingCost ?? existing.shippingCost
      const tax = input.tax ?? existing.tax
      newTotal = newSubtotal + shipping + tax
    }

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...(input.supplierId ? { supplierId: input.supplierId } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.expectedDate !== undefined
            ? { expectedDate: input.expectedDate && input.expectedDate.trim() ? new Date(input.expectedDate) : null }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes && input.notes.trim() ? input.notes.trim() : null } : {}),
          ...(input.shippingCost !== undefined ? { shippingCost: input.shippingCost } : {}),
          ...(input.tax !== undefined ? { tax: input.tax } : {}),
          ...(newSubtotal !== undefined ? { subtotal: newSubtotal } : {}),
          ...(newTotal !== undefined ? { total: newTotal } : {}),
        },
        include: INCLUDE,
      })

      // Sync items if provided
      if (itemsInput) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })
        if (itemsInput.length > 0) {
          await tx.purchaseOrderItem.createMany({
            data: itemsInput.map((item) => ({
              purchaseOrderId: id,
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: computeLineTotal(item),
            })),
          })
        }
      }

      return tx.purchaseOrder.findUnique({ where: { id }, include: INCLUDE })
    })

    return enrich(result!)
  }

  static async cancel(id: string): Promise<PurchaseWithRelations> {
    const existing = await db.purchaseOrder.findUnique({ where: { id } })
    if (!existing) throw new Error('Orden de compra no encontrada')
    if (existing.status === 'RECEIVED') throw new Error('No se puede cancelar una orden ya recibida')
    if (existing.status === 'CANCELLED') throw new Error('La orden ya está cancelada')

    const updated = await db.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: INCLUDE,
    })
    return enrich(updated)
  }

  // Receive: status → RECEIVED + update inventory stock + create movements + create EXPENSE transaction
  static async receive(id: string): Promise<PurchaseWithRelations> {
    const existing = await db.purchaseOrder.findUnique({
      where: { id },
      include: INCLUDE,
    })
    if (!existing) throw new Error('Orden de compra no encontrada')
    if (existing.status === 'CANCELLED') throw new Error('No se puede recibir una orden cancelada')
    if (existing.status === 'RECEIVED') throw new Error('La orden ya fue recibida')

    // Use the first active warehouse as the receiving warehouse
    const warehouse = await db.warehouse.findFirst({ where: { isActive: true } })
    if (!warehouse) throw new Error('No hay almacén activo disponible')

    await db.$transaction(async (tx) => {
      // 1. Update purchase order status + receivedDate
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED', receivedDate: new Date() },
      })

      // 2. For each item: upsert inventory, create movement
      for (const item of existing.items) {
        // Find or create the inventory row
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

        // Record IN movement
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId: warehouse.id,
            type: 'IN',
            quantity: item.quantity,
            reason: `Recepción orden ${existing.number}`,
            reference: existing.number,
          },
        })
      }

      // 3. Create EXPENSE transaction
      await tx.transaction.create({
        data: {
          type: 'EXPENSE',
          category: 'PURCHASES',
          description: `Compra ${existing.number} — ${existing.supplier.companyName}`,
          amount: existing.total,
          currencyCode: existing.currencyCode,
          reference: existing.number,
          date: new Date(),
        },
      })
    })

    const refreshed = await db.purchaseOrder.findUnique({ where: { id }, include: INCLUDE })
    return enrich(refreshed!)
  }

  static async delete(id: string): Promise<void> {
    const existing = await db.purchaseOrder.findUnique({ where: { id } })
    if (!existing) throw new Error('Orden de compra no encontrada')
    if (existing.status === 'RECEIVED') {
      throw new Error('No se puede eliminar una orden ya recibida (impacto en inventario y finanzas)')
    }
    await db.$transaction(async (tx) => {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })
      await tx.purchaseOrder.delete({ where: { id } })
    })
  }

  static async stats() {
    const [total, pending, approved, shipped, received, cancelled, totalInvested] = await Promise.all([
      db.purchaseOrder.count(),
      db.purchaseOrder.count({ where: { status: 'PENDING' } }),
      db.purchaseOrder.count({ where: { status: 'APPROVED' } }),
      db.purchaseOrder.count({ where: { status: 'SHIPPED' } }),
      db.purchaseOrder.count({ where: { status: 'RECEIVED' } }),
      db.purchaseOrder.count({ where: { status: 'CANCELLED' } }),
      db.purchaseOrder.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
    ])
    return {
      total,
      pending,
      approved,
      shipped,
      received,
      cancelled,
      totalInvested: totalInvested._sum.total ?? 0,
    }
  }
}
