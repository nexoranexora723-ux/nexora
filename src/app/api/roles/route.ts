import { NextRequest, NextResponse } from 'next/server'

// Note: Role/Permission models are not defined in the Prisma schema.
// These endpoints return empty arrays / not-implemented responses.
export async function GET(_req: NextRequest) {
  return NextResponse.json([])
}

export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 404 })
}
