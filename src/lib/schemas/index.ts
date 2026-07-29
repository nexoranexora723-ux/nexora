import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Contraseña obligatoria'),
})

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Nombre muy corto'),
  lastName: z.string().min(2, 'Apellido muy corto'),
  email: z.string().email('Correo inválido'),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  purpose: z.enum(['personal', 'resale', 'business']).default('personal'),
})

export const createRequestSchema = z.object({
  productName: z.string().min(2, 'Describe el producto').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  purpose: z.enum(['personal', 'resale', 'business']).default('personal'),
  quantity: z.number().int().min(1, 'Mínimo 1 unidad'),
  budget: z.number().min(0).optional(),
  currencyCode: z.string().max(3).default('USD'),
  referenceUrl: z.string().url().optional().or(z.literal('')),
  referenceImages: z.string().optional().or(z.literal('')), // JSON array
  details: z.string().max(1000).optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

export const updateRequestStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional().or(z.literal('')),
})

export const createQuoteSchema = z.object({
  requestId: z.string(),
  supplierId: z.string(),
  unitPrice: z.number().min(0),
  quantity: z.number().int().min(1),
  shippingCost: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  currencyCode: z.string().max(3).default('USD'),
  leadTime: z.number().int().optional(),
  warranty: z.string().optional().or(z.literal('')),
  validity: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export const createImportSchema = z.object({
  requestId: z.string(),
  quoteId: z.string().optional().or(z.literal('')),
  supplierId: z.string(),
  productCost: z.number().min(0),
  shippingCost: z.number().min(0).default(0),
  customsCost: z.number().min(0).default(0),
  otherCosts: z.number().min(0).default(0),
  salePrice: z.number().min(0),
  currencyCode: z.string().max(3).default('USD'),
  carrier: z.string().optional().or(z.literal('')),
  trackingNumber: z.string().optional().or(z.literal('')),
  incoterm: z.string().default('FOB'),
  notes: z.string().optional().or(z.literal('')),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateRequestInput = z.infer<typeof createRequestSchema>
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type CreateImportInput = z.infer<typeof createImportSchema>
