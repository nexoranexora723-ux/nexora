// NEXORA — Customer Service (CRM)
// Business logic layer. Route handlers delegate here (per DOC-002 §7, §12 "Regla de Oro").
// Mirrors the pattern established by ProductService.
import { db } from '@/lib/db'
import { CreateCustomerInput, UpdateCustomerInput, CustomerQuery } from '@/lib/schemas/customer.schema'

export interface CustomerWithRelations {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  country: string | null
  city: string | null
  address: string | null
  tags: string | null
  status: string
  lifetimeValue: number
  totalOrders: number
  companyId: string
  createdAt: string
  updatedAt: string
  // computed
  fullName: string
  tagsList: string[]
}

interface CustomerWithIncludes {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  country: string | null
  city: string | null
  address: string | null
  tags: string | null
  status: string
  lifetimeValue: number
  totalOrders: number
  companyId: string
  createdAt: Date
  updatedAt: Date
}

function enrich(c: CustomerWithIncludes): CustomerWithRelations {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    country: c.country,
    city: c.city,
    address: c.address,
    tags: c.tags,
    status: c.status,
    lifetimeValue: c.lifetimeValue,
    totalOrders: c.totalOrders,
    companyId: c.companyId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    fullName: `${c.firstName} ${c.lastName}`,
    tagsList: c.tags
      ? c.tags
          .split(/[,;|]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
  }
}

function buildOrderBy(sort: CustomerQuery['sort']) {
  switch (sort) {
    case 'created':
      return { createdAt: 'asc' as const }
    case 'name':
      return { firstName: 'asc' as const }
    case 'ltv':
      return { lifetimeValue: 'asc' as const }
    case 'ltv_desc':
      return { lifetimeValue: 'desc' as const }
    default:
      return { createdAt: 'desc' as const }
  }
}

export class CustomerService {
  static async list(query: CustomerQuery): Promise<CustomerWithRelations[]> {
    const where: Record<string, unknown> = { deletedAt: null }
    if (query.q) {
      where.OR = [
        { firstName: { contains: query.q } },
        { lastName: { contains: query.q } },
        { email: { contains: query.q } },
        { phone: { contains: query.q } },
        { city: { contains: query.q } },
        { tags: { contains: query.q } },
      ]
    }
    if (query.status) where.status = query.status

    const customers = await db.customer.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
    })
    return customers.map((c) => enrich(c as unknown as CustomerWithIncludes))
  }

  static async getById(id: string): Promise<CustomerWithRelations | null> {
    const c = await db.customer.findUnique({ where: { id, deletedAt: null } })
    return c ? enrich(c as unknown as CustomerWithIncludes) : null
  }

  static async create(input: CreateCustomerInput, companyId: string): Promise<CustomerWithRelations> {
    // Verify email uniqueness
    const existing = await db.customer.findUnique({ where: { email: input.email } })
    if (existing) {
      throw new Error(`Ya existe un cliente con email "${input.email}"`)
    }

    // NOTE: companyName and nit are accepted for UX but not persisted — the Customer
    // model doesn't have those columns. They are silently dropped here.
    const { companyName: _cn, nit: _nit, ...data } = input

    // Clean empty strings → null for optional fields
    const cleanData: Record<string, unknown> = { ...data, companyId }
    for (const [k, v] of Object.entries(cleanData)) {
      if (v === '') cleanData[k] = null
    }

    const customer = await db.customer.create({
      data: cleanData as object,
    })
    return enrich(customer as unknown as CustomerWithIncludes)
  }

  static async update(id: string, input: UpdateCustomerInput): Promise<CustomerWithRelations> {
    const existing = await db.customer.findUnique({ where: { id, deletedAt: null } })
    if (!existing) throw new Error('Cliente no encontrado')

    // Email uniqueness check if changing
    if (input.email && input.email !== existing.email) {
      const dup = await db.customer.findUnique({ where: { email: input.email } })
      if (dup) throw new Error(`Ya existe un cliente con email "${input.email}"`)
    }

    // Drop non-persisted fields
    const { companyName: _cn, nit: _nit, ...data } = input

    // Clean empty strings → null
    const cleanData: Record<string, unknown> = { ...data }
    for (const [k, v] of Object.entries(cleanData)) {
      if (v === '') cleanData[k] = null
    }

    const customer = await db.customer.update({
      where: { id },
      data: cleanData,
    })
    return enrich(customer as unknown as CustomerWithIncludes)
  }

  static async softDelete(id: string): Promise<void> {
    await db.customer.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    })
  }

  static async setStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'VIP',
  ): Promise<CustomerWithRelations> {
    const customer = await db.customer.update({
      where: { id, deletedAt: null },
      data: { status },
    })
    return enrich(customer as unknown as CustomerWithIncludes)
  }

  // Stats for header cards
  static async stats() {
    const [total, vip, active, inactive, aggLtv, aggOrders] = await Promise.all([
      db.customer.count({ where: { deletedAt: null } }),
      db.customer.count({ where: { deletedAt: null, status: 'VIP' } }),
      db.customer.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      db.customer.count({ where: { deletedAt: null, status: 'INACTIVE' } }),
      db.customer.aggregate({
        where: { deletedAt: null },
        _sum: { lifetimeValue: true },
      }),
      db.customer.aggregate({
        where: { deletedAt: null },
        _sum: { totalOrders: true },
      }),
    ])
    const totalOrders = aggOrders._sum.totalOrders ?? 0
    const totalLtv = aggLtv._sum.lifetimeValue ?? 0
    return {
      total,
      vip,
      active,
      inactive,
      totalLtv,
      totalOrders,
      avgTicket: totalOrders > 0 ? totalLtv / totalOrders : 0,
    }
  }
}
