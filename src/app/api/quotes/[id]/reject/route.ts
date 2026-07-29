import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
