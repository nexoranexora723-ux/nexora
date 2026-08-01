import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { RequestService } from '@/server/services/request.service'

/**
 * GET /api/orders/[id]
 * Devuelve el detalle de un pedido (ImportRequest) del usuario autenticado.
 * Los clientes solo pueden ver sus propios pedidos; los admins pueden ver cualquiera.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { id } = await params
    const r = await RequestService.getById(id)
    if (!r) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    // Clientes solo pueden ver sus propios pedidos
    if (
      (user.role === 'CLIENT' || user.role === 'RESELLER') &&
      (r as { clientId?: string }).clientId !== user.id
    ) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    return NextResponse.json(r)
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
