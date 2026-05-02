import { z } from 'zod';

const workspaceId = z.string().min(1);
const goalId = z.string().min(1);
const milestoneId = z.string().min(1);

export const createGoalSchema = z.object({
  params: z.object({
    workspaceId,
  }),
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional().or(z.literal('')),
    ownerId: z.string().min(1).optional(),
    dueDate: z.string().datetime().optional().or(z.literal('')),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  }),
});

export const updateGoalSchema = z.object({
  params: z.object({
    workspaceId,
    goalId,
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().or(z.literal('')),
    ownerId: z.string().min(1).optional(),
    dueDate: z.string().datetime().optional().or(z.literal('')),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  }),
});

export const goalParamsSchema = z.object({
  params: z.object({
    workspaceId,
    goalId,
  }),
});

export const createMilestoneSchema = z.object({
  params: z.object({
    workspaceId,
    goalId,
  }),
  body: z.object({
    title: z.string().min(1).max(160),
    progress: z.number().int().min(0).max(100).optional(),
  }),
});

export const updateMilestoneSchema = z.object({
  params: z.object({
    workspaceId,
    goalId,
    milestoneId,
  }),
  body: z.object({
    title: z.string().min(1).max(160).optional(),
    progress: z.number().int().min(0).max(100).optional(),
  }),
});

export const milestoneParamsSchema = z.object({
  params: z.object({
    workspaceId,
    goalId,
    milestoneId,
  }),
});

export const createGoalUpdateSchema = z.object({
  params: z.object({
    workspaceId,
    goalId,
  }),
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
});
