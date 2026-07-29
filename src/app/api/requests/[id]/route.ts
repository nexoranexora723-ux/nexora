import { NextResponse } from 'next/server'
import { RequestService } from '@/server/services/request.service'
import { AuthService } from '@/server/services/auth.service'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const r = await RequestService.getById(id)
    if (!r) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    // Clients can only see their own
    if ((user.role === 'CLIENT' || user.role === 'RESELLER') && r.clientId !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    return NextResponse.json(r)
  } catch (error) {
    console.error('GET /api/requests/[id] error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
