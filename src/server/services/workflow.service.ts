// NEXORA — Workflow Service
// Automation engine: IF trigger THEN actions (with optional conditions).
// Per DOC-002 §7, §12 "Regla de Oro" — route handlers delegate here.
import { db } from '@/lib/db'
import {
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowQuery,
  WorkflowCondition,
  WorkflowAction,
  WorkflowTrigger,
} from '@/lib/schemas/workflow.schema'

export interface WorkflowView {
  id: string
  companyId: string
  name: string
  description: string | null
  triggerType: WorkflowTrigger
  triggerConfig: Record<string, unknown> | null
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  status: string
  lastRunAt: string | null
  runCount: number
  createdAt: string
  updatedAt: string
}

export interface WorkflowExecutionView {
  id: string
  workflowId: string
  triggerData: Record<string, unknown> | null
  status: string
  startedAt: string
  finishedAt: string | null
  error: string | null
  result: Record<string, unknown> | null
}

// Helper: safely parse a JSON string into typed object
function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function enrich(w: {
  id: string
  companyId: string
  name: string
  description: string | null
  triggerType: string
  triggerConfig: string | null
  conditions: string | null
  actions: string | null
  status: string
  lastRunAt: Date | null
  runCount: number
  createdAt: Date
  updatedAt: Date
}): WorkflowView {
  return {
    id: w.id,
    companyId: w.companyId,
    name: w.name,
    description: w.description,
    triggerType: w.triggerType as WorkflowTrigger,
    triggerConfig: parseJson<Record<string, unknown> | null>(w.triggerConfig, null),
    conditions: parseJson<WorkflowCondition[]>(w.conditions, []),
    actions: parseJson<WorkflowAction[]>(w.actions, []),
    status: w.status,
    lastRunAt: w.lastRunAt ? new Date(w.lastRunAt).toISOString() : null,
    runCount: w.runCount ?? 0,
    createdAt: new Date(w.createdAt).toISOString(),
    updatedAt: new Date(w.updatedAt).toISOString(),
  }
}

function enrichExecution(e: {
  id: string
  workflowId: string
  triggerData: string | null
  status: string
  startedAt: Date
  finishedAt: Date | null
  error: string | null
  result: string | null
}): WorkflowExecutionView {
  return {
    id: e.id,
    workflowId: e.workflowId,
    triggerData: parseJson<Record<string, unknown> | null>(e.triggerData, null),
    status: e.status,
    startedAt: new Date(e.startedAt).toISOString(),
    finishedAt: e.finishedAt ? new Date(e.finishedAt).toISOString() : null,
    error: e.error,
    result: parseJson<Record<string, unknown> | null>(e.result, null),
  }
}

function buildOrderBy(sort: WorkflowQuery['sort']) {
  switch (sort) {
    case 'name': return { name: 'asc' as const }
    case 'name_desc': return { name: 'desc' as const }
    case 'created': return { createdAt: 'asc' as const }
    case 'runs': return { runCount: 'desc' as const }
    case 'last_run': return { lastRunAt: 'desc' as const }
    case 'created_desc':
    default: return { createdAt: 'desc' as const }
  }
}

// ============================================================================
// PREBUILT WORKFLOW TEMPLATES (5 — per task spec)
// ============================================================================
export interface WorkflowTemplate {
  key: string
  label: string
  description: string
  icon: string
  triggerType: WorkflowTrigger
  triggerConfig: Record<string, unknown>
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    key: 'stock_bajo',
    label: 'Stock bajo',
    description: 'Avisar al equipo cuando un producto cae por debajo del stock mínimo.',
    icon: 'AlertTriangle',
    triggerType: 'inventory_low',
    triggerConfig: { threshold: 'min_stock' },
    conditions: [],
    actions: [
      { type: 'notify', config: { channel: 'inventory', priority: 'HIGH', message: 'Stock bajo en {{product.name}} ({{product.stock}} u.)' } },
      { type: 'create_task', config: { title: 'Reabastecer {{product.name}}', assignee: 'compras' } },
    ],
  },
  {
    key: 'cliente_nuevo',
    label: 'Cliente nuevo',
    description: 'Enviar email de bienvenida y crear tarea de seguimiento a los 7 días.',
    icon: 'UserPlus',
    triggerType: 'customer_created',
    triggerConfig: {},
    conditions: [],
    actions: [
      { type: 'email', config: { template: 'welcome', to: '{{customer.email}}' } },
      { type: 'create_task', config: { title: 'Llamar a {{customer.fullName}} en 7 días', assignee: 'ventas' } },
    ],
  },
  {
    key: 'pedido_entregado',
    label: 'Pedido entregado',
    description: 'Solicitar reseña del producto y notificar a marketing al entregar.',
    icon: 'PackageCheck',
    triggerType: 'order_created',
    triggerConfig: {},
    conditions: [{ field: 'order.status', operator: 'eq', value: 'DELIVERED' }],
    actions: [
      { type: 'email', config: { template: 'review_request', to: '{{customer.email}}' } },
      { type: 'notify', config: { channel: 'marketing', priority: 'LOW', message: 'Pedido {{order.number}} entregado — opportunity for review' } },
    ],
  },
  {
    key: 'pago_recibido',
    label: 'Pago recibido',
    description: 'Registrar transacción de ingreso y avisar a finanzas al recibir un pago.',
    icon: 'CreditCard',
    triggerType: 'payment_received',
    triggerConfig: {},
    conditions: [],
    actions: [
      { type: 'update_record', config: { entity: 'order', field: 'status', value: 'PAID' } },
      { type: 'notify', config: { channel: 'finance', priority: 'MEDIUM', message: 'Pago recibido por {{payment.amount}}' } },
    ],
  },
  {
    key: 'compra_completada',
    label: 'Compra completada',
    description: 'Notificar a inventario y actualizar stock al recibir una orden de compra.',
    icon: 'ShoppingCart',
    triggerType: 'manual',
    triggerConfig: {},
    conditions: [{ field: 'purchase.status', operator: 'eq', value: 'RECEIVED' }],
    actions: [
      { type: 'notify', config: { channel: 'inventory', priority: 'MEDIUM', message: 'OC {{purchase.number}} recibida — actualizar stock' } },
      { type: 'update_record', config: { entity: 'inventory', field: 'stock', value: 'increment' } },
    ],
  },
]

// ============================================================================
// SERVICE
// ============================================================================
export class WorkflowService {
  static async list(query: WorkflowQuery, companyId: string): Promise<WorkflowView[]> {
    const where: Record<string, unknown> = { companyId }
    if (query.q) {
      where.OR = [
        { name: { contains: query.q } },
        { description: { contains: query.q } },
      ]
    }
    if (query.status) where.status = query.status
    if (query.triggerType) where.triggerType = query.triggerType

    const items = await db.workflow.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
    })
    return items.map(enrich)
  }

  static async getById(id: string): Promise<WorkflowView | null> {
    const w = await db.workflow.findUnique({ where: { id } })
    return w ? enrich(w) : null
  }

  static async create(input: CreateWorkflowInput, companyId: string): Promise<WorkflowView> {
    const w = await db.workflow.create({
      data: {
        companyId,
        name: input.name,
        description: input.description && input.description !== '' ? input.description : null,
        triggerType: input.triggerType,
        triggerConfig:
          input.triggerConfig && input.triggerConfig !== ''
            ? input.triggerConfig
            : null,
        conditions: JSON.stringify(input.conditions ?? []),
        actions: JSON.stringify(input.actions ?? []),
        status: input.status,
      },
    })
    return enrich(w)
  }

  static async update(id: string, input: UpdateWorkflowInput): Promise<WorkflowView> {
    const existing = await db.workflow.findUnique({ where: { id } })
    if (!existing) throw new Error('Workflow no encontrado')

    const data: Record<string, unknown> = {}
    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) {
      data.description = input.description && input.description !== '' ? input.description : null
    }
    if (input.triggerType !== undefined) data.triggerType = input.triggerType
    if (input.triggerConfig !== undefined) {
      data.triggerConfig =
        input.triggerConfig && input.triggerConfig !== '' ? input.triggerConfig : null
    }
    if (input.conditions !== undefined) data.conditions = JSON.stringify(input.conditions)
    if (input.actions !== undefined) data.actions = JSON.stringify(input.actions)
    if (input.status !== undefined) data.status = input.status

    const w = await db.workflow.update({ where: { id }, data })
    return enrich(w)
  }

  static async delete(id: string): Promise<void> {
    await db.workflow.delete({ where: { id } })
  }

  static async toggleStatus(id: string): Promise<WorkflowView> {
    const existing = await db.workflow.findUnique({ where: { id } })
    if (!existing) throw new Error('Workflow no encontrado')
    const next = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    const w = await db.workflow.update({ where: { id }, data: { status: next } })
    return enrich(w)
  }

  // Execute a workflow manually — simulates a single run.
  // In a real engine this would evaluate conditions against the trigger payload
  // and dispatch actions; here we persist an execution record with COMPLETED.
  static async execute(id: string): Promise<WorkflowExecutionView> {
    const w = await db.workflow.findUnique({ where: { id } })
    if (!w) throw new Error('Workflow no encontrado')

    const startedAt = new Date()
    const exec = await db.workflowExecution.create({
      data: {
        workflowId: id,
        triggerData: JSON.stringify({ source: 'manual', at: startedAt.toISOString() }),
        status: 'RUNNING',
        startedAt,
      },
    })

    try {
      // Simulated execution: always succeed (this is a demo platform)
      await new Promise((r) => setTimeout(r, 250))
      const finishedAt = new Date()
      const result = {
        actionsExecuted: parseJson<WorkflowAction[]>(w.actions, []).length,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        outcome: 'OK',
      }
      const updated = await db.workflowExecution.update({
        where: { id: exec.id },
        data: {
          status: 'COMPLETED',
          finishedAt,
          result: JSON.stringify(result),
        },
      })
      await db.workflow.update({
        where: { id },
        data: { lastRunAt: finishedAt, runCount: { increment: 1 } },
      })
      return enrichExecution(updated)
    } catch (err) {
      const finishedAt = new Date()
      const updated = await db.workflowExecution.update({
        where: { id: exec.id },
        data: {
          status: 'FAILED',
          finishedAt,
          error: err instanceof Error ? err.message : 'Error desconocido',
        },
      })
      return enrichExecution(updated)
    }
  }

  static async getExecutions(
    workflowId: string,
    limit = 20,
  ): Promise<WorkflowExecutionView[]> {
    const items = await db.workflowExecution.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    })
    return items.map(enrichExecution)
  }

  static async stats(companyId: string): Promise<{
    total: number
    active: number
    inactive: number
    runsToday: number
    errors: number
  }> {
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))
    const [total, active, inactive, runsToday, errors] = await Promise.all([
      db.workflow.count({ where: { companyId } }),
      db.workflow.count({ where: { companyId, status: 'ACTIVE' } }),
      db.workflow.count({ where: { companyId, status: 'INACTIVE' } }),
      db.workflowExecution.count({
        where: { startedAt: { gte: startOfToday } },
      }),
      db.workflowExecution.count({ where: { status: 'FAILED' } }),
    ])
    return { total, active, inactive, runsToday, errors }
  }
}
