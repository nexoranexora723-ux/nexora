// NEXORA — Import Platform Types

export type Portal = 'public' | 'client' | 'admin'
export type ModuleKey =
  | 'landing' | 'catalog' | 'how-it-works' | 'about' | 'contact'
  | 'client-dashboard' | 'client-requests' | 'client-tracking' | 'client-profile'
  | 'admin-dashboard' | 'admin-requests' | 'admin-suppliers' | 'admin-quotes'
  | 'admin-imports' | 'admin-products' | 'admin-finance' | 'admin-naios'
  | 'admin-users' | 'admin-settings'

export type UserRole = 'CLIENT' | 'RESELLER' | 'EMPLOYEE' | 'ADMIN' | 'SUPER_ADMIN'

export const REQUEST_STATUSES = [
  'NUEVA', 'ANALIZANDO', 'BUSCANDO_PROVEEDOR', 'COTIZACION_RECIBIDA',
  'COTIZACION_ENVIADA', 'ESPERANDO_APROBACION', 'PAGO_RECIBIDO',
  'COMPRA_REALIZADA', 'PRODUCCION', 'EN_TRANSITO', 'ENTREGADO', 'CERRADO',
] as const

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  NUEVA: 'Nueva',
  ANALIZANDO: 'Analizando',
  BUSCANDO_PROVEEDOR: 'Buscando proveedor',
  COTIZACION_RECIBIDA: 'Cotización recibida',
  COTIZACION_ENVIADA: 'Cotización enviada',
  ESPERANDO_APROBACION: 'Esperando aprobación',
  PAGO_RECIBIDO: 'Pago recibido',
  COMPRA_REALIZADA: 'Compra realizada',
  PRODUCCION: 'En producción',
  EN_TRANSITO: 'En tránsito',
  ENTREGADO: 'Entregado',
  CERRADO: 'Cerrado',
}

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  NUEVA: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900',
  ANALIZANDO: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-900',
  BUSCANDO_PROVEEDOR: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  COTIZACION_RECIBIDA: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  COTIZACION_ENVIADA: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
  ESPERANDO_APROBACION: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  PAGO_RECIBIDO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  COMPRA_REALIZADA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  PRODUCCION: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900',
  EN_TRANSITO: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  ENTREGADO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  CERRADO: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
}

export interface ImportRequest {
  id: string
  number: string
  clientId: string
  client: { id: string; firstName: string; lastName: string; email: string; phone: string | null }
  assignedToId: string | null
  assignee: { id: string; firstName: string; lastName: string } | null
  productName: string
  description: string | null
  category: string | null
  purpose: string | null
  quantity: number
  budget: number | null
  currencyCode: string
  referenceUrl: string | null
  referenceImages: string | null
  details: string | null
  priority: string
  naiosSummary: string | null
  naiosCategory: string | null
  naiosPriority: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
  quotes?: Quote[]
  imports?: Import[]
}

export interface Quote {
  id: string
  number: string
  requestId: string
  supplierId: string
  supplier: { id: string; companyName: string }
  unitPrice: number
  quantity: number
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  currencyCode: string
  leadTime: number | null
  warranty: string | null
  validity: string | null
  status: string
  notes: string | null
  createdAt: string
}

export interface Import {
  id: string
  number: string
  requestId: string
  supplierId: string
  supplier: { id: string; companyName: string }
  productCost: number
  shippingCost: number
  customsCost: number
  otherCosts: number
  totalCost: number
  salePrice: number
  profit: number
  currencyCode: string
  status: string
  purchasedAt: string | null
  productionEndsAt: string | null
  shippedAt: string | null
  arrivedAt: string | null
  deliveredAt: string | null
  carrier: string | null
  trackingNumber: string | null
  billOfLading: string | null
  incoterm: string | null
  notes: string | null
  createdAt: string
}

export interface Supplier {
  id: string
  companyName: string
  contactName: string | null
  whatsapp: string | null
  wechat: string | null
  email: string | null
  website: string | null
  country: string | null
  city: string | null
  moq: number | null
  leadTime: number | null
  productionTime: number | null
  warranty: string | null
  oem: boolean
  odm: boolean
  status: string
  riskLevel: string
  rating?: { overallScore: number; communicationScore: number; qualityScore: number; priceScore: number; shippingScore: number; warrantyScore: number; trustScore: number; review: string | null } | null
  quoteCount?: number
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  brand: { id: string; name: string } | null
  category: { id: string; name: string; icon: string | null } | null
  supplier: { id: string; companyName: string } | null
  imageUrl: string | null
  referenceUrl: string | null
  estimatedCost: number | null
  suggestedPrice: number | null
  currencyCode: string
  isFeatured: boolean
  status: string
  specs?: { label: string; value: string }[]
  features?: string[]
  images?: string[]
  videoUrl?: string | null
  rating?: number
  reviewCount?: number
  soldCount?: number
}

export interface DashboardStats {
  newRequests: number
  activeRequests: number
  pendingQuotes: number
  activeImports: number
  revenue: number
  expenses: number
  profit: number
  totalClients: number
  activeSuppliers: number
  requestsByStatus: { status: string; count: number }[]
  recentRequests: ImportRequest[]
  revenueByDay?: { revenue: number }[]
}

export interface NaiosRecommendation {
  id: string
  type: string
  severity: string
  title: string
  description: string
  module: string
  action: string | null
  status: string
  createdAt: string
}

export interface Notification {
  id: string
  type: string
  priority: string
  title: string
  message: string
  readAt: string | null
  createdAt: string
}
