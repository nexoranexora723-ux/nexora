// NEXORA — Supplier Service
// Business logic layer. Route handlers delegate here (per DOC-002 §7, §12 "Regla de Oro").
// Mirrors the pattern established by ProductService.
import { db } from '@/lib/db'
import { CreateSupplierInput, UpdateSupplierInput, SupplierQuery, SupplierRatingInput } from '@/lib/schemas/supplier.schema'

export interface SupplierRatingView {
  id: string
  communicationScore: number
  qualityScore: number
  priceScore: number
  shippingScore: number
  warrantyScore: number
  trustScore: number
  overallScore: number
  review: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SupplierWithRelations {
  id: string
  companyName: string
  contactName: string | null
  whatsapp: string | null
  wechat: string | null
  email: string | null
  website: string | null
  yupoo: string | null
  country: string | null
  city: string | null
  address: string | null
  moq: number | null
  paymentMethods: string | null
  shippingMethods: string | null
  warranty: string | null
  leadTime: number | null
  productionTime: number | null
  oem: boolean
  odm: boolean
  status: string
  riskLevel: string
  companyId: string
  createdAt: Date
  updatedAt: Date
  // computed / relations
  rating: SupplierRatingView | null
  productCount: number
  approvedQuotes: number
}

const INCLUDE = {
  ratings: { orderBy: { createdAt: 'desc' as const }, take: 1 },
  products: { select: { id: true } },
  quotes: { select: { id: true, status: true } },
} as const

type SupplierWithIncludes = Record<string, unknown> & {
  id: string
  companyName: string
  contactName: string | null
  whatsapp: string | null
  wechat: string | null
  email: string | null
  website: string | null
  yupoo: string | null
  country: string | null
  city: string | null
  address: string | null
  moq: number | null
  paymentMethods: string | null
  shippingMethods: string | null
  warranty: string | null
  leadTime: number | null
  productionTime: number | null
  oem: boolean
  odm: boolean
  status: string
  riskLevel: string
  companyId: string
  createdAt: Date
  updatedAt: Date
  ratings?: Array<{
    id: string
    communicationScore: number
    qualityScore: number
    priceScore: number
    shippingScore: number
    warrantyScore: number
    trustScore: number
    overallScore: number
    review: string | null
    createdAt: Date
    updatedAt: Date
  }>
  products?: Array<{ id: string }>
  quotes?: Array<{ id: string; status: string }>
}

function enrich(s: SupplierWithIncludes): SupplierWithRelations {
  const ratingRow = s.ratings && s.ratings.length > 0 ? s.ratings[0] : null
  const approvedQuotes = (s.quotes ?? []).filter((q) => q.status === 'APPROVED').length
  return {
    id: s.id,
    companyName: s.companyName,
    contactName: s.contactName,
    whatsapp: s.whatsapp,
    wechat: s.wechat,
    email: s.email,
    website: s.website,
    yupoo: s.yupoo,
    country: s.country,
    city: s.city,
    address: s.address,
    moq: s.moq,
    paymentMethods: s.paymentMethods,
    shippingMethods: s.shippingMethods,
    warranty: s.warranty,
    leadTime: s.leadTime,
    productionTime: s.productionTime,
    oem: s.oem,
    odm: s.odm,
    status: s.status,
    riskLevel: s.riskLevel,
    companyId: s.companyId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    rating: ratingRow
      ? {
          id: ratingRow.id,
          communicationScore: ratingRow.communicationScore,
          qualityScore: ratingRow.qualityScore,
          priceScore: ratingRow.priceScore,
          shippingScore: ratingRow.shippingScore,
          warrantyScore: ratingRow.warrantyScore,
          trustScore: ratingRow.trustScore,
          overallScore: ratingRow.overallScore,
          review: ratingRow.review,
          createdAt: ratingRow.createdAt,
          updatedAt: ratingRow.updatedAt,
        }
      : null,
    productCount: (s.products ?? []).length,
    approvedQuotes,
  }
}

// Compute overall score as simple average of 6 dimensions (DOC-006)
function computeOverall(r: SupplierRatingInput): number {
  const sum =
    r.communicationScore +
    r.qualityScore +
    r.priceScore +
    r.shippingScore +
    r.warrantyScore +
    r.trustScore
  return Math.round((sum / 6) * 10) / 10
}

// Rating counts only if at least one score > 0 (so all-zero default is treated as "no rating")
function hasRatingData(r?: SupplierRatingInput): r is SupplierRatingInput {
  return (
    !!r &&
    (r.communicationScore > 0 ||
      r.qualityScore > 0 ||
      r.priceScore > 0 ||
      r.shippingScore > 0 ||
      r.warrantyScore > 0 ||
      r.trustScore > 0)
  )
}

export class SupplierService {
  static async list(query: SupplierQuery): Promise<SupplierWithRelations[]> {
    const where: Record<string, unknown> = { deletedAt: null }
    if (query.q) {
      where.OR = [
        { companyName: { contains: query.q } },
        { contactName: { contains: query.q } },
        { email: { contains: query.q } },
        { whatsapp: { contains: query.q } },
        { city: { contains: query.q } },
        { country: { contains: query.q } },
      ]
    }
    if (query.status) where.status = query.status
    if (query.riskLevel) where.riskLevel = query.riskLevel

    const suppliers = await db.supplier.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    return suppliers.map((s) => enrich(s as unknown as SupplierWithIncludes))
  }

  static async getById(id: string): Promise<SupplierWithRelations | null> {
    const s = await db.supplier.findUnique({ where: { id, deletedAt: null }, include: INCLUDE })
    return s ? enrich(s as unknown as SupplierWithIncludes) : null
  }

  static async create(input: CreateSupplierInput, companyId: string): Promise<SupplierWithRelations> {
    const { rating, ...data } = input

    // Clean empty strings → null for optional fields
    const cleanData: Record<string, unknown> = { ...data, companyId }
    for (const [k, v] of Object.entries(cleanData)) {
      if (v === '') cleanData[k] = null
    }

    const supplier = await db.supplier.create({
      data: {
        ...(cleanData as object),
        companyName: data.companyName,
        country: data.country,
        oem: data.oem,
        odm: data.odm,
        riskLevel: data.riskLevel,
        status: data.status,
        companyId,
        // Create the rating inline if at least one score is non-zero
        ...(hasRatingData(rating)
          ? {
              ratings: {
                create: {
                  communicationScore: rating.communicationScore,
                  qualityScore: rating.qualityScore,
                  priceScore: rating.priceScore,
                  shippingScore: rating.shippingScore,
                  warrantyScore: rating.warrantyScore,
                  trustScore: rating.trustScore,
                  overallScore: computeOverall(rating),
                  review: rating.review ?? null,
                },
              },
            }
          : {}),
      },
      include: INCLUDE,
    })
    return enrich(supplier as unknown as SupplierWithIncludes)
  }

  static async update(id: string, input: UpdateSupplierInput): Promise<SupplierWithRelations> {
    const existing = await db.supplier.findUnique({ where: { id, deletedAt: null }, include: INCLUDE })
    if (!existing) throw new Error('Proveedor no encontrado')

    const { rating, ...data } = input

    // Clean empty strings → null
    const cleanData: Record<string, unknown> = { ...data }
    for (const [k, v] of Object.entries(cleanData)) {
      if (v === '') cleanData[k] = null
    }

    const updated = await db.supplier.update({
      where: { id },
      data: cleanData,
      include: INCLUDE,
    })

    // Upsert rating if provided AND has non-zero scores
    if (hasRatingData(rating)) {
      const existingRating = updated.ratings && updated.ratings.length > 0 ? updated.ratings[0] : null
      const ratingPayload = {
        communicationScore: rating.communicationScore,
        qualityScore: rating.qualityScore,
        priceScore: rating.priceScore,
        shippingScore: rating.shippingScore,
        warrantyScore: rating.warrantyScore,
        trustScore: rating.trustScore,
        overallScore: computeOverall(rating),
        review: rating.review ?? null,
      }
      if (existingRating) {
        await db.supplierRating.update({
          where: { id: existingRating.id },
          data: ratingPayload,
        })
      } else {
        await db.supplierRating.create({
          data: { supplierId: id, ...ratingPayload },
        })
      }
    }

    const refreshed = await db.supplier.findUnique({ where: { id }, include: INCLUDE })
    return enrich(refreshed as unknown as SupplierWithIncludes)
  }

  static async softDelete(id: string): Promise<void> {
    await db.supplier.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
  }

  static async setStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED',
  ): Promise<SupplierWithRelations> {
    const supplier = await db.supplier.update({
      where: { id, deletedAt: null },
      data: { status },
      include: INCLUDE,
    })
    return enrich(supplier as unknown as SupplierWithIncludes)
  }

  static async stats() {
    const [total, active, blacklisted, highRisk, lowRisk, avgRating] = await Promise.all([
      db.supplier.count({ where: { deletedAt: null } }),
      db.supplier.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      db.supplier.count({ where: { deletedAt: null, status: 'BLACKLISTED' } }),
      db.supplier.count({ where: { deletedAt: null, riskLevel: 'HIGH' } }),
      db.supplier.count({ where: { deletedAt: null, riskLevel: 'LOW' } }),
      db.supplierRating.aggregate({ _avg: { overallScore: true } }),
    ])
    return {
      total,
      active,
      blacklisted,
      highRisk,
      lowRisk,
      avgScore: avgRating._avg.overallScore ?? 0,
    }
  }
}
