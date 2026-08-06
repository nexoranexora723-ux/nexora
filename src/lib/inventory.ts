/**
 * NEXORA — Inventory Management
 *
 * Sistema de gestión de inventario con:
 * - Stock tracking por producto
 * - Alertas de stock bajo
 * - Reserva de stock cuando se agrega al carrito
 * - Historial de movimientos
 */

import { db } from './db'

export interface StockMovement {
  productId: string
  type: 'in' | 'out' | 'adjustment' | 'reservation' | 'release'
  quantity: number
  reason: string
  userId?: string
  timestamp: Date
}

export interface InventoryStatus {
  productId: string
  currentStock: number
  reserved: number
  available: number
  minStock: number
  status: 'OUT' | 'LOW' | 'OK' | 'OVERSTOCK'
}

/**
 * Obtiene el estado de inventario de un producto
 * Como los productos son importables, por defecto tienen stock "ilimitado"
 * pero se puede configurar stock real para productos en inventario local.
 */
export async function getInventoryStatus(productId: string): Promise<InventoryStatus | null> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      soldCount: true,
      // Si el producto tiene stockField, usarlo; si no, asumir disponible
    },
  })

  if (!product) return null

  // Por defecto, productos importables son "disponibles"
  // El stock real se manage vía campo soldCount (inverso)
  const currentStock = 999 // ilimitado para importables
  const reserved = 0
  const available = currentStock - reserved
  const minStock = 5
  const status: InventoryStatus['status'] = 'OK'

  return {
    productId,
    currentStock,
    reserved,
    available,
    minStock,
    status,
  }
}

/**
 * Obtiene productos con stock bajo (para dashboard admin)
 */
export async function getLowStockProducts(limit = 50): Promise<any[]> {
  // Para productos importables, "stock bajo" no aplica realmente
  // pero podemos usar soldCount para identificar productos populares
  const products = await db.product.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { soldCount: 'desc' },
    take: limit,
    select: {
      id: true,
      sku: true,
      name: true,
      soldCount: true,
      imageUrl: true,
      suggestedPrice: true,
      brand: { select: { name: true } },
    },
  })
  return products
}

// ============================================================================
// FACTURACIÓN ELECTRÓNICA (Colombia - DIAN)
// ============================================================================

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number // 19% IVA en Colombia
}

export interface InvoiceData {
  number: string // número de factura (ej: FE-2025-000001)
  date: Date
  dueDate: Date
  customer: {
    name: string
    documentType: 'CC' | 'NIT' | 'CE' | 'PP'
    documentNumber: string
    email: string
    phone: string
    address: string
    city: string
  }
  items: InvoiceItem[]
  subtotal: number
  taxAmount: number
  total: number
  currency: 'COP' | 'USD'
  notes?: string
}

/**
 * Genera número de factura secuencial
 */
export function generateInvoiceNumber(lastNumber: number): string {
  const year = new Date().getFullYear()
  const seq = (lastNumber + 1).toString().padStart(6, '0')
  return `FE-${year}-${seq}`
}

/**
 * Calcula totales de factura
 */
export function calculateInvoiceTotals(items: InvoiceItem[]): {
  subtotal: number
  taxAmount: number
  total: number
} {
  let subtotal = 0
  let taxAmount = 0

  for (const item of items) {
    const itemSubtotal = item.quantity * item.unitPrice
    const itemTax = itemSubtotal * (item.taxRate / 100)
    subtotal += itemSubtotal
    taxAmount += itemTax
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  }
}

/**
 * Genera factura en formato texto (para enviar por WhatsApp/email)
 */
export function generateInvoiceText(invoice: InvoiceData): string {
  const itemsText = invoice.items.map((item, idx) => {
    const subtotal = item.quantity * item.unitPrice
    return `${idx + 1}. ${item.description}
   Cant: ${item.quantity} × $${item.unitPrice}
   Subtotal: $${subtotal.toFixed(2)}
   IVA (${item.taxRate}%): $${(subtotal * item.taxRate / 100).toFixed(2)}`
  }).join('\n\n')

  return `🧾 *FACTURA DE VENTA*

*${invoice.number}*
Fecha: ${invoice.date.toLocaleDateString('es-CO')}
Vencimiento: ${invoice.dueDate.toLocaleDateString('es-CO')}

*DATOS DEL CLIENTE:*
${invoice.customer.name}
${invoice.customer.documentType}: ${invoice.customer.documentNumber}
📧 ${invoice.customer.email}
📱 ${invoice.customer.phone}
📍 ${invoice.customer.address}, ${invoice.customer.city}

*DETALLE:*
${itemsText}

───────────────────
Subtotal: $${invoice.subtotal.toFixed(2)}
IVA (19%): $${invoice.taxAmount.toFixed(2)}
*TOTAL: $${invoice.total.toFixed(2)} ${invoice.currency}*
───────────────────

${invoice.notes ? `Notas: ${invoice.notes}\n` : ''}
¡Gracias por su compra!

NEXORA Importaciones S.A.S.
NIT: 901.234.567-8
info@nexora.co | +57 324 758 3173`
}

// ============================================================================
// SISTEMA DE DROPSHIPPING
// ============================================================================

export interface DropshipOrder {
  id: string
  orderId: string // referencia al pedido original
  supplierId: string
  productId: string
  quantity: number
  unitCost: number
  totalCost: number
  customerName: string
  customerAddress: string
  customerPhone: string
  status: 'pending' | 'sent_to_supplier' | 'shipped' | 'delivered' | 'cancelled'
  supplierOrderRef?: string // número de orden del proveedor
  trackingNumber?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Crea una orden de dropshipping (comprar al proveedor para enviar directo al cliente)
 */
export async function createDropshipOrder(data: {
  orderId: string
  supplierId: string
  productId: string
  quantity: number
  unitCost: number
  customerName: string
  customerAddress: string
  customerPhone: string
}): Promise<DropshipOrder> {
  return {
    id: `drop_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    orderId: data.orderId,
    supplierId: data.supplierId,
    productId: data.productId,
    quantity: data.quantity,
    unitCost: data.unitCost,
    totalCost: data.unitCost * data.quantity,
    customerName: data.customerName,
    customerAddress: data.customerAddress,
    customerPhone: data.customerPhone,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Genera mensaje para enviar al proveedor (WhatsApp) con detalles de la orden
 */
export function generateSupplierMessage(order: DropshipOrder, product: { name: string; sku: string }): string {
  return `📦 *ORDEN DE COMPRA - DROPSHIPPING*

Hola! Necesito el siguiente producto para enviar directo a mi cliente:

*Producto:* ${product.name}
*SKU:* ${product.sku}
*Cantidad:* ${order.quantity}
*Costo unitario:* $${order.unitCost}
*Costo total:* $${order.totalCost}

*DATOS DE ENVÍO DIRECTO:*
👤 ${order.customerName}
📱 ${order.customerPhone}
📍 ${order.customerAddress}

Por favor confirmar disponibilidad y tiempo de envío. 
Responda a este mensaje con el número de seguimiento una vez enviado.

Gracias! 🙏

NEXORA Importaciones`
}
