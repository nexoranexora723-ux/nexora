import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    await db.notification.update({ where: { id }, data: { readAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
