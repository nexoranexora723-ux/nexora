import { NextResponse } from 'next/server'
import { InventoryService } from '@/server/services/inventory.service'
import { adjustStockSchema } from '@/lib/schemas/inventory.schema'

// NEXORA — Inventory adjust API
// POST: creates an InventoryMovement + updates Inventory.stock in a single $transaction
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = adjustStockSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const inventory = await InventoryService.adjustStock(parsed.data)
    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    console.error('POST /api/inventory/adjust error:', error)
    const message = error instanceof Error ? error.message : 'Error al ajustar stock'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
