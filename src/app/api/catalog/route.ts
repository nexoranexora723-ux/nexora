import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Catalog lookup endpoint
// Returns brands, categories, suppliers for product form selects
export async function GET() {
  const [brands, categories, suppliers] = await Promise.all([
    db.brand.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    db.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        children: { select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } },
      },
    }),
    db.supplier.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      orderBy: { companyName: 'asc' },
      select: { id: true, companyName: true },
    }),
  ])

  return NextResponse.json({ brands, categories, suppliers })
}
