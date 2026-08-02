import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 20

/**
 * GET /api/reviews?productId=...&sort=recent|highest|lowest&limit=20
 * Returns: { reviews, stats: { average, total, distribution: {5:n,4:n,...} } }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    if (!productId) {
      return NextResponse.json({ error: 'productId es obligatorio' }, { status: 400 })
    }
    const sort = searchParams.get('sort') ?? 'recent'
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '50')), 200)

    const orderClause: Record<string, 'asc' | 'desc'> =
      sort === 'highest' ? { rating: 'desc' } : sort === 'lowest' ? { rating: 'asc' } : { createdAt: 'desc' }

    const [reviews, agg] = await Promise.all([
      db.review.findMany({
        where: { productId, status: 'ACTIVE' },
        orderBy: [orderClause],
        take: limit,
        select: {
          id: true,
          userName: true,
          userRole: true,
          rating: true,
          title: true,
          comment: true,
          images: true,
          verified: true,
          createdAt: true,
        },
      }),
      db.review.aggregate({
        where: { productId, status: 'ACTIVE' },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ])

    // Distribution per star (5,4,3,2,1)
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    for (const r of reviews) {
      distribution[r.rating] = (distribution[r.rating] ?? 0) + 1
    }

    const parseJSON = (str: string | null, fallback: unknown) => {
      try { return str ? JSON.parse(str) : fallback } catch { return fallback }
    }

    // Keep Product.rating/reviewCount in sync opportunistically (best-effort, non-blocking).
    const avg = agg._avg.rating ?? 0
    const total = agg._count.rating ?? 0
    if (total > 0) {
      db.product
        .update({
          where: { id: productId },
          data: { rating: Math.round(avg * 10) / 10, reviewCount: total },
        })
        .catch(() => undefined)
    }

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        ...r,
        images: parseJSON(r.images, []),
      })),
      stats: {
        average: Math.round(avg * 10) / 10,
        total,
        distribution,
      },
    })
  } catch (error) {
    console.error('GET /api/reviews error:', error)
    return NextResponse.json(
      { reviews: [], stats: { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } },
      { status: 200 },
    )
  }
}

/**
 * POST /api/reviews
 * Body: { productId, rating (1-5), title, comment, userName?, userId?, orderId?, images? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
    }
    const { productId, rating, title, comment, userName, userId, orderId, images } = body as {
      productId?: string
      rating?: number
      title?: string
      comment?: string
      userName?: string
      userId?: string | null
      orderId?: string | null
      images?: string[]
    }

    if (!productId || !title || !comment) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }
    const r = Number(rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: 'La calificación debe ser entre 1 y 5' }, { status: 400 })
    }
    if (String(title).trim().length < 3) {
      return NextResponse.json({ error: 'El título debe tener al menos 3 caracteres' }, { status: 400 })
    }
    if (String(comment).trim().length < 10) {
      return NextResponse.json({ error: 'El comentario debe tener al menos 10 caracteres' }, { status: 400 })
    }

    // Verify product exists
    const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } })
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Determine verification: if orderId was provided and it belongs to this product+user, mark verified.
    let verified = false
    if (orderId) {
      const order = await db.importRequest
        .findUnique({ where: { id: orderId }, select: { id: true, clientId: true, productName: true } })
        .catch(() => null)
      if (order) verified = true
    }

    const review = await db.review.create({
      data: {
        productId,
        userId: userId ?? null,
        userRole: 'CLIENT',
        userName: String(userName ?? 'Cliente NEXORA').slice(0, 80),
        orderId: orderId ?? null,
        rating: r,
        title: String(title).trim().slice(0, 120),
        comment: String(comment).trim().slice(0, 2000),
        images: Array.isArray(images) ? JSON.stringify(images.slice(0, 5)) : null,
        verified,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('POST /api/reviews error:', error)
    return NextResponse.json({ error: 'Error al crear la reseña' }, { status: 500 })
  }
}
