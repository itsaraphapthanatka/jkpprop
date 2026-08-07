/* POST /api/auth/logout — destroy the session and clear the cookie. */
import { cookies } from 'next/headers';
import { ok, handler } from '@/lib/server/api';
import { destroySession, SESSION_COOKIE } from '@/lib/server/auth';

export const POST = handler(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  jar.delete(SESSION_COOKIE);
  return ok({ ok: true });
});
