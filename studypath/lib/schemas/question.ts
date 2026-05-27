// lib/schemas/question.ts
// Zod schema for creating a question (admin only).

import { z } from 'zod';

const VarkModeEnum   = z.enum(['visual', 'auditory', 'read_write', 'kinesthetic']);
const DifficultyEnum = z.enum(['easy', 'medium', 'hard']);

/** POST /api/admin/questions */
export const CreateQuestionSchema = z.object({
  subjectId: z
    .string({ required_error: 'subjectId is required.' })
    .cuid('subjectId must be a valid cuid.'),

  text: z
    .string({ required_error: 'Question text is required.' })
    .min(10,   'Question text must be at least 10 characters.')
    .max(2000, 'Question text must be at most 2000 characters.')
    .trim(),

  mode: VarkModeEnum,

  difficulty: DifficultyEnum,

  /**
   * Array of 2–6 answer option strings.
   * The correctAnswer must be one of these strings.
   */
  options: z
    .array(z.string().min(1).max(500))
    .min(2, 'At least 2 options are required.')
    .max(6, 'At most 6 options are allowed.'),

  /** Must exactly match one of the strings in options[] */
  correctAnswer: z
    .string({ required_error: 'correctAnswer is required.' })
    .min(1, 'correctAnswer cannot be empty.'),

  explanation: z
    .string({ required_error: 'Explanation is required.' })
    .min(10,   'Explanation must be at least 10 characters.')
    .max(2000, 'Explanation must be at most 2000 characters.')
    .trim(),
}).refine(
  (data) => data.options.includes(data.correctAnswer),
  {
    message: 'correctAnswer must exactly match one of the strings in options[].',
    path:    ['correctAnswer'],
  },
);

export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
