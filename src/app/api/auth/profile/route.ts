import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { db } from '@/lib/db'

/**
 * GET /api/auth/profile
 * Devuelve el perfil del usuario autenticado (incluyendo createdAt).
 */
export async function GET(req: NextRequest) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const full = await db.user.findUnique({
      where: { id: user.id, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        position: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })
    if (!full) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    return NextResponse.json({
      ...full,
      createdAt: full.createdAt.toISOString(),
      lastLoginAt: full.lastLoginAt?.toISOString() ?? null,
    })
  } catch (error) {
    console.error('GET /api/auth/profile error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

/**
 * PATCH /api/auth/profile
 * Permite al usuario autenticado actualizar campos básicos de su perfil
 * (por ahora: phone). No permite cambiar email/rol/status desde aquí.
 */
export async function PATCH(req: NextRequest) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const data: { phone?: string | null; avatarUrl?: string | null } = {}

    if (typeof body.phone !== 'undefined') {
      const phone = String(body.phone || '').trim()
      data.phone = phone === '' ? null : phone
    }
    if (typeof body.avatarUrl !== 'undefined') {
      data.avatarUrl = body.avatarUrl ? String(body.avatarUrl) : null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        position: true,
        avatarUrl: true,
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PROFILE_UPDATE',
        entity: 'user',
        entityId: user.id,
        result: 'SUCCESS',
        metadata: JSON.stringify(data),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/auth/profile error:', error)
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 })
  }
}
