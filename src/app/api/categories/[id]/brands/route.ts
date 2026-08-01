import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // Find brands that have at least one ACTIVE product in this category
    const products = await db.product.findMany({
      where: {
        status: 'ACTIVE',
        categoryId: id,
      },
      select: { brandId: true },
    })

    const brandIds = [...new Set(products.map((p) => p.brandId).filter(Boolean))] as string[]
    if (brandIds.length === 0) return NextResponse.json([])

    const brands = await db.brand.findMany({
      where: { id: { in: brandIds } },
      orderBy: { name: 'asc' },
    })

    const countPromises = brands.map((b) =>
      db.product.count({
        where: { status: 'ACTIVE', categoryId: id, brandId: b.id },
      }),
    )
    const counts = await Promise.all(countPromises)

    const result = brands.map((b, i) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      productCount: counts[i],
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/categories/[id]/brands error:', error)
    return NextResponse.json([])
  }
}
