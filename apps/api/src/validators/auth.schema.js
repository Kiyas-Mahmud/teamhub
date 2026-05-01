import { z } from 'zod';

export const registerRouteSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    displayName: z.string().min(2).max(80),
  }),
});

export const loginRouteSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});
