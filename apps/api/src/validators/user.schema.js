import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).max(80).optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
    avatarPublicId: z.string().min(1).optional().or(z.literal('')),
  }),
});
