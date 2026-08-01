import { NextRequest, NextResponse } from 'next/server'

// Note: Permission model is not defined in the Prisma schema.
// This endpoint returns an empty object.
export async function GET(_req: NextRequest) {
  return NextResponse.json({})
}
