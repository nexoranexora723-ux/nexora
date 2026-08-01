import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const productCount = await db.product.count()
    return NextResponse.json({
      status: 'ok',
      productCount,
      databaseUrl: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
