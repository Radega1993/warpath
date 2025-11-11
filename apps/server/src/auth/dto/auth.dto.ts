import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    handle: z.string().min(1).max(20).regex(/^[a-zA-Z0-9_-]+$/),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

