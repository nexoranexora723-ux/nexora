import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = _req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { id } = await params
    const original = await db.product.findUnique({ where: { id } })
    if (!original) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    let newSku = original.sku + '-COPY'
    let counter = 1
    while (await db.product.findUnique({ where: { sku: newSku } })) {
      newSku = `${original.sku}-COPY${counter++}`
    }

    const copy = await db.product.create({
      data: {
        ...original,
        id: undefined,
        sku: newSku,
        name: original.name + ' (Copia)',
        status: 'INACTIVE',
        isFeatured: false,
        rating: 4.0,
        reviewCount: 0,
        soldCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    return NextResponse.json({ id: copy.id, success: true }, { status: 201 })
  } catch (error) {
    console.error('Duplicate error:', error)
    return NextResponse.json({ error: 'Error al duplicar' }, { status: 500 })
  }
}
