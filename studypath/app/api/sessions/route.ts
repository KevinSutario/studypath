// app/api/sessions/route.ts
// POST /api/sessions
// Starts a new study session. Calls the adaptive engine to assign the VARK mode,
// then returns the session + the first batch of questions.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNextMode } from '@/lib/adaptiveEngine';
import { CreateSessionSchema } from '@/lib/schemas/session';

const QUESTIONS_PER_SESSION = 10;

export const POST = withAuth(async (req: NextRequest, payload: AuthPayload) => {
  // 1. Validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { subjectId } = parsed.data;

  // 2. Confirm subject exists
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
  }

  // 3. Ask the adaptive engine which mode to serve
  const mode = await getNextMode(payload.sub, subjectId);

  // 4. Create the session record (endedAt is null until PATCH completes it)
  const session = await prisma.session.create({
    data: {
      userId:    payload.sub,
      subjectId,
      mode,
    },
    select: {
      id:        true,
      mode:      true,
      startedAt: true,
      subject:   { select: { id: true, name: true, slug: true } },
    },
  });

  // 5. Fetch questions for this mode, randomised, limited to QUESTIONS_PER_SESSION
  const questions = await prisma.question.findMany({
    where:   { subjectId, mode },
    select:  {
      id:            true,
      text:          true,
      mode:          true,
      difficulty:    true,
      options:       true,
      // correctAnswer is intentionally excluded — sent only after answer submission
    },
    orderBy: { id: 'asc' }, // stable default; shuffled below
  });

  // Fisher-Yates shuffle then slice
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j]!, questions[i]!];
  }
  const selected = questions.slice(0, QUESTIONS_PER_SESSION);

  return NextResponse.json({ session, questions: selected }, { status: 201 });
});
