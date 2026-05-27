// app/api/auth/logout/route.ts
// POST /api/auth/logout
// Expires the JWT cookie. No auth required — always succeeds.

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);
  return res;
}
