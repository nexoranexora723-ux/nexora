import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '24')), 60)
    const categoryId = searchParams.get('categoryId')
    const brandId = searchParams.get('brandId')
    const featured = searchParams.get('featured')

    const where: Record<string, unknown> = { status: 'ACTIVE' }
    if (categoryId) where.categoryId = categoryId
    if (brandId) where.brandId = brandId
    if (featured === 'true') where.isFeatured = true

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        select: {
          id: true, sku: true, name: true, description: true,
          imageUrl: true, images: true,
          estimatedCost: true, suggestedPrice: true, currencyCode: true,
          status: true, isFeatured: true,
          rating: true, reviewCount: true, soldCount: true,
          specs: true, features: true, videoUrl: true,
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, icon: true } },
          supplier: { select: { id: true, companyName: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    const parseJSON = (str: string | null, fallback: unknown) => {
      try { return str ? JSON.parse(str) : fallback } catch { return fallback }
    }

    return NextResponse.json({
      products: products.map(p => ({
        ...p,
        images: parseJSON(p.images, p.imageUrl ? [p.imageUrl] : []),
        longDescription: null,
        videoUrl: null,
        specs: parseJSON(p.specs, []),
        features: parseJSON(p.features, []),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ 
      products: [], 
      total: 0, 
      page: 1, 
      totalPages: 0,
    })
  }
}
