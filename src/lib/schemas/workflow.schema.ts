// NEXORA — Workflow domain schemas (Zod validation)
// Automation engine: IF trigger THEN actions (with optional conditions)
import { z } from 'zod'

export const workflowStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])

export const workflowTriggerSchema = z.enum([
  'product_created',
  'order_created',
  'inventory_low',
  'payment_received',
  'customer_created',
  'supplier_created',
  'manual',
  'scheduled',
])

export const workflowConditionOperatorSchema = z.enum([
  'eq',
  'neq',
  'gt',
  'lt',
  'contains',
  'in',
])

export const workflowActionTypeSchema = z.enum([
  'notify',
  'email',
  'create_task',
  'update_record',
  'api_call',
])

// Condition: a single predicate over an event field
export const workflowConditionSchema = z.object({
  field: z.string().min(1, 'Campo requerido'),
  operator: workflowConditionOperatorSchema,
  value: z.string().min(1, 'Valor requerido'),
})

// Action: a single step to execute when trigger fires
export const workflowActionSchema = z.object({
  type: workflowActionTypeSchema,
  config: z.record(z.string(), z.unknown()).default({}),
})

// Create workflow schema
export const createWorkflowSchema = z.object({
  name: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(120, 'Nombre demasiado largo'),
  description: z.string().max(500).optional().or(z.literal('')),
  triggerType: workflowTriggerSchema,
  triggerConfig: z.string().optional().or(z.literal('')),
  conditions: z.array(workflowConditionSchema).default([]),
  actions: z.array(workflowActionSchema).min(1, 'Debe haber al menos una acción'),
  status: workflowStatusSchema.default('ACTIVE'),
})

// Update workflow schema: all fields optional
export const updateWorkflowSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional().or(z.literal('')),
  triggerType: workflowTriggerSchema.optional(),
  triggerConfig: z.string().optional().or(z.literal('')),
  conditions: z.array(workflowConditionSchema).optional(),
  actions: z.array(workflowActionSchema).min(1).optional(),
  status: workflowStatusSchema.optional(),
})

// Query schema for list endpoint
export const workflowQuerySchema = z.object({
  q: z.string().optional(),
  status: workflowStatusSchema.optional(),
  triggerType: workflowTriggerSchema.optional(),
  sort: z
    .enum(['created_desc', 'created', 'name', 'name_desc', 'runs', 'last_run'])
    .default('created_desc'),
})

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>
export type WorkflowQuery = z.infer<typeof workflowQuerySchema>
export type WorkflowTrigger = z.infer<typeof workflowTriggerSchema>
export type WorkflowCondition = z.infer<typeof workflowConditionSchema>
export type WorkflowAction = z.infer<typeof workflowActionSchema>
export type WorkflowActionType = z.infer<typeof workflowActionTypeSchema>
export type WorkflowConditionOperator = z.infer<typeof workflowConditionOperatorSchema>
