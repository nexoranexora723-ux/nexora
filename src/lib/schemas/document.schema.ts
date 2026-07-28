// NEXORA — Document domain schemas (Zod validation)
// Per spec: "Usar Zod, React Hook Form, TypeScript estricto"
import { z } from 'zod'

export const documentCategorySchema = z.enum([
  'invoice',
  'contract',
  'catalog',
  'proforma',
  'guarantee',
  'manual',
  'legal',
  'marketing',
  'general',
  'other',
])

export const documentEntityTypeSchema = z.enum([
  'product',
  'order',
  'supplier',
  'customer',
  'purchase',
])

export const documentStatusSchema = z.enum(['ACTIVE', 'ARCHIVED'])

// Create document schema
export const createDocumentSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(200, 'Nombre demasiado largo'),
  url: z.string().url('URL inválida'),
  category: documentCategorySchema.default('general'),
  tags: z.string().max(500).optional().or(z.literal('')),
  entityType: documentEntityTypeSchema.optional().or(z.literal('')),
  entityId: z.string().max(100).optional().or(z.literal('')),
  fileId: z.string().optional().or(z.literal('')),
})

// Update document schema (all optional; bumpVersion flag handled in service)
export const updateDocumentSchema = z
  .object({
    name: z.string().min(2).max(200).optional(),
    url: z.string().url().optional(),
    category: documentCategorySchema.optional(),
    tags: z.string().max(500).optional().or(z.literal('')),
    entityType: documentEntityTypeSchema.optional().or(z.literal('')),
    entityId: z.string().max(100).optional().or(z.literal('')),
  })
  .partial()

// Query / filters schema for the list endpoint
export const documentQuerySchema = z.object({
  q: z.string().optional(),
  category: documentCategorySchema.optional(),
  entityType: documentEntityTypeSchema.optional(),
  status: documentStatusSchema.optional(),
})

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
export type DocumentQuery = z.infer<typeof documentQuerySchema>
export type DocumentCategory = z.infer<typeof documentCategorySchema>
export type DocumentEntityType = z.infer<typeof documentEntityTypeSchema>
