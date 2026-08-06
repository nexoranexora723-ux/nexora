'use client'

/**
 * NEXORA — WhatsApp Notifications
 *
 * Permite enviar notificaciones por WhatsApp al cliente para:
 * 1. Confirmación de pedido
 * 2. Actualización de estado (en proceso, enviado, entregado)
 * 3. Recordatorio de carrito abandonado
 * 4. Ofertas personalizadas
 *
 * Usa wa.me links que abren WhatsApp con mensaje pre-armado.
 */

const WHATSAPP_NUMBER = '573247583173'

export interface WhatsAppMessage {
  to: string // número del cliente en formato internacional (ej: 573105550100)
  message: string
}

/**
 * Genera URL de wa.me con mensaje pre-armado
 */
export function buildWhatsAppUrl(message: string, toNumber: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${toNumber}?text=${encodeURIComponent(message)}`
}

/**
 * Abre WhatsApp con el mensaje pre-armado
 */
export function openWhatsApp(message: string, toNumber?: string): void {
  const url = buildWhatsAppUrl(message, toNumber)
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ============================================================================
// PLANTILLAS DE MENSAJES
// ============================================================================

export interface OrderNotificationData {
  orderNumber: string
  customerName: string
  total: number
  currency?: string
  items?: Array<{ name: string; quantity: number; price: number }>
}

export function orderConfirmationMessage(data: OrderNotificationData): string {
  const itemsList = data.items?.length
    ? `\n\n*Productos:*\n${data.items.map((i, idx) =>
        `${idx + 1}. ${i.name}\n   • Cant: ${i.quantity}\n   • Precio: $${i.price}`
      ).join('\n')}`
    : ''

  return `🛍️ *NEXORA — Confirmación de pedido*

Hola ${data.customerName}! Hemos recibido tu pedido *${data.orderNumber}* y lo estamos procesando.

${itemsList}

💰 *Total: $${data.total}${data.currency ? ` ${data.currency}` : 'USD'}*

Te mantendremos informado sobre el estado de tu pedido. Si tienes preguntas, responde a este mensaje.

¡Gracias por confiar en NEXORA! 🙏`
}

export function orderStatusMessage(data: {
  orderNumber: string
  customerName: string
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered'
  trackingNumber?: string
  carrier?: string
}): string {
  const statusInfo = {
    confirmed: {
      emoji: '✅',
      title: 'Pedido confirmado',
      msg: 'Tu pedido ha sido confirmado y estamos preparando los productos para envío.',
    },
    processing: {
      emoji: '📦',
      title: 'Pedido en proceso',
      msg: 'Estamos preparando tu pedido para ser enviado. Esto toma 1-2 días hábiles.',
    },
    shipped: {
      emoji: '🚚',
      title: 'Pedido enviado',
      msg: `Tu pedido ha sido enviado${data.carrier ? ` vía ${data.carrier}` : ''}.${
        data.trackingNumber ? `\n\n📋 *Número de seguimiento:* ${data.trackingNumber}` : ''
      }\n\nPuedes rastrear tu envío con este número.`,
    },
    delivered: {
      emoji: '🎉',
      title: 'Pedido entregado',
      msg: 'Tu pedido ha sido entregado. Esperamos que disfrutes tus productos!\n\n¿Todo bien con tu compra? Tu opinión nos importa 💬',
    },
  }[data.status]

  return `${statusInfo.emoji} *NEXORA — ${statusInfo.title}*

Hola ${data.customerName}!

${statusInfo.msg}

*Pedido:* ${data.orderNumber}

Si tienes preguntas, no dudes en responder a este mensaje.`
}

export function abandonedCartMessage(data: {
  customerName?: string
  items: Array<{ name: string; price: number; quantity: number; sku?: string }>
  total: number
}): string {
  const itemsList = data.items.map((item, idx) =>
    `${idx + 1}. ${item.name}
   • SKU: ${item.sku || 'N/A'}
   • Cantidad: ${item.quantity}
   • Precio: $${item.price}`
  ).join('\n\n')

  return `🛒 *NEXORA — Tu carrito te espera*

Hola${data.customerName ? ` ${data.customerName}` : ''}! Vimos que tenías productos en tu carrito y queríamos ayudarte a completar tu compra:

${itemsList}

💰 *Total: $${data.total}*

¿Tienes preguntas sobre disponibilidad, envío o pago? Responde a este mensaje y te ayudamos! 🙌`
}

export function offerMessage(data: {
  customerName?: string
  title: string
  description: string
  discountCode?: string
  discountPct?: number
  validUntil?: string
}): string {
  return `🎁 *NEXORA — ${data.title}*

${data.customerName ? `Hola ${data.customerName}! ` : ''}${data.description}

${data.discountCode ? `🎫 *Código:* ${data.discountCode}\n💰 *Descuento:* ${data.discountPct}%\n` : ''}${data.validUntil ? `⏰ *Válido hasta:* ${data.validUntil}\n` : ''}
Visita nuestra web para ver todos los productos disponibles.

¡No te lo pierdas! ✨`
}

// ============================================================================
// HOOK PARA USAR NOTIFICACIONES
// ============================================================================

export function useWhatsAppNotifications() {
  const sendOrderConfirmation = (data: OrderNotificationData, customerPhone?: string) => {
    openWhatsApp(orderConfirmationMessage(data), customerPhone)
  }

  const sendOrderStatus = (
    data: Parameters<typeof orderStatusMessage>[0],
    customerPhone?: string
  ) => {
    openWhatsApp(orderStatusMessage(data), customerPhone)
  }

  const sendAbandonedCart = (
    data: Parameters<typeof abandonedCartMessage>[0],
    customerPhone?: string
  ) => {
    openWhatsApp(abandonedCartMessage(data), customerPhone)
  }

  const sendOffer = (
    data: Parameters<typeof offerMessage>[0],
    customerPhone?: string
  ) => {
    openWhatsApp(offerMessage(data), customerPhone)
  }

  return {
    sendOrderConfirmation,
    sendOrderStatus,
    sendAbandonedCart,
    sendOffer,
    openWhatsApp,
  }
}
