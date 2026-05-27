// lib/adaptiveEngine.ts
// Adaptive learning engine — determines which VARK mode to serve next
// and evaluates whether a student's dominant mode should be locked in.

import type { VarkMode } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_MODES: VarkMode[] = ['visual', 'auditory', 'read_write', 'kinesthetic'];

/** Number of sessions before the engine starts evaluating mode scores. */
const MIN_SESSIONS_FOR_EVALUATION = 20;

/**
 * A dominant mode is locked in when its weighted score is at least this
 * fraction above the second-highest score.
 *   e.g. 0.20 → dominant must score ≥ 20% higher than runner-up.
 */
const LOCK_IN_THRESHOLD = 0.20;

/**
 * After lock-in, run one cross-mode probe every N sessions so the engine
 * can detect if the student's preferred style has drifted.
 */
const PROBE_INTERVAL = 10;

// ─── Weighted score formula ───────────────────────────────────────────────────
//
//   score = (accuracy × 0.50)
//         + (normalisedSpeed × 0.20)
//         + (confidence × 0.20)
//         + (lowRevisitBonus × 0.10)
//
// All components are normalised to [0, 1] before weighting.

const WEIGHTS = {
  accuracy:        0.50,
  normalisedSpeed: 0.20,
  confidence:      0.20,
  lowRevisitBonus: 0.10,
} as const;

// ─── Internal types ───────────────────────────────────────────────────────────

interface ModeStats {
  avgScore:     number; // 0–100
  avgTime:      number; // seconds per question
  avgConfidence:number; // 1–5
  avgRevisit:   number; // revisit count per session
  count:        number; // number of sessions
}

type ModeScores = Record<VarkMode, number>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundRobin(sessionCount: number): VarkMode {
  return ALL_MODES[sessionCount % ALL_MODES.length]!;
}

function randomFrom(modes: VarkMode[]): VarkMode {
  return modes[Math.floor(Math.random() * modes.length)]!;
}

/**
 * Normalise a value within [min, max] to [0, 1].
 * Returns 0.5 when min === max (no variance).
 */
function normalise(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

// ─── Core engine functions ────────────────────────────────────────────────────

/**
 * Compute per-mode weighted scores for a given student × subject.
 * Only completed sessions (endedAt IS NOT NULL) are considered.
 */
export async function computeWeightedScores(
  userId:    string,
  subjectId: string,
): Promise<ModeScores> {
  // Fetch all completed sessions for this student × subject
  const sessions = await prisma.session.findMany({
    where:  { userId, subjectId, endedAt: { not: null } },
    select: { id: true, mode: true, score: true, avgConfidence: true, revisitCount: true },
  });

  // Fetch per-mode average answer time from SessionAnswer
  const answerAggs = await prisma.sessionAnswer.groupBy({
    by:    ['sessionId'],
    where: { session: { userId, subjectId } },
    _avg:  { timeSpentSeconds: true },
  });

  // Map sessionId → avgTime
  const sessionAvgTime = new Map<string, number>(
    answerAggs.map((a) => [a.sessionId, a._avg.timeSpentSeconds ?? 30]),
  );

  // Build per-mode stats
  const statsMap: Partial<Record<VarkMode, ModeStats>> = {};

  for (const mode of ALL_MODES) {
    const modeSessions = sessions.filter((s) => s.mode === mode);
    if (modeSessions.length === 0) {
      statsMap[mode] = { avgScore: 0, avgTime: 60, avgConfidence: 3, avgRevisit: 0, count: 0 };
      continue;
    }

    const avgScore = modeSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / modeSessions.length;
    const avgConfidence = modeSessions.reduce((sum, s) => sum + (s.avgConfidence ?? 3), 0) / modeSessions.length;
    const avgRevisit = modeSessions.reduce((sum, s) => sum + s.revisitCount, 0) / modeSessions.length;
    const avgTime = modeSessions.reduce((sum, s) => sum + (sessionAvgTime.get(s.id) ?? 30), 0) / modeSessions.length;

    statsMap[mode] = { avgScore, avgTime, avgConfidence, avgRevisit, count: modeSessions.length };
  }

  // Normalise speed across all modes (faster = higher score, so we invert)
  const allTimes = ALL_MODES.map((m) => statsMap[m]!.avgTime);
  const minTime  = Math.min(...allTimes);
  const maxTime  = Math.max(...allTimes);

  const scores = {} as ModeScores;

  for (const mode of ALL_MODES) {
    const s = statsMap[mode]!;

    const accuracy        = s.avgScore / 100;                              // 0–1
    // Faster (lower time) → higher score, so invert the normalisation
    const normalisedSpeed = 1 - normalise(s.avgTime, minTime, maxTime);   // 0–1
    const confidence      = (s.avgConfidence - 1) / 4;                    // 0–1
    const lowRevisitBonus = Math.max(0, 1 - s.avgRevisit / 5);            // 0–1

    scores[mode] =
      accuracy        * WEIGHTS.accuracy +
      normalisedSpeed * WEIGHTS.normalisedSpeed +
      confidence      * WEIGHTS.confidence +
      lowRevisitBonus * WEIGHTS.lowRevisitBonus;
  }

  return scores;
}

/**
 * Determine the next VARK mode to serve for a student × subject session.
 *
 * Logic:
 *  1. Sessions 1–20  → round-robin (V→A→R→K→V…)
 *  2. Sessions 21+   → evaluate weighted scores:
 *       - If dominant scores ≥ 20% above runner-up → lock in
 *       - Otherwise serve the current leader without locking
 *  3. Post lock-in   → serve dominant mode every session
 *       - Every PROBE_INTERVAL sessions, serve a random non-dominant mode
 *         to re-evaluate whether the style has drifted
 */
export async function getNextMode(
  userId:    string,
  subjectId: string,
): Promise<VarkMode> {
  // Find or create the profile
  let profile = await prisma.learningStyleProfile.findUnique({
    where: { userId_subjectId: { userId, subjectId } },
  });

  if (!profile) {
    profile = await prisma.learningStyleProfile.create({
      data: { userId, subjectId },
    });
  }

  // ── Post lock-in ─────────────────────────────────────────────────────────
  if (profile.isLocked && profile.dominantMode) {
    // Probe: serve a random non-dominant mode every PROBE_INTERVAL sessions
    if (profile.sessionCount > 0 && profile.sessionCount % PROBE_INTERVAL === 0) {
      const others = ALL_MODES.filter((m) => m !== profile!.dominantMode);
      return randomFrom(others);
    }
    return profile.dominantMode;
  }

  // ── First 20 sessions: round-robin ───────────────────────────────────────
  if (profile.sessionCount < MIN_SESSIONS_FOR_EVALUATION) {
    return roundRobin(profile.sessionCount);
  }

  // ── Evaluate weighted scores ──────────────────────────────────────────────
  const scores = await computeWeightedScores(userId, subjectId);

  const sorted   = (Object.entries(scores) as [VarkMode, number][])
    .sort(([, a], [, b]) => b - a);
  const [dominant, dominantScore] = sorted[0]!;
  const [, secondScore]           = sorted[1] ?? ['', 0];

  // Lock in if threshold met
  const shouldLock = dominantScore >= (secondScore as number) * (1 + LOCK_IN_THRESHOLD);
  if (shouldLock) {
    await prisma.learningStyleProfile.update({
      where: { userId_subjectId: { userId, subjectId } },
      data: {
        dominantMode:    dominant,
        isLocked:        true,
        lastEvaluatedAt: new Date(),
      },
    });
  }

  return dominant;
}

/**
 * Increment the session counter for a student × subject profile.
 * Call this when a session is completed (PATCH /api/sessions/[id]).
 * Uses upsert so it is safe even if the profile doesn't exist yet.
 */
export async function incrementSessionCount(
  userId:    string,
  subjectId: string,
): Promise<void> {
  await prisma.learningStyleProfile.upsert({
    where:  { userId_subjectId: { userId, subjectId } },
    update: { sessionCount: { increment: 1 } },
    create: { userId, subjectId, sessionCount: 1 },
  });
}

/**
 * Return the current weighted scores and profile for a student × subject.
 * Used by GET /api/learning-style/[studentId].
 */
export async function getLearningStyleStatus(
  userId:    string,
  subjectId: string,
) {
  const [profile, scores] = await Promise.all([
    prisma.learningStyleProfile.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
    }),
    computeWeightedScores(userId, subjectId),
  ]);

  return { profile, scores };
}
