// app/api/admin/students/route.ts
// GET /api/admin/students?page=&pageSize=&search=
// Returns a paginated list of all students with their learning style profiles.

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const QuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search:   z.string().optional(),
});

export const GET = withAdmin(async (req: NextRequest, _payload: AuthPayload) => {
  const { searchParams } = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    page:     searchParams.get('page')     ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    search:   searchParams.get('search')   ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { page, pageSize, search } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where = {
    role: 'student' as const,
    ...(search
      ? {
          OR: [
            { name:  { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take:    pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id:        true,
        name:      true,
        email:     true,
        createdAt: true,
        learningProfiles: {
          select: {
            id:              true,
            dominantMode:    true,
            isLocked:        true,
            sessionCount:    true,
            lastEvaluatedAt: true,
            subject:         { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    students,
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  });
});
