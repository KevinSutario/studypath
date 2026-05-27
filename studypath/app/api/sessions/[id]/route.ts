// app/api/sessions/[id]/route.ts
// PATCH /api/sessions/[id]
// Completes an in-progress session: records the final score, avgConfidence,
// revisitCount, and endedAt. Then increments the adaptive engine's session counter.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { incrementSessionCount } from '@/lib/adaptiveEngine';
import { CompleteSessionSchema } from '@/lib/schemas/session';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withAuth(async (req: NextRequest, payload: AuthPayload, ctx?: Ctx) => {
  const { id: sessionId } = await ctx!.params;

  // 1. Find the session and verify ownership
  const session = await prisma.session.findUnique({
    where:  { id: sessionId },
    select: { id: true, userId: true, subjectId: true, endedAt: true },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  if (session.userId !== payload.sub) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  if (session.endedAt !== null) {
    return NextResponse.json({ error: 'Session is already completed.' }, { status: 409 });
  }

  // 2. Validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = CompleteSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { score, avgConfidence, revisitCount } = parsed.data;

  // 3. Mark session as completed
  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: {
      score,
      avgConfidence,
      revisitCount,
      endedAt: new Date(),
    },
    select: {
      id:           true,
      mode:         true,
      score:        true,
      avgConfidence:true,
      revisitCount: true,
      startedAt:    true,
      endedAt:      true,
    },
  });

  // 4. Increment session count in the learning style profile
  //    (triggers lock-in evaluation on next getNextMode call)
  await incrementSessionCount(payload.sub, session.subjectId);

  return NextResponse.json({ session: updated });
});
