import { db } from '@/lib/db'
import { CreateRequestInput } from '@/lib/schemas'

const INCLUDE = {
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
  quotes: { include: { supplier: { select: { id: true, companyName: true } } }, orderBy: { createdAt: 'desc' } },
  imports: { include: { supplier: { select: { id: true, companyName: true } } }, orderBy: { createdAt: 'desc' } },
} as const

function enrich(r: any) {
  return {
    ...r,
    client: r.client,
    assignee: r.assignee,
    quotes: (r.quotes ?? []).map((q: any) => ({ ...q, validity: q.validity?.toISOString() ?? null, createdAt: q.createdAt.toISOString() })),
    imports: (r.imports ?? []).map((i: any) => ({ ...i, purchasedAt: i.purchasedAt?.toISOString() ?? null, productionEndsAt: i.productionEndsAt?.toISOString() ?? null, shippedAt: i.shippedAt?.toISOString() ?? null, arrivedAt: i.arrivedAt?.toISOString() ?? null, deliveredAt: i.deliveredAt?.toISOString() ?? null, createdAt: i.createdAt.toISOString() })),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    closedAt: r.closedAt?.toISOString() ?? null,
  }
}

export class RequestService {
  static async list(filters?: { status?: string; clientId?: string; assignedToId?: string; q?: string }) {
    const where: Record<string, unknown> = {}
    if (filters?.status) where.status = filters.status
    if (filters?.clientId) where.clientId = filters.clientId
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId
    if (filters?.q) {
      where.OR = [
        { number: { contains: filters.q } },
        { productName: { contains: filters.q } },
        { description: { contains: filters.q } },
      ]
    }
    const reqs = await db.importRequest.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' } })
    return reqs.map(enrich)
  }

  static async getById(id: string) {
    const r = await db.importRequest.findUnique({ where: { id }, include: { ...INCLUDE, statusHistory: { orderBy: { createdAt: 'desc' } }, attachments: true } })
    if (!r) return null
    return {
      ...enrich(r),
      statusHistory: r.statusHistory.map((h: { id: string; fromStatus: string | null; toStatus: string; notes: string | null; createdAt: Date }) => ({
        id: h.id, fromStatus: h.fromStatus, toStatus: h.toStatus, notes: h.notes, createdAt: h.createdAt.toISOString(),
      })),
      attachments: r.attachments.map((a: { id: string; type: string; url: string; name: string | null }) => ({ id: a.id, type: a.type, url: a.url, name: a.name })),
    }
  }

  static async create(input: CreateRequestInput, clientId: string) {
    const count = await db.importRequest.count()
    const number = `NX-2025-${String(count + 1).padStart(6, '0')}`
    const req = await db.importRequest.create({
      data: {
        number, clientId,
        productName: input.productName,
        description: input.description || null,
        category: input.category || null,
        purpose: input.purpose,
        quantity: input.quantity,
        budget: input.budget ?? null,
        currencyCode: input.currencyCode,
        referenceUrl: input.referenceUrl || null,
        referenceImages: input.referenceImages || null,
        details: input.details || null,
        priority: input.priority,
        status: 'NUEVA',
      },
      include: INCLUDE,
    })
    await db.requestStatusHistory.create({ data: { requestId: req.id, toStatus: 'NUEVA', notes: 'Solicitud creada por el cliente' } })
    // Notify all admins
    const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE' } })
    await db.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id, type: 'request', priority: 'HIGH',
        title: 'Nueva solicitud de importación',
        message: `${number}: ${input.productName} (${input.quantity} u)`,
        data: JSON.stringify({ requestId: req.id }),
      })),
    })
    return enrich(req)
  }

  static async updateStatus(id: string, status: string, notes?: string, changedById?: string) {
    const req = await db.importRequest.findUnique({ where: { id } })
    if (!req) throw new Error('Solicitud no encontrada')
    const updated = await db.importRequest.update({
      where: { id },
      data: { status, ...(status === 'CERRADO' ? { closedAt: new Date() } : {}) },
      include: INCLUDE,
    })
    await db.requestStatusHistory.create({
      data: { requestId: id, fromStatus: req.status, toStatus: status, notes: notes || null, changedById },
    })
    // Notify client
    await db.notification.create({
      data: {
        userId: req.clientId, type: 'request', priority: 'MEDIUM',
        title: 'Tu solicitud fue actualizada',
        message: `${req.number}: estado actualizado a "${status}"`,
        data: JSON.stringify({ requestId: id }),
      },
    })
    return enrich(updated)
  }

  static async assign(id: string, assignedToId: string) {
    const req = await db.importRequest.update({ where: { id }, data: { assignedToId }, include: INCLUDE })
    return enrich(req)
  }

  static async setNaiosAnalysis(id: string, summary: string, category?: string, priority?: string) {
    const req = await db.importRequest.update({
      where: { id },
      data: { naiosSummary: summary, naiosCategory: category, naiosPriority: priority, status: 'ANALIZANDO' },
      include: INCLUDE,
    })
    return enrich(req)
  }
}
