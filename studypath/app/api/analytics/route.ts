// app/api/analytics/route.ts
// GET /api/analytics?userId=&subjectId=
// Returns aggregated performance data for charts:
//   - scoreOverTime: [{date, score, mode}] last 50 completed sessions
//   - avgScoreByMode: {visual, auditory, read_write, kinesthetic}
//   - avgTimeByMode:  {visual, auditory, read_write, kinesthetic}  (seconds/question)
//   - confidenceTrend: [{date, avgConfidence}] last 50 sessions
// Students can only query their own data; admins can query any userId.

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { VarkMode } from '@prisma/client';

const ALL_MODES: VarkMode[] = ['visual', 'auditory', 'read_write', 'kinesthetic'];

const QuerySchema = z.object({
  userId:    z.string().cuid('userId must be a valid cuid.'),
  subjectId: z.string().cuid().optional(),
});

export const GET = withAuth(async (req: NextRequest, payload: AuthPayload) => {
  const { searchParams } = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    userId:    searchParams.get('userId'),
    subjectId: searchParams.get('subjectId') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { userId, subjectId } = parsed.data;

  // Access control
  if (payload.role !== 'admin' && payload.sub !== userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // Base where clause — only completed sessions
  const where = {
    userId,
    endedAt: { not: null },
    ...(subjectId ? { subjectId } : {}),
  };

  // ── 1. Score over time (last 50 sessions) ──────────────────────────────────
  const recentSessions = await prisma.session.findMany({
    where,
    orderBy: { startedAt: 'desc' },
    take:    50,
    select: {
      id:        true,
      mode:      true,
      score:     true,
      avgConfidence: true,
      startedAt: true,
      subject:   { select: { slug: true } },
    },
  });

  const scoreOverTime = recentSessions
    .reverse()
    .map((s) => ({
      date:    s.startedAt.toISOString(),
      score:   s.score ?? 0,
      mode:    s.mode,
      subject: s.subject.slug,
    }));

  const confidenceTrend = recentSessions
    .reverse()  // already reversed above, reverse back
    .map((s) => ({
      date:          s.startedAt.toISOString(),
      avgConfidence: s.avgConfidence ?? 0,
    }));

  // ── 2. Avg score by mode ───────────────────────────────────────────────────
  const scoreAggs = await prisma.session.groupBy({
    by:     ['mode'],
    where,
    _avg:   { score: true },
    _count: { id: true },
  });

  const avgScoreByMode = Object.fromEntries(
    ALL_MODES.map((m) => {
      const agg = scoreAggs.find((a) => a.mode === m);
      return [m, agg ? Math.round(agg._avg.score ?? 0) : null];
    }),
  ) as Record<VarkMode, number | null>;

  // ── 3. Avg time per question by mode ───────────────────────────────────────
  const sessionIds = recentSessions.map((s) => s.id);

  const timeAggs = await prisma.sessionAnswer.groupBy({
    by:   ['sessionId'],
    where: { sessionId: { in: sessionIds } },
    _avg:  { timeSpentSeconds: true },
  });

  // Join with session to get mode
  const sessionModeMap = new Map(recentSessions.map((s) => [s.id, s.mode]));

  const timeByMode: Record<VarkMode, number[]> = {
    visual:      [],
    auditory:    [],
    read_write:  [],
    kinesthetic: [],
  };

  for (const agg of timeAggs) {
    const mode = sessionModeMap.get(agg.sessionId);
    if (mode && agg._avg.timeSpentSeconds !== null) {
      timeByMode[mode].push(agg._avg.timeSpentSeconds);
    }
  }

  const avgTimeByMode = Object.fromEntries(
    ALL_MODES.map((m) => {
      const arr = timeByMode[m];
      return [
        m,
        arr.length > 0
          ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
          : null,
      ];
    }),
  ) as Record<VarkMode, number | null>;

  // ── 4. Session counts by mode ──────────────────────────────────────────────
  const sessionCountByMode = Object.fromEntries(
    ALL_MODES.map((m) => [
      m,
      scoreAggs.find((a) => a.mode === m)?._count.id ?? 0,
    ]),
  ) as Record<VarkMode, number>;

  return NextResponse.json({
    scoreOverTime,
    confidenceTrend,
    avgScoreByMode,
    avgTimeByMode,
    sessionCountByMode,
    totalSessions: recentSessions.length,
  });
});
