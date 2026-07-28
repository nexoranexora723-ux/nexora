import { NextResponse } from 'next/server'
import { InventoryService } from '@/server/services/inventory.service'
import { inventoryQuerySchema } from '@/lib/schemas/inventory.schema'

// NEXORA — Inventory API (uses InventoryService.list with filters)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = inventoryQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      warehouseId: searchParams.get('warehouseId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    })
    const inventory = await InventoryService.list(query)
    return NextResponse.json(inventory)
  } catch (error) {
    console.error('GET /api/inventory error:', error)
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 })
  }
}
