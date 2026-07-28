// NEXORA — Product Service
// Business logic layer. Route handlers delegate here (per DOC-002 §7, §12 "Regla de Oro").
import { db } from '@/lib/db'
import { CreateProductInput, UpdateProductInput, ProductQuery } from '@/lib/schemas/product.schema'

export interface ProductWithRelations {
  id: string
  sku: string
  internalCode: string | null
  barcode: string | null
  name: string
  description: string | null
  brandId: string | null
  categoryId: string | null
  subcategoryId: string | null
  supplierId: string | null
  weight: number | null
  length: number | null
  width: number | null
  height: number | null
  color: string | null
  material: string | null
  warranty: string | null
  countryOfOrigin: string | null
  tags: string | null
  purchasePrice: number
  salePrice: number
  currencyCode: string
  status: string
  imageUrl: string | null
  createdAt: Date
  updatedAt: Date
  // computed
  margin: number
  marginPct: number
  stock: number
  available: number
  minStock: number
  // relations
  brand: { id: string; name: string } | null
  category: { id: string; name: string } | null
  subcategory: { id: string; name: string } | null
  supplier: { id: string; companyName: string } | null
  images: { id: string; url: string; alt: string | null; position: number; isPrimary: boolean }[]
  videos: { id: string; url: string; title: string | null; position: number }[]
  variants: {
    id: string
    sku: string
    name: string
    option1: string | null
    value1: string | null
    option2: string | null
    value2: string | null
    option3: string | null
    value3: string | null
    price: number
    stock: number
    imageUrl: string | null
    status: string
  }[]
}

const INCLUDE = {
  brand: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  subcategory: { select: { id: true, name: true } },
  supplier: { select: { id: true, companyName: true } },
  images: { orderBy: { position: 'asc' } },
  videos: { orderBy: { position: 'asc' } },
  variants: { orderBy: { createdAt: 'asc' } },
  inventory: { include: { warehouse: true } },
} as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductWithIncludes = Record<string, unknown> & {
  inventory?: { stock: number; reserved: number; minStock: number }[]
  salePrice: number
  purchasePrice: number
}

function enrich(p: ProductWithIncludes): ProductWithRelations {
  const stock = (p.inventory ?? []).reduce((s: number, i: { stock: number }) => s + i.stock, 0)
  const reserved = (p.inventory ?? []).reduce((s: number, i: { reserved: number }) => s + i.reserved, 0)
  const minStock = (p.inventory ?? []).length > 0 ? Math.min(...(p.inventory ?? []).map((i: { minStock: number }) => i.minStock)) : 0
  const margin = p.salePrice - p.purchasePrice
  const marginPct = p.salePrice > 0 ? (margin / p.salePrice) * 100 : 0
  return {
    id: p.id,
    sku: p.sku,
    internalCode: p.internalCode,
    barcode: p.barcode,
    name: p.name,
    description: p.description,
    brandId: p.brandId,
    categoryId: p.categoryId,
    subcategoryId: p.subcategoryId,
    supplierId: p.supplierId,
    weight: p.weight,
    length: p.length,
    width: p.width,
    height: p.height,
    color: p.color,
    material: p.material,
    warranty: p.warranty,
    countryOfOrigin: p.countryOfOrigin,
    tags: p.tags,
    purchasePrice: p.purchasePrice,
    salePrice: p.salePrice,
    currencyCode: p.currencyCode,
    status: p.status,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    margin,
    marginPct,
    stock,
    available: stock - reserved,
    minStock,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    supplier: p.supplier,
    images: p.images,
    videos: p.videos,
    variants: p.variants,
  }
}

function buildOrderBy(sort: ProductQuery['sort']) {
  switch (sort) {
    case 'name': return { name: 'asc' as const }
    case 'name_desc': return { name: 'desc' as const }
    case 'price': return { salePrice: 'asc' as const }
    case 'price_desc': return { salePrice: 'desc' as const }
    case 'created': return { createdAt: 'asc' as const }
    case 'created_desc': return { createdAt: 'desc' as const }
    default: return { createdAt: 'desc' as const }
  }
}

export class ProductService {
  static async list(query: ProductQuery): Promise<ProductWithRelations[]> {
    const where: Record<string, unknown> = { deletedAt: null }
    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { sku: { contains: query.q } },
        { internalCode: { contains: query.q } },
        { barcode: { contains: query.q } },
      ]
    }
    if (query.status) where.status = query.status
    if (query.brandId && query.brandId !== 'all') where.brandId = query.brandId
    if (query.categoryId && query.categoryId !== 'all') where.categoryId = query.categoryId
    if (query.supplierId && query.supplierId !== 'all') where.supplierId = query.supplierId

    const products = await db.product.findMany({
      where,
      include: INCLUDE,
      orderBy: buildOrderBy(query.sort),
    })
    return products.map(enrich)
  }

  static async getById(id: string): Promise<ProductWithRelations | null> {
    const p = await db.product.findUnique({ where: { id, deletedAt: null }, include: INCLUDE })
    return p ? enrich(p) : null
  }

  static async create(input: CreateProductInput, companyId: string): Promise<ProductWithRelations> {
    // Verify SKU uniqueness
    const existing = await db.product.findUnique({ where: { sku: input.sku } })
    if (existing) {
      throw new Error(`Ya existe un producto con SKU "${input.sku}"`)
    }

    const { images = [], videos = [], variants = [], ...data } = input

    // Clean empty strings → null for optional fields
    const cleanData: Record<string, unknown> = { ...data, companyId }
    for (const [k, v] of Object.entries(cleanData)) {
      if (v === '') cleanData[k] = null
    }

    const product = await db.product.create({
      data: {
        ...cleanData,
        sku: data.sku,
        name: data.name,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        status: data.status,
        images: images.length > 0 ? { create: images } : undefined,
        videos: videos.length > 0 ? { create: videos } : undefined,
        variants: variants.length > 0 ? { create: variants } : undefined,
      },
      include: INCLUDE,
    })
    return enrich(product)
  }

  static async update(id: string, input: UpdateProductInput): Promise<ProductWithRelations> {
    const existing = await db.product.findUnique({ where: { id, deletedAt: null } })
    if (!existing) throw new Error('Producto no encontrado')

    // SKU uniqueness check if changing
    if (input.sku && input.sku !== existing.sku) {
      const dup = await db.product.findUnique({ where: { sku: input.sku } })
      if (dup) throw new Error(`Ya existe un producto con SKU "${input.sku}"`)
    }

    const { images, videos, variants, ...data } = input

    // Clean empty strings → null
    const cleanData: Record<string, unknown> = { ...data }
    for (const [k, v] of Object.entries(cleanData)) {
      if (v === '') cleanData[k] = null
    }

    const product = await db.product.update({
      where: { id },
      data: cleanData,
      include: INCLUDE,
    })

    // Sync child collections if provided
    if (images) {
      await db.productImage.deleteMany({ where: { productId: id } })
      if (images.length > 0) {
        await db.productImage.createMany({ data: images.map((i) => ({ ...i, productId: id })) })
      }
    }
    if (videos) {
      await db.productVideo.deleteMany({ where: { productId: id } })
      if (videos.length > 0) {
        await db.productVideo.createMany({ data: videos.map((v) => ({ ...v, productId: id })) })
      }
    }
    if (variants) {
      await db.productVariant.deleteMany({ where: { productId: id } })
      if (variants.length > 0) {
        await db.productVariant.createMany({ data: variants.map((v) => ({ ...v, productId: id })) })
      }
    }

    const refreshed = await db.product.findUnique({ where: { id }, include: INCLUDE })
    return enrich(refreshed!)
  }

  static async softDelete(id: string): Promise<void> {
    await db.product.update({ where: { id }, data: { deletedAt: new Date(), status: 'DISCONTINUED' } })
  }

  static async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'): Promise<ProductWithRelations> {
    const product = await db.product.update({ where: { id, deletedAt: null }, data: { status }, include: INCLUDE })
    return enrich(product)
  }

  // Stats for the header cards
  static async stats() {
    const [total, active, inactive, lowStock, totalValue] = await Promise.all([
      db.product.count({ where: { deletedAt: null } }),
      db.product.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      db.product.count({ where: { deletedAt: null, status: 'INACTIVE' } }),
      db.product.count({
        where: {
          deletedAt: null,
          inventory: { some: { stock: { lte: 0 } } },
        },
      }),
      db.product.aggregate({
        where: { deletedAt: null },
        _sum: { purchasePrice: true },
      }),
    ])
    return { total, active, inactive, lowStock, totalValue: totalValue._sum.purchasePrice ?? 0 }
  }
}
