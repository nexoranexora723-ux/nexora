import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — NAIOS recommendations endpoint
// Per DOC-006: alerts, opportunities, risks, insights
export async function GET() {
  const recs = await db.naiosRecommendation.findMany({
    where: { status: 'PENDING' },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(
    recs.map((r) => ({
      id: r.id,
      type: r.type,
      severity: r.severity,
      title: r.title,
      description: r.description,
      module: r.module,
      action: r.action,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  )
}

// Dismiss a recommendation
export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, status } = body
  await db.naiosRecommendation.update({ where: { id }, data: { status } })
  return NextResponse.json({ ok: true })
}
