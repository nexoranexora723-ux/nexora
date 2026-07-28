import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Finance endpoint (transactions + cash flow)
export async function GET() {
  const transactions = await db.transaction.findMany({ orderBy: { date: 'desc' } })

  const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  // Expenses by category
  const byCategory = new Map<string, number>()
  for (const t of transactions.filter((t) => t.type === 'EXPENSE')) {
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount)
  }
  const expensesByCategory = Array.from(byCategory.entries()).map(([category, amount]) => ({ category, amount }))

  // Monthly cash flow (last 6 months)
  const now = new Date()
  const monthly: { month: string; income: number; expenses: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const mIncome = transactions
      .filter((t) => t.type === 'INCOME' && new Date(t.date) >= m && new Date(t.date) < next)
      .reduce((s, t) => s + t.amount, 0)
    const mExpenses = transactions
      .filter((t) => t.type === 'EXPENSE' && new Date(t.date) >= m && new Date(t.date) < next)
      .reduce((s, t) => s + t.amount, 0)
    monthly.push({ month: m.toLocaleDateString('es-CO', { month: 'short' }), income: mIncome, expenses: mExpenses })
  }

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      category: t.category,
      description: t.description,
      amount: t.amount,
      currencyCode: t.currencyCode,
      reference: t.reference,
      date: t.date.toISOString(),
    })),
    summary: { income, expenses, profit: income - expenses, balance: income - expenses },
    expensesByCategory,
    monthly,
  })
}
