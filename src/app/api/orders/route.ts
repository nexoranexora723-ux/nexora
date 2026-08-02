import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/server/services/auth.service'
import { RequestService } from '@/server/services/request.service'
import { db } from '@/lib/db'
import { sendOrderConfirmation } from '@/lib/email-service'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * GET /api/orders
 *
 * Modos:
 *   1) Cliente (no admin o sin `scope=admin`): devuelve sus propios pedidos como array.
 *      Soporta `?email=...` para admins que consulten pedidos de otro usuario.
 *   2) Admin (`scope=admin` y rol ADMIN/SUPER_ADMIN/EMPLOYEE): devuelve TODOS los
 *      pedidos en formato paginado con filtros:
 *        ?status=PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED
 *        ?search=NX-1234 (busca por número o email del cliente)
 *        ?page=1&limit=20
 *      Retorna: { orders, total, page, totalPages, stats }
 */
export async function GET(req: NextRequest) {
  try {
    const t = req.cookies.get('nexora-session')?.value
    const user = t ? await AuthService.validate(t) : null
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const emailFilter = searchParams.get('email')
    const scope = searchParams.get('scope')
    const isAdmin =
      (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'EMPLOYEE') &&
      scope === 'admin'

    // === MODO ADMIN: listar TODOS los pedidos con filtros/paginación ===
    if (isAdmin) {
      const status = searchParams.get('status') // PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|CANCELLED
      const search = (searchParams.get('search') ?? '').trim()
      const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
      const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20')), 100)

      const where: {
        adminStatus?: string;
        OR?: Array<{
          number?: { contains: string; mode?: 'insensitive' };
          client?: { email?: { contains: string; mode?: 'insensitive' } };
          adminStatus?: string | null;
        }>;
      } = {}

      if (status && status !== 'all') {
        // PENDING → adminStatus='PENDING' OR adminStatus IS NULL (tratar nulos como pendientes)
        if (status === 'PENDING') {
          where.OR = [
            { adminStatus: 'PENDING' },
            { adminStatus: null },
          ]
        } else {
          where.adminStatus = status
        }
      }

      if (search) {
        where.OR = [
          { number: { contains: search, mode: 'insensitive' } },
          { client: { email: { contains: search, mode: 'insensitive' } } },
        ]
      }

      const [total, requests] = await Promise.all([
        db.importRequest.count({ where }),
        db.importRequest.findMany({
          where,
          include: {
            client: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
            quotes: { select: { id: true, total: true, currencyCode: true, status: true } },
            imports: { select: { id: true, salePrice: true, currencyCode: true, carrier: true, trackingNumber: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ])

      // Map to flat order shape + compute stats in one pass
      const orders = requests.map((r) => mapRequestToOrder(r))

      // Stats — count by adminStatus (null counted as PENDING)
      const allRows = await db.importRequest.findMany({
        select: { adminStatus: true, budget: true, currencyCode: true },
      })
      const stats = {
        total: allRows.length,
        pending: allRows.filter((r) => !r.adminStatus || r.adminStatus === 'PENDING').length,
        confirmed: allRows.filter((r) => r.adminStatus === 'CONFIRMED').length,
        processing: allRows.filter((r) => r.adminStatus === 'PROCESSING').length,
        shipped: allRows.filter((r) => r.adminStatus === 'SHIPPED').length,
        delivered: allRows.filter((r) => r.adminStatus === 'DELIVERED').length,
        cancelled: allRows.filter((r) => r.adminStatus === 'CANCELLED').length,
        revenue: allRows
          .filter((r) => r.adminStatus !== 'CANCELLED')
          .reduce((s, r) => s + (r.budget ?? 0), 0),
      }

      return NextResponse.json({
        orders,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        stats,
      })
    }

    // === MODO CLIENTE: pedidos del propio usuario (formato array, backward-compat) ===
    let targetUserId = user.id
    if (emailFilter && emailFilter.toLowerCase() !== user.email.toLowerCase()) {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'EMPLOYEE') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
      }
      const target = await db.user.findUnique({
        where: { email: emailFilter.toLowerCase() },
        select: { id: true },
      })
      if (!target) return NextResponse.json([])
      targetUserId = target.id
    }

    const reqs = await RequestService.list({ clientId: targetUserId })
    const orders = reqs.map((r: Record<string, unknown>) => mapRequestToOrder(r))
    return NextResponse.json(orders)
  } catch (error) {
    console.error('GET /api/orders error:', error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

/**
 * Convierte una ImportRequest (con relaciones cargadas) en un objeto "order"
 * plano para el frontend del admin y del cliente.
 */
function mapRequestToOrder(r: Record<string, unknown>) {
  const quotes = (r.quotes as Array<Record<string, unknown>>) ?? []
  const imports = (r.imports as Array<Record<string, unknown>>) ?? []
  const client = (r.client as Record<string, unknown> | null) ?? null

  // Total: import.salePrice > quote.total > budget
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

  // Items: parsear la description que genera POST /api/orders
  // Formato: "1. AirPods Pro 2 — 2 u × 199 USD (SKU: AP-PRO2)\n2. ..."
  const items = parseItemsFromDescription(
    (r.description as string | null) ?? null,
    (r.productName as string) ?? 'Producto',
    (r.quantity as number) ?? 1,
    total,
    currencyCode,
  )

  const adminStatus = (r.adminStatus as string | null) ?? 'PENDING'

  return {
    id: r.id,
    number: r.number,
    status: adminStatus, // status administrativo (PENDING/CONFIRMED/...)
    requestStatus: r.status, // estado interno del pipeline de importación
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    closedAt: r.closedAt,
    productName: r.productName,
    quantity: r.quantity,
    currencyCode,
    total,
    itemsCount: items.length,
    items,
    // Datos del cliente
    customer: client
      ? {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone ?? null,
        }
      : null,
    paymentMethod: (r.paymentMethod as string | null) ?? null,
    shippingAddress: (r.shippingAddress as string | null) ?? null,
    trackingNumber:
      (r.trackingNumber as string | null) ??
      ((imports[0]?.trackingNumber as string | undefined) ?? null),
    carrier: (imports[0]?.carrier as string | undefined) ?? null,
    // Detalles adicionales
    budget: r.budget ?? null,
    category: r.category ?? null,
    description: r.description ?? null,
  }
}

function parseItemsFromDescription(
  description: string | null,
  productName: string,
  quantity: number,
  total: number,
  currencyCode: string,
): Array<{ name: string; quantity: number; unitPrice: number; currencyCode: string; sku?: string }> {
  if (!description) {
    return [
      {
        name: productName,
        quantity,
        unitPrice: quantity > 0 ? total / quantity : 0,
        currencyCode,
      },
    ]
  }
  // Detectar formato multilinea "1. Name — Q u × P CUR (SKU: X)"
  const lines = description.split('\n').filter((l) => l.trim().length > 0)
  const itemRegex = /^\d+\.\s*(.+?)\s+—\s+(\d+)\s*u\s*×\s*([\d.]+)\s*(\w+)(?:\s*\(SKU:\s*([^)]+)\))?/i
  const parsed = lines
    .map((line) => {
      const m = line.match(itemRegex)
      if (!m) return null
      return {
        name: m[1].trim(),
        quantity: parseInt(m[2], 10),
        unitPrice: parseFloat(m[3]),
        currencyCode: m[4] ?? currencyCode,
        sku: m[5]?.trim(),
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  if (parsed.length === 0) {
    return [
      {
        name: productName,
        quantity,
        unitPrice: quantity > 0 ? total / quantity : 0,
        currencyCode,
      },
    ]
  }
  return parsed
}

/**
 * POST /api/orders
 * Crea un pedido a partir del carrito. Requiere autenticación.
 */
export async function POST(req: NextRequest) {
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

    const productName =
      items.length === 1
        ? items[0].name.slice(0, 180)
        : `Pedido de ${items.length} productos (${items
            .slice(0, 4)
            .map((i) => i.name.slice(0, 30))
            .join(', ')}${items.length > 4 ? '…' : ''})`.slice(0, 200)

    const description = items
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.name} — ${i.quantity} u × ${i.price} ${i.currencyCode || currencyCode}${i.sku ? ` (SKU: ${i.sku})` : ''}`,
      )
      .join('\n')

    const details = [
      paymentMethod ? `Método de pago: ${paymentMethod}` : null,
      shippingAddress ? `Dirección de envío: ${shippingAddress}` : null,
    ]
      .filter(Boolean)
      .join('\n')

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

    // Set the new admin fields (adminStatus=PENDING, paymentMethod, shippingAddress)
    try {
      await db.importRequest.update({
        where: { id: created.id },
        data: {
          adminStatus: 'PENDING',
          paymentMethod,
          shippingAddress,
        },
      })
    } catch (e) {
      console.error('Update admin fields on order create error:', e)
    }

    try {
      await sendOrderConfirmation({
        orderNumber: created.number,
        customerName: `${user.firstName} ${user.lastName}`,
        customerEmail: user.email,
        items: items.map((i) => ({
          name: i.name,
          quantity: Number(i.quantity) || 1,
          price: Number(i.price) || 0,
        })),
        total: subtotal,
        paymentMethod: paymentMethod || 'No especificado',
        shippingAddress: shippingAddress || 'No especificada',
        city: shippingAddress || 'Colombia',
      })
    } catch (e) {
      console.error('sendOrderConfirmation error:', e)
    }

    return NextResponse.json(
      {
        id: created.id,
        number: created.number,
        status: 'PENDING',
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
