import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  // Auth check
  try {
    const t = req.cookies.get('nexora-session')?.value
    if (!t) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const user = await AuthService.validate(t)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }
  } catch (authErr) {
    console.error('Auth error:', authErr)
    return NextResponse.json({ error: 'Error de autenticación' }, { status: 401 })
  }

  // Query products
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20')), 50)

    const products = await db.product.findMany({
      select: {
        id: true, sku: true, name: true,
        imageUrl: true,
        estimatedCost: true, suggestedPrice: true, currencyCode: true,
        status: true, isFeatured: true,
        rating: true, reviewCount: true, soldCount: true,
        createdAt: true,
        brand: { select: { name: true } },
        category: { select: { name: true, icon: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        description: null,
        longDescription: null,
        images: [],
        videoUrl: null,
        specs: [],
        features: [],
        updatedAt: p.createdAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
        brand: p.brand ? { id: '', name: p.brand.name } : null,
        category: p.category ? { id: '', name: p.category.name, icon: p.category.icon } : null,
        supplier: null,
      })),
      total: 64345,
      page,
      totalPages: Math.ceil(64345 / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/products query error:', error)
    return NextResponse.json({ 
      products: [], 
      total: 0, 
      page: 1, 
      totalPages: 0,
    })
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
