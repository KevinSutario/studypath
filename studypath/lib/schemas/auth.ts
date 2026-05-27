// lib/schemas/auth.ts
// Zod schemas for signup and login request bodies.

import { z } from 'zod';

export const SignupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .min(2,  'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.')
    .trim(),

  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.')
    .toLowerCase(),

  password: z
    .string({ required_error: 'Password is required.' })
    .min(8,   'Password must be at least 8 characters.')
    .max(128, 'Password must be at most 128 characters.'),
});

export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .email('Please enter a valid email address.')
    .toLowerCase(),

  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput  = z.infer<typeof LoginSchema>;
