import { z } from 'zod'

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual obligatoria'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
