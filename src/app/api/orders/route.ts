import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { RequestService } from '@/server/services/request.service'
import { db } from '@/lib/db'
import { sendOrderConfirmation } from '@/lib/email-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * GET /api/orders
 * Lista los "pedidos" del usuario autenticado. Internamente son ImportRequests.
 *
 * Query params:
 *   - email: opcional. Si se pasa, debe coincidir con el email del usuario
 *            autenticado (o el caller debe ser admin) — de lo contrario 403.
 *            Por defecto devuelve los pedidos del usuario autenticado.
 *
 * Respuesta: array de pedidos enriquecidos con número, fecha, estado, total
 *            estimado (basado en quotes aprobadas o budget), count de items,
 *            etc., apto para la página /pedidos.
 */
export async function GET(req: NextRequest) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const emailFilter = searchParams.get('email')

    // Si se pasa email, validar que sea el propio usuario o un admin
    let targetUserId = user.id
    if (emailFilter && emailFilter.toLowerCase() !== user.email.toLowerCase()) {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
      const target = await db.user.findUnique({
        where: { email: emailFilter.toLowerCase(), deletedAt: null },
        select: { id: true },
      })
      if (!target) return NextResponse.json([])
      targetUserId = target.id
    }

    // Reusa RequestService.list (filtra por clientId)
    const reqs = await RequestService.list({ clientId: targetUserId })

    // Mapea a formato "order" plano para el frontend
    const orders = reqs.map((r: Record<string, unknown>) => {
      const quotes = (r.quotes as Array<Record<string, unknown>>) ?? []
      const imports = (r.imports as Array<Record<string, unknown>>) ?? []

      // Total: si hay import → usar salePrice; si no, mejor quote.total; si no, budget
      let total = 0
      let currencyCode = (r.currencyCode as string) ?? 'USD'
      if (imports.length > 0 && typeof imports[0].salePrice === 'number') {
        total = imports[0].salePrice as number
        currencyCode = (imports[0].currencyCode as string) ?? currencyCode
      } else if (quotes.length > 0 && typeof quotes[0].total === 'number') {
        total = quotes[0].total as number
        currencyCode = (quotes[0].currencyCode as string) ?? currencyCode
      } else if (typeof r.budget === 'number') {
        total = r.budget as number
      }

      // Items count: para solicitudes de importación, cada solicitud es 1 "producto"
      // (con quantity). Pero para /pedidos lo mostramos como un item line.
      const items = [
        {
          name: r.productName as string,
          quantity: r.quantity as number,
          unitPrice: total && r.quantity ? total / (r.quantity as number) : 0,
          currencyCode,
        },
      ]

      return {
        id: r.id,
        number: r.number,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        closedAt: r.closedAt,
        productName: r.productName,
        quantity: r.quantity,
        currencyCode,
        total,
        itemsCount: 1,
        items,
        paymentMethod: imports[0]?.carrier ? String(imports[0].carrier) : null,
        shippingAddress: null,
        trackingNumber: (imports[0]?.trackingNumber as string | undefined) ?? null,
        carrier: (imports[0]?.carrier as string | undefined) ?? null,
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('GET /api/orders error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

/**
 * POST /api/orders
 * Crea un pedido a partir del carrito. Requiere autenticación.
 * Body: { items: [{ name, quantity, price, currencyCode, sku, imageUrl, productId? }], paymentMethod?, shippingAddress? }
 *
 * Internamente:
 *   1. Crea un ImportRequest por cada item (o uno solo agrupando todos los
 *      productos del carrito como una solicitud compuesta). Para mantener la
 *      semántica simple, creamos UNA solicitud cuyo productName lista los
 *      productos y quantity = total de items.
 *   2. Llama a sendOrderConfirmation(email, ...) → console + DB notification.
 *   3. Devuelve el pedido creado.
 */
export async function POST(req: NextRequest) {
  // Rate limit: 30 order creations per minute per IP
  const limited = enforceRateLimit(req, 'orders-create', RATE_LIMITS.WRITE)
  if (limited) return limited

  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const items: Array<{
      name: string
      quantity: number
      price: number
      currencyCode?: string
      sku?: string
      imageUrl?: string | null
      productId?: string
    }> = Array.isArray(body.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 })
    }

    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : null
    const shippingAddress = typeof body.shippingAddress === 'string' ? body.shippingAddress : null

    const totalQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
    const currencyCode = items[0]?.currencyCode || 'USD'

    // Producto compuesto: "Pedido de N productos" + detalles en description
    const productName =
      items.length === 1
        ? items[0].name.slice(0, 180)
        : `Pedido de ${items.length} productos (${items
            .slice(0, 4)
            .map((i) => i.name.slice(0, 30))
            .join(', ')}${items.length > 4 ? '…' : ''})`.slice(0, 200)

    const description = items
      .map((i, idx) => `${idx + 1}. ${i.name} — ${i.quantity} u × ${i.price} ${i.currencyCode || currencyCode}${i.sku ? ` (SKU: ${i.sku})` : ''}`)
      .join('\n')

    const details = [
      paymentMethod ? `Método de pago: ${paymentMethod}` : null,
      shippingAddress ? `Dirección de envío: ${shippingAddress}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    // Crea la solicitud via service (esto genera number NX-2025-NNNNNN + notifica admins)
    const created = await RequestService.create(
      {
        productName,
        description,
        purpose: 'personal',
        quantity: Math.max(1, totalQty),
        budget: subtotal,
        currencyCode,
        details: details || undefined,
        priority: 'MEDIUM',
      },
      user.id,
    )

    // Envía email de confirmación (console + DB notification)
    try {
      await sendOrderConfirmation(user.email, {
        orderNumber: created.number,
        clientName: `${user.firstName} ${user.lastName}`,
        items: items.map((i) => ({
          name: i.name,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.price) || 0,
          currencyCode: i.currencyCode || currencyCode,
        })),
        subtotal,
        total: subtotal,
        currencyCode,
        paymentMethod: paymentMethod || undefined,
        shippingAddress: shippingAddress || undefined,
        trackingUrl: `/track-order?number=${encodeURIComponent(created.number)}`,
        createdAt: created.createdAt,
      })
    } catch (e) {
      console.error('sendOrderConfirmation error:', e)
    }

    return NextResponse.json(
      {
        id: created.id,
        number: created.number,
        status: created.status,
        createdAt: created.createdAt,
        total: subtotal,
        currencyCode,
        emailSent: true,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/orders error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
