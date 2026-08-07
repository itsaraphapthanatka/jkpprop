/* POST /api/auth/login — email+password → httpOnly session cookie.
   Lockout: 5 failures / 15 min per email (SPEC_PACK §2 login rules),
   same error message either way — no user enumeration. */
import { cookies } from 'next/headers';
import { db } from '@/lib/server/db';
import { ok, fail, handler, clientIp } from '@/lib/server/api';
import { createSession, sessionCookieOptions, verifyPassword, SESSION_COOKIE } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';

const fails = new Map<string, { n: number; until: number }>();
const WINDOW = 15 * 60 * 1000;

export const POST = handler(async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) {
    return fail('VALIDATION', 'กรุณากรอกอีเมลและรหัสผ่าน', 400);
  }

  const now = Date.now();
  const f = fails.get(email);
  if (f && f.n >= 5 && now < f.until) {
    return fail('LOCKED', 'พยายามเข้าสู่ระบบผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่', 429);
  }

  const user = await db.user.findUnique({ where: { email } });
  const okPw = user ? await verifyPassword(password, user.passwordHash) : false;
  const expired = user?.role === 'co_agent' && user.expiresAt && user.expiresAt < new Date();

  if (!user || !okPw || !user.active || expired) {
    const cur = fails.get(email);
    fails.set(email, { n: (cur && now < cur.until ? cur.n : 0) + 1, until: now + WINDOW });
    return fail('BAD_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
  }
  fails.delete(email);

  const token = await createSession(user.id);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());

  await audit({
    user, orgId: user.orgId, action: 'auth.login', entity: 'user', entityId: user.id, ip: clientIp(req),
  });

  return ok({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, scope: user.scope, privileges: user.privileges },
  });
});
