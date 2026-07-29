import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const transactions = await db.transaction.findMany({ orderBy: { date: 'desc' } })
    const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id, type: t.type, category: t.category, description: t.description,
        amount: t.amount, reference: t.reference, date: t.date.toISOString(),
      })),
      summary: { income, expenses, profit: income - expenses },
    })
  } catch (error) {
    console.error('GET /api/finance error:', error)
    return NextResponse.json({ transactions: [], summary: { income: 0, expenses: 0, profit: 0 } })
  }
}
