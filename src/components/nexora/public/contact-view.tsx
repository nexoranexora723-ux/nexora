'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Send, CheckCircle2, Clock, Globe } from 'lucide-react'

export function ContactView({ onNavigate, onLogin }: { onNavigate: (v: string) => void; onLogin: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate sending
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    }, 4000)
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
              <span className="text-sm font-black">N</span>
            </div>
            <span className="font-bold">NEXORA</span>
          </div>
          <Button size="sm" variant="ghost" onClick={onLogin}>Iniciar sesión</Button>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Contáctanos</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            ¿Tienes preguntas? Estamos aquí para ayudarte. Nuestro equipo te responde en menos de 24 horas.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Form */}
          <Card>
            <CardContent className="p-6">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">¡Mensaje enviado!</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Te responderemos en menos de 24 horas.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-semibold">Envíanos un mensaje</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nombre *</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Teléfono</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+57 300..." />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Correo electrónico *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Asunto</Label>
                    <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="¿En qué podemos ayudarte?" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Mensaje *</Label>
                    <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} required placeholder="Cuéntanos qué necesitas..." />
                  </div>
                  <Button type="submit" className="w-full gap-1.5">
                    <Send className="h-4 w-4" /> Enviar mensaje
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Contact info */}
          <div className="space-y-4">
            <Card><CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Información de contacto</h3>
              <div className="space-y-4">
                <a href="mailto:info@nexora.co" className="flex items-center gap-3 transition-colors hover:text-primary">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div>
                  <div><p className="text-xs text-muted-foreground">Correo</p><p className="text-sm font-medium">info@nexora.co</p></div>
                </a>
                <a href="https://wa.me/573105550100" target="_blank" rel="noreferrer" className="flex items-center gap-3 transition-colors hover:text-primary">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><MessageCircle className="h-5 w-5" /></div>
                  <div><p className="text-xs text-muted-foreground">WhatsApp</p><p className="text-sm font-medium">+57 310 555 0100</p></div>
                </a>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></div>
                  <div><p className="text-xs text-muted-foreground">Dirección</p><p className="text-sm font-medium">Bogotá, Colombia</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Clock className="h-5 w-5" /></div>
                  <div><p className="text-xs text-muted-foreground">Horario</p><p className="text-sm font-medium">Lun-Vie 9:00-18:00</p></div>
                </div>
              </div>
            </CardContent></Card>

            <Card className="border-primary/20 bg-primary/5"><CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold">¿Prefieres que te contactemos?</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Crea una cuenta y solicita una cotización. Nuestro equipo te contactará con una propuesta personalizada.</p>
                  <Button size="sm" className="mt-3" onClick={() => onNavigate('register')}>Crear cuenta</Button>
                </div>
              </div>
            </CardContent></Card>

            <Card><CardContent className="p-6">
              <h3 className="mb-3 text-sm font-semibold">Preguntas frecuentes</h3>
              <div className="space-y-3">
                {[
                  { q: '¿Cuánto tarda una importación?', a: 'Generalmente entre 15 y 30 días desde que se aprueba la cotización.' },
                  { q: '¿Cuál es el mínimo de unidades?', a: 'Depende del proveedor. Algunos desde 1 unidad, otros desde 50.' },
                  { q: '¿Mis productos tienen garantía?', a: 'Sí, todos los productos incluyen garantía del proveedor (1 a 12 meses).' },
                  { q: '¿Puedo ver el producto antes de pagar?', a: 'Te enviamos fotos y videos del producto real antes de que pagues.' },
                ].map((faq) => (
                  <details key={faq.q} className="group rounded-lg border p-3">
                    <summary className="cursor-pointer text-xs font-medium">{faq.q}</summary>
                    <p className="mt-2 text-xs text-muted-foreground">{faq.a}</p>
                  </details>
                ))}
              </div>
            </CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  )
}
