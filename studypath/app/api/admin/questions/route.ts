// app/api/admin/questions/route.ts
// GET  /api/admin/questions?subjectId=&mode=&difficulty=&page=&pageSize=
// POST /api/admin/questions

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateQuestionSchema } from '@/lib/schemas/question';
import { z } from 'zod';

// ── GET — list questions with optional filters and pagination ─────────────────

const ListQuerySchema = z.object({
  subjectId:  z.string().cuid().optional(),
  mode:       z.enum(['visual', 'auditory', 'read_write', 'kinesthetic']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  page:       z.coerce.number().int().min(1).default(1),
  pageSize:   z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = withAdmin(async (req: NextRequest, _payload: AuthPayload) => {
  const { searchParams } = new URL(req.url);

  const parsed = ListQuerySchema.safeParse({
    subjectId:  searchParams.get('subjectId')  ?? undefined,
    mode:       searchParams.get('mode')        ?? undefined,
    difficulty: searchParams.get('difficulty')  ?? undefined,
    page:       searchParams.get('page')        ?? undefined,
    pageSize:   searchParams.get('pageSize')    ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { subjectId, mode, difficulty, page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(subjectId  ? { subjectId }  : {}),
    ...(mode       ? { mode }       : {}),
    ...(difficulty ? { difficulty } : {}),
  };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take:    pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id:            true,
        text:          true,
        mode:          true,
        difficulty:    true,
        options:       true,
        correctAnswer: true,
        explanation:   true,
        createdAt:     true,
        subject:       { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return NextResponse.json({
    questions,
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
});

// ── POST — create a question ──────────────────────────────────────────────────

export const POST = withAdmin(async (req: NextRequest, _payload: AuthPayload) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = CreateQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { subjectId, text, mode, difficulty, options, correctAnswer, explanation } = parsed.data;

  // Verify subject exists
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
  }

  const question = await prisma.question.create({
    data: { subjectId, text, mode, difficulty, options, correctAnswer, explanation },
    select: {
      id:            true,
      text:          true,
      mode:          true,
      difficulty:    true,
      options:       true,
      correctAnswer: true,
      explanation:   true,
      createdAt:     true,
      subject:       { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ question }, { status: 201 });
});
