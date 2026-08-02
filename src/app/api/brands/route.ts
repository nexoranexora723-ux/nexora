import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const brands = await db.brand.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { products: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { name: 'asc' },
    })
    
    // Only return brands that have at least 1 active product
    const brandsWithProducts = brands
      .filter(b => b._count.products > 0)
      .map(b => ({ id: b.id, name: b.name, productCount: b._count.products }))
    
    return NextResponse.json({ brands: brandsWithProducts })
  } catch (error) {
    console.error('GET /api/brands error:', error)
    return NextResponse.json({ brands: [] })
  }
}
