import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// NEXORA — NAIOS Daily Briefing
// Generates a strategic business summary using live data (per DOC-006: NAIOS analyzes & summarizes)
export async function GET() {
  try {
    const [orders, products, suppliers, inventory, transactions, customers, recs] = await Promise.all([
      db.order.findMany({ include: { items: true, customer: true } }),
      db.product.findMany({ include: { supplier: true } }),
      db.supplier.findMany({ include: { ratings: { take: 1, orderBy: { createdAt: 'desc' } } } }),
      db.inventory.findMany({ include: { product: true } }),
      db.transaction.findMany(),
      db.customer.findMany(),
      db.naiosRecommendation.findMany({ where: { status: 'PENDING' } }),
    ])

    const revenue = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
    const lowStock = inventory.filter((i) => i.stock <= i.minStock).map((i) => `${i.product.name} (${i.stock}/${i.minStock})`)
    const topSuppliers = suppliers
      .map((s) => ({ name: s.companyName, overall: s.ratings[0]?.overallScore ?? 0, risk: s.riskLevel }))
      .sort((a, b) => b.overall - a.overall)
    const topProducts = products
      .map((p) => ({ name: p.name, margin: ((p.salePrice - p.purchasePrice) / p.salePrice) * 100 }))
      .sort((a, b) => b.margin - a.margin)
    const vipCustomers = customers.filter((c) => c.status === 'VIP')

    const dataContext = `DATOS DEL NEGOCIO (NEXORA):
- Ingresos totales: $${revenue.toFixed(2)} USD
- Gastos totales: $${expenses.toFixed(2)} USD
- Utilidad: $${(revenue - expenses).toFixed(2)} USD
- Total pedidos: ${orders.length}
- Productos en catálogo: ${products.length}
- Clientes: ${customers.length} (VIP: ${vipCustomers.length})
- Proveedores activos: ${suppliers.length}
- Productos con stock bajo/agotado: ${lowStock.join(', ') || 'ninguno'}
- Top proveedores por score: ${topSuppliers.map((s) => `${s.name} (${s.overall})`).join(', ')}
- Productos con mayor margen: ${topProducts.slice(0, 3).map((p) => `${p.name} (${p.margin.toFixed(0)}%)`).join(', ')}
- Alertas NAIOS pendientes: ${recs.length}`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'Eres NAIOS, el asistente inteligente de NEXORA. Genera un BRIEFING EJECUTIVO diario en español, en formato Markdown, basándote en los datos del negocio. Estructura: 1) Resumen del día (1-2 frases), 2) Indicadores clave (lista), 3) Alertas prioritarias (lista), 4) 3 recomendaciones accionables (lista). Sé conciso, directo y profesional. Máximo 250 palabras. No tomes decisiones, solo sugiere.',
        },
        { role: 'user', content: dataContext },
      ],
      thinking: { type: 'disabled' },
    })

    const briefing = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ briefing })
  } catch (error) {
    console.error('NAIOS insights error:', error)
    return NextResponse.json(
      { briefing: '## Briefing no disponible\n\nNo se pudo generar el briefing automático en este momento. El resto de NEXORA funciona con normalidad.' },
      { status: 200 },
    )
  }
}
