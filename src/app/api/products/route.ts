import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Products endpoint
export async function GET() {
  const products = await db.product.findMany({
    where: { deletedAt: null },
    include: {
      brand: true,
      category: true,
      supplier: { select: { id: true, companyName: true } },
      inventory: { include: { warehouse: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const enriched = products.map((p) => {
    const stock = p.inventory.reduce((s, i) => s + i.stock, 0)
    const reserved = p.inventory.reduce((s, i) => s + i.reserved, 0)
    const minStock = p.inventory.length > 0 ? Math.min(...p.inventory.map((i) => i.minStock)) : 0
    const margin = p.salePrice - p.purchasePrice
    const marginPct = p.salePrice > 0 ? (margin / p.salePrice) * 100 : 0
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
      category: p.category ? { id: p.category.id, name: p.category.name } : null,
      supplier: p.supplier ? { id: p.supplier.id, companyName: p.supplier.companyName } : null,
      weight: p.weight,
      material: p.material,
      warranty: p.warranty,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      currencyCode: p.currencyCode,
      status: p.status,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt.toISOString(),
      margin,
      marginPct,
      stock,
      available: stock - reserved,
      minStock,
    }
  })

  return NextResponse.json(enriched)
}
