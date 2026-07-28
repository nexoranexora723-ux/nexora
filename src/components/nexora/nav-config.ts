import {
  Store, LayoutDashboard, Sparkles, Package, Warehouse, Truck, ShoppingCart,
  Receipt, Users, Wallet, Settings, Shield, KeyRound, LucideIcon,
} from 'lucide-react'
import { ModuleKey } from '@/lib/types'

export interface NavItem {
  key: ModuleKey
  label: string
  icon: LucideIcon
  description: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Tienda',
    items: [
      { key: 'store', label: 'Tienda NEXORA', icon: Store, description: 'Catálogo público y ventas' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Visión general del negocio' },
      { key: 'naios', label: 'NAIOS', icon: Sparkles, description: 'Asistente inteligente' },
    ],
  },
  {
    label: 'Operación',
    items: [
      { key: 'products', label: 'Productos', icon: Package, description: 'Catálogo y márgenes' },
      { key: 'inventory', label: 'Inventario', icon: Warehouse, description: 'Existencias y stock' },
      { key: 'suppliers', label: 'Proveedores', icon: Truck, description: 'Abastecimiento y ratings' },
      { key: 'purchases', label: 'Compras', icon: ShoppingCart, description: 'Órdenes a proveedores' },
    ],
  },
  {
    label: 'Ventas',
    items: [
      { key: 'orders', label: 'Pedidos', icon: Receipt, description: 'Órdenes de venta' },
      { key: 'customers', label: 'Clientes', icon: Users, description: 'CRM y segmentación' },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { key: 'finance', label: 'Finanzas', icon: Wallet, description: 'Ingresos, gastos, flujo' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { key: 'users', label: 'Usuarios', icon: Users, description: 'Gestión de usuarios y acceso' },
      { key: 'roles', label: 'Roles y Permisos', icon: Shield, description: 'RBAC · Control de permisos' },
      { key: 'settings', label: 'Configuración', icon: Settings, description: 'Ajustes de la empresa' },
    ],
  },
]

export const NAV_MAP: Record<ModuleKey, NavItem> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items).map((i) => [i.key, i]),
) as Record<ModuleKey, NavItem>
