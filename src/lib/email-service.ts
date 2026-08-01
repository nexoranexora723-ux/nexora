// NEXORA — Email notification service
//
// Servicio centralizado para enviar notificaciones por email. Como no tenemos
// un proveedor SMTP/SendGrid configurado en este entorno, la implementación
// actual:
//   1. Registra el email en consola (para debug en dev).
//   2. Persiste el mensaje en la tabla `Notification` como una notificación
//      "email" dirigida al usuario destinatario (si existe en DB).
//   3. Devuelve un objeto con el HTML generado para que la API caller pueda
//      exponerlo o adjuntarlo.
//
// Cuando se configure un proveedor real (Resend, SendGrid, SES, etc.), basta
// con reemplazar la función `deliver()` y todo el resto del sistema sigue
// funcionando sin cambios.

import { db } from '@/lib/db'

// ---------- Types ----------

export interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
  currencyCode?: string
}

export interface OrderConfirmationData {
  orderNumber: string
  clientName: string
  items: OrderItem[]
  subtotal: number
  shipping?: number
  tax?: number
  total: number
  currencyCode?: string
  paymentMethod?: string
  shippingAddress?: string
  trackingUrl?: string
  createdAt?: string | Date
}

export interface OrderStatusUpdateData {
  orderNumber: string
  clientName: string
  newStatus: string
  previousStatus?: string
  notes?: string
  trackingUrl?: string
  trackingNumber?: string
  carrier?: string
}

// ---------- Status helpers ----------

const STATUS_LABELS: Record<string, string> = {
  NUEVA: 'Solicitud recibida',
  ANALIZANDO: 'En análisis',
  BUSCANDO_PROVEEDOR: 'Buscando proveedor',
  COTIZACION_RECIBIDA: 'Cotización recibida',
  COTIZACION_ENVIADA: 'Cotización enviada',
  ESPERANDO_APROBACION: 'Esperando tu aprobación',
  PAGO_RECIBIDO: 'Pago recibido',
  COMPRA_REALIZADA: 'Compra realizada',
  PRODUCCION: 'En producción',
  EN_TRANSITO: 'En tránsito',
  ENTREGADO: 'Entregado',
  CERRADO: 'Cerrado',
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

function fmtMoney(amount: number, currency = 'USD'): string {
  const symbol = ['USD', 'COP', 'MXN'].includes(currency) ? '$' : currency === 'EUR' ? '€' : '$'
  return `${symbol}${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`
}

function fmtDate(d?: string | Date): string {
  if (!d) return new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ---------- HTML templates ----------

export function orderConfirmationHtml(o: OrderConfirmationData): string {
  const itemsRows = (o.items ?? [])
    .map(
      (it) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">${escapeHtml(it.name)}${it.quantity > 1 ? ` <span style="color:#64748b;">× ${it.quantity}</span>` : ''}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap;">${fmtMoney(it.unitPrice * it.quantity, it.currencyCode || o.currencyCode)}</td>
        </tr>`,
    )
    .join('')

  const shippingRow = o.shipping ? row('Envío', fmtMoney(o.shipping, o.currencyCode)) : ''
  const taxRow = o.tax ? row('Impuestos', fmtMoney(o.tax, o.currencyCode)) : ''
  const payRow = o.paymentMethod ? row('Método de pago', o.paymentMethod) : ''
  const addrRow = o.shippingAddress ? row('Dirección de envío', o.shippingAddress) : ''

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Confirmación de tu pedido ${o.orderNumber}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:24px;border-radius:12px 12px 0 0;text-align:center;color:#fff;">
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.5px;">NEXORA</div>
      <div style="margin-top:6px;font-size:14px;opacity:0.9;">Importaciones desde China</div>
    </div>
    <div style="background:#fff;padding:28px 24px;border-radius:0 0 12px 12px;box-shadow:0 4px 12px rgba(15,23,42,0.06);">
      <h1 style="margin:0 0 8px;font-size:22px;">¡Recibimos tu solicitud, ${escapeHtml(o.clientName)}!</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.55;">
        Tu pedido <strong style="color:#0f172a;">${escapeHtml(o.orderNumber)}</strong> fue registrado el ${fmtDate(o.createdAt)}.
        Nuestro equipo comenzará a buscar el mejor proveedor y te contactará con una cotización en las próximas 24 horas.
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            <th style="padding:8px 0;text-align:left;border-bottom:2px solid #e2e8f0;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Producto</th>
            <th style="padding:8px 0;text-align:right;border-bottom:2px solid #e2e8f0;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || `<tr><td colspan="2" style="padding:14px 0;color:#94a3b8;text-align:center;">Sin items</td></tr>`}
        </tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
        ${row('Subtotal', fmtMoney(o.subtotal, o.currencyCode))}
        ${shippingRow}
        ${taxRow}
        <tr>
          <td style="padding:14px 0 4px;font-weight:700;font-size:16px;">Total</td>
          <td style="padding:14px 0 4px;font-weight:700;font-size:16px;text-align:right;white-space:nowrap;color:#1d4ed8;">${fmtMoney(o.total, o.currencyCode)}</td>
        </tr>
      </table>

      ${(o.paymentMethod || o.shippingAddress) ? `
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:18px;background:#f8fafc;border-radius:8px;">
        ${payRow}
        ${addrRow}
      </table>` : ''}

      ${o.trackingUrl ? `
      <div style="margin-top:24px;text-align:center;">
        <a href="${escapeHtml(o.trackingUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Seguir mi pedido →</a>
      </div>` : ''}

      <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.55;text-align:center;">
        ¿Dudas? Responde a este correo o escríbenos a <a href="mailto:info@nexora.co" style="color:#1d4ed8;">info@nexora.co</a>.<br/>
        NEXORA Importaciones S.A.S. — NIT 901.234.567-8 — Bogotá, Colombia.
      </p>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#94a3b8;">© 2025 NEXORA Importaciones S.A.S.</p>
  </div>
</body></html>`
}

export function orderStatusUpdateHtml(s: OrderStatusUpdateData): string {
  const label = statusLabel(s.newStatus)
  const trackingBlock = s.trackingNumber ? `
    <div style="margin-top:18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;">
      <p style="margin:0 0 4px;font-size:12px;color:#1e40af;text-transform:uppercase;letter-spacing:0.04em;font-weight:600;">${s.carrier ? escapeHtml(s.carrier) : 'Seguimiento'}</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;font-family:monospace;">${escapeHtml(s.trackingNumber)}</p>
      ${s.trackingUrl ? `<a href="${escapeHtml(s.trackingUrl)}" style="display:inline-block;margin-top:8px;color:#1d4ed8;font-size:13px;text-decoration:none;font-weight:600;">Ver seguimiento →</a>` : ''}
    </div>` : ''

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Actualización de tu pedido ${s.orderNumber}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:24px;border-radius:12px 12px 0 0;text-align:center;color:#fff;">
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.5px;">NEXORA</div>
      <div style="margin-top:6px;font-size:14px;opacity:0.9;">Importaciones desde China</div>
    </div>
    <div style="background:#fff;padding:28px 24px;border-radius:0 0 12px 12px;box-shadow:0 4px 12px rgba(15,23,42,0.06);">
      <h1 style="margin:0 0 8px;font-size:22px;">Hola ${escapeHtml(s.clientName)},</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:14px;line-height:1.55;">
        Tu pedido <strong style="color:#0f172a;">${escapeHtml(s.orderNumber)}</strong> cambió de estado.
      </p>

      <div style="background:#f1f5f9;border-radius:10px;padding:18px 20px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Nuevo estado</p>
        <p style="margin:0;font-size:20px;font-weight:700;color:#1d4ed8;">${escapeHtml(label)}</p>
        ${s.previousStatus ? `<p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">Antes: ${escapeHtml(statusLabel(s.previousStatus))}</p>` : ''}
      </div>

      ${s.notes ? `<p style="margin:18px 0 0;font-size:14px;color:#475569;line-height:1.55;">${escapeHtml(s.notes)}</p>` : ''}
      ${trackingBlock}

      <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.55;text-align:center;">
        ¿Dudas? Escríbenos a <a href="mailto:info@nexora.co" style="color:#1d4ed8;">info@nexora.co</a> o al <a href="https://wa.me/573105550100" style="color:#1d4ed8;">+57 310 555 0100</a>.<br/>
        NEXORA Importaciones S.A.S. — Bogotá, Colombia.
      </p>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#94a3b8;">© 2025 NEXORA Importaciones S.A.S.</p>
  </div>
</body></html>`
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:#64748b;">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right;font-weight:500;">${escapeHtml(value)}</td></tr>`
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------- Delivery ----------

export interface EmailResult {
  to: string
  subject: string
  html: string
  delivered: 'console' | 'db' | 'none'
  notificationId?: string
}

/**
 * Función interna que "entrega" el email. Por ahora solo lo registra en
 * consola. En el futuro, aquí se llamará al proveedor de email real.
 */
async function deliver(to: string, subject: string, html: string): Promise<EmailResult> {
  // 1) Siempre log a consola para audibilidad en dev
  console.log('────────────────── NEXORA EMAIL ──────────────────')
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log('--------------------------------------------------')

  // 2) Intentar persistir como notificación "email" para el usuario destinatario
  try {
    const user = await db.user.findUnique({ where: { email: to } })
    if (user) {
      const notif = await db.notification.create({
        data: {
          userId: user.id,
          type: 'system',
          priority: 'MEDIUM',
          title: subject,
          message: stripHtml(html).slice(0, 280),
          data: JSON.stringify({ kind: 'email', to, subject, htmlPreview: html.slice(0, 4000) }),
        },
      })
      return { to, subject, html, delivered: 'db', notificationId: notif.id }
    }
  } catch (err) {
    console.error('email-service: no se pudo persistir la notificación en DB:', err)
  }

  return { to, subject, html, delivered: 'console' }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ---------- Public API ----------

/**
 * Envía el email de confirmación tras crear un pedido/solicitud.
 */
export async function sendOrderConfirmation(email: string, order: OrderConfirmationData): Promise<EmailResult> {
  const subject = `¡Pedido confirmado! ${order.orderNumber} — NEXORA`
  const html = orderConfirmationHtml(order)
  return deliver(email, subject, html)
}

/**
 * Envía un email de actualización de estado del pedido.
 */
export async function sendOrderStatusUpdate(
  email: string,
  orderNumber: string,
  newStatus: string,
  extra?: { clientName?: string; previousStatus?: string; notes?: string; trackingUrl?: string; trackingNumber?: string; carrier?: string },
): Promise<EmailResult> {
  const subject = `Actualización de tu pedido ${orderNumber} — NEXORA`
  const html = orderStatusUpdateHtml({
    orderNumber,
    clientName: extra?.clientName ?? 'Cliente',
    newStatus,
    previousStatus: extra?.previousStatus,
    notes: extra?.notes,
    trackingUrl: extra?.trackingUrl,
    trackingNumber: extra?.trackingNumber,
    carrier: extra?.carrier,
  })
  return deliver(email, subject, html)
}
