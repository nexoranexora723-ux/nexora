import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth
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
