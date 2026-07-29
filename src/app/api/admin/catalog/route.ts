import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService } from '@/server/services/auth.service'

export async function GET(req: Request) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const [brands, categories, suppliers] = await Promise.all([
      db.brand.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      db.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, icon: true } }),
      db.supplier.findMany({ where: { status: 'ACTIVE' }, orderBy: { companyName: 'asc' }, select: { id: true, companyName: true } }),
    ])

    return NextResponse.json({ brands, categories, suppliers })
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}
