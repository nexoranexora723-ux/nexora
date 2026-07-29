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
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'requests'

    let data: Record<string, unknown>[] = []
    if (type === 'requests') {
      const reqs = await db.importRequest.findMany({ include: { client: true } })
      data = reqs.map((r) => ({
        number: r.number, product: r.productName, quantity: r.quantity, budget: r.budget,
        status: r.status, client: `${r.client.firstName} ${r.client.lastName}`, email: r.client.email,
        date: r.createdAt.toISOString().slice(0, 10),
      }))
    } else if (type === 'finance') {
      const txns = await db.transaction.findMany()
      data = txns.map((t) => ({
        type: t.type, category: t.category, description: t.description, amount: t.amount,
        reference: t.reference, date: t.date.toISOString().slice(0, 10),
      }))
    }

    const headers = data.length > 0 ? Object.keys(data[0]) : []
    const csv = [headers.join(','), ...data.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="nexora-${type}.csv"` } })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
