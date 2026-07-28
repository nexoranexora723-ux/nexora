import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Dashboard aggregated stats endpoint
// Consumes all modules per DOC-002 (dashboard only consumes, never stores)
export async function GET() {
  const [orders, products, customers, suppliers, transactions, inventory] = await Promise.all([
    db.order.findMany({ include: { items: { include: { product: true } } } }),
    db.product.findMany(),
    db.customer.findMany(),
    db.supplier.findMany({ where: { status: 'ACTIVE' } }),
    db.transaction.findMany(),
    db.inventory.findMany(),
  ])

  const revenue = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((s, t) => s + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s, t) => s + t.amount, 0)
  const profit = revenue - expenses
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'PAID').length
  const lowStockCount = inventory.filter((i) => i.stock <= i.minStock).length

  // Revenue/expenses by day (last 14 days)
  const now = new Date()
  const days: { date: string; revenue: number; expenses: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    day.setHours(0, 0, 0, 0)
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    const dayRevenue = transactions
      .filter((t) => t.type === 'INCOME' && new Date(t.date) >= day && new Date(t.date) < next)
      .reduce((s, t) => s + t.amount, 0)
    const dayExpenses = transactions
      .filter((t) => t.type === 'EXPENSE' && new Date(t.date) >= day && new Date(t.date) < next)
      .reduce((s, t) => s + t.amount, 0)
    days.push({ date: day.toISOString().slice(0, 10), revenue: dayRevenue, expenses: dayExpenses })
  }

  const statusCounts = new Map<string, number>()
  for (const o of orders) statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1)
  const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }))

  // Top products by revenue
  const productRevenue = new Map<string, { name: string; sku: string; sold: number; revenue: number }>()
  for (const o of orders) {
    if (o.status === 'CANCELLED' || o.status === 'REFUNDED') continue
    for (const it of o.items) {
      const cur = productRevenue.get(it.productId) ?? { name: it.product.name, sku: it.product.sku, sold: 0, revenue: 0 }
      cur.sold += it.quantity
      cur.revenue += it.total
      productRevenue.set(it.productId, cur)
    }
  }
  const topProducts = Array.from(productRevenue.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // Category revenue
  const productsWithCat = await db.product.findMany({ include: { category: true } })
  const catRevenue = new Map<string, number>()
  for (const o of orders) {
    if (o.status === 'CANCELLED' || o.status === 'REFUNDED') continue
    for (const it of o.items) {
      const prod = productsWithCat.find((p) => p.id === it.productId)
      const cat = prod?.category?.name ?? 'Sin categoría'
      catRevenue.set(cat, (catRevenue.get(cat) ?? 0) + it.total)
    }
  }
  const categoryRevenue = Array.from(catRevenue.entries()).map(([category, revenue]) => ({ category, revenue }))

  return NextResponse.json({
    revenue,
    expenses,
    profit,
    profitMargin,
    totalOrders: orders.length,
    pendingOrders,
    totalProducts: products.length,
    lowStockCount,
    totalCustomers: customers.length,
    activeSuppliers: suppliers.length,
    revenueByDay: days,
    ordersByStatus,
    topProducts,
    categoryRevenue,
  })
}
