import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Public storefront catalog
// Returns only public-facing product fields (no purchase price, no supplier info)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const brand = searchParams.get('brand')
  const q = searchParams.get('q')

  const where: Record<string, unknown> = {
    deletedAt: null,
    status: 'ACTIVE',
  }
  if (category && category !== 'all') where.categoryId = category
  if (brand && brand !== 'all') where.brandId = brand
  if (q) where.name = { contains: q }

  const products = await db.product.findMany({
    where,
    include: {
      brand: true,
      category: true,
      inventory: { include: { warehouse: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const catalog = products.map((p) => {
    const totalStock = p.inventory.reduce((s, i) => s + i.stock, 0)
    const reserved = p.inventory.reduce((s, i) => s + i.reserved, 0)
    const available = totalStock - reserved
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
      category: p.category ? { id: p.category.id, name: p.category.name } : null,
      salePrice: p.salePrice,
      currencyCode: p.currencyCode,
      imageUrl: p.imageUrl,
      weight: p.weight,
      material: p.material,
      warranty: p.warranty,
      stock: available,
      inStock: available > 0,
    }
  })

  // Also return categories and brands for filters
  const [categories, brands] = await Promise.all([
    db.category.findMany({ orderBy: { name: 'asc' } }),
    db.brand.findMany({ orderBy: { name: 'asc' } }),
  ])

  return NextResponse.json({
    products: catalog,
    categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    brands: brands.map((b) => ({ id: b.id, name: b.name })),
  })
}
