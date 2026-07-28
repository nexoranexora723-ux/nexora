import { NextResponse } from 'next/server'
import { ProductService } from '@/server/services/product.service'
import { createProductSchema, productQuerySchema } from '@/lib/schemas/product.schema'
import { db } from '@/lib/db'

// NEXORA — Products API
// GET: list with filters/sort  | POST: create (per spec: Zod + RHF + TS strict)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = productQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      brandId: searchParams.get('brandId') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      supplierId: searchParams.get('supplierId') ?? undefined,
      sort: searchParams.get('sort') ?? 'created_desc',
      view: searchParams.get('view') ?? 'table',
    })
    const products = await ProductService.list(query)
    return NextResponse.json(products)
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const company = await db.company.findFirst()
    if (!company) {
      return NextResponse.json({ error: 'No existe empresa configurada' }, { status: 500 })
    }

    const product = await ProductService.create(parsed.data, company.id)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear producto'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
