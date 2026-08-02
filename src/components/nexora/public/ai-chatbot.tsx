'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, X, Send, Bot, User, MessageCircle,
  Package, Truck, CreditCard, Headphones, Loader2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface AiChatbotProps {
  /** Called when a quick reply that requires navigation is clicked. */
  onNavigate?: (view: string) => void
}

const GREETING = '¡Hola! 👋 Soy NAIOS, tu asistente. ¿Cómo puedo ayudarte?'

const QUICK_REPLIES = [
  { id: 'catalog', label: 'Ver catálogo', icon: Package, prompt: '¿Dónde puedo ver el catálogo de productos?' },
  { id: 'track', label: 'Track my order', icon: Truck, prompt: '¿Cómo rastreo mi pedido?' },
  { id: 'payment', label: 'Métodos de pago', icon: CreditCard, prompt: '¿Qué métodos de pago aceptan?' },
  { id: 'human', label: 'Hablar con humano', icon: Headphones, prompt: 'Quiero hablar con una persona, por favor.' },
]

/**
 * AI Chatbot — floating customer-service widget (NAIOS).
 *
 * - Floating button (bottom-right, next to live chat).
 * - Click to open chat window.
 * - Uses /api/naios/chat to answer questions.
 * - Pre-programmed greeting + quick reply buttons.
 * - Chat history stored in state (not persisted).
 * - Collapsible.
 */
export function AiChatbot({ onNavigate }: AiChatbotProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  // Insert greeting once on first open.
  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          content: GREETING,
          createdAt: new Date().toISOString(),
        },
      ])
    }
  }, [open])

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  async function send(prompt: string) {
    const text = prompt.trim()
    if (!text || sending) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    const priorMessages = [...messages, userMsg]
    setMessages(priorMessages)
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/naios/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: priorMessages.map((m) => ({ role: m.role, content: m.content })),
          businessContext: 'Eres NAIOS, asistente de atención al cliente de NEXORA. Responde en español, claro y breve. Ayudas con: catálogo, tracking de pedidos, métodos de pago, y preguntas generales de importación.',
        }),
      })
      const data = await res.json()
      const reply = data.response ?? data.error ?? 'Lo siento, no pude procesar tu solicitud.'
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ No pude conectar con el servidor. Intenta de nuevo en un momento.',
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleQuickReply(qr: typeof QUICK_REPLIES[number]) {
    // For navigation-type quick replies, navigate AND show a chat message.
    if (qr.id === 'catalog' && onNavigate) {
      onNavigate('catalog')
    }
    send(qr.prompt)
  }

  return (
    <>
      {/* Floating button (bottom-right, sits above live chat) */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar NAIOS' : 'Abrir asistente NAIOS'}
        aria-expanded={open}
        className="fixed bottom-5 right-20 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 sm:bottom-6 sm:right-24"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
          </span>
        )}
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-5 z-50 flex h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:right-6"
            role="dialog"
            aria-label="Chat con NAIOS"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary to-blue-700 px-4 py-3 text-primary-foreground">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">NAIOS</p>
                  <p className="text-xs opacity-90">Asistente de NEXORA</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar chat"
                className="rounded p-1 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="nexora-scroll flex-1 space-y-3 overflow-y-auto p-4"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex items-start gap-2',
                    m.role === 'user' && 'flex-row-reverse',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
                      m.role === 'assistant'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {m.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                      m.role === 'assistant'
                        ? 'rounded-tl-sm bg-muted text-foreground'
                        : 'rounded-tr-sm bg-primary text-primary-foreground',
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex items-start gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick replies (only show when no user messages yet) */}
              {messages.length <= 1 && !sending && (
                <div className="pt-2">
                  <p className="mb-2 text-xs text-muted-foreground">Preguntas frecuentes:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_REPLIES.map((qr) => (
                      <button
                        key={qr.id}
                        onClick={() => handleQuickReply(qr)}
                        className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-2 text-left text-xs font-medium transition-colors hover:border-primary/40 hover:bg-accent"
                      >
                        <qr.icon className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        <span className="line-clamp-1">{qr.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t bg-background p-3">
              <form
                onSubmit={(e) => { e.preventDefault(); send(input) }}
                className="flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={sending}
                  className="flex-1"
                  aria-label="Mensaje"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || sending}
                  aria-label="Enviar"
                  className="flex-shrink-0"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Badge variant="outline" className="gap-1 px-1.5 text-[9px]">
                  <Sparkles className="h-2.5 w-2.5" /> IA
                </Badge>
                Powered by NAIOS · Las respuestas son sugerencias
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
