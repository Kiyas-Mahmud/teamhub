import { z } from 'zod';

export const analyticsParamsSchema = z.object({
  params: z.object({
    workspaceId: z.string().min(1),
  }),
});
