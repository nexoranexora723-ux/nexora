import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export async function GET(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20')), 100)
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        select: {
          id: true, sku: true, name: true, description: true,
          imageUrl: true, images: true, videoUrl: true,
          estimatedCost: true, suggestedPrice: true, currencyCode: true,
          status: true, isFeatured: true, specs: true, features: true,
          rating: true, reviewCount: true, soldCount: true,
          createdAt: true, updatedAt: true,
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, icon: true } },
          supplier: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      search || (status && status !== 'all') ? db.product.count({ where }) : Promise.resolve(64345),
    ])

    const parseJSON = (str: string | null, fallback: unknown) => {
      try { return str ? JSON.parse(str) : fallback } catch { return fallback }
    }

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id, sku: p.sku, name: p.name,
        description: p.description,
        longDescription: null,
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
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/products error:', error)
    return NextResponse.json({ 
      products: [], 
      total: 0, 
      page: 1, 
      totalPages: 0,
      error: 'Error interno del servidor' 
    }, { status: 500 })
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
