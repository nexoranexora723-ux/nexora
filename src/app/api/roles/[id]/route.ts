import { NextRequest, NextResponse } from 'next/server'

// Note: Role/Permission models are not defined in the Prisma schema.
// These endpoints return 404 not-implemented responses.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params
  return NextResponse.json({ error: 'Not implemented' }, { status: 404 })
}

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params
  return NextResponse.json({ error: 'Not implemented' }, { status: 404 })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params
  return NextResponse.json({ error: 'Not implemented' }, { status: 404 })
}
