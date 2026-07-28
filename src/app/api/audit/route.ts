import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return NextResponse.json(
      logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        result: l.result,
        ipAddress: l.ipAddress,
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
      })),
    )
  } catch (error) {
    console.error('GET /api/audit error:', error)
    return NextResponse.json([])
  }
}
