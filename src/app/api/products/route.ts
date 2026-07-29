import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, icon: true } },
        supplier: { select: { id: true, companyName: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json([])
  }
}
