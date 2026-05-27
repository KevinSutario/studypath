// app/api/questions/route.ts
// GET /api/questions?subjectId=&mode=&limit=
// Returns a randomised set of questions for a given subject and VARK mode.
// correctAnswer is excluded — only revealed after answer submission.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const QuerySchema = z.object({
  subjectId: z.string().cuid('subjectId must be a valid cuid.'),
  mode: z.enum(['visual', 'auditory', 'read_write', 'kinesthetic']),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const GET = withAuth(async (req: NextRequest, _payload: AuthPayload) => {
  const { searchParams } = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    subjectId: searchParams.get('subjectId'),
    mode:      searchParams.get('mode'),
    limit:     searchParams.get('limit'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { subjectId, mode, limit } = parsed.data;

  // Fetch all matching questions (no correctAnswer)
  const questions = await prisma.question.findMany({
    where:  { subjectId, mode },
    select: {
      id:         true,
      text:       true,
      mode:       true,
      difficulty: true,
      options:    true,
    },
  });

  // Fisher-Yates shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j]!, questions[i]!];
  }

  return NextResponse.json({ questions: questions.slice(0, limit) });
});
