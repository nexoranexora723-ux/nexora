import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// NEXORA — Customers endpoint (CRM)
export async function GET() {
  const customers = await db.customer.findMany({
    where: { deletedAt: null },
    orderBy: { lifetimeValue: 'desc' },
  })

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      country: c.country,
      city: c.city,
      address: c.address,
      tags: c.tags,
      status: c.status,
      lifetimeValue: c.lifetimeValue,
      totalOrders: c.totalOrders,
      createdAt: c.createdAt.toISOString(),
    })),
  )
}
