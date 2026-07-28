// NEXORA — Finance Service
// Business logic layer for transactions + cash-flow analytics.
// Mirrors the pattern established by ProductService / OrderService.
import { db } from '@/lib/db'
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionQuery,
} from '@/lib/schemas/finance.schema'

export interface TransactionView {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  description: string
  amount: number
  currencyCode: string
  reference: string | null
  date: string
  createdAt: string
}

export interface FinanceSummary {
  income: number
  expenses: number
  profit: number
  balance: number
  margin: number
}

export interface FinanceStats {
  total: number
  income: number
  expenses: number
  avgTicket: number
}

export interface MonthlyPoint {
  month: string
  income: number
  expenses: number
}

export interface CategoryPoint {
  category: string
  amount: number
}

export interface FinanceOverview {
  transactions: TransactionView[]
  summary: FinanceSummary
  expensesByCategory: CategoryPoint[]
  monthly: MonthlyPoint[]
  stats: FinanceStats
}

type TransactionRow = Record<string, unknown> & {
  id: string
  type: string
  category: string
  description: string
  amount: number
  currencyCode: string
  reference: string | null
  date: Date
  createdAt: Date
}

function enrich(t: TransactionRow): TransactionView {
  return {
    id: t.id,
    type: t.type as 'INCOME' | 'EXPENSE',
    category: t.category,
    description: t.description,
    amount: t.amount,
    currencyCode: t.currencyCode,
    reference: t.reference,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
  }
}

function buildOrderBy(sort: TransactionQuery['sort']) {
  switch (sort) {
    case 'date':
      return { date: 'asc' as const }
    case 'amount':
      return { amount: 'asc' as const }
    case 'amount_desc':
      return { amount: 'desc' as const }
    default:
      return { date: 'desc' as const }
  }
}

export class FinanceService {
  static async listTransactions(
    query: TransactionQuery,
  ): Promise<TransactionView[]> {
    const where: Record<string, unknown> = {}
    if (query.q) {
      where.OR = [
        { description: { contains: query.q } },
        { reference: { contains: query.q } },
      ]
    }
    if (query.type) where.type = query.type
    if (query.category) where.category = query.category
    if (query.dateFrom || query.dateTo) {
      where.date = {}
      if (query.dateFrom) (where.date as Record<string, unknown>).gte = new Date(query.dateFrom)
      if (query.dateTo) {
        // Include the entire end day
        const end = new Date(query.dateTo)
        end.setHours(23, 59, 59, 999)
        (where.date as Record<string, unknown>).lte = end
      }
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
    })
    return transactions.map((t) => enrich(t as unknown as TransactionRow))
  }

  static async getTransactionById(id: string): Promise<TransactionView | null> {
    const t = await db.transaction.findUnique({ where: { id } })
    return t ? enrich(t as unknown as TransactionRow) : null
  }

  static async createTransaction(input: CreateTransactionInput): Promise<TransactionView> {
    const reference =
      input.reference && input.reference.trim() ? input.reference.trim() : null
    const date = input.date && input.date.trim() ? new Date(input.date) : new Date()

    const t = await db.transaction.create({
      data: {
        type: input.type,
        category: input.category,
        description: input.description.trim(),
        amount: input.amount,
        currencyCode: input.currencyCode,
        reference,
        date,
      },
    })
    return enrich(t as unknown as TransactionRow)
  }

  static async updateTransaction(
    id: string,
    input: UpdateTransactionInput,
  ): Promise<TransactionView> {
    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) throw new Error('Transacción no encontrada')

    const reference =
      input.reference !== undefined
        ? input.reference && input.reference.trim()
          ? input.reference.trim()
          : null
        : undefined
    const date =
      input.date !== undefined
        ? input.date && input.date.trim()
          ? new Date(input.date)
          : new Date()
        : undefined

    const t = await db.transaction.update({
      where: { id },
      data: {
        ...(input.type ? { type: input.type } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currencyCode ? { currencyCode: input.currencyCode } : {}),
        ...(reference !== undefined ? { reference } : {}),
        ...(date !== undefined ? { date } : {}),
      },
    })
    return enrich(t as unknown as TransactionRow)
  }

  static async deleteTransaction(id: string): Promise<void> {
    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) throw new Error('Transacción no encontrada')
    // Protect SALES transactions auto-generated from orders (reverse via order cancel instead)
    if (existing.category === 'SALES' && existing.reference && existing.reference.startsWith('ORD-')) {
      throw new Error(
        'Esta transacción está vinculada a un pedido. Cancela el pedido para reversarla.',
      )
    }
    await db.transaction.delete({ where: { id } })
  }

  // Income / expenses / profit / margin over all transactions
  static async getSummary(): Promise<FinanceSummary> {
    const rows = await db.transaction.findMany()
    const income = rows
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + t.amount, 0)
    const expenses = rows
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + t.amount, 0)
    const profit = income - expenses
    const margin = income > 0 ? (profit / income) * 100 : 0
    return { income, expenses, profit, balance: profit, margin }
  }

  // 6-month income vs expenses series
  static async getMonthly(): Promise<MonthlyPoint[]> {
    const rows = await db.transaction.findMany()
    const now = new Date()
    const monthly: MonthlyPoint[] = []
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const mIncome = rows
        .filter((t) => t.type === 'INCOME' && t.date >= m && t.date < next)
        .reduce((s, t) => s + t.amount, 0)
      const mExpenses = rows
        .filter((t) => t.type === 'EXPENSE' && t.date >= m && t.date < next)
        .reduce((s, t) => s + t.amount, 0)
      monthly.push({
        month: m.toLocaleDateString('es-CO', { month: 'short' }),
        income: mIncome,
        expenses: mExpenses,
      })
    }
    return monthly
  }

  // Expenses grouped by category (sorted desc)
  static async getExpensesByCategory(): Promise<CategoryPoint[]> {
    const rows = await db.transaction.findMany({ where: { type: 'EXPENSE' } })
    const map = new Map<string, number>()
    for (const t of rows) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }

  static async stats(): Promise<FinanceStats> {
    const [total, incomeAgg, expensesAgg] = await Promise.all([
      db.transaction.count(),
      db.transaction.aggregate({ where: { type: 'INCOME' }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { type: 'EXPENSE' }, _sum: { amount: true } }),
    ])
    const income = incomeAgg._sum.amount ?? 0
    const expenses = expensesAgg._sum.amount ?? 0
    const incomeCount = await db.transaction.count({ where: { type: 'INCOME' } })
    const avgTicket = incomeCount > 0 ? income / incomeCount : 0
    return { total, income, expenses, avgTicket }
  }

  // Convenience: full overview payload used by the finance view
  static async getOverview(query?: TransactionQuery): Promise<FinanceOverview> {
    const [transactions, summary, monthly, expensesByCategory, stats] = await Promise.all([
      FinanceService.listTransactions(query ?? { sort: 'date_desc' }),
      FinanceService.getSummary(),
      FinanceService.getMonthly(),
      FinanceService.getExpensesByCategory(),
      FinanceService.stats(),
    ])
    return { transactions, summary, monthly, expensesByCategory, stats }
  }
}
