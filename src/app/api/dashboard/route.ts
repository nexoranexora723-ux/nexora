import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [requests, quotes, imports, transactions, clients, suppliers] = await Promise.all([
      db.importRequest.findMany({ include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } }, orderBy: { createdAt: 'desc' } }),
      db.quote.findMany(),
      db.import.findMany(),
      db.transaction.findMany(),
      db.user.count({ where: { role: 'CLIENT', status: 'ACTIVE' } }),
      db.supplier.count({ where: { status: 'ACTIVE' } }),
    ])

    const newRequests = requests.filter((r) => r.status === 'NUEVA').length
    const activeRequests = requests.filter((r) => !['ENTREGADO', 'CERRADO'].includes(r.status)).length
    const pendingQuotes = quotes.filter((q) => ['RECIBIDA', 'ENVIADA_AL_CLIENTE'].includes(q.status)).length
    const activeImports = imports.filter((i) => !['ENTREGADO', 'CANCELADO'].includes(i.status)).length

    const revenue = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

    const statusCounts = new Map<string, number>()
    for (const r of requests) statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1)
    const requestsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }))

    const recentRequests = requests.slice(0, 8).map((r) => ({
      ...r,
      client: r.client,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      closedAt: r.closedAt?.toISOString() ?? null,
    }))

    return NextResponse.json({
      newRequests, activeRequests, pendingQuotes, activeImports,
      revenue, expenses, profit: revenue - expenses,
      totalClients: clients, activeSuppliers: suppliers,
      requestsByStatus, recentRequests,
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
