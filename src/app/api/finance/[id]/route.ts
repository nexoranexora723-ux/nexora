import { NextResponse } from 'next/server'
import { FinanceService } from '@/server/services/finance.service'
import { updateTransactionSchema } from '@/lib/schemas/finance.schema'

// NEXORA — Transaction by ID API
// PUT: update a transaction  | DELETE: remove a transaction

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const tx = await FinanceService.updateTransaction(id, parsed.data)
    return NextResponse.json(tx)
  } catch (error) {
    console.error('PUT /api/finance/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al actualizar transacción'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await FinanceService.deleteTransaction(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/finance/[id] error:', error)
    const message = error instanceof Error ? error.message : 'Error al eliminar transacción'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
