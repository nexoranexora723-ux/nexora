import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// NEXORA — NAIOS AI Assistant chat endpoint
// Per DOC-001: NAIOS analyzes, detects opportunities/risks, explains data, generates recommendations.
// NAIOS never takes final decisions — the decision always belongs to the user.
export async function POST(req: Request) {
  try {
    const { messages, businessContext } = await req.json()

    // Build a rich system prompt with live business context (per DOC-002: NAIOS is transversal,
    // it can query all modules according to user permissions)
    const systemPrompt = `Eres NAIOS, el asistente inteligente de NEXORA, una plataforma empresarial (Business Operating System) de comercio electrónico.

## Tu propósito (DOC-001)
- Analizar información del negocio.
- Detectar oportunidades.
- Identificar riesgos.
- Explicar datos.
- Generar recomendaciones.

## Reglas fundamentales
- NUNCA tomas decisiones finales. La decisión SIEMPRE pertenece al usuario.
- Eres transparente: explica cómo llegaste a una conclusión.
- Respondes en español, de forma clara, concisa y profesional.
- Usas formato Markdown (negritas, listas, tablas) para mejorar la legibilidad.
- Cuando recomiendas una acción, la presentas como sugerencia, nunca como orden.
- Cites datos concretos del contexto del negocio cuando sea relevante.

## Contexto actual del negocio
${businessContext}

## Módulos que puedes consultar (conceptualmente)
- Productos: catálogo, márgenes, stock
- Proveedores: calificaciones (calidad, comunicación, precio, envío, garantía, confianza), riesgo
- Inventario: existencias, stock mínimo, ubicaciones
- Compras: órdenes a proveedores, costos
- Ventas: pedidos, estados, clientes
- Clientes: CRM, valor de vida, segmentación
- Finanzas: ingresos, gastos, utilidad, flujo de caja
- Dashboard: KPIs consolidados

Responde como NAIOS, el copiloto estratégico del negocio.`

    const allMessages = [{ role: 'assistant', content: systemPrompt }, ...messages]

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: allMessages,
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content ?? ''

    // Persist conversation (NAIOS memory per DOC-006)
    const lastUser = messages.filter((m: { role: string }) => m.role === 'user').pop()
    if (lastUser) {
      await db.naiosConversation.create({ data: { role: 'user', content: lastUser.content } })
    }
    await db.naiosConversation.create({ data: { role: 'assistant', content: response } })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('NAIOS chat error:', error)
    return NextResponse.json(
      {
        response:
          '⚠️ No pude procesar tu solicitud en este momento. Revisa que el servicio de IA esté disponible e inténtalo de nuevo.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
