// NEXORA — Document Service (DMS)
// Business logic layer. Route handlers delegate here (per DOC-002 §7, §12 "Regla de Oro").
import { db } from '@/lib/db'
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentQuery,
} from '@/lib/schemas/document.schema'

export interface DocumentView {
  id: string
  companyId: string
  name: string
  fileId: string | null
  url: string
  category: string
  tags: string | null
  tagsList: string[]
  entityType: string | null
  entityId: string | null
  status: string
  ownerId: string | null
  version: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

function enrich(d: {
  id: string
  companyId: string
  name: string
  fileId: string | null
  url: string
  category: string
  tags: string | null
  entityType: string | null
  entityId: string | null
  status: string
  ownerId: string | null
  version: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}): DocumentView {
  return {
    id: d.id,
    companyId: d.companyId,
    name: d.name,
    fileId: d.fileId,
    url: d.url,
    category: d.category,
    tags: d.tags,
    tagsList: d.tags ? d.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    entityType: d.entityType,
    entityId: d.entityId,
    status: d.status,
    ownerId: d.ownerId,
    version: d.version,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    deletedAt: d.deletedAt ? d.deletedAt.toISOString() : null,
  }
}

export class DocumentService {
  static async list(query: DocumentQuery, companyId: string): Promise<DocumentView[]> {
    const where: Record<string, unknown> = { companyId, deletedAt: null }
    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { tags: { contains: query.q } },
        { url: { contains: query.q } },
      ]
    }
    if (query.category) where.category = query.category
    if (query.entityType) where.entityType = query.entityType
    if (query.status) where.status = query.status

    const items = await db.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })
    return items.map(enrich)
  }

  static async getById(id: string): Promise<DocumentView | null> {
    const d = await db.document.findUnique({ where: { id } })
    return d ? enrich(d) : null
  }

  static async create(
    input: CreateDocumentInput,
    companyId: string,
    ownerId?: string,
  ): Promise<DocumentView> {
    const d = await db.document.create({
      data: {
        companyId,
        name: input.name,
        url: input.url,
        category: input.category,
        tags: input.tags && input.tags !== '' ? input.tags : null,
        entityType: input.entityType ? input.entityType : null,
        entityId: input.entityId && input.entityId !== '' ? input.entityId : null,
        fileId: input.fileId && input.fileId !== '' ? input.fileId : null,
        ownerId: ownerId ?? null,
      },
    })
    return enrich(d)
  }

  static async update(id: string, input: UpdateDocumentInput): Promise<DocumentView> {
    const existing = await db.document.findUnique({ where: { id, deletedAt: null } })
    if (!existing) throw new Error('Documento no encontrado')

    const cleanData: {
      name?: string
      url?: string
      category?: string
      tags?: string | null
      entityType?: string | null
      entityId?: string | null
      version?: { increment: number }
    } = {}
    if (input.name !== undefined) cleanData.name = input.name
    if (input.url !== undefined) cleanData.url = input.url
    if (input.category !== undefined) cleanData.category = input.category
    if (input.tags !== undefined) cleanData.tags = input.tags === '' ? null : input.tags
    if (input.entityType !== undefined) {
      const v = input.entityType as string
      cleanData.entityType = v === '' ? null : v
    }
    if (input.entityId !== undefined) {
      const v = input.entityId as string
      cleanData.entityId = v === '' ? null : v
    }

    // If meaningful fields changed, bump version
    const changed = Object.keys(cleanData).length > 0
    if (changed) {
      cleanData.version = { increment: 1 }
    }

    const d = await db.document.update({ where: { id }, data: cleanData })
    return enrich(d)
  }

  static async softDelete(id: string): Promise<void> {
    await db.document.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    })
  }

  static async archive(id: string): Promise<DocumentView> {
    const d = await db.document.update({
      where: { id, deletedAt: null },
      data: { status: 'ARCHIVED' },
    })
    return enrich(d)
  }

  static async restore(id: string): Promise<DocumentView> {
    const d = await db.document.update({
      where: { id, deletedAt: null },
      data: { status: 'ACTIVE' },
    })
    return enrich(d)
  }

  // Stats for the header cards
  static async stats(companyId: string): Promise<{
    total: number
    active: number
    archived: number
    categories: number
    byCategory: { category: string; count: number }[]
    recent: number
  }> {
    const baseWhere = { companyId, deletedAt: null }
    const [total, active, archived, categoriesAgg, recent] = await Promise.all([
      db.document.count({ where: baseWhere }),
      db.document.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
      db.document.count({ where: { ...baseWhere, status: 'ARCHIVED' } }),
      db.document.groupBy({
        by: ['category'],
        where: baseWhere,
        _count: { category: true },
      }),
      db.document.count({
        where: {
          ...baseWhere,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    return {
      total,
      active,
      archived,
      categories: categoriesAgg.length,
      byCategory: categoriesAgg.map((c) => ({ category: c.category, count: c._count.category })),
      recent,
    }
  }
}
