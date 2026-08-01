import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: {
            products: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const withCounts = categories
      .filter((c) => c._count.products > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: c.description,
        productCount: c._count.products,
      }))

    return NextResponse.json(withCounts)
  } catch (error) {
    console.error('GET /api/categories error:', error)
    return NextResponse.json([])
  }
}
