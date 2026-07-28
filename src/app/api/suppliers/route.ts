import { NextResponse } from 'next/server'
import { SupplierService } from '@/server/services/supplier.service'
import { createSupplierSchema, supplierQuerySchema } from '@/lib/schemas/supplier.schema'
import { db } from '@/lib/db'

// NEXORA — Suppliers API
// GET: list with filters (q, status, riskLevel)  |  POST: create with Zod validation
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = supplierQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      riskLevel: searchParams.get('riskLevel') ?? undefined,
    })
    const suppliers = await SupplierService.list(query)
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('GET /api/suppliers error:', error)
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createSupplierSchema.safeParse(body)
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

    const supplier = await SupplierService.create(parsed.data, company.id)
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('POST /api/suppliers error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear proveedor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
