// src/lib/env.ts
import { z } from 'zod';
export const Env = z.object({
  NEXT_PUBLIC_API_BASE: z.string().url(),
});
export const env = Env.parse({
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
});
