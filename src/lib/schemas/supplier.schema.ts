// NEXORA — Supplier domain schemas (Zod validation)
// Per spec: full CRUD with risk levels, status, and multi-factor rating (DOC-006).
import { z } from 'zod'

export const supplierStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED'])
export const supplierRiskSchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

// Supplier rating — 6 dimensions 0-100 + free-form review (overallScore is computed in the service)
export const supplierRatingSchema = z.object({
  communicationScore: z
    .number()
    .int('Score entero')
    .min(0, 'Mínimo 0')
    .max(100, 'Máximo 100'),
  qualityScore: z
    .number()
    .int('Score entero')
    .min(0, 'Mínimo 0')
    .max(100, 'Máximo 100'),
  priceScore: z
    .number()
    .int('Score entero')
    .min(0, 'Mínimo 0')
    .max(100, 'Máximo 100'),
  shippingScore: z
    .number()
    .int('Score entero')
    .min(0, 'Mínimo 0')
    .max(100, 'Máximo 100'),
  warrantyScore: z
    .number()
    .int('Score entero')
    .min(0, 'Mínimo 0')
    .max(100, 'Máximo 100'),
  trustScore: z
    .number()
    .int('Score entero')
    .min(0, 'Mínimo 0')
    .max(100, 'Máximo 100'),
  review: z.string().max(2000, 'Review demasiado larga').optional().or(z.literal('')),
})

// Preprocess: empty/NaN string → undefined for optional numeric fields
const numericOptional = (min: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
    z.number().int().min(min).optional(),
  )

// === CREATE ===
export const createSupplierSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Nombre de empresa obligatorio')
    .max(200, 'Nombre demasiado largo'),
  contactName: z.string().max(200).optional().or(z.literal('')),
  whatsapp: z.string().max(50).optional().or(z.literal('')),
  wechat: z.string().max(100).optional().or(z.literal('')),
  email: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  website: z.string().max(200).optional().or(z.literal('')),
  yupoo: z.string().max(200).optional().or(z.literal('')),
  country: z.string().min(2).max(2).default('CN'),
  city: z.string().max(100).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  moq: numericOptional(0),
  paymentMethods: z.string().max(500).optional().or(z.literal('')),
  shippingMethods: z.string().max(500).optional().or(z.literal('')),
  warranty: z.string().max(200).optional().or(z.literal('')),
  leadTime: numericOptional(0),
  productionTime: numericOptional(0),
  oem: z.boolean().default(false),
  odm: z.boolean().default(false),
  riskLevel: supplierRiskSchema.default('MEDIUM'),
  status: supplierStatusSchema.default('ACTIVE'),
  rating: supplierRatingSchema.optional(),
})

// === UPDATE === (all fields optional, rating upserted if provided)
export const updateSupplierSchema = z.object({
  companyName: z.string().min(2).max(200).optional(),
  contactName: z.string().max(200).optional().or(z.literal('')),
  whatsapp: z.string().max(50).optional().or(z.literal('')),
  wechat: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().max(200).optional().or(z.literal('')),
  yupoo: z.string().max(200).optional().or(z.literal('')),
  country: z.string().min(2).max(2).optional(),
  city: z.string().max(100).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  moq: numericOptional(0),
  paymentMethods: z.string().max(500).optional().or(z.literal('')),
  shippingMethods: z.string().max(500).optional().or(z.literal('')),
  warranty: z.string().max(200).optional().or(z.literal('')),
  leadTime: numericOptional(0),
  productionTime: numericOptional(0),
  oem: z.boolean().optional(),
  odm: z.boolean().optional(),
  riskLevel: supplierRiskSchema.optional(),
  status: supplierStatusSchema.optional(),
  rating: supplierRatingSchema.optional(),
})

// === QUERY ===
export const supplierQuerySchema = z.object({
  q: z.string().optional(),
  status: supplierStatusSchema.optional(),
  riskLevel: supplierRiskSchema.optional(),
})

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
export type SupplierQuery = z.infer<typeof supplierQuerySchema>
export type SupplierRatingInput = z.infer<typeof supplierRatingSchema>
