import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Inventory endpoint
export async function GET() {
  const inventory = await db.inventory.findMany({
    include: {
      product: {
        include: {
          brand: true,
          category: true,
          supplier: { select: { companyName: true } },
        },
      },
      warehouse: true,
    },
    orderBy: { stock: 'asc' },
  })

  const enriched = inventory.map((i) => {
    const available = i.stock - i.reserved
    const status = i.stock <= 0 ? 'OUT' : i.stock <= i.minStock ? 'LOW' : 'OK'
    return {
      id: i.id,
      product: {
        id: i.product.id,
        sku: i.product.sku,
        name: i.product.name,
        imageUrl: i.product.imageUrl,
        purchasePrice: i.product.purchasePrice,
        salePrice: i.product.salePrice,
        currencyCode: i.product.currencyCode,
        brand: i.product.brand ? { name: i.product.brand.name } : null,
        category: i.product.category ? { name: i.product.category.name } : null,
        supplier: i.product.supplier ? { companyName: i.product.supplier.companyName } : null,
      },
      warehouse: { id: i.warehouse.id, name: i.warehouse.name, code: i.warehouse.code },
      stock: i.stock,
      reserved: i.reserved,
      available,
      minStock: i.minStock,
      location: i.location,
      status,
    }
  })

  return NextResponse.json(enriched)
}
