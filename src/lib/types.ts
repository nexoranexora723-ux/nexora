// NEXORA — Shared domain types (per DOC-006 entity specs)

export type ModuleKey =
  | 'store'
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'suppliers'
  | 'purchases'
  | 'orders'
  | 'customers'
  | 'finance'
  | 'naios'
  | 'settings'

export type Role =
  | 'CEO'
  | 'ADMIN'
  | 'COMPRAS'
  | 'VENTAS'
  | 'INVENTARIO'
  | 'MARKETING'
  | 'FINANZAS'
  | 'SOPORTE'

export type EntityStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'VIP'
  | 'DISCONTINUED'
  | 'BLACKLISTED'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'PAID'
  | 'DELIVERED'
  | 'REFUNDED'

export type NaiosType = 'ALERT' | 'OPPORTUNITY' | 'RISK' | 'INSIGHT'
export type NaiosSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Product {
  id: string
  sku: string
  name: string
  description: string | null
  brand: { id: string; name: string } | null
  category: { id: string; name: string } | null
  supplier: { id: string; companyName: string } | null
  weight: number | null
  material: string | null
  warranty: string | null
  purchasePrice: number
  salePrice: number
  currencyCode: string
  status: string
  imageUrl: string | null
  createdAt: string
  // computed
  margin?: number
  marginPct?: number
  stock?: number
  available?: number
  minStock?: number
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
  paymentMethods: string | null
  shippingMethods: string | null
  warranty: string | null
  leadTime: number | null
  productionTime: number | null
  oem: boolean
  odm: boolean
  status: string
  riskLevel: string
  rating?: SupplierRating | null
  productCount?: number
}

export interface SupplierRating {
  communicationScore: number
  qualityScore: number
  priceScore: number
  shippingScore: number
  warrantyScore: number
  trustScore: number
  overallScore: number
  review: string | null
}

export interface InventoryItem {
  id: string
  product: Product
  warehouse: { id: string; name: string; code: string }
  stock: number
  reserved: number
  available: number
  minStock: number
  location: string | null
  status: 'OUT' | 'LOW' | 'OK'
}

export interface PurchaseOrder {
  id: string
  number: string
  status: string
  supplier: { id: string; companyName: string; country: string | null }
  items: { id: string; product: { id: string; name: string; sku: string }; quantity: number; unitCost: number; totalCost: number }[]
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  currencyCode: string
  expectedDate: string | null
  receivedDate: string | null
  notes: string | null
  createdAt: string
}

export interface Order {
  id: string
  number: string
  status: string
  customer: { id: string; firstName: string; lastName: string; email: string; city: string | null }
  items: { id: string; product: { id: string; name: string; sku: string }; quantity: number; unitPrice: number; total: number }[]
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  total: number
  currencyCode: string
  paymentMethod: string | null
  trackingNumber: string | null
  createdAt: string
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  country: string | null
  city: string | null
  address: string | null
  tags: string | null
  status: string
  lifetimeValue: number
  totalOrders: number
  createdAt: string
}

export interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  description: string
  amount: number
  currencyCode: string
  reference: string | null
  date: string
}

export interface NaiosRecommendation {
  id: string
  type: NaiosType
  severity: NaiosSeverity
  title: string
  description: string
  module: string
  action: string | null
  status: string
  createdAt: string
}

export interface DashboardStats {
  revenue: number
  expenses: number
  profit: number
  profitMargin: number
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  lowStockCount: number
  totalCustomers: number
  activeSuppliers: number
  // series
  revenueByDay: { date: string; revenue: number; expenses: number }[]
  ordersByStatus: { status: string; count: number }[]
  topProducts: { id: string; name: string; sku: string; sold: number; revenue: number }[]
  categoryRevenue: { category: string; revenue: number }[]
}
