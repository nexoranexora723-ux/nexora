import { NextResponse } from 'next/server'
import { FinanceService } from '@/server/services/finance.service'
import {
  createTransactionSchema,
  transactionQuerySchema,
} from '@/lib/schemas/finance.schema'

// NEXORA — Finance API
// GET: overview (transactions + summary + monthly + categories) OR filtered transactions
// POST: create a manual transaction
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const hasFilters =
      searchParams.has('q') ||
      searchParams.has('type') ||
      searchParams.has('category') ||
      searchParams.has('dateFrom') ||
      searchParams.has('dateTo') ||
      searchParams.has('sort')

    // If no filters → return the full overview payload (keeps backward compat with the
    // existing finance-view which expects { transactions, summary, expensesByCategory, monthly })
    if (!hasFilters) {
      const overview = await FinanceService.getOverview()
      return NextResponse.json(overview)
    }

    const query = transactionQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      sort: searchParams.get('sort') ?? 'date_desc',
    })
    const transactions = await FinanceService.listTransactions(query)
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('GET /api/finance error:', error)
    return NextResponse.json({ error: 'Error al obtener finanzas' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const tx = await FinanceService.createTransaction(parsed.data)
    return NextResponse.json(tx, { status: 201 })
  } catch (error) {
    console.error('POST /api/finance error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear transacción'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
