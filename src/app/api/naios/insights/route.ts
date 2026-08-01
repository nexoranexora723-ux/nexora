import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (auth instanceof NextResponse) return auth
    const [requests, suppliers, quotes, imports, transactions, recs] = await Promise.all([
      db.importRequest.findMany({ include: { client: true } }),
      db.supplier.findMany({ include: { ratings: { take: 1, orderBy: { createdAt: 'desc' } } } }),
      db.quote.findMany(),
      db.import.findMany(),
      db.transaction.findMany(),
      db.naiosRecommendation.findMany({ where: { status: 'PENDING' } }),
    ])

    const newReqs = requests.filter((r) => r.status === 'NUEVA').length
    const activeReqs = requests.filter((r) => !['ENTREGADO', 'CERRADO'].includes(r.status)).length
    const pendingQuotes = quotes.filter((q) => ['RECIBIDA', 'ENVIADA_AL_CLIENTE'].includes(q.status)).length
    const activeImports = imports.filter((i) => !['ENTREGADO', 'CANCELADO'].includes(i.status)).length
    const revenue = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
    const profit = revenue - expenses
    const topSuppliers = suppliers.map((s) => ({ name: s.companyName, score: s.ratings[0]?.overallScore ?? 0, risk: s.riskLevel })).sort((a, b) => b.score - a.score).slice(0, 3)
    const lowStockSuppliers = suppliers.filter((s) => s.riskLevel === 'HIGH').map((s) => s.companyName)

    const ctx = `DATOS DE NEXORA:
- Solicitudes: ${requests.length} total (${newReqs} nuevas, ${activeReqs} activas)
- Cotizaciones pendientes: ${pendingQuotes}
- Importaciones activas: ${activeImports}
- Ingresos: $${revenue.toFixed(0)} | Gastos: $${expenses.toFixed(0)} | Utilidad: $${profit.toFixed(0)}
- Proveedores: ${suppliers.length} activos
- Top proveedores: ${topSuppliers.map((s) => `${s.name} (${s.score})`).join(', ')}
- Proveedores de riesgo: ${lowStockSuppliers.join(', ') || 'ninguno'}
- Alertas pendientes: ${recs.length}`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'Eres NAIOS, copiloto de importaciones de NEXORA. Genera un BRIEFING EJECUTIVO diario en español, formato Markdown. Estructura: 1) Resumen del día (1-2 frases), 2) Indicadores clave (lista), 3) Alertas prioritarias (lista), 4) 3 recomendaciones accionables. Máximo 200 palabras. No tomas decisiones, solo sugieres.' },
        { role: 'user', content: ctx },
      ],
      thinking: { type: 'disabled' },
    })

    return NextResponse.json({ briefing: completion.choices[0]?.message?.content ?? '' })
  } catch (error) {
    console.error('NAIOS insights error:', error)
    return NextResponse.json({ briefing: '## Briefing no disponible\n\nEl servicio de IA no está disponible en este momento.' })
  }
}
