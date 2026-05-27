// lib/auth.ts
// JWT creation / verification and httpOnly cookie helpers.
// Uses jose (Edge-compatible) for signing and bcryptjs for password hashing.

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@prisma/client';

// ─── Constants ────────────────────────────────────────────────────────────────

const COOKIE_NAME = 'learnlens_token';
const TOKEN_TTL   = '7d';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET env var is missing or too short (minimum 32 characters).');
  }
  return new TextEncoder().encode(secret);
}

// ─── Payload shape ────────────────────────────────────────────────────────────

export interface AuthPayload extends JWTPayload {
  /** Prisma User.id (cuid) */
  sub:  string;
  role: Role;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * Sign a new JWT with the given payload.
 * Returns the compact serialised token string.
 */
export async function createToken(
  payload: Pick<AuthPayload, 'sub' | 'role'>,
): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

/**
 * Verify a token and return the decoded payload.
 * Throws if the token is missing, malformed, or expired.
 */
export async function verifyToken(token: string): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as AuthPayload;
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

/**
 * Append a Set-Cookie header that stores the JWT in an httpOnly cookie.
 * Call this on a NextResponse before returning it from a route handler.
 */
export function setAuthCookie(res: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7, // 7 days in seconds
  });
}

/**
 * Expire the auth cookie immediately (used by /api/auth/logout).
 */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  });
}

// ─── Route-handler guards ─────────────────────────────────────────────────────

/**
 * Read and verify the JWT from the incoming request cookie.
 *
 * Usage in a route handler:
 *   const payload = await requireAuth(req);
 *
 * Throws a Response (401) if the token is absent or invalid — callers should
 * catch it and return it:
 *   try { const p = await requireAuth(req); }
 *   catch (e) { if (e instanceof Response) return e; throw e; }
 *
 * Or use the convenience wrapper `withAuth` below.
 */
export async function requireAuth(req: NextRequest): Promise<AuthPayload> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    throw NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    );
  }
  try {
    return await verifyToken(token);
  } catch {
    throw NextResponse.json(
      { error: 'Invalid or expired session. Please sign in again.' },
      { status: 401 },
    );
  }
}

/**
 * Like requireAuth but additionally enforces admin role.
 * Throws a 403 Response if the authenticated user is not an admin.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthPayload> {
  const payload = await requireAuth(req);
  if (payload.role !== 'admin') {
    throw NextResponse.json(
      { error: 'Admin access required.' },
      { status: 403 },
    );
  }
  return payload;
}

// ─── Higher-order handler wrappers ────────────────────────────────────────────

type RouteHandler<T = void> = (
  req: NextRequest,
  payload: AuthPayload,
  ctx?: T,
) => Promise<NextResponse>;

/**
 * Wrap a route handler with auth enforcement.
 *
 * @example
 * export const GET = withAuth(async (req, payload) => {
 *   return NextResponse.json({ userId: payload.sub });
 * });
 */
export function withAuth<T = void>(
  handler: RouteHandler<T>,
): (req: NextRequest, ctx?: T) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const payload = await requireAuth(req);
      return await handler(req, payload, ctx);
    } catch (e) {
      if (e instanceof NextResponse) return e;
      throw e;
    }
  };
}

/**
 * Wrap a route handler with admin-only enforcement.
 */
export function withAdmin<T = void>(
  handler: RouteHandler<T>,
): (req: NextRequest, ctx?: T) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const payload = await requireAdmin(req);
      return await handler(req, payload, ctx);
    } catch (e) {
      if (e instanceof NextResponse) return e;
      throw e;
    }
  };
}
