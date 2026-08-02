import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * GET /api/admin/products-list
 *
 * Lista productos con filtros y paginación para el panel admin y el editor
 * de precios en línea.
 *
 * Query params:
 *   - search:    busca por name o SKU (case-insensitive)
 *   - categoryId: filtra por categoría
 *   - brandId:    filtra por marca
 *   - status:     ACTIVE | INACTIVE
 *   - sortBy:     createdAt | name | price | sku
 *   - sortOrder:  asc | desc
 *   - page:       entero >= 1
 *   - limit:      entero 1-100 (default 50)
 *
 * Respuesta: { products, total, page, totalPages }
 */
export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, 'admin-products-list', RATE_LIMITS.WRITE)
  if (limited) return limited

  try {
    const t = req.cookies.get('nexora-session')?.value
    if (!t) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const user = await AuthService.validate(t)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = (searchParams.get('search') ?? '').trim()
    const categoryId = searchParams.get('categoryId') ?? null
    const brandId = searchParams.get('brandId') ?? null
    const status = searchParams.get('status') ?? null
    const sortBy = searchParams.get('sortBy') ?? 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '50')), 100)

    // Build where clause
    const where: {
      OR?: Array<{ name?: { contains: string; mode?: 'insensitive' }; sku?: { contains: string; mode?: 'insensitive' } }>;
      categoryId?: string;
      brandId?: string;
      status?: string;
    } = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (brandId) where.brandId = brandId
    if (status && status !== 'all') where.status = status

    // Build orderBy
    type OrderBy = { createdAt: 'asc' | 'desc' } | { name: 'asc' | 'desc' } | { suggestedPrice: 'asc' | 'desc' } | { estimatedCost: 'asc' | 'desc' } | { sku: 'asc' | 'desc' }
    let orderBy: OrderBy
    switch (sortBy) {
      case 'name':
        orderBy = { name: sortOrder }
        break
      case 'price':
        // sort by suggestedPrice (what the editor changes), fallback to estimatedCost
        orderBy = { suggestedPrice: sortOrder }
        break
      case 'cost':
        orderBy = { estimatedCost: sortOrder }
        break
      case 'sku':
        orderBy = { sku: sortOrder }
        break
      case 'createdAt':
      default:
        orderBy = { createdAt: sortOrder }
        break
    }

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          longDescription: true,
          imageUrl: true,
          images: true,
          videoUrl: true,
          estimatedCost: true,
          suggestedPrice: true,
          currencyCode: true,
          status: true,
          isFeatured: true,
          specs: true,
          features: true,
          rating: true,
          reviewCount: true,
          soldCount: true,
          createdAt: true,
          updatedAt: true,
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, icon: true } },
          supplier: { select: { id: true, companyName: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    // Parse JSON-encoded fields
    const parseJSON = (str: string | null, fallback: unknown) => {
      try {
        return str ? JSON.parse(str) : fallback
      } catch {
        return fallback
      }
    }

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        longDescription: p.longDescription,
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
        brand: p.brand,
        category: p.category,
        supplier: p.supplier,
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error('GET /api/admin/products-list error:', error)
    return NextResponse.json({
      products: [],
      total: 0,
      page: 1,
      totalPages: 0,
    })
  }
}
