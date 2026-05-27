// app/api/admin/questions/[id]/route.ts
// DELETE /api/admin/questions/[id]

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import type { AuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = withAdmin(async (req: NextRequest, _payload: AuthPayload, ctx?: Ctx) => {
  const { id } = await ctx!.params;

  const question = await prisma.question.findUnique({
    where:  { id },
    select: { id: true },
  });

  if (!question) {
    return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
  }

  await prisma.question.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
