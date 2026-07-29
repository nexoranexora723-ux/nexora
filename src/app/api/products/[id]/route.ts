import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const p = await db.product.findUnique({
      where: { id, status: 'ACTIVE' },
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, icon: true } },
      },
    })
    if (!p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    // Parse JSON fields safely
    const parseJSON = (str: string | null, fallback: unknown) => {
      try { return str ? JSON.parse(str) : fallback } catch { return fallback }
    }

    return NextResponse.json({
      id: p.id, sku: p.sku, name: p.name,
      description: p.description,
      longDescription: p.longDescription,
      brand: p.brand, category: p.category,
      imageUrl: p.imageUrl,
      images: parseJSON(p.images, p.imageUrl ? [p.imageUrl] : []),
      videoUrl: p.videoUrl,
      estimatedCost: p.estimatedCost,
      suggestedPrice: p.suggestedPrice,
      currencyCode: p.currencyCode,
      isFeatured: p.isFeatured,
      status: p.status,
      specs: parseJSON(p.specs, []),
      features: parseJSON(p.features, []),
      rating: p.rating ?? 4.0,
      reviewCount: p.reviewCount,
      soldCount: p.soldCount,
    })
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
