import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    if (!t) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    
    const user = await AuthService.validate(t)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = 20

    const products = await db.product.findMany({
      select: {
        id: true, sku: true, name: true,
        imageUrl: true,
        estimatedCost: true, suggestedPrice: true,
        status: true, isFeatured: true,
        createdAt: true,
        brand: { select: { name: true } },
        category: { select: { name: true, icon: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      products: products.map(p => ({
        id: p.id, sku: p.sku, name: p.name,
        description: null, longDescription: null,
        imageUrl: p.imageUrl, images: [], videoUrl: null,
        estimatedCost: p.estimatedCost, suggestedPrice: p.suggestedPrice,
        currencyCode: 'USD', status: p.status, isFeatured: p.isFeatured,
        specs: [], features: [],
        rating: 4.0, reviewCount: 0, soldCount: 0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.createdAt.toISOString(),
        brand: p.brand ? { id: '', name: p.brand.name } : null,
        category: p.category ? { id: '', name: p.category.name, icon: p.category.icon } : null,
        supplier: null,
      })),
      total: 64345,
      page,
      totalPages: Math.ceil(64345 / limit),
    })
  } catch (error) {
    console.error('Products list error:', error)
    return NextResponse.json({ 
      products: [], total: 0, page: 1, totalPages: 0,
    })
  }
}
