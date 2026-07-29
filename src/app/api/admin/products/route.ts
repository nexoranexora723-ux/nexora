import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'
import { log } from '@/lib/platform-utils'

export async function GET(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const products = await db.product.findMany({
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, icon: true } },
        supplier: { select: { id: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const parseJSON = (str: string | null, fallback: unknown) => {
      try { return str ? JSON.parse(str) : fallback } catch { return fallback }
    }

    return NextResponse.json(products.map((p) => ({
      id: p.id, sku: p.sku, name: p.name,
      description: p.description,
      longDescription: p.longDescription,
      brand: p.brand, category: p.category, supplier: p.supplier,
      imageUrl: p.imageUrl,
      images: parseJSON(p.images, p.imageUrl ? [p.imageUrl] : []),
      videoUrl: p.videoUrl,
      estimatedCost: p.estimatedCost,
      suggestedPrice: p.suggestedPrice,
      currencyCode: p.currencyCode,
      status: p.status,
      isFeatured: p.isFeatured,
      specs: parseJSON(p.specs, []),
      features: parseJSON(p.features, []),
      rating: p.rating ?? 4.0,
      reviewCount: p.reviewCount,
      soldCount: p.soldCount,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })))
  } catch (error) {
    log('error', 'GET /api/admin/products', { error })
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json()
    const {
      sku, name, description, longDescription,
      brandId, categoryId, supplierId,
      imageUrl, images, videoUrl,
      estimatedCost, suggestedPrice, currencyCode,
      status, isFeatured,
      specs, features,
    } = body

    if (!sku || !name) return NextResponse.json({ error: 'SKU y nombre son obligatorios' }, { status: 400 })

    const existing = await db.product.findUnique({ where: { sku } })
    if (existing) return NextResponse.json({ error: `Ya existe un producto con SKU "${sku}"` }, { status: 400 })

    const product = await db.product.create({
      data: {
        sku, name,
        description: description || null,
        longDescription: longDescription || null,
        brandId: brandId || null,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
        imageUrl: imageUrl || null,
        images: images ? JSON.stringify(images) : null,
        videoUrl: videoUrl || null,
        estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        suggestedPrice: suggestedPrice ? Number(suggestedPrice) : null,
        currencyCode: currencyCode || 'USD',
        status: status || 'ACTIVE',
        isFeatured: isFeatured || false,
        specs: specs ? JSON.stringify(specs) : null,
        features: features ? JSON.stringify(features) : null,
        rating: 4.0,
        reviewCount: 0,
        soldCount: 0,
      },
    })

    return NextResponse.json({ id: product.id, success: true }, { status: 201 })
  } catch (error) {
    log('error', 'POST /api/admin/products', { error })
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
