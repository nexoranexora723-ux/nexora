import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/admin/products/bulk-update-prices
 *
 * Actualiza los precios de venta (suggestedPrice) de múltiples productos en
 * una sola operación. Recibe un array de { id, estimatedCost } o
 * { sku, estimatedCost }.
 *
 * Body:
 *   {
 *     updates: Array<{ id?: string, sku?: string, estimatedCost: number }>
 *   }
 *
 * Respuesta: { success: true, updated: number }
 */
export async function POST(req: NextRequest) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos de administrador' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const updates: Array<{ id?: string; sku?: string; estimatedCost?: number; price?: number }> =
      Array.isArray(body.updates) ? body.updates : []

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No hay actualizaciones' }, { status: 400 })
    }

    if (updates.length > 500) {
      return NextResponse.json({ error: 'Máximo 500 actualizaciones por lote' }, { status: 400 })
    }

    let updatedCount = 0
    // Use a transaction to update all or nothing on hard errors
    await db.$transaction(async (tx) => {
      for (const u of updates) {
        const newPrice = Number(u.estimatedCost ?? u.price)
        if (Number.isNaN(newPrice) || newPrice < 0) continue

        // Build where: prefer id, fallback to sku
        let where: { id: string } | { sku: string }
        if (u.id) {
          where = { id: u.id }
        } else if (u.sku) {
          where = { sku: u.sku }
        } else {
          continue
        }

        try {
          const result = await tx.product.updateMany({
            where,
            data: { suggestedPrice: newPrice },
          })
          updatedCount += result.count
        } catch (e) {
          console.error('bulk-update-prices: error updating', where, e)
        }
      }
    })

    return NextResponse.json({
      success: true,
      updated: updatedCount,
    })
  } catch (error) {
    console.error('POST /api/admin/products/bulk-update-prices error:', error)
    return NextResponse.json({ error: 'Error al actualizar precios' }, { status: 500 })
  }
}
