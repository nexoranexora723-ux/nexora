import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ShoppingCart,
  CreditCard,
  Truck,
  ShieldCheck,
  Package,
  ArrowLeft,
  Mail,
  MessageCircle,
  Home as HomeIcon,
  HelpCircle,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes',
  description:
    'Respuestas a las preguntas más frecuentes sobre pedidos, pagos, envíos, seguridad y productos en NEXORA — importación desde China a Colombia.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Preguntas frecuentes | NEXORA',
    description:
      'Respuestas a las preguntas más frecuentes sobre pedidos, pagos, envíos, seguridad y productos en NEXORA — importación desde China a Colombia.',
  },
}

interface QA {
  q: string
  a: React.ReactNode
}

interface FAQCategory {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  questions: QA[]
}

const categories: FAQCategory[] = [
  {
    id: 'pedidos',
    title: 'Pedidos',
    icon: <ShoppingCart className="h-5 w-5" />,
    description: 'Cómo hacer y gestionar tus pedidos de importación.',
    questions: [
      {
        q: '¿Cómo hago un pedido?',
        a: (
          <>
            <p>
              Crear una cuenta gratuita en NEXORA, navegar el catálogo o usar el{' '}
              <strong>“Solicitar producto personalizado”</strong>. Indicas qué producto quieres, cantidad y
              presupuesto, y nuestro equipo te envía una cotización. Una vez aprobas y pagas, iniciamos la
              importación.
            </p>
          </>
        ),
      },
      {
        q: '¿Cuánto tarda en llegar?',
        a: (
          <>
            <p>
              El plazo estimado es de <strong>~22 días</strong> desde la confirmación del pago hasta la entrega.
              Esto incluye producción (5-10 días), envío internacional (7-12 días), aduana (2-4 días) y envío interno
              en Colombia (1-3 días).
            </p>
          </>
        ),
      },
      {
        q: '¿Puedo cancelar mi pedido?',
        a: (
          <>
            <p>
              Sí. Puedes cancelar sin costo dentro de las <strong>24 horas siguientes al pago</strong>. Después de ese
              plazo, si el proveedor ya inició la producción, la cancelación puede tener cargos o no ser posible.
            </p>
          </>
        ),
      },
      {
        q: '¿Cómo sé el estado de mi pedido?',
        a: (
          <>
            <p>
              En tu portal de cliente tienes una sección <strong>“Mis pedidos”</strong> con el timeline visual de cada
              solicitud: Nueva → Analizando → Buscando proveedor → Cotización → Pago → Compra → Producción → En
              tránsito → Entregado. Además, recibes notificaciones por correo en cada cambio de estado.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'pagos',
    title: 'Precios y pagos',
    icon: <CreditCard className="h-5 w-5" />,
    description: 'Métodos de pago, descuentos por volumen y conversiones.',
    questions: [
      {
        q: '¿Los precios incluyen envío?',
        a: (
          <>
            <p>
              Sí. Los precios publicados ya incluyen <strong>producto + envío internacional + aduana + IVA + margen
              de NEXORA</strong>. Lo que ves es lo que pagas (salvo recargo por zona no urbana).
            </p>
          </>
        ),
      },
      {
        q: '¿Qué métodos de pago aceptan?',
        a: (
          <>
            <p>Aceptamos:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Nequi</strong></li>
              <li><strong>Daviplata</strong></li>
              <li><strong>PayPal</strong> (para clientes internacionales)</li>
              <li><strong>Transferencia bancaria</strong> (Bancolombia)</li>
            </ul>
            <p className="mt-2">
              <strong>No aceptamos pago contraentrega</strong> — el producto se compra al proveedor en China después
              de recibir el pago.
            </p>
          </>
        ),
      },
      {
        q: '¿Puedo pagar en pesos?',
        a: (
          <>
            <p>
              Sí. Aunque los precios están en USD, pagas en pesos colombianos (COP) y la conversión se hace
              automáticamente al <strong>tipo de cambio TRM del día del pago</strong>, publicado por la
              Superintendencia Financiera.
            </p>
          </>
        ),
      },
      {
        q: '¿Tienen descuentos al por mayor?',
        a: (
          <>
            <p>Sí, los descuentos por volumen son:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>De <strong>5 a 9 unidades</strong>: <strong>10% de descuento</strong>.</li>
              <li>De <strong>10 a 19 unidades</strong>: <strong>15% de descuento</strong>.</li>
              <li>De <strong>20 o más unidades</strong>: <strong>20% de descuento</strong>.</li>
            </ul>
            <p className="mt-2">Los descuentos se aplican automáticamente en la cotización.</p>
          </>
        ),
      },
    ],
  },
  {
    id: 'envios',
    title: 'Envíos',
    icon: <Truck className="h-5 w-5" />,
    description: 'Cobertura, costos y tiempos de entrega.',
    questions: [
      {
        q: '¿Envían a toda Colombia?',
        a: (
          <>
            <p>
              Sí. Realizamos envíos a toda Colombia a través de <strong>DHL</strong> y <strong>FedEx</strong>. En
              ciudades principales la entrega es de 1 a 2 días hábiles desde Bogotá; en zonas suburbanas o rurales
              puede tardar 3 a 5 días.
            </p>
          </>
        ),
      },
      {
        q: '¿Cuánto cuesta el envío?',
        a: (
          <>
            <p>
              El envío está <strong>incluido en el precio publicado</strong>. No hay costos adicionales de envío
              nacional, salvo en zonas no urbanas o de difícil acceso, donde puede haber un recargo que se te informará
              antes de pagar.
            </p>
          </>
        ),
      },
      {
        q: '¿Puedo recoger mi pedido?',
        a: (
          <>
            <p>
              Sí. Si estás en <strong>Bogotá</strong>, puedes recoger tu pedido en nuestro punto de entrega sin costo
              adicional. Coordinamos contigo por WhatsApp cuando el producto llega a Bogotá.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'seguridad',
    title: 'Seguridad',
    icon: <ShieldCheck className="h-5 w-5" />,
    description: 'Confianza, garantías y manejo de datos.',
    questions: [
      {
        q: '¿Son productos originales?',
        a: (
          <>
            <p>
              Algunos productos son <strong>réplicas premium</strong> (no originales) y otros son productos{' '}
              <strong>genéricos OEM</strong>. Esto se indica claramente en cada ficha del catálogo. Trabajamos con{' '}
              <strong>transparencia total</strong>: nunca vendemos una réplica haciéndola pasar por original.
            </p>
          </>
        ),
      },
      {
        q: '¿Es seguro comprar?',
        a: (
          <>
            <p>
              Sí. NEXORA cumple con los siguientes estándares de seguridad:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>HTTPS/TLS</strong> en todo el sitio (cifrado de extremo a extremo).</li>
              <li><strong>No almacenamos datos de tarjetas</strong>. Los pagos se procesan a través de pasarelas externas (PayPal, Nequi, Daviplata, Bancolombia).</li>
              <li><strong>Garantía de 30 días</strong> sobre defectos de fabricación, ampliable según el producto.</li>
              <li><strong>Proveedores verificados</strong> en China, con calificación multifactor.</li>
              <li><strong>Cumplimiento de la Ley 1581 de 2012</strong> (protección de datos personales).</li>
            </ul>
          </>
        ),
      },
      {
        q: '¿Qué pasa si viene defectuoso?',
        a: (
          <>
            <p>
              Tienes <strong>48 horas desde la recepción</strong> para reportarlo a{' '}
              <a className="text-primary hover:underline" href="mailto:info@nexora.co">info@nexora.co</a> con fotos del
              defecto. Evaluamos tu caso y, si procede, aplicamos <strong>reembolso, cambio o crédito</strong> según tu
              preferencia. La garantía legal cubre defectos de fabricación durante <strong>1 año</strong>.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'productos',
    title: 'Productos',
    icon: <Package className="h-5 w-5" />,
    description: 'Sobre el catálogo, fotos y disponibilidad.',
    questions: [
      {
        q: '¿Las fotos son reales?',
        a: (
          <>
            <p>
              Sí. Cada producto del catálogo incluye entre <strong>9 y 10 fotos reales</strong> tomadas al producto
              físico antes de publicarlo. Esto te permite apreciar acabados, materiales y detalles antes de comprar.
            </p>
          </>
        ),
      },
      {
        q: '¿Qué tallas tienen?',
        a: (
          <>
            <p>
              Depende del tipo de producto:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Calzado</strong>: tallas del <strong>38 al 45</strong> (EU).</li>
              <li><strong>Ropa</strong>: tallas <strong>S, M, L, XL, XXL</strong>.</li>
              <li><strong>Otros productos</strong>: revisa la ficha de cada producto para ver las tallas o variantes disponibles.</li>
            </ul>
            <p className="mt-2">
              Si necesitas una talla fuera de este rango, pídelo en “Solicitar producto personalizado”.
            </p>
          </>
        ),
      },
      {
        q: '¿Puedo pedir un producto que no está?',
        a: (
          <>
            <p>
              ¡Sí! Esa es una de las ventajas de NEXORA. Usa la opción{' '}
              <strong>“Solicitar producto personalizado”</strong>, describe el producto (o pega un enlace de Alibaba,
              AliExpress, Yupoo, etc.) y nuestro equipo lo buscará con proveedores verificados. Te enviamos una
              cotización sin compromiso.
            </p>
          </>
        ),
      },
    ],
  },
]

export default function FAQPage() {
  const totalQuestions = categories.reduce((acc, c) => acc + c.questions.length, 0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm">
              <span className="text-sm font-black">N</span>
            </div>
            <span className="font-bold tracking-tight">NEXORA</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/">Ver catálogo</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ===== HEADER ===== */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Preguntas frecuentes</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Respuestas a las dudas más comunes sobre pedidos, pagos, envíos, seguridad y productos. Si no encuentras lo
            que buscas, contáctanos y te ayudamos.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {totalQuestions} preguntas en {categories.length} categorías
          </p>
        </div>
      </section>

      {/* ===== QUICK CATEGORIES NAV ===== */}
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-4 py-4 sm:px-6 lg:px-8">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {c.icon}
              {c.title}
            </a>
          ))}
        </div>
      </div>

      {/* ===== ACCORDIONS ===== */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl space-y-12 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          {categories.map((category) => (
            <section key={category.id} id={category.id} className="scroll-mt-24">
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {category.icon}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">{category.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>

              <Accordion type="single" collapsible className="rounded-xl border bg-card px-4 shadow-sm sm:px-6">
                {category.questions.map((qa, idx) => (
                  <AccordionItem key={`${category.id}-${idx}`} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left text-base font-medium">
                      {qa.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      <div className="space-y-2">{qa.a}</div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}

          {/* ===== CONTACT CTA ===== */}
          <section className="rounded-2xl border bg-gradient-to-br from-primary to-blue-700 p-8 text-center text-primary-foreground shadow-lg sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">¿No encuentras tu respuesta?</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm opacity-90 sm:text-base">
              Nuestro equipo está listo para ayudarte. Escríbenos y te respondemos en menos de 24 horas.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <a href="mailto:info@nexora.co">
                  <Mail className="h-4 w-4" /> Escríbenos
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <a href="https://wa.me/573105550100" target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
            </div>
          </section>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t bg-muted/30 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
                  <span className="text-sm font-black">N</span>
                </div>
                <span className="font-bold">NEXORA</span>
              </div>
              <p className="max-w-xs text-sm text-muted-foreground">
                Plataforma inteligente de importación desde China. Tú eliges el producto, nosotros nos encargamos del resto.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/terminos" className="hover:text-foreground">
                    Términos y condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/privacidad" className="hover:text-foreground">
                    Política de privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/devoluciones" className="hover:text-foreground">
                    Devoluciones y garantías
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-foreground">
                    Preguntas frecuentes
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold">Contacto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> info@nexora.co
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-3.5 w-3.5" /> +57 310 555 0100
                </li>
                <li className="flex items-center gap-2">
                  <HomeIcon className="h-3.5 w-3.5" /> Bogotá, Colombia
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            © 2025 NEXORA Importaciones S.A.S. — NIT 901.234.567-8. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
