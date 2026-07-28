// NEXORA — Inventory Service
// Business logic layer. Route handlers delegate here (per DOC-002 §7, §12 "Regla de Oro").
// Mirrors the pattern established by ProductService.
import { db } from '@/lib/db'
import { AdjustStockInput, InventoryQuery, MovementQuery } from '@/lib/schemas/inventory.schema'

export interface InventoryWithRelations {
  id: string
  productId: string
  warehouseId: string
  stock: number
  reserved: number
  available: number
  minStock: number
  maxStock: number | null
  location: string | null
  updatedAt: Date
  // computed
  status: 'OUT' | 'LOW' | 'OK'
  // relations
  product: {
    id: string
    sku: string
    name: string
    imageUrl: string | null
    purchasePrice: number
    salePrice: number
    currencyCode: string
    brand: { name: string } | null
    category: { name: string } | null
    supplier: { companyName: string } | null
  }
  warehouse: { id: string; name: string; code: string }
}

export interface InventoryMovementWithRelations {
  id: string
  productId: string
  warehouseId: string
  type: string
  quantity: number
  reason: string | null
  reference: string | null
  createdAt: Date
  product: { id: string; sku: string; name: string; imageUrl: string | null }
  warehouse: { id: string; name: string; code: string }
}

const INCLUDE = {
  product: {
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      supplier: { select: { companyName: true } },
    },
  },
  warehouse: { select: { id: true, name: true, code: true } },
} as const

type InventoryWithIncludes = Record<string, unknown> & {
  id: string
  productId: string
  warehouseId: string
  stock: number
  reserved: number
  minStock: number
  maxStock: number | null
  location: string | null
  updatedAt: Date
  product: {
    id: string
    sku: string
    name: string
    imageUrl: string | null
    purchasePrice: number
    salePrice: number
    currencyCode: string
    brand: { name: string } | null
    category: { name: string } | null
    supplier: { companyName: string } | null
  }
  warehouse: { id: string; name: string; code: string }
}

function computeStatus(stock: number, minStock: number): 'OUT' | 'LOW' | 'OK' {
  if (stock <= 0) return 'OUT'
  if (stock <= minStock) return 'LOW'
  return 'OK'
}

function enrich(i: InventoryWithIncludes): InventoryWithRelations {
  const available = i.stock - i.reserved
  return {
    id: i.id,
    productId: i.productId,
    warehouseId: i.warehouseId,
    stock: i.stock,
    reserved: i.reserved,
    available,
    minStock: i.minStock,
    maxStock: i.maxStock,
    location: i.location,
    updatedAt: i.updatedAt,
    status: computeStatus(i.stock, i.minStock),
    product: i.product,
    warehouse: i.warehouse,
  }
}

export class InventoryService {
  static async list(query: InventoryQuery): Promise<InventoryWithRelations[]> {
    const where: Record<string, unknown> = {}
    if (query.warehouseId) where.warehouseId = query.warehouseId
    if (query.q) {
      where.product = {
        OR: [
          { name: { contains: query.q } },
          { sku: { contains: query.q } },
        ],
      }
    }

    const inventory = await db.inventory.findMany({
      where,
      include: INCLUDE,
      orderBy: { stock: 'asc' },
    })

    const enriched = inventory.map((i) => enrich(i as unknown as InventoryWithIncludes))

    // Status filter applied after computation (since it's derived)
    if (query.status) {
      return enriched.filter((i) => i.status === query.status)
    }
    return enriched
  }

  static async getMovements(query: MovementQuery): Promise<InventoryMovementWithRelations[]> {
    const where: Record<string, unknown> = {}
    if (query.productId) where.productId = query.productId
    if (query.warehouseId) where.warehouseId = query.warehouseId
    if (query.type) where.type = query.type
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {}
      if (query.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(query.dateFrom)
      if (query.dateTo) {
        const d = new Date(query.dateTo)
        d.setHours(23, 59, 59, 999)
        ;(where.createdAt as Record<string, unknown>).lte = d
      }
    }

    const movements = await db.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, name: true, imageUrl: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      warehouseId: m.warehouseId,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      reference: m.reference,
      createdAt: m.createdAt,
      product: m.product,
      warehouse: m.warehouse,
    }))
  }

  static async adjustStock(input: AdjustStockInput): Promise<InventoryWithRelations> {
    // Compute signed delta based on type
    // IN: +quantity, OUT: -quantity, ADJUST: signed quantity (already)
    let delta: number
    if (input.type === 'IN') delta = input.quantity
    else if (input.type === 'OUT') delta = -input.quantity
    else delta = input.quantity // ADJUST: can be negative

    const result = await db.$transaction(async (tx) => {
      // Find existing inventory row (productId + warehouseId unique)
      let inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        include: INCLUDE,
      })

      if (!inventory) {
        // Create empty inventory row if missing
        inventory = await tx.inventory.create({
          data: {
            productId: input.productId,
            warehouseId: input.warehouseId,
            stock: 0,
            reserved: 0,
            minStock: 0,
          },
          include: INCLUDE,
        })
      }

      const newStock = inventory.stock + delta
      if (newStock < 0) {
        throw new Error(
          `Stock insuficiente: stock actual ${inventory.stock}, intentando restar ${Math.abs(delta)}`,
        )
      }

      // Update stock
      const updated = await tx.inventory.update({
        where: { id: inventory.id },
        data: { stock: newStock },
        include: INCLUDE,
      })

      // Record movement (signed delta so it reflects the actual change applied)
      await tx.inventoryMovement.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          type: input.type,
          quantity: delta,
          reason: input.reason && input.reason.trim() ? input.reason.trim() : null,
          reference: input.reference && input.reference.trim() ? input.reference.trim() : null,
        },
      })

      return updated
    })

    return enrich(result as unknown as InventoryWithIncludes)
  }

  static async stats() {
    const inventory = await db.inventory.findMany({
      include: { product: { select: { purchasePrice: true } } },
    })
    const totalUnits = inventory.reduce((s, i) => s + i.stock, 0)
    const totalValue = inventory.reduce((s, i) => s + i.stock * i.product.purchasePrice, 0)
    let low = 0
    let out = 0
    for (const i of inventory) {
      const status = computeStatus(i.stock, i.minStock)
      if (status === 'OUT') out++
      else if (status === 'LOW') low++
    }
    return {
      totalUnits,
      totalValue,
      low,
      out,
      totalItems: inventory.length,
    }
  }
}
