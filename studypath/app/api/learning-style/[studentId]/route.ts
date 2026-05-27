// app/api/learning-style/[studentId]/route.ts
// GET /api/learning-style/[studentId]
// Returns the learning style profile (dominant mode, lock status, weighted scores)
// for every subject for a given student.
// Students can only view their own profile; admins can view any.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLearningStyleStatus } from '@/lib/adaptiveEngine';

type Ctx = { params: Promise<{ studentId: string }> };

export const GET = withAuth(async (req: NextRequest, payload: AuthPayload, ctx?: Ctx) => {
  const { studentId } = await ctx!.params;

  // Students can only see their own profile; admins can see anyone's
  if (payload.role !== 'admin' && payload.sub !== studentId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // Confirm the target user exists
  const user = await prisma.user.findUnique({
    where:  { id: studentId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  // Fetch all subjects
  const subjects = await prisma.subject.findMany({
    select: { id: true, name: true, slug: true },
  });

  // Build profile + scores for each subject in parallel
  const profiles = await Promise.all(
    subjects.map(async (subject) => {
      const { profile, scores } = await getLearningStyleStatus(studentId, subject.id);
      return {
        subject,
        profile: profile ?? {
          id:              null,
          dominantMode:    null,
          isLocked:        false,
          sessionCount:    0,
          lastEvaluatedAt: null,
        },
        scores,
      };
    }),
  );

  return NextResponse.json({ user, profiles });
});
