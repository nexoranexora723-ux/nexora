// NEXORA — Customer domain schemas (Zod validation)
// Full CRM CRUD. Customer model: firstName, lastName, email (unique), phone, country, city, address, tags, status, lifetimeValue, totalOrders.
// NOTE: companyName / nit are accepted by the API (form UX) but not persisted — the Customer model doesn't have those columns.
import { z } from 'zod'

export const customerStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'VIP'])

// === CREATE ===
export const createCustomerSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Nombre obligatorio')
    .max(100, 'Nombre demasiado largo'),
  lastName: z
    .string()
    .min(2, 'Apellido obligatorio')
    .max(100, 'Apellido demasiado largo'),
  email: z
    .string()
    .min(1, 'Email obligatorio')
    .email('Email inválido'),
  phone: z.string().max(50).optional().or(z.literal('')),
  // Accepted for UX, not persisted (Customer model has no columns for them)
  companyName: z.string().max(200).optional().or(z.literal('')),
  nit: z.string().max(50).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().min(2).max(2).default('CO'),
  status: customerStatusSchema.default('ACTIVE'),
  tags: z.string().max(500).optional().or(z.literal('')),
})

// === UPDATE === (all optional)
export const updateCustomerSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  companyName: z.string().max(200).optional().or(z.literal('')),
  nit: z.string().max(50).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().min(2).max(2).optional(),
  status: customerStatusSchema.optional(),
  tags: z.string().max(500).optional().or(z.literal('')),
})

// === QUERY ===
export const customerQuerySchema = z.object({
  q: z.string().optional(),
  status: customerStatusSchema.optional(),
  sort: z.enum(['created_desc', 'created', 'name', 'ltv', 'ltv_desc']).default('ltv_desc'),
})

export type CustomerStatus = z.infer<typeof customerStatusSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CustomerQuery = z.infer<typeof customerQuerySchema>
