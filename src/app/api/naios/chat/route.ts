import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

    // Try to use ZAI SDK with dynamic import (works in Vercel)
    let response = ''
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({ 
        messages: allMessages, 
        thinking: { type: 'disabled' } 
      })
      response = completion.choices[0]?.message?.content ?? ''
    } catch (zaiError) {
      console.error('ZAI SDK error, using fallback:', zaiError)
      // Fallback: respond with a helpful message based on the user's question
      const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop()
      const userText = lastUserMessage?.content?.toLowerCase() || ''
      
      if (userText.includes('precio') || userText.includes('costo') || userText.includes('cuanto')) {
        response = `## 💰 Análisis de precios

Basado en el catálogo de NEXORA:

- **Costo China**: Varía por producto y marca
- **Envío DHL/FedEx**: $8-15 USD (según ciudad)
- **Aduana (20%)**: Calculada sobre costo + envío
- **IVA (19%)**: Calculado sobre subtotal
- **Margen (50%)**: Tu ganancia

### Fórmula
\`\`\`
Precio final = (Costo China + Envío) × 1.20 × 1.19 × 1.50
\`\`\`

¿Sobre qué producto específico quieres que analice el precio?`
      } else if (userText.includes('proveedor') || userText.includes('fabricante')) {
        response = `## 🏭 Proveedores disponibles

NEXORA trabaja con proveedores verificados en China:

1. **Shenzhen TechLink Electronics** — Electrónica, score 92/100
2. **Guangzhou Premium Footwear** — Calzado, score 77/100  
3. **Yiwu Smart Trading** — Varios, score 62/100
4. **PayPalShop Yupoo** — Marca de lujo, réplicas premium

¿Qué tipo de producto buscas importar?`
      } else if (userText.includes('envio') || userText.includes('envío') || userText.includes('entrega') || userText.includes('tiempo')) {
        response = `## 🚚 Tiempos de entrega

El proceso completo de importación toma aproximadamente **22 días**:

1. **Cotización**: 24 horas
2. **Producción**: 15 días
3. **Envío internacional**: 7 días
4. **Entrega nacional**: 1-2 días

### Envío dentro de Colombia
- Bogotá: 5-7 días ($8 USD)
- Medellín: 5-7 días ($8 USD)
- Cali: 7-9 días ($10 USD)
- Otras ciudades: 8-10 días ($12 USD)
- **Envío gratis** en pedidos sobre $200 USD`
      } else if (userText.includes('hola') || userText.includes('buenas') || userText.includes('ayuda')) {
        response = `## ¡Hola! 👋 Soy NAIOS

Tu asistente inteligente de importaciones. Puedo ayudarte con:

- 📊 Análisis de precios y costos
- 🏭 Búsqueda de proveedores
- 🚚 Cálculo de tiempos de entrega
- 💡 Recomendaciones de productos
- ⚠️ Detección de riesgos

¿En qué puedo ayudarte hoy?`
      } else {
        response = `## 🤖 NAIOS

Entiendo tu consulta. Como asistente de NEXORA, puedo ayudarte con:

- **Precios**: "¿Cuánto cuesta importar un bolso Gucci?"
- **Proveedores**: "¿Qué proveedor recomiendas para calzado?"
- **Envíos**: "¿Cuánto tarda la entrega a Medellín?"
- **Productos**: "¿Qué productos son más rentables?"

¿Qué información necesitas específicamente?`
      }
    }

    // Save conversation
    const lastUser = messages.filter((m: { role: string }) => m.role === 'user').pop()
    if (lastUser) {
      try {
        await db.naiosConversation.create({ data: { role: 'user', content: lastUser.content, module: 'requests' } })
        await db.naiosConversation.create({ data: { role: 'assistant', content: response, module: 'requests' } })
      } catch (dbError) {
        console.error('Failed to save NAIOS conversation:', dbError)
      }
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('NAIOS chat error:', error)
    return NextResponse.json({ 
      response: '⚠️ No pude procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.' 
    }, { status: 500 })
  }
}
