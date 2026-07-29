import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth

    const perms = await db.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] })
    const grouped: Record<string, { id: string; action: string }[]> = {}
    for (const p of perms) {
      if (!grouped[p.module]) grouped[p.module] = []
      grouped[p.module].push({ id: p.id, action: p.action })
    }
    return NextResponse.json(grouped)
  } catch { return NextResponse.json({}) }
}
