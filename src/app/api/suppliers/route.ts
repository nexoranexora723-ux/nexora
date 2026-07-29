import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const suppliers = await db.supplier.findMany({
      where: { status: { not: 'BLACKLISTED' } },
      include: {
        ratings: { orderBy: { createdAt: 'desc' }, take: 1 },
        quotes: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enriched = suppliers.map((s) => {
      const rating = s.ratings[0] ?? null
      return {
        id: s.id,
        companyName: s.companyName,
        contactName: s.contactName,
        whatsapp: s.whatsapp,
        wechat: s.wechat,
        email: s.email,
        website: s.website,
        country: s.country,
        city: s.city,
        moq: s.moq,
        leadTime: s.leadTime,
        productionTime: s.productionTime,
        oem: s.oem,
        odm: s.odm,
        status: s.status,
        riskLevel: s.riskLevel,
        rating: rating
          ? {
              overallScore: rating.overallScore,
              communicationScore: rating.communicationScore,
              qualityScore: rating.qualityScore,
              priceScore: rating.priceScore,
              shippingScore: rating.shippingScore,
              warrantyScore: rating.warrantyScore,
              trustScore: rating.trustScore,
              review: rating.review,
            }
          : null,
        quoteCount: s.quotes.length,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('GET /api/suppliers error:', error)
    return NextResponse.json([])
  }
}
