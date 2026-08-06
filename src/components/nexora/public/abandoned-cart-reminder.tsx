'use client'

/**
 * NEXORA — Abandoned Cart WhatsApp Recovery
 *
 * Detecta cuando un usuario tiene items en el carrito pero lleva más de X tiempo
 * sin completar la compra. Le muestra un recordatorio con opción de enviar
 * el carrito por WhatsApp al vendedor.
 *
 * Estrategia:
 * 1. Si el carrito tiene items y el usuario lleva >3 min sin interactuar → mostrar banner
 * 2. Botón "Enviar carrito por WhatsApp" que arma un mensaje con todos los items
 * 3. Tracking de abandono en localStorage para no molestar al mismo usuario muy seguido
 */
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart-store'
import { useCurrency } from '@/lib/currency-store'
import { Button } from '@/components/ui/button'
import { X, ShoppingCart, MessageCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const WHATSAPP_NUMBER = '573247583173'
const ABANDON_THRESHOLD_MS = 3 * 60 * 1000 // 3 minutos
const REMINDER_COOLDOWN_MS = 30 * 60 * 1000 // 30 min entre recordatorios
const STORAGE_KEY = 'nexora-abandoned-cart'

interface AbandonState {
  lastReminder: number
  dismissed: boolean
}

export function AbandonedCartReminder() {
  const { items } = useCart()
  const { format } = useCurrency()
  const [show, setShow] = useState(false)
  const [lastInteraction, setLastInteraction] = useState(Date.now())

  // Track user interaction
  useEffect(() => {
    const updateInteraction = () => setLastInteraction(Date.now())
    window.addEventListener('click', updateInteraction)
    window.addEventListener('scroll', updateInteraction)
    window.addEventListener('keydown', updateInteraction)
    return () => {
      window.removeEventListener('click', updateInteraction)
      window.removeEventListener('scroll', updateInteraction)
      window.removeEventListener('keydown', updateInteraction)
    }
  }, [])

  // Check abandoned cart
  useEffect(() => {
    if (items.length === 0) {
      setShow(false)
      return
    }

    const interval = setInterval(() => {
      const idleTime = Date.now() - lastInteraction
      if (idleTime < ABANDON_THRESHOLD_MS) return

      // Check cooldown
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const state: AbandonState = raw ? JSON.parse(raw) : { lastReminder: 0, dismissed: false }
        if (state.dismissed) return
        if (Date.now() - state.lastReminder < REMINDER_COOLDOWN_MS) return
      } catch {
        // ignore
      }

      setShow(true)
    }, 30 * 1000) // check cada 30s

    return () => clearInterval(interval)
  }, [items.length, lastInteraction])

  const dismiss = () => {
    setShow(false)
    try {
      const state: AbandonState = { lastReminder: Date.now(), dismissed: true }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }

  const sendToWhatsApp = () => {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const lines = items.map((item, idx) => {
      const subtotal = item.price * item.quantity
      return `${idx + 1}. ${item.name}
   • SKU: ${item.sku || 'N/A'}
   • Cantidad: ${item.quantity}
   • Precio: ${format(item.price)}
   • Subtotal: ${format(subtotal)}`
    })
    const message = `🛒 *NEXORA — Quiero completar mi compra*

Hola! Estaba armando este carrito en su web y me gustaría confirmar la disponibilidad y coordinar el pago:

${lines.join('\n\n')}

💰 *Total: ${format(total)}*

¿Me pueden ayudar a finalizar la compra?`
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    dismiss()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md"
        >
          <div className="bg-card border border-primary/20 rounded-xl shadow-2xl p-4 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 shrink-0">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">¿Olvidaste algo?</p>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {items.length} {items.length === 1 ? 'item' : 'items'} en tu carrito
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Tu carrito te está esperando. Coordinemos la compra por WhatsApp.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={sendToWhatsApp}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enviar por WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={dismiss}
                    className="px-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
