import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth
    const { id } = await params
    const quote = await db.quote.update({ where: { id }, data: { status: 'RECHAZADA' } })
    await db.notification.createMany({
      data: (await db.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE' } })).map((a) => ({
        userId: a.id, type: 'quote', priority: 'MEDIUM',
        title: 'Cotización rechazada',
        message: `El cliente rechazó la cotización ${quote.number}.`,
        data: JSON.stringify({ quoteId: id }),
      })),
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/quotes/[id]/reject error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
