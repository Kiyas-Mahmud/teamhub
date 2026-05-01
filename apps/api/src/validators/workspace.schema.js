import { z } from 'zod';

const workspaceId = z.string().min(1);

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    description: z.string().max(500).optional().or(z.literal('')),
    accentColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{6})$/, 'Accent color must be a hex value')
      .optional(),
  }),
});

export const workspaceParamsSchema = z.object({
  params: z.object({
    workspaceId,
  }),
});

export const updateWorkspaceSchema = z.object({
  params: z.object({
    workspaceId,
  }),
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(500).optional().or(z.literal('')),
    accentColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{6})$/, 'Accent color must be a hex value')
      .optional(),
  }),
});

export const inviteMemberSchema = z.object({
  params: z.object({
    workspaceId,
  }),
  body: z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  }),
});

export const acceptInviteSchema = z.object({
  params: z.object({
    workspaceId,
  }),
  body: z.object({
    token: z.string().min(10),
  }),
});
