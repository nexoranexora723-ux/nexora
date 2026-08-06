import { NextRequest, NextResponse } from 'next/server'
import { subscribeToNewsletter } from '@/lib/marketing'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Email inválido' },
        { status: 400 }
      )
    }

    const result = await subscribeToNewsletter(email, name)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { success: false, message: `Error: ${(e as Error).message}` },
      { status: 500 }
    )
  }
}
