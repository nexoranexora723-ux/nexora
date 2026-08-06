import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'NEXORA <onboarding@resend.dev>'
// Cuando verifiques tu dominio en Resend, cambia a:
// const FROM_EMAIL = 'NEXORA <info@nexora.co>'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: OrderItem[]
  total: number
  paymentMethod: string
  shippingAddress: string
  city: string
}

/**
 * Envía email de confirmación de pedido al cliente
 */
export async function sendOrderConfirmation(order: OrderEmailData) {
  try {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('')

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customerEmail,
      subject: `✅ Pedido confirmado — ${order.orderNumber} | NEXORA`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0284c7, #10b981); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Pedido confirmado! 🎉</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">NEXORA Importaciones</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; color: #333;">Hola <strong>${order.customerName}</strong>,</p>
            <p style="color: #666;">Tu pedido ha sido confirmado exitosamente. Aquí están los detalles:</p>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Número de pedido:</p>
              <p style="margin: 5px 0 0; font-size: 20px; font-weight: bold; color: #0284c7;">${order.orderNumber}</p>
            </div>
            
            <h3 style="color: #333; margin-bottom: 10px;">Productos:</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Cant.</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">Total:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; color: #10b981; font-size: 18px; border-top: 2px solid #ddd;">$${order.total.toFixed(2)} USD</td>
                </tr>
              </tfoot>
            </table>
            
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px;"><strong>📡 Método de pago:</strong> ${order.paymentMethod}</p>
              <p style="margin: 0 0 8px;"><strong>📍 Dirección de envío:</strong> ${order.shippingAddress}</p>
              <p style="margin: 0;"><strong>🏙️ Ciudad:</strong> ${order.city}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⏱️ <strong>Tiempo estimado de entrega:</strong> 22 días<br/>
                Puedes rastrear tu pedido en cualquier momento desde nuestro sitio web.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nexora-inky-mu.vercel.app/track-order?number=${order.orderNumber}" 
                 style="background: #0284c7; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Rastrear mi pedido →
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              NEXORA Importaciones S.A.S. | NIT 901.234.567-8 | Bogotá, Colombia<br/>
              info@nexora.co | +57 324 758 3173
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email enviado:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('sendOrderConfirmation error:', error)
    return { success: false, error: 'Error al enviar email' }
  }
}

/**
 * Envía notificación de cambio de estado del pedido
 */
export async function sendOrderStatusUpdate(
  email: string,
  orderNumber: string,
  newStatus: string,
  trackingNumber?: string,
) {
  try {
    const statusLabels: Record<string, string> = {
      PENDING: '⏳ Pendiente',
      CONFIRMED: '✅ Confirmado',
      PROCESSING: '🏭 En producción',
      SHIPPED: '🚚 En tránsito',
      DELIVERED: '📦 Entregado',
      CANCELLED: '❌ Cancelado',
    }

    const statusLabel = statusLabels[newStatus] || newStatus

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Actualización de pedido — ${orderNumber} | NEXORA`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0284c7, #10b981); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Actualización de tu pedido</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <p style="font-size: 16px; color: #333;">Tu pedido <strong>${orderNumber}</strong> ha cambiado de estado:</p>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="font-size: 28px; font-weight: bold; color: #0284c7; margin: 0;">${statusLabel}</p>
            </div>
            
            ${trackingNumber ? `
              <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #065f46;">
                  📦 <strong>Número de seguimiento:</strong> ${trackingNumber}<br/>
                  Puedes rastrear tu paquete en el sitio de DHL/FedEx.
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nexora-inky-mu.vercel.app/track-order?number=${orderNumber}" 
                 style="background: #0284c7; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Rastrear mi pedido →
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              NEXORA Importaciones S.A.S. | info@nexora.co | +57 324 758 3173
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Email de estado enviado:', data?.id)
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('sendOrderStatusUpdate error:', error)
    return { success: false, error: 'Error al enviar email' }
  }
}

/**
 * Envía email de bienvenida al registrarse
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '¡Bienvenido a NEXORA! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0284c7, #10b981); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a NEXORA! 🎉</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #333;">Hola <strong>${name}</strong>,</p>
            <p style="color: #666;">¡Gracias por registrarte en NEXORA! Ya puedes:</p>
            
            <ul style="color: #666; line-height: 1.8;">
              <li>📦 Explorar nuestro catálogo de 64,000+ productos</li>
              <li>🛒 Agregar productos al carrito</li>
              <li>💳 Hacer pedidos con Nequi, Daviplata o PayPal</li>
              <li>📦 Rastrear tus pedidos en tiempo real</li>
              <li>⭐ Dejar reseñas en los productos</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nexora-inky-mu.vercel.app/" 
                 style="background: #0284c7; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Ver catálogo →
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              NEXORA Importaciones S.A.S. | info@nexora.co | +57 324 758 3173
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend welcome email error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('sendWelcomeEmail error:', error)
    return { success: false, error: 'Error al enviar email' }
  }
}
