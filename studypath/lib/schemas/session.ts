// lib/schemas/session.ts
// Zod schemas for session creation and completion.

import { z } from 'zod';

const VarkModeEnum = z.enum(['visual', 'auditory', 'read_write', 'kinesthetic']);

/** POST /api/sessions — start a new session */
export const CreateSessionSchema = z.object({
  subjectId: z
    .string({ required_error: 'subjectId is required.' })
    .cuid('subjectId must be a valid cuid.'),
});

/**
 * PATCH /api/sessions/[id] — complete a session.
 * The client sends aggregated results after the last question is answered.
 */
export const CompleteSessionSchema = z.object({
  /** 0–100 percentage of correct answers */
  score: z
    .number()
    .min(0)
    .max(100),

  /** Average of all confidenceRating values (1–5) across the session */
  avgConfidence: z
    .number()
    .min(1)
    .max(5),

  /** How many times the student navigated back to re-read a question */
  revisitCount: z
    .number()
    .int()
    .min(0),
});

export type CreateSessionInput   = z.infer<typeof CreateSessionSchema>;
export type CompleteSessionInput = z.infer<typeof CompleteSessionSchema>;
