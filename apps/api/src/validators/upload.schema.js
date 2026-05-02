import { z } from 'zod';

export const uploadSignatureSchema = z.object({
  body: z.object({
    folder: z.enum(['avatars', 'attachments']),
    publicId: z.string().min(1).optional(),
    transformation: z.string().min(1).optional(),
  }),
});
