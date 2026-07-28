// NEXORA — Product domain schemas (Zod validation)
// Per spec: "Usar Zod, React Hook Form, TypeScript estricto"
import { z } from 'zod'

export const productStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED'])

// Variant schema
export const productVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU de variante es obligatorio'),
  name: z.string().min(1, 'Nombre de variante es obligatorio'),
  option1: z.string().optional(),
  value1: z.string().optional(),
  option2: z.string().optional(),
  value2: z.string().optional(),
  option3: z.string().optional(),
  value3: z.string().optional(),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  weight: z.number().optional(),
  barcode: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

// Image schema
export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url('URL de imagen inválida'),
  alt: z.string().optional(),
  position: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
})

// Video schema
export const productVideoSchema = z.object({
  id: z.string().optional(),
  url: z.string().url('URL de video inválida'),
  title: z.string().optional(),
  position: z.number().int().default(0),
})

// Create product schema (base — without refinement so .partial() works)
export const createProductSchema = z
  .object({
    sku: z
      .string()
      .min(2, 'SKU debe tener al menos 2 caracteres')
      .max(50, 'SKU demasiado largo')
      .regex(/^[A-Za-z0-9\-_]+$/, 'SKU solo permite letras, números, guiones'),
    internalCode: z.string().max(50).optional().or(z.literal('')),
    barcode: z.string().max(100).optional().or(z.literal('')),
    name: z
      .string()
      .min(2, 'Nombre debe tener al menos 2 caracteres')
      .max(200, 'Nombre demasiado largo'),
    description: z.string().max(5000).optional().or(z.literal('')),
    brandId: z.string().optional().or(z.literal('')),
    categoryId: z.string().optional().or(z.literal('')),
    subcategoryId: z.string().optional().or(z.literal('')),
    supplierId: z.string().optional().or(z.literal('')),
    weight: z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(0).optional()),
    length: z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(0).optional()),
    width: z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(0).optional()),
    height: z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(0).optional()),
    color: z.string().max(50).optional().or(z.literal('')),
    material: z.string().max(100).optional().or(z.literal('')),
    warranty: z.string().max(200).optional().or(z.literal('')),
    countryOfOrigin: z.string().max(2).optional().or(z.literal('')),
    tags: z.string().max(500).optional().or(z.literal('')),
    purchasePrice: z.number().min(0, 'Precio de compra inválido'),
    salePrice: z.number().min(0, 'Precio de venta inválido'),
    currencyCode: z.string().max(3).default('USD'),
    status: productStatusSchema.default('ACTIVE'),
    imageUrl: z.string().url().optional().or(z.literal('')),
    images: z.array(productImageSchema).optional(),
    videos: z.array(productVideoSchema).optional(),
    variants: z.array(productVariantSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // Business rule: sale price should be >= purchase price (margin >= 0)
    if (data.salePrice < data.purchasePrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salePrice'],
        message: 'El precio de venta debería ser mayor o igual al precio de compra',
      })
    }
  })

// Update product schema: derive from the raw object (without refinement) then partial
const createProductRaw = z.object({
  sku: z
    .string()
    .min(2, 'SKU debe tener al menos 2 caracteres')
    .max(50, 'SKU demasiado largo')
    .regex(/^[A-Za-z0-9\-_]+$/, 'SKU solo permite letras, números, guiones'),
  internalCode: z.string().max(50).optional().or(z.literal('')),
  barcode: z.string().max(100).optional().or(z.literal('')),
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional().or(z.literal('')),
  brandId: z.string().optional().or(z.literal('')),
  categoryId: z.string().optional().or(z.literal('')),
  subcategoryId: z.string().optional().or(z.literal('')),
  supplierId: z.string().optional().or(z.literal('')),
  weight: z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(0).optional()),
  length: z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(0).optional()),
  width: z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(0).optional()),
  height: z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? undefined : Number(v)), z.number().min(0).optional()),
  color: z.string().max(50).optional().or(z.literal('')),
  material: z.string().max(100).optional().or(z.literal('')),
  warranty: z.string().max(200).optional().or(z.literal('')),
  countryOfOrigin: z.string().max(2).optional().or(z.literal('')),
  tags: z.string().max(500).optional().or(z.literal('')),
  purchasePrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  currencyCode: z.string().max(3).optional(),
  status: productStatusSchema.optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  images: z.array(productImageSchema).optional(),
  videos: z.array(productVideoSchema).optional(),
  variants: z.array(productVariantSchema).optional(),
})

export const updateProductSchema = createProductRaw.partial()

// Query/filters schema for list endpoint
export const productQuerySchema = z.object({
  q: z.string().optional(),
  status: productStatusSchema.optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  sort: z.enum(['name', 'name_desc', 'price', 'price_desc', 'created', 'created_desc', 'stock', 'margin']).default('created_desc'),
  view: z.enum(['table', 'cards']).default('table'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductQuery = z.infer<typeof productQuerySchema>
export type ProductVariantInput = z.infer<typeof productVariantSchema>
export type ProductImageInput = z.infer<typeof productImageSchema>
export type ProductVideoInput = z.infer<typeof productVideoSchema>
