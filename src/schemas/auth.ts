import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

export const roleAssignmentSchema = z.object({
  targetUserId: z.string().uuid('Invalid user identifier.'),
  role: z.enum(['SUPER_ADMIN', 'EDITOR', 'VIEWER']),
  isActive: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type RoleAssignmentValues = z.infer<typeof roleAssignmentSchema>;
