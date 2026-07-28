import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Suppliers endpoint (with ratings + product count per DOC-006)
export async function GET() {
  const suppliers = await db.supplier.findMany({
    where: { deletedAt: null },
    include: {
      ratings: { orderBy: { createdAt: 'desc' }, take: 1 },
      products: { select: { id: true } },
      quotes: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const enriched = suppliers.map((s) => {
    const rating = s.ratings[0] ?? null
    const approvedQuotes = s.quotes.filter((q) => q.status === 'APPROVED').length
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
      paymentMethods: s.paymentMethods,
      shippingMethods: s.shippingMethods,
      warranty: s.warranty,
      leadTime: s.leadTime,
      productionTime: s.productionTime,
      oem: s.oem,
      odm: s.odm,
      status: s.status,
      riskLevel: s.riskLevel,
      rating: rating
        ? {
            communicationScore: rating.communicationScore,
            qualityScore: rating.qualityScore,
            priceScore: rating.priceScore,
            shippingScore: rating.shippingScore,
            warrantyScore: rating.warrantyScore,
            trustScore: rating.trustScore,
            overallScore: rating.overallScore,
            review: rating.review,
          }
        : null,
      productCount: s.products.length,
      approvedQuotes,
    }
  })

  return NextResponse.json(enriched)
}
