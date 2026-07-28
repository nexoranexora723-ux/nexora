// NEXORA — Integration Service
// External connectors hub: list providers, connect/disconnect, simulate test.
// Per DOC-002 §7, §12 "Regla de Oro" — route handlers delegate here.
import { db } from '@/lib/db'
import {
  CreateIntegrationInput,
  UpdateIntegrationInput,
  IntegrationQuery,
  IntegrationCategory,
  IntegrationProvider,
} from '@/lib/schemas/integration.schema'

export interface IntegrationView {
  id: string
  companyId: string
  provider: IntegrationProvider
  category: IntegrationCategory
  name: string
  config: Record<string, unknown>
  status: string
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
  _count?: { logs: number }
}

export interface IntegrationLogView {
  id: string
  integrationId: string
  direction: string
  request: Record<string, unknown> | null
  response: Record<string, unknown> | null
  statusCode: number | null
  duration: number | null
  status: string
  error: string | null
  createdAt: string
}

// ============================================================================
// PROVIDERS REGISTRY (grouped by category, with metadata)
// ============================================================================
export interface ProviderMeta {
  provider: string
  category: IntegrationCategory
  displayName: string
  description: string
  icon: string // emoji or lucide name token
  fields: { key: string; label: string; type: 'text' | 'password' | 'url' | 'textarea'; required: boolean; placeholder?: string }[]
}

export const PROVIDERS: ProviderMeta[] = [
  // E-commerce
  {
    provider: 'shopify',
    category: 'ecommerce',
    displayName: 'Shopify',
    description: 'Sincroniza catálogo, pedidos y stock con tu tienda Shopify.',
    icon: '🛍️',
    fields: [
      { key: 'shopDomain', label: 'Shop domain', type: 'text', required: true, placeholder: 'mystore.myshopify.com' },
      { key: 'apiKey', label: 'API key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API secret', type: 'password', required: true },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: false },
    ],
  },
  {
    provider: 'woocommerce',
    category: 'ecommerce',
    displayName: 'WooCommerce',
    description: 'Conecta tu tienda WooCommerce (WordPress).',
    icon: '🛒',
    fields: [
      { key: 'storeUrl', label: 'URL de la tienda', type: 'url', required: true, placeholder: 'https://mi-tienda.com' },
      { key: 'consumerKey', label: 'Consumer key', type: 'text', required: true },
      { key: 'consumerSecret', label: 'Consumer secret', type: 'password', required: true },
    ],
  },
  {
    provider: 'mercadolibre',
    category: 'ecommerce',
    displayName: 'Mercado Libre',
    description: 'Vende y sincroniza en Mercado Libre.',
    icon: '🟡',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client secret', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh token', type: 'password', required: false },
    ],
  },
  // Payments
  {
    provider: 'stripe',
    category: 'payments',
    displayName: 'Stripe',
    description: 'Procesa pagos, suscripciones y reembolsos.',
    icon: '💳',
    fields: [
      { key: 'publishableKey', label: 'Publishable key', type: 'text', required: true, placeholder: 'pk_live_...' },
      { key: 'secretKey', label: 'Secret key', type: 'password', required: true, placeholder: 'sk_live_...' },
      { key: 'webhookSecret', label: 'Webhook secret', type: 'password', required: false },
    ],
  },
  {
    provider: 'paypal',
    category: 'payments',
    displayName: 'PayPal',
    description: 'Acepta pagos con PayPal y tarjetas.',
    icon: '🅿️',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client secret', type: 'password', required: true },
      { key: 'mode', label: 'Modo (sandbox/live)', type: 'text', required: true, placeholder: 'sandbox' },
    ],
  },
  {
    provider: 'mercadopago',
    category: 'payments',
    displayName: 'Mercado Pago',
    description: 'Procesa pagos en LATAM con Mercado Pago.',
    icon: '💚',
    fields: [
      { key: 'accessToken', label: 'Access token', type: 'password', required: true },
      { key: 'publicKey', label: 'Public key', type: 'text', required: false },
    ],
  },
  // Logistics
  {
    provider: 'dhl',
    category: 'logistics',
    displayName: 'DHL',
    description: 'Crea envíos y rastrea paquetes con DHL.',
    icon: '🚚',
    fields: [
      { key: 'apiKey', label: 'API key', type: 'password', required: true },
      { key: 'apiSecret', label: 'API secret', type: 'password', required: true },
      { key: 'accountNumber', label: 'Número de cuenta', type: 'text', required: true },
    ],
  },
  {
    provider: 'fedex',
    category: 'logistics',
    displayName: 'FedEx',
    description: 'Integra envíos y tracking con FedEx.',
    icon: '📦',
    fields: [
      { key: 'apiKey', label: 'API key', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret key', type: 'password', required: true },
      { key: 'accountNumber', label: 'Número de cuenta', type: 'text', required: true },
    ],
  },
  {
    provider: 'envia',
    category: 'logistics',
    displayName: 'Envía.com',
    description: 'Mensajería y logística urbana LATAM.',
    icon: '🛵',
    fields: [
      { key: 'apiToken', label: 'API token', type: 'password', required: true },
      { key: 'carrier', label: 'Carrier preferido', type: 'text', required: false },
    ],
  },
  // Messaging
  {
    provider: 'whatsapp',
    category: 'messaging',
    displayName: 'WhatsApp Business',
    description: 'Envía notificaciones por WhatsApp Cloud API.',
    icon: '💬',
    fields: [
      { key: 'phoneNumberId', label: 'Phone number ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access token', type: 'password', required: true },
      { key: 'webhookVerifyToken', label: 'Webhook verify token', type: 'password', required: false },
    ],
  },
  {
    provider: 'slack',
    category: 'messaging',
    displayName: 'Slack',
    description: 'Publica alertas y reportes en canales Slack.',
    icon: '📢',
    fields: [
      { key: 'botToken', label: 'Bot token (xoxb-)', type: 'password', required: true },
      { key: 'defaultChannel', label: 'Canal por defecto', type: 'text', required: false, placeholder: '#alerts' },
    ],
  },
  {
    provider: 'telegram',
    category: 'messaging',
    displayName: 'Telegram',
    description: 'Notificaciones por Telegram Bot.',
    icon: '✈️',
    fields: [
      { key: 'botToken', label: 'Bot token', type: 'password', required: true },
      { key: 'chatId', label: 'Chat ID por defecto', type: 'text', required: false },
    ],
  },
  // Email
  {
    provider: 'gmail',
    category: 'email',
    displayName: 'Gmail',
    description: 'Envía y recibe email vía Gmail SMTP / API.',
    icon: '📧',
    fields: [
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'OAuth Client secret', type: 'password', required: true },
      { key: 'fromAddress', label: 'Dirección remitente', type: 'text', required: true, placeholder: 'ventas@nexora.co' },
    ],
  },
  {
    provider: 'sendgrid',
    category: 'email',
    displayName: 'SendGrid',
    description: 'Email transaccional y campañas a escala.',
    icon: '📨',
    fields: [
      { key: 'apiKey', label: 'API key', type: 'password', required: true, placeholder: 'SG.xxx' },
      { key: 'fromEmail', label: 'Email remitente', type: 'text', required: true },
      { key: 'fromName', label: 'Nombre remitente', type: 'text', required: false },
    ],
  },
  {
    provider: 'mailgun',
    category: 'email',
    displayName: 'Mailgun',
    description: 'API de email para desarrolladores.',
    icon: '📬',
    fields: [
      { key: 'apiKey', label: 'API key', type: 'password', required: true },
      { key: 'domain', label: 'Dominio', type: 'text', required: true, placeholder: 'mg.nexora.co' },
    ],
  },
  // AI
  {
    provider: 'openai',
    category: 'ai',
    displayName: 'OpenAI',
    description: 'GPT-4, DALL·E y embeddings para NAIOS.',
    icon: '🤖',
    fields: [
      { key: 'apiKey', label: 'API key', type: 'password', required: true, placeholder: 'sk-...' },
      { key: 'organization', label: 'Organization ID', type: 'text', required: false },
      { key: 'defaultModel', label: 'Modelo por defecto', type: 'text', required: false, placeholder: 'gpt-4o' },
    ],
  },
  {
    provider: 'anthropic',
    category: 'ai',
    displayName: 'Anthropic',
    description: 'Modelos Claude para NAIOS y automatizaciones.',
    icon: '🧠',
    fields: [
      { key: 'apiKey', label: 'API key', type: 'password', required: true, placeholder: 'sk-ant-...' },
      { key: 'defaultModel', label: 'Modelo por defecto', type: 'text', required: false, placeholder: 'claude-3-5-sonnet' },
    ],
  },
  // Storage
  {
    provider: 's3',
    category: 'storage',
    displayName: 'AWS S3',
    description: 'Almacenamiento de archivos y backups.',
    icon: '🗄️',
    fields: [
      { key: 'accessKeyId', label: 'Access key ID', type: 'text', required: true },
      { key: 'secretAccessKey', label: 'Secret access key', type: 'password', required: true },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
      { key: 'region', label: 'Región', type: 'text', required: true, placeholder: 'us-east-1' },
    ],
  },
  {
    provider: 'r2',
    category: 'storage',
    displayName: 'Cloudflare R2',
    description: 'Object storage compatible con S3, sin egress.',
    icon: '🔶',
    fields: [
      { key: 'accountId', label: 'Account ID', type: 'text', required: true },
      { key: 'accessKeyId', label: 'Access key ID', type: 'text', required: true },
      { key: 'secretAccessKey', label: 'Secret access key', type: 'password', required: true },
      { key: 'bucket', label: 'Bucket', type: 'text', required: true },
    ],
  },
  {
    provider: 'supabase',
    category: 'storage',
    displayName: 'Supabase Storage',
    description: 'Storage + Auth + Postgres en un solo SDK.',
    icon: '⚡',
    fields: [
      { key: 'projectUrl', label: 'Project URL', type: 'url', required: true },
      { key: 'anonKey', label: 'Anon key', type: 'password', required: true },
      { key: 'bucket', label: 'Bucket', type: 'text', required: false },
    ],
  },
]

export const PROVIDERS_BY_CATEGORY: Record<IntegrationCategory, ProviderMeta[]> = PROVIDERS.reduce(
  (acc, p) => {
    ;(acc[p.category] ||= []).push(p)
    return acc
  },
  {} as Record<IntegrationCategory, ProviderMeta[]>,
)

export function getProviderMeta(provider: string): ProviderMeta | undefined {
  return PROVIDERS.find((p) => p.provider === provider)
}

// ============================================================================
// HELPERS
// ============================================================================
function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function enrich(i: {
  id: string
  companyId: string
  provider: string
  category: string
  name: string
  config: string | null
  status: string
  lastSyncAt: Date | null
  createdAt: Date
  updatedAt: Date
  _count?: { logs: number }
}): IntegrationView {
  return {
    id: i.id,
    companyId: i.companyId,
    provider: i.provider,
    category: i.category,
    name: i.name,
    config: parseJson<Record<string, unknown>>(i.config, {}),
    status: i.status,
    lastSyncAt: i.lastSyncAt ? new Date(i.lastSyncAt).toISOString() : null,
    createdAt: new Date(i.createdAt).toISOString(),
    updatedAt: new Date(i.updatedAt).toISOString(),
    _count: i._count,
  }
}

function enrichLog(l: {
  id: string
  integrationId: string
  direction: string
  request: string | null
  response: string | null
  statusCode: number | null
  duration: number | null
  status: string
  error: string | null
  createdAt: Date
}): IntegrationLogView {
  return {
    id: l.id,
    integrationId: l.integrationId,
    direction: l.direction,
    request: parseJson<Record<string, unknown> | null>(l.request, null),
    response: parseJson<Record<string, unknown> | null>(l.response, null),
    statusCode: l.statusCode,
    duration: l.duration,
    status: l.status,
    error: l.error,
    createdAt: new Date(l.createdAt).toISOString(),
  }
}

function buildOrderBy(sort: IntegrationQuery['sort']) {
  switch (sort) {
    case 'name': return { name: 'asc' as const }
    case 'name_desc': return { name: 'desc' as const }
    case 'created': return { createdAt: 'asc' as const }
    case 'last_sync': return { lastSyncAt: 'desc' as const }
    case 'created_desc':
    default: return { createdAt: 'desc' as const }
  }
}

// ============================================================================
// SERVICE
// ============================================================================
export class IntegrationService {
  static async list(
    query: IntegrationQuery,
    companyId: string,
  ): Promise<IntegrationView[]> {
    const where: Record<string, unknown> = { companyId }
    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { provider: { contains: query.q } },
      ]
    }
    if (query.category) where.category = query.category
    if (query.provider) where.provider = query.provider
    if (query.status) where.status = query.status

    const items = await db.integration.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
      include: { _count: { select: { logs: true } } },
    })
    return items.map(enrich)
  }

  static async getById(id: string): Promise<IntegrationView | null> {
    const i = await db.integration.findUnique({
      where: { id },
      include: { _count: { select: { logs: true } } },
    })
    return i ? enrich(i) : null
  }

  static async create(
    input: CreateIntegrationInput,
    companyId: string,
  ): Promise<IntegrationView> {
    const i = await db.integration.create({
      data: {
        companyId,
        provider: input.provider,
        category: input.category,
        name: input.name,
        config: JSON.stringify(input.config ?? {}),
        status: 'DISCONNECTED',
      },
      include: { _count: { select: { logs: true } } },
    })
    return enrich(i)
  }

  static async update(
    id: string,
    input: UpdateIntegrationInput,
  ): Promise<IntegrationView> {
    const existing = await db.integration.findUnique({ where: { id } })
    if (!existing) throw new Error('Integración no encontrada')

    const data: Record<string, unknown> = {}
    if (input.name !== undefined) data.name = input.name
    if (input.config !== undefined) data.config = JSON.stringify(input.config)
    if (input.status !== undefined) data.status = input.status

    const i = await db.integration.update({
      where: { id },
      data,
      include: { _count: { select: { logs: true } } },
    })
    return enrich(i)
  }

  static async delete(id: string): Promise<void> {
    await db.integration.delete({ where: { id } })
  }

  static async connect(id: string): Promise<IntegrationView> {
    const existing = await db.integration.findUnique({ where: { id } })
    if (!existing) throw new Error('Integración no encontrada')
    const i = await db.integration.update({
      where: { id },
      data: { status: 'CONNECTED', lastSyncAt: new Date() },
      include: { _count: { select: { logs: true } } },
    })
    return enrich(i)
  }

  static async disconnect(id: string): Promise<IntegrationView> {
    const existing = await db.integration.findUnique({ where: { id } })
    if (!existing) throw new Error('Integración no encontrada')
    const i = await db.integration.update({
      where: { id },
      data: { status: 'DISCONNECTED' },
      include: { _count: { select: { logs: true } } },
    })
    return enrich(i)
  }

  static async getLogs(
    integrationId: string,
    limit = 30,
  ): Promise<IntegrationLogView[]> {
    const items = await db.integrationLog.findMany({
      where: { integrationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return items.map(enrichLog)
  }

  /**
   * Simulated test connection: writes a synthetic log and returns success.
   * In a real engine this would actually call the provider's health endpoint.
   */
  static async testConnection(id: string): Promise<{
    ok: boolean
    statusCode: number
    durationMs: number
    message: string
  }> {
    const integration = await db.integration.findUnique({ where: { id } })
    if (!integration) throw new Error('Integración no encontrada')

    const start = Date.now()
    // Simulate latency
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600))
    const durationMs = Date.now() - start
    const ok = true
    const statusCode = 200
    const message = `Conexión exitosa con ${integration.name} (${integration.provider}).`

    await db.integrationLog.create({
      data: {
        integrationId: id,
        direction: 'out',
        request: JSON.stringify({ action: 'test_connection' }),
        response: JSON.stringify({ ok, statusCode, durationMs }),
        statusCode,
        duration: durationMs,
        status: ok ? 'SUCCESS' : 'ERROR',
        error: ok ? null : 'Test failed',
      },
    })

    if (ok) {
      await db.integration.update({
        where: { id },
        data: { status: 'CONNECTED', lastSyncAt: new Date() },
      })
    } else {
      await db.integration.update({
        where: { id },
        data: { status: 'ERROR' },
      })
    }

    return { ok, statusCode, durationMs, message }
  }

  static async stats(companyId: string): Promise<{
    total: number
    active: number
    errors: number
    byCategory: { category: string; count: number }[]
    syncsToday: number
  }> {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
    const [total, active, errors, syncsToday, byCategoryRaw] = await Promise.all([
      db.integration.count({ where: { companyId } }),
      db.integration.count({ where: { companyId, status: 'CONNECTED' } }),
      db.integration.count({ where: { companyId, status: 'ERROR' } }),
      db.integrationLog.count({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startOfToday },
          integration: { companyId },
        },
      }),
      db.integration.groupBy({
        by: ['category'],
        where: { companyId },
        _count: { category: true },
      }),
    ])
    return {
      total,
      active,
      errors,
      syncsToday,
      byCategory: byCategoryRaw.map((r) => ({
        category: r.category,
        count: r._count.category,
      })),
    }
  }
}
