import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

/**
 * DELETE /api/reviews/[id] — soft delete (set status to HIDDEN).
 * Query: ?hard=true to permanently delete.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const existing = await db.review.findUnique({ where: { id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 })
    }

    const url = new URL(req.url)
    const hard = url.searchParams.get('hard') === 'true'

    if (hard) {
      await db.review.delete({ where: { id } })
    } else {
      await db.review.update({ where: { id }, data: { status: 'HIDDEN' } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/reviews/[id] error:', error)
    return NextResponse.json({ error: 'Error al eliminar la reseña' }, { status: 500 })
  }
}
