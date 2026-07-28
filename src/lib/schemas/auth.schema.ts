// NEXORA — Auth & RBAC Schemas (Zod validation)
import { z } from 'zod'

// === Auth ===
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'Contraseña es obligatoria'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual es obligatoria'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// === Users ===
export const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])

export const createUserSchema = z.object({
  firstName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  lastName: z.string().min(2, 'Apellido debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  phone: z.string().max(30).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  roleId: z.string().min(1, 'Rol es obligatorio'),
  branchId: z.string().optional().or(z.literal('')),
  status: userStatusSchema.default('ACTIVE'),
  timezone: z.string().default('America/Bogota'),
  language: z.string().max(5).default('es'),
})
export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  roleId: z.string().optional(),
  branchId: z.string().optional().or(z.literal('')),
  status: userStatusSchema.optional(),
  timezone: z.string().optional(),
  language: z.string().max(5).optional(),
  password: z.string().min(8).optional(), // Optional on update; if provided, re-hash
})
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const userQuerySchema = z.object({
  q: z.string().optional(),
  status: userStatusSchema.optional(),
  roleId: z.string().optional(),
  branchId: z.string().optional(),
})
export type UserQuery = z.infer<typeof userQuerySchema>

// === Roles ===
export const createRoleSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(50).regex(/^[A-Za-z0-9_]+$/, 'Solo letras, números y guiones bajos'),
  description: z.string().max(500).optional().or(z.literal('')),
  permissionIds: z.array(z.string()).default([]),
})
export type CreateRoleInput = z.infer<typeof createRoleSchema>

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  permissionIds: z.array(z.string()).optional(),
})
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>

// === Branches ===
export const createBranchSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  code: z.string().min(2, 'Código debe tener al menos 2 caracteres').max(20),
  address: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(2).default('CO'),
  state: z.string().max(100).optional().or(z.literal('')),
  responsibleId: z.string().optional().or(z.literal('')),
})
export type CreateBranchInput = z.infer<typeof createBranchSchema>

export const updateBranchSchema = createBranchSchema.partial()
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>
