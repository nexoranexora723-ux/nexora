import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const recs = await db.naiosRecommendation.findMany({
      where: { status: 'PENDING' },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(
      recs.map((r) => ({
        id: r.id, type: r.type, severity: r.severity, title: r.title,
        description: r.description, module: r.module, action: r.action,
        status: r.status, createdAt: r.createdAt.toISOString(),
      })),
    )
  } catch {
    return NextResponse.json([])
  }
}
