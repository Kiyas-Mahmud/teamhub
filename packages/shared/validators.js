import { z } from 'zod';

const cuid = z.string().min(1);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(80),
});

export const workspaceCreateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal('')),
  accentColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Accent color must be a hex value')
    .optional(),
});

export const workspaceIdSchema = z.object({
  workspaceId: cuid,
});
