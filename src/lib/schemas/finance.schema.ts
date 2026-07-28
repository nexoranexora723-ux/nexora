// NEXORA — Finance domain schemas (Zod validation)
import { z } from 'zod'

export const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE'])

export const transactionCategorySchema = z.enum([
  'SALES',
  'PURCHASES',
  'SHIPPING',
  'SALARY',
  'MARKETING',
  'RENT',
  'UTILITY',
  'COMMISSION',
  'TAX',
  'OTHER',
])

// Create transaction schema
export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  category: transactionCategorySchema,
  description: z
    .string()
    .min(2, 'Descripción debe tener al menos 2 caracteres')
    .max(300, 'Descripción demasiado larga'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  currencyCode: z.string().max(3).default('USD'),
  reference: z.string().max(200).optional().or(z.literal('')),
  date: z.string().optional().or(z.literal('')),
})

// Update transaction schema (partial)
const createTransactionRaw = z.object({
  type: transactionTypeSchema.optional(),
  category: transactionCategorySchema.optional(),
  description: z.string().min(2).max(300).optional(),
  amount: z.number().positive().optional(),
  currencyCode: z.string().max(3).optional(),
  reference: z.string().max(200).optional().or(z.literal('')),
  date: z.string().optional().or(z.literal('')),
})

export const updateTransactionSchema = createTransactionRaw.partial()

// Query/filters schema for transactions list
export const transactionQuerySchema = z.object({
  q: z.string().optional(),
  type: transactionTypeSchema.optional(),
  category: transactionCategorySchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(['date', 'date_desc', 'amount', 'amount_desc']).default('date_desc'),
})

// Account schema (for future bank/cash accounts — kept minimal)
export const accountTypeSchema = z.enum(['BANK', 'CASH', 'CREDIT'])

export const createAccountSchema = z.object({
  name: z.string().min(2, 'Nombre requerido').max(100),
  type: accountTypeSchema,
  currency: z.string().max(3).default('USD'),
  balance: z.number().default(0),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionQuery = z.infer<typeof transactionQuerySchema>
export type CreateAccountInput = z.infer<typeof createAccountSchema>
