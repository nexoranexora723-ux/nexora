import { NextResponse } from 'next/server'
import { CustomerService } from '@/server/services/customer.service'
import { createCustomerSchema, customerQuerySchema } from '@/lib/schemas/customer.schema'
import { db } from '@/lib/db'

// NEXORA — Customers API (CRM)
// GET: list with filters (q, status, sort)  |  POST: create with Zod validation
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = customerQuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    })
    const customers = await CustomerService.list(query)
    return NextResponse.json(customers)
  } catch (error) {
    console.error('GET /api/customers error:', error)
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createCustomerSchema.safeParse(body)
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

    const customer = await CustomerService.create(parsed.data, company.id)
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('POST /api/customers error:', error)
    const message = error instanceof Error ? error.message : 'Error al crear cliente'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
