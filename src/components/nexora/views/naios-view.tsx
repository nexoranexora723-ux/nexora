'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import { PageHeader } from '@/components/nexora/stat-card'
import { NaiosTypeBadge, SeverityDot } from '@/components/nexora/status-badge'
import { NaiosRecommendation, DashboardStats } from '@/lib/types'
import { timeAgo } from '@/lib/format'
import {
  Sparkles, Send, Bot, User, RefreshCw, AlertCircle,
  Lightbulb, TrendingUp, ShieldAlert, BarChart3, Trash2, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: '¿Cuál es la salud financiera del negocio este mes?' },
  { icon: ShieldAlert, text: '¿Qué proveedores presentan mayor riesgo y por qué?' },
  { icon: BarChart3, text: '¿Qué productos tienen el mejor margen y deberíamos promocionar?' },
  { icon: Lightbulb, text: 'Genera 3 recomendaciones accionables para aumentar la utilidad.' },
]

export function NaiosView({
  alerts,
  onAlertsChange,
}: {
  alerts: NaiosRecommendation[]
  onAlertsChange: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Live business context for NAIOS (per DOC-002: transversal access)
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => (await fetch('/api/dashboard')).json(),
  })
  // Daily AI briefing
  const { data: briefing, isLoading: briefingLoading, refetch: refetchBriefing } = useQuery<{ briefing: string }>({
    queryKey: ['naios-briefing'],
    queryFn: async () => (await fetch('/api/naios/insights')).json(),
    staleTime: 5 * 60 * 1000,
  })

  const buildContext = (): string => {
    if (!stats) return 'Datos del negocio no disponibles aún.'
    return `RESUMEN EN VIVO:
- Ingresos: $${stats.revenue.toFixed(2)} | Gastos: $${stats.expenses.toFixed(2)} | Utilidad: $${stats.profit.toFixed(2)} (margen ${stats.profitMargin.toFixed(1)}%)
- Pedidos: ${stats.totalOrders} (${stats.pendingOrders} pendientes) | Productos: ${stats.totalProducts} | Clientes: ${stats.totalCustomers}
- Proveedores activos: ${stats.activeSuppliers} | Alertas de stock: ${stats.lowStockCount}
- Top productos: ${stats.topProducts.map((p) => `${p.name} ($${p.revenue.toFixed(0)})`).join(', ')}
- Alertas NAIOS pendientes: ${alerts.length}`
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || sending) return
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content, ts: Date.now() }
    setMessages((m) => [...m, userMsg])
    setSending(true)
    try {
      const res = await fetch('/api/naios/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          businessContext: buildContext(),
        }),
      })
      const data = await res.json()
      const assistantMsg: ChatMessage = { role: 'assistant', content: data.response, ts: Date.now() }
      setMessages((m) => [...m, assistantMsg])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: '⚠️ Ocurrió un error de conexión. Inténtalo de nuevo.', ts: Date.now() }])
    } finally {
      setSending(false)
    }
  }

  const dismissAlert = async (id: string) => {
    await fetch('/api/naios/recommendations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'DISMISSED' }),
    })
    onAlertsChange()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="NAIOS"
        description="Asistente inteligente · Analiza, detecta oportunidades y riesgos, y recomienda — pero la decisión siempre es tuya."
        icon={Sparkles}
        action={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetchBriefing()}>
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar briefing
          </Button>
        }
      />

      {/* Briefing + Recommendations */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* AI Daily Briefing */}
        <Card className="lg:col-span-2 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-sm">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <CardTitle className="text-base">Briefing ejecutivo</CardTitle>
                <CardDescription>Resumen estratégico generado por IA en tiempo real</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {briefingLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="naios-markdown rounded-lg bg-muted/40 p-4 text-sm leading-relaxed">
                <ReactMarkdown>{briefing?.briefing ?? 'Briefing no disponible.'}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recomendaciones</CardTitle>
            <CardDescription>{alerts.length} pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="nexora-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary/40" />
                  Todo en orden
                </div>
              ) : (
                alerts.map((r) => (
                  <div key={r.id} className="group rounded-lg border bg-card p-2.5">
                    <div className="flex items-center gap-2">
                      <SeverityDot severity={r.severity} />
                      <NaiosTypeBadge type={r.type} />
                      <span className="ml-auto text-[10px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium leading-snug">{r.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{r.description}</p>
                    <button
                      onClick={() => dismissAlert(r.id)}
                      className="mt-1.5 text-[10px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                    >
                      Descartar
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent pb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-sm">
              <Bot className="h-4.5 w-4.5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-base">Conversación con NAIOS</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> En línea · Modo asesor
              </CardDescription>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto gap-1.5 text-xs text-muted-foreground"
                onClick={() => setMessages([])}
              >
                <Trash2 className="h-3.5 w-3.5" /> Limpiar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages */}
          <div ref={scrollRef} className="nexora-scroll h-80 overflow-y-auto p-4 sm:h-96">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-lg">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold">Hola, soy NAIOS</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Tu copiloto estratégico. Pregúntame sobre el negocio, pide análisis o recomendaciones. Tengo acceso a todos los módulos de NEXORA.
                </p>
                <div className="mt-5 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p.text}
                      onClick={() => sendMessage(p.text)}
                      className="flex items-start gap-2.5 rounded-lg border bg-card p-3 text-left text-xs transition-all hover:border-primary/40 hover:bg-muted/40"
                    >
                      <p.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm',
                        m.role === 'assistant'
                          ? 'bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground'
                          : 'bg-muted text-foreground',
                      )}
                    >
                      {m.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                        m.role === 'assistant'
                          ? 'rounded-tl-sm bg-muted/60'
                          : 'rounded-tr-sm bg-primary text-primary-foreground',
                      )}
                    >
                      {m.role === 'assistant' ? (
                        <div className="naios-markdown"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t bg-card p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Pregunta a NAIOS sobre tu negocio..."
                className="min-h-11 max-h-32 resize-none"
                rows={1}
                disabled={sending}
              />
              <Button onClick={() => sendMessage()} disabled={!input.trim() || sending} size="icon" className="h-11 w-11 shrink-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              NAIOS no toma decisiones finales. La decisión siempre pertenece al usuario.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Principles reminder */}
      <Card className="border-primary/15 bg-primary/[0.03]">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Transparencia de la IA:</span> NAIOS analiza datos reales de tu negocio (productos, proveedores, inventario, ventas, finanzas) y explica cómo llega a sus conclusiones. Nunca ejecuta acciones automáticas sin tu autorización.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
