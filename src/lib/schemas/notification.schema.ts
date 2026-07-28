// NEXORA — Notification domain schemas (Zod validation)
// Per spec: "Usar Zod, React Hook Form, TypeScript estricto"
import { z } from 'zod'

export const notificationTypeSchema = z.enum([
  'info',
  'warning',
  'error',
  'success',
  'system',
  'finance',
  'purchases',
  'sales',
  'inventory',
  'marketing',
  'naios',
])

export const notificationPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

// Create notification schema
export const createNotificationSchema = z.object({
  type: notificationTypeSchema,
  priority: notificationPrioritySchema.default('MEDIUM'),
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres').max(200, 'Título demasiado largo'),
  message: z.string().min(2, 'El mensaje debe tener al menos 2 caracteres').max(2000, 'Mensaje demasiado largo'),
  data: z.string().optional().or(z.literal('')),
  userId: z.string().optional().or(z.literal('')),
})

// Update notification schema (used for mark as read / change priority)
export const updateNotificationSchema = z.object({
  priority: notificationPrioritySchema.optional(),
  readAt: z.preprocess(
    (v) => (v === null || v === undefined || v === '' ? null : v),
    z.union([z.date(), z.null()]).optional(),
  ),
})

// Query / filters schema for the list endpoint
export const notificationQuerySchema = z.object({
  q: z.string().optional(),
  type: notificationTypeSchema.optional(),
  priority: notificationPrioritySchema.optional(),
  unreadOnly: z.preprocess((v) => {
    if (v === 'true' || v === '1' || v === true) return true
    if (v === 'false' || v === '0' || v === false) return false
    return undefined
  }, z.boolean().optional()),
})

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>
export type NotificationQuery = z.infer<typeof notificationQuerySchema>
export type NotificationType = z.infer<typeof notificationTypeSchema>
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>
