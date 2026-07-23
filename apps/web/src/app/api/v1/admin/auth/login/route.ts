import type { NextRequest } from 'next/server';
import { apiFail, apiOk } from '@/lib/api-response';
import { ADMIN_COOKIE, encodeSession, type AdminUser } from '@/data/admin/session';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/v1/admin/auth/login — DEMO admin auth (FR-SEC-01/04).
 * Accepts any non-empty credentials and grants super_admin. Replace with real
 * auth + bcrypt + 5-attempts/15-min lockout later.
 */
export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

  if (!checkRateLimit(`login:${ip}`, 10)) {
    return apiFail([{ code: 'RATE_LIMITED', message: 'rate_limited' }], requestId, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiFail([{ code: 'VALIDATION_ERROR', message: 'invalid_json' }], requestId, 400);
  }

  const { email, password } = (body ?? {}) as { email?: string; password?: string };
  if (!email) return apiFail([{ code: 'required', message: 'required', field: 'email' }], requestId, 422);
  if (!password) return apiFail([{ code: 'required', message: 'required', field: 'password' }], requestId, 422);

  const user: AdminUser = { name: email.split('@')[0] || 'admin', email, role: 'super_admin' };
  const res = apiOk({ user }, requestId, 200);
  res.cookies.set(ADMIN_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}
