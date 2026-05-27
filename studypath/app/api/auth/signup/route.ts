// app/api/auth/signup/route.ts
// POST /api/auth/signup
// Creates a new student account, hashes the password, and issues a JWT cookie.

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createToken, setAuthCookie } from '@/lib/auth';
import { SignupSchema } from '@/lib/schemas/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  // 2. Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with that email already exists.' },
      { status: 409 },
    );
  }

  // 3. Hash password and create user
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'student' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // 4. Issue JWT and set cookie
  const token = await createToken({ sub: user.id, role: user.role });
  const res = NextResponse.json({ user }, { status: 201 });
  setAuthCookie(res, token);
  return res;
}
