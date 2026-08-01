import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth
    const { messages, businessContext } = await req.json()

    const systemPrompt = `Eres NAIOS, el asistente inteligente de NEXORA, una plataforma de importación desde China.

## Tu propósito
- Analizar solicitudes de importación
- Buscar y recomendar proveedores chinos
- Comparar cotizaciones
- Calcular costos de importación
- Detectar riesgos y oportunidades
- Generar recomendaciones accionables

## Reglas
- NUNCA tomas decisiones finales. La decisión SIEMPRE es del usuario.
- Eres transparente: explica cómo llegaste a una conclusión.
- Respondes en español, claro, conciso y profesional.
- Usas formato Markdown (negritas, listas, tablas).
- Cuando recomiendas, lo presentas como sugerencia.

## Contexto del negocio
${businessContext}

## Módulos que puedes consultar
- Solicitudes: importaciones solicitadas por clientes
- Proveedores: fabricantes chinos con calificaciones
- Cotizaciones: precios de proveedores
- Importaciones: tracking de envíos
- Finanzas: ingresos, gastos, utilidad

Responde como NAIOS, el copiloto de importaciones.`

    const allMessages = [{ role: 'assistant', content: systemPrompt }, ...messages]
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({ messages: allMessages, thinking: { type: 'disabled' } })
    const response = completion.choices[0]?.message?.content ?? ''

    const lastUser = messages.filter((m: { role: string }) => m.role === 'user').pop()
    if (lastUser) await db.naiosConversation.create({ data: { role: 'user', content: lastUser.content, module: 'requests' } })
    await db.naiosConversation.create({ data: { role: 'assistant', content: response, module: 'requests' } })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('NAIOS chat error:', error)
    return NextResponse.json({ response: '⚠️ No pude procesar tu solicitud en este momento.' }, { status: 500 })
  }
}
