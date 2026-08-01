import { NextRequest, NextResponse } from 'next/server'
import { RequestService } from '@/server/services/request.service'
import { AuthService } from '@/server/services/auth.service'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { status, notes } = await req.json()
    const r = await RequestService.updateStatus(id, status, notes, user.id)
    return NextResponse.json(r)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
