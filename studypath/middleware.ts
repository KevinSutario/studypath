// middleware.ts
// Edge-compatible route protection.
// Runs before every request that matches the config.matcher pattern.
//
// Rules:
//  - Public paths (login, signup, public API auth): pass through
//  - No cookie → redirect to /login
//  - Valid cookie but non-admin on /admin/* → redirect to /dashboard
//  - Everything else → pass through (route handlers do their own auth)

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Paths that never require auth ───────────────────────────────────────────

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
  // Allow logout without a valid token (clears the cookie regardless)
  '/api/auth/logout',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Always allow public paths and Next.js internals
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get('learnlens_token')?.value;

  if (!token) {
    // API routes → 401 JSON; page routes → redirect to /login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 },
      );
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Verify the token (Edge-compatible: jose only, no Node.js crypto module)
  let payload: { sub?: string; role?: string };
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload: p } = await jwtVerify(token, secret);
    payload = p as typeof payload;
  } catch {
    // Invalid / expired token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please sign in again.' },
        { status: 401 },
      );
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    const res = NextResponse.redirect(loginUrl);
    // Clear the bad cookie
    res.cookies.set('learnlens_token', '', { maxAge: 0, path: '/' });
    return res;
  }

  // Admin guard: /admin pages and /api/admin/* routes
  const isAdminPath =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin/');

  if (isAdminPath && payload.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - Public image/font files (png, jpg, svg, woff2, …)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff2?|ttf)).*)',
  ],
};
