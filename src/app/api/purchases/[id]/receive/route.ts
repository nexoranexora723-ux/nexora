import { NextResponse } from 'next/server'
import { PurchaseService } from '@/server/services/purchase.service'

// NEXORA — Receive Purchase Order endpoint
// POST: marks the order as RECEIVED, updates inventory stock, creates InventoryMovements
// (type=IN) for each item, and creates a Transaction (type=EXPENSE, category=PURCHASES).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const purchase = await PurchaseService.receive(id)
    return NextResponse.json(purchase)
  } catch (error) {
    console.error('POST /api/purchases/[id]/receive error:', error)
    const message = error instanceof Error ? error.message : 'Error al recibir orden de compra'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
