import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = _req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { id } = await params
    const p = await db.product.findUnique({
      where: { id },
      include: { brand: true, category: true, supplier: { select: { id: true, companyName: true } } },
    })
    if (!p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const parseJSON = (str: string | null, fallback: unknown) => { try { return str ? JSON.parse(str) : fallback } catch { return fallback } }
    return NextResponse.json({
      ...p,
      images: parseJSON(p.images, p.imageUrl ? [p.imageUrl] : []),
      specs: parseJSON(p.specs, []),
      features: parseJSON(p.features, []),
    })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json()
    const { sku, name, description, longDescription, brandId, categoryId, supplierId, imageUrl, images, videoUrl, estimatedCost, suggestedPrice, currencyCode, status, isFeatured, specs, features } = body

    if (sku) {
      const dup = await db.product.findUnique({ where: { sku } })
      if (dup && dup.id !== id) return NextResponse.json({ error: `Ya existe un producto con SKU "${sku}"` }, { status: 400 })
    }

    const updated = await db.product.update({
      where: { id },
      data: {
        ...(sku !== undefined && { sku }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(longDescription !== undefined && { longDescription: longDescription || null }),
        ...(brandId !== undefined && { brandId: brandId || null }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(supplierId !== undefined && { supplierId: supplierId || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(images !== undefined && { images: images ? JSON.stringify(images) : null }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(estimatedCost !== undefined && { estimatedCost: estimatedCost ? Number(estimatedCost) : null }),
        ...(suggestedPrice !== undefined && { suggestedPrice: suggestedPrice ? Number(suggestedPrice) : null }),
        ...(currencyCode !== undefined && { currencyCode }),
        ...(status !== undefined && { status }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(specs !== undefined && { specs: specs ? JSON.stringify(specs) : null }),
        ...(features !== undefined && { features: features ? JSON.stringify(features) : null }),
      },
    })
    return NextResponse.json({ id: updated.id, success: true })
  } catch (error) {
    console.error('PUT /api/admin/products/[id] error:', error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = _req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { id } = await params
    await db.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
    const { id } = await params
    const { status, isFeatured } = await req.json()
    const data: Record<string, unknown> = {}
    if (status !== undefined) data.status = status
    if (isFeatured !== undefined) data.isFeatured = isFeatured
    await db.product.update({ where: { id }, data })
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
