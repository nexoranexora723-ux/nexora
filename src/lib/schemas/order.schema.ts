// NEXORA — Order domain schemas (Zod validation)
// Per spec: "Usar Zod, React Hook Form, TypeScript estricto"
import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
])

export const paymentMethodSchema = z.enum([
  'Tarjeta',
  'Nequi',
  'PayPal',
  'Contraentrega',
])

// Order item schema — each line of the order
export const orderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'Selecciona un producto'),
  quantity: z.number().int().min(1, 'Cantidad debe ser ≥ 1'),
  unitPrice: z.number().min(0, 'Precio inválido'),
  discount: z.number().min(0).max(100).default(0),
})

// Create order schema (base — without refinement so .partial() works for update)
export const createOrderSchema = z
  .object({
    customerId: z.string().min(1, 'Selecciona un cliente'),
    status: orderStatusSchema.default('PENDING'),
    paymentMethod: paymentMethodSchema.optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
    items: z.array(orderItemSchema).min(1, 'Agrega al menos un producto'),
  })
  .superRefine((data, ctx) => {
    if (!data.items || data.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items'],
        message: 'Agrega al menos un producto',
      })
    }
  })

// Update order schema — partial of the raw object (no refinement)
const createOrderRaw = z.object({
  customerId: z.string().min(1).optional(),
  status: orderStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  items: z.array(orderItemSchema).optional(),
})

export const updateOrderSchema = createOrderRaw.partial()

// Query/filters schema for list endpoint
export const orderQuerySchema = z.object({
  q: z.string().optional(),
  status: orderStatusSchema.optional(),
  customerId: z.string().optional(),
  sort: z
    .enum(['created', 'created_desc', 'total', 'total_desc', 'status'])
    .default('created_desc'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type OrderQuery = z.infer<typeof orderQuerySchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>
