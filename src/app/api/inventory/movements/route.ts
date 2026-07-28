import { NextResponse } from 'next/server'
import { InventoryService } from '@/server/services/inventory.service'
import { movementQuerySchema } from '@/lib/schemas/inventory.schema'

// NEXORA — Inventory movements (kardex) API
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = movementQuerySchema.parse({
      productId: searchParams.get('productId') ?? undefined,
      warehouseId: searchParams.get('warehouseId') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
    })
    const movements = await InventoryService.getMovements(query)
    return NextResponse.json(movements)
  } catch (error) {
    console.error('GET /api/inventory/movements error:', error)
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 })
  }
}
