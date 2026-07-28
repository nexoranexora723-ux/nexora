// NEXORA — Purchase Order domain schemas (Zod validation)
// Full CRUD with line items, supplier linkage and lifecycle (DRAFT → PENDING → APPROVED → SHIPPED → RECEIVED → CANCELLED).
import { z } from 'zod'

export const purchaseStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'APPROVED',
  'SHIPPED',
  'RECEIVED',
  'CANCELLED',
])

// Line item: a product reference + quantity + unit cost + optional discount (%)
export const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  quantity: z
    .number({ invalid_type_error: 'Cantidad inválida' })
    .int('Debe ser entero')
    .min(1, 'Cantidad mínima 1'),
  unitCost: z
    .number({ invalid_type_error: 'Costo inválido' })
    .min(0, 'Costo inválido'),
  discount: z
    .number()
    .min(0, 'Descuento inválido')
    .max(100, 'Descuento máx. 100%')
    .default(0),
})

// === CREATE ===
export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, 'Proveedor obligatorio'),
  status: purchaseStatusSchema.default('DRAFT'),
  expectedDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000, 'Notas demasiado largas').optional().or(z.literal('')),
  shippingCost: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? 0 : Number(v)),
      z.number().min(0, 'Envío inválido'),
    )
    .default(0),
  tax: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? 0 : Number(v)),
      z.number().min(0, 'Impuesto inválido'),
    )
    .default(0),
  items: z
    .array(purchaseItemSchema)
    .min(1, 'Agrega al menos un item a la orden'),
})

// === UPDATE === (all optional, items optional for partial sync)
export const updatePurchaseSchema = z.object({
  supplierId: z.string().min(1).optional(),
  status: purchaseStatusSchema.optional(),
  expectedDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  shippingCost: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
      z.number().min(0).optional(),
    )
    .optional(),
  tax: z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
      z.number().min(0).optional(),
    )
    .optional(),
  items: z.array(purchaseItemSchema).optional(),
})

// === QUERY ===
export const purchaseQuerySchema = z.object({
  q: z.string().optional(),
  status: purchaseStatusSchema.optional(),
  supplierId: z.string().optional(),
  sort: z
    .enum(['created_desc', 'created', 'total', 'total_desc', 'status'])
    .default('created_desc'),
})

export type PurchaseStatus = z.infer<typeof purchaseStatusSchema>
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>
export type PurchaseQuery = z.infer<typeof purchaseQuerySchema>
