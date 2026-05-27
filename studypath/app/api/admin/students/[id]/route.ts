// app/api/admin/students/[id]/route.ts
// PATCH /api/admin/students/[id]
// Admin can override a student's dominant mode for a subject,
// or unlock a previously locked profile so the engine re-evaluates.

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type Ctx = { params: Promise<{ id: string }> };

const OverrideSchema = z.object({
  subjectId: z.string().cuid('subjectId must be a valid cuid.'),

  /** Set a specific dominant mode, or null to clear it. */
  dominantMode: z
    .enum(['visual', 'auditory', 'read_write', 'kinesthetic'])
    .nullable()
    .optional(),

  /** Set to false to unlock and let the engine re-evaluate. */
  isLocked: z.boolean().optional(),
});

export const PATCH = withAdmin(async (req: NextRequest, _payload: AuthPayload, ctx?: Ctx) => {
  const { id: studentId } = await ctx!.params;

  // 1. Confirm student exists
  const student = await prisma.user.findUnique({
    where:  { id: studentId },
    select: { id: true, role: true },
  });

  if (!student) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  if (student.role !== 'student') {
    return NextResponse.json({ error: 'Target user is not a student.' }, { status: 400 });
  }

  // 2. Validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = OverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { subjectId, dominantMode, isLocked } = parsed.data;

  // 3. Confirm subject exists
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) {
    return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
  }

  // 4. Upsert the profile with the override values
  const profile = await prisma.learningStyleProfile.upsert({
    where:  { userId_subjectId: { userId: studentId, subjectId } },
    update: {
      ...(dominantMode !== undefined ? { dominantMode } : {}),
      ...(isLocked     !== undefined ? { isLocked }     : {}),
      lastEvaluatedAt: new Date(),
    },
    create: {
      userId:       studentId,
      subjectId,
      dominantMode: dominantMode ?? null,
      isLocked:     isLocked     ?? false,
    },
    select: {
      id:              true,
      dominantMode:    true,
      isLocked:        true,
      sessionCount:    true,
      lastEvaluatedAt: true,
      subject:         { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ profile });
});
