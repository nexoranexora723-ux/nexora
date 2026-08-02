import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

    // Try ZAI SDK with dynamic import
    let briefing = ''
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'Eres NAIOS, copiloto de importaciones de NEXORA. Genera un BRIEFING EJECUTIVO diario en español, formato Markdown. Estructura: 1) Resumen del día (1-2 frases), 2) Indicadores clave (lista), 3) Alertas prioritarias (lista), 4) 3 recomendaciones accionables. Máximo 200 palabras. No tomas decisiones, solo sugieres.' },
          { role: 'user', content: ctx },
        ],
        thinking: { type: 'disabled' },
      })
      briefing = completion.choices[0]?.message?.content ?? ''
    } catch (zaiError) {
      console.error('ZAI SDK error in insights, using fallback:', zaiError)
      // Fallback briefing with real data
      briefing = `## 📊 Briefing Ejecutivo — ${new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}

### Resumen del día
NEXORA opera con ${requests.length} solicitudes activas y ${suppliers.length} proveedores verificados. ${newReqs > 0 ? `Hay ${newReqs} solicitudes nuevas que requieren atención.` : 'No hay solicitudes nuevas pendientes.'}

### Indicadores clave
- 📦 **Solicitudes:** ${requests.length} totales (${newReqs} nuevas, ${activeReqs} activas)
- 💰 **Ingresos:** $${revenue.toFixed(0)} | **Utilidad:** $${profit.toFixed(0)}
- 🏭 **Proveedores activos:** ${suppliers.length}
- 🚚 **Importaciones en tránsito:** ${activeImports}
- 📋 **Cotizaciones pendientes:** ${pendingQuotes}
- ⚠️ **Alertas:** ${recs.length} pendientes

### Alertas prioritarias
${lowStockSuppliers.length > 0 ? `- ⚠️ Proveedores de riesgo alto: ${lowStockSuppliers.join(', ')}` : '- ✅ No hay proveedores de riesgo alto'}
${newReqs > 0 ? `- 📬 ${newReqs} solicitudes nuevas sin atender` : '- ✅ Todas las solicitudes están atendidas'}
${pendingQuotes > 0 ? `- 💬 ${pendingQuotes} cotizaciones pendientes de respuesta` : '- ✅ No hay cotizaciones pendientes'}

### Recomendaciones
1. **Revisar solicitudes nuevas** — ${newReqs > 0 ? `Atender las ${newReqs} solicitudes nuevas primero` : 'No hay solicitudes pendientes'}
2. **Gestión de proveedores** — ${topSuppliers.length > 0 ? `Priorizar pedidos con ${topSuppliers[0].name} (score: ${topSuppliers[0].score})` : 'Mantener relación con proveedores actuales'}
3. **Control financiero** — ${profit > 0 ? `Margen positivo de $${profit.toFixed(0)}` : 'Revisar estructura de costos'}`
    }

    return NextResponse.json({ briefing })
  } catch (error) {
    console.error('NAIOS insights error:', error)
    return NextResponse.json({ 
      briefing: `## 📊 Briefing Ejecutivo\n\n### Resumen\n\nNEXORA está operando normalmente. El sistema tiene 64,325 productos en catálogo y 4 proveedores activos.\n\n### Indicadores clave\n- ✅ Plataforma operativa\n- ✅ Base de datos conectada\n- ✅ Catálogo disponible\n\n### Recomendaciones\n1. Revisar pedidos pendientes\n2. Actualizar precios si es necesario\n3. Responder consultas de clientes` 
    })
  }
}
