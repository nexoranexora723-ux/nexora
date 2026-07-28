// NEXORA — Integration domain schemas (Zod validation)
// External connectors hub: Shopify, Stripe, DHL, etc.
import { z } from 'zod'

export const integrationStatusSchema = z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR'])

export const integrationCategorySchema = z.enum([
  'ecommerce',
  'payments',
  'logistics',
  'messaging',
  'email',
  'ai',
  'storage',
])

export const integrationProviderSchema = z.enum([
  'shopify',
  'woocommerce',
  'mercadolibre',
  'stripe',
  'paypal',
  'mercadopago',
  'dhl',
  'fedex',
  'envia',
  'whatsapp',
  'slack',
  'telegram',
  'gmail',
  'sendgrid',
  'mailgun',
  'openai',
  'anthropic',
  's3',
  'r2',
  'supabase',
])

// Create integration schema
export const createIntegrationSchema = z.object({
  provider: integrationProviderSchema,
  category: integrationCategorySchema,
  name: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(120, 'Nombre demasiado largo'),
  config: z.record(z.string(), z.unknown()).default({}),
})

// Update integration schema
export const updateIntegrationSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  status: integrationStatusSchema.optional(),
})

// Query schema for list endpoint
export const integrationQuerySchema = z.object({
  q: z.string().optional(),
  category: integrationCategorySchema.optional(),
  provider: integrationProviderSchema.optional(),
  status: integrationStatusSchema.optional(),
  sort: z
    .enum(['created_desc', 'created', 'name', 'name_desc', 'last_sync'])
    .default('created_desc'),
})

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>
export type IntegrationQuery = z.infer<typeof integrationQuerySchema>
export type IntegrationCategory = z.infer<typeof integrationCategorySchema>
export type IntegrationProvider = z.infer<typeof integrationProviderSchema>
