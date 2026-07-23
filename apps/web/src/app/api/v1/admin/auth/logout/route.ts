import { apiOk } from '@/lib/api-response';
import { ADMIN_COOKIE } from '@/data/admin/session';

/** POST /api/v1/admin/auth/logout — clears the session cookie. */
export async function POST() {
  const requestId = crypto.randomUUID();
  const res = apiOk({ ok: true }, requestId, 200);
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
