// lib/schemas/answer.ts
// Zod schema for submitting a single answer within a session.

import { z } from 'zod';

/** POST /api/answers */
export const SubmitAnswerSchema = z.object({
  sessionId: z
    .string({ required_error: 'sessionId is required.' })
    .cuid('sessionId must be a valid cuid.'),

  questionId: z
    .string({ required_error: 'questionId is required.' })
    .cuid('questionId must be a valid cuid.'),

  /** The exact option string the student selected */
  selectedAnswer: z
    .string({ required_error: 'selectedAnswer is required.' })
    .min(1, 'selectedAnswer cannot be empty.'),

  /** Wall-clock seconds from question display to submission */
  timeSpentSeconds: z
    .number({ required_error: 'timeSpentSeconds is required.' })
    .int()
    .min(0)
    .max(3600),

  /** Self-reported confidence: 1 (not confident) – 5 (very confident) */
  confidenceRating: z
    .number({ required_error: 'confidenceRating is required.' })
    .int()
    .min(1)
    .max(5),
});

export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;
