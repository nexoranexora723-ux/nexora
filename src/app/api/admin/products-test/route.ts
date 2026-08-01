import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    if (!t) return NextResponse.json({ error: 'No token' }, { status: 401 })
    
    const user = await AuthService.validate(t)
    if (!user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    
    // Just count products
    const count = await db.product.count()
    
    return NextResponse.json({ 
      user: user.email,
      role: user.role,
      productCount: count 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : null,
    }, { status: 500 })
  }
}
