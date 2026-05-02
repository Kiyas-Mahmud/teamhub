import { z } from 'zod';

const workspaceId = z.string().min(1);
const actionItemId = z.string().min(1);

export const actionItemQuerySchema = z.object({
  params: z.object({
    workspaceId,
  }),
  query: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    assigneeId: z.string().min(1).optional(),
    goalId: z.string().min(1).optional(),
  }),
});

export const createActionItemSchema = z.object({
  params: z.object({
    workspaceId,
  }),
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional().or(z.literal('')),
    assigneeId: z.string().min(1).optional().or(z.literal('')),
    goalId: z.string().min(1).optional().or(z.literal('')),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    dueDate: z.string().datetime().optional().or(z.literal('')),
  }),
});

export const updateActionItemSchema = z.object({
  params: z.object({
    workspaceId,
    actionItemId,
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().or(z.literal('')),
    assigneeId: z.string().min(1).optional().or(z.literal('')),
    goalId: z.string().min(1).optional().or(z.literal('')),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    dueDate: z.string().datetime().optional().or(z.literal('')),
  }),
});

export const actionItemParamsSchema = z.object({
  params: z.object({
    workspaceId,
    actionItemId,
  }),
});
