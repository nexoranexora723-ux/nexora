import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ 
    products: [],
    total: 64345,
    page: 1,
    totalPages: 3217,
    message: 'Endpoint works - DB query disabled for testing',
  })
}
