/**
 * NEXORA — Payment Gateway Integration
 *
 * Soporta múltiples pasarelas de pago colombianas:
 * - PayU (https://www.payu.co)
 * - Wompi (https://wompi.co)
 * - Mercado Pago (https://mercadopago.com.co)
 *
 * Por ahora usa Wompi como default (más moderno y fácil de integrar).
 * Las credenciales se configuran via variables de entorno:
 *   - WOMPI_PUBLIC_KEY
 *   - WOMPI_PRIVATE_KEY
 *   - WOMPI_ENVIRONMENT (test|prod)
 *
 * Para producción, el usuario debe crear cuenta en wompi.co y obtener sus keys.
 */

export type PaymentGateway = 'wompi' | 'payu' | 'mercadopago' | 'whatsapp' | 'manual'

export interface PaymentRequest {
  gateway: PaymentGateway
  amount: number // en COP
  currency: 'COP' | 'USD'
  reference: string // número de pedido
  description: string
  customer: {
    name: string
    email: string
    phone: string
    documentNumber: string
  }
  redirectUrl?: string
}

export interface PaymentResponse {
  success: boolean
  paymentUrl?: string // URL a la que redirigir al usuario para pagar
  transactionId?: string
  message: string
}

// ============================================================================
// WOMPI (recomendado para Colombia)
// ============================================================================

export function buildWompiCheckoutUrl(req: PaymentRequest): string {
  const isTest = process.env.WOMPI_ENVIRONMENT !== 'prod'
  const base = isTest ? 'https://checkout.wompi.co' : 'https://checkout.wompi.co'
  const publicKey = process.env.WOMPI_PUBLIC_KEY || 'pub_test_xxx' // placeholder

  const params = new URLSearchParams({
    'public-key': publicKey,
    'currency': req.currency,
    'amount-in-cents': Math.round(req.amount * 100).toString(),
    'reference': req.reference,
    'redirect-url': req.redirectUrl || `${window.location.origin}/pedidos`,
  })

  if (req.customer.email) params.append('customer-email', req.customer.email)
  if (req.customer.name) params.append('customer-name', req.customer.name)
  if (req.customer.phone) params.append('customer-phone-number', req.customer.phone)

  return `${base}/?${params.toString()}`
}

// ============================================================================
// PAYU
// ============================================================================

export function buildPayUCheckoutUrl(req: PaymentRequest): string {
  const isTest = process.env.PAYU_ENVIRONMENT !== 'prod'
  const base = isTest ? 'https://sandbox.checkout.payulatam.com' : 'https://checkout.payulatam.com'
  const merchantId = process.env.PAYU_MERCHANT_ID || 'xxx'
  const apiKey = process.env.PAYU_API_KEY || 'xxx'

  const params = new URLSearchParams({
    merchantId,
    ApiKey: apiKey,
    referenceCode: req.reference,
    amount: req.amount.toString(),
    currency: req.currency,
    description: req.description,
    buyerEmail: req.customer.email,
    buyerFullName: req.customer.name,
    telephone: req.customer.phone,
    responseUrl: req.redirectUrl || `${window.location.origin}/pedidos`,
    confirmationUrl: `${window.location.origin}/api/payments/payu/webhook`,
  })

  return `${base}/ppp-web-gateway/payu-latam/checkout/?${params.toString()}`
}

// ============================================================================
// MERCADO PAGO
// ============================================================================

export function buildMercadoPagoUrl(req: PaymentRequest): string {
  // MP requiere crear una preferencia via API primero
  // Por ahora devolvemos URL base con parámetros básicos
  const params = new URLSearchParams({
    source: 'link',
    medium: 'checkout',
    campaign: 'nexora',
  })
  return `https://www.mercadopago.com.co/checkout/?${params.toString()}`
}

// ============================================================================
// FACTORY — genera URL de checkout según pasarela
// ============================================================================

export function createPaymentCheckout(req: PaymentRequest): PaymentResponse {
  try {
    let paymentUrl: string

    switch (req.gateway) {
      case 'wompi':
        paymentUrl = buildWompiCheckoutUrl(req)
        break
      case 'payu':
        paymentUrl = buildPayUCheckoutUrl(req)
        break
      case 'mercadopago':
        paymentUrl = buildMercadoPagoUrl(req)
        break
      case 'whatsapp':
        // Para pago por WhatsApp: abrir wa.me con instrucciones
        const msg = `🛍️ *NEXORA — Pago de pedido ${req.reference}*

Hola! Quiero pagar el siguiente pedido:

💰 *Monto:* $${req.amount.toLocaleString('es-CO')} COP
📋 *Referencia:* ${req.reference}
👤 *Cliente:* ${req.customer.name}
📧 *Email:* ${req.customer.email}

¿Me indican los datos para transferir o pagar?`
        paymentUrl = `https://wa.me/573247583173?text=${encodeURIComponent(msg)}`
        break
      case 'manual':
        // Pago manual (transferencia bancaria, efectivo)
        return {
          success: true,
          message: 'Pago manual coordinado por WhatsApp',
        }
      default:
        return {
          success: false,
          message: `Pasarela ${req.gateway} no soportada`,
        }
    }

    return {
      success: true,
      paymentUrl,
      transactionId: `${req.gateway}_${Date.now()}`,
      message: 'Checkout URL generada',
    }
  } catch (e) {
    return {
      success: false,
      message: `Error: ${(e as Error).message}`,
    }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

export const PAYMENT_GATEWAYS: Array<{
  id: PaymentGateway
  name: string
  description: string
  icon: string
  requiresKeys: boolean
  recommended?: boolean
}> = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Coordinar pago por WhatsApp (transferencia, efectivo)',
    icon: '💬',
    requiresKeys: false,
    recommended: true,
  },
  {
    id: 'wompi',
    name: 'Wompi',
    description: 'Tarjeta de crédito/débito, PSE, Nequi, Daviplata',
    icon: '💳',
    requiresKeys: true,
    recommended: true,
  },
  {
    id: 'payu',
    name: 'PayU',
    description: 'Tarjeta de crédito/débito, PSE, efectivo',
    icon: '💰',
    requiresKeys: true,
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Tarjeta, PSE, efectivo, QR',
    icon: '🔵',
    requiresKeys: true,
  },
  {
    id: 'manual',
    name: 'Manual',
    description: 'Pago acordado directamente con el vendedor',
    icon: '🤝',
    requiresKeys: false,
  },
]

export function isGatewayConfigured(gateway: PaymentGateway): boolean {
  if (gateway === 'whatsapp' || gateway === 'manual') return true
  if (gateway === 'wompi') return !!process.env.WOMPI_PUBLIC_KEY
  if (gateway === 'payu') return !!process.env.PAYU_MERCHANT_ID && !!process.env.PAYU_API_KEY
  if (gateway === 'mercadopago') return !!process.env.MERCADOPAGO_ACCESS_TOKEN
  return false
}
