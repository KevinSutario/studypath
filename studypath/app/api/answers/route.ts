// app/api/answers/route.ts
// POST /api/answers
// Submits one answer for a question within an active session.
// Looks up the correct answer server-side and returns isCorrect + explanation.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubmitAnswerSchema } from '@/lib/schemas/answer';

export const POST = withAuth(async (req: NextRequest, payload: AuthPayload) => {
  // 1. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = SubmitAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { sessionId, questionId, selectedAnswer, timeSpentSeconds, confidenceRating } = parsed.data;

  // 2. Verify the session exists, belongs to this user, and is not yet completed
  const session = await prisma.session.findUnique({
    where:  { id: sessionId },
    select: { userId: true, endedAt: true },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }
  if (session.userId !== payload.sub) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  if (session.endedAt !== null) {
    return NextResponse.json({ error: 'Cannot submit answers to a completed session.' }, { status: 409 });
  }

  // 3. Fetch the question to determine correctness
  const question = await prisma.question.findUnique({
    where:  { id: questionId },
    select: { correctAnswer: true, explanation: true },
  });

  if (!question) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
  }

  // 4. Guard against duplicate answers for the same question in this session
  const duplicate = await prisma.sessionAnswer.findFirst({
    where: { sessionId, questionId },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: 'This question has already been answered in this session.' },
      { status: 409 },
    );
  }

  const isCorrect = selectedAnswer === question.correctAnswer;

  // 5. Persist the answer
  const answer = await prisma.sessionAnswer.create({
    data: {
      sessionId,
      questionId,
      selectedAnswer,
      isCorrect,
      timeSpentSeconds,
      confidenceRating,
    },
    select: {
      id:               true,
      isCorrect:        true,
      timeSpentSeconds: true,
      confidenceRating: true,
    },
  });

  // 6. Return result with correct answer and explanation so the UI can show feedback
  return NextResponse.json({
    answer,
    correctAnswer: question.correctAnswer,
    explanation:   question.explanation,
  }, { status: 201 });
});
