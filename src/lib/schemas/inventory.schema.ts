// NEXORA — Inventory domain schemas (Zod validation)
// Per spec: stock adjustments, kardex (movements) with filters.
import { z } from 'zod'

export const movementTypeSchema = z.enum(['IN', 'OUT', 'ADJUST'])

// Adjust stock: creates an InventoryMovement + updates Inventory.stock atomically
// IN  → stock += quantity (quantity must be > 0)
// OUT → stock -= quantity (quantity must be > 0)
// ADJUST → stock += quantity (quantity can be negative for corrections)
export const adjustStockSchema = z
  .object({
    productId: z.string().min(1, 'Producto obligatorio'),
    warehouseId: z.string().min(1, 'Almacén obligatorio'),
    type: movementTypeSchema,
    quantity: z
      .number({ invalid_type_error: 'Cantidad debe ser un número' })
      .int('Cantidad debe ser entera'),
    reason: z.string().max(500).optional().or(z.literal('')),
    reference: z.string().max(200).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // IN / OUT require strictly positive quantities
    if ((data.type === 'IN' || data.type === 'OUT') && data.quantity <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message: `Para tipo ${data.type}, la cantidad debe ser mayor que 0`,
      })
    }
    // ADJUST cannot be 0
    if (data.type === 'ADJUST' && data.quantity === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message: 'La cantidad de ajuste no puede ser 0',
      })
    }
  })

// Inventory list filters
export const inventoryQuerySchema = z.object({
  q: z.string().optional(),
  warehouseId: z.string().optional(),
  status: z.enum(['LOW', 'OUT', 'OK']).optional(),
})

// Movements (kardex) filters
export const movementQuerySchema = z.object({
  productId: z.string().optional(),
  warehouseId: z.string().optional(),
  type: movementTypeSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export type AdjustStockInput = z.infer<typeof adjustStockSchema>
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>
export type MovementQuery = z.infer<typeof movementQuerySchema>
