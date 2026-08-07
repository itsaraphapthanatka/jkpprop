/* ============================================================
   Auth — httpOnly cookie session backed by the Session table.
   Decision (FRONTEND_API_SPEC §11 #1): session cookie, not JWT,
   so Server Components can read the user directly.

   RBAC enforcement lives here too (§12.2):
   - requireUser(): session + active + co_agent expiry check
   - requirePriv(): privilege gate, validated against FORBIDDEN_PRIVS
   - scopeWhere(): row-level 'own' filtering — never filter on the client
   ============================================================ */
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { db } from './db';
import { ApiError } from './api';
import { FORBIDDEN_PRIVS, type PrivKey, type RoleKey } from '@/lib/rbac';

export const SESSION_COOKIE = 'jkp_session';
const SESSION_DAYS = 30;

/* store only the hash of the token — a DB leak can't be replayed */
const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { token: hashToken(token), userId, expiresAt } });
  return token;
}

export async function destroySession(token: string) {
  await db.session.deleteMany({ where: { token: hashToken(token) } });
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 86400) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** Session user, or null. Enforces active + co_agent expiry on every request (§12.2 #5). */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (!u.active) return null;
  if (u.role === 'co_agent' && u.expiresAt && u.expiresAt < new Date()) return null;
  return u;
}

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) throw new ApiError('UNAUTHENTICATED', 'กรุณาเข้าสู่ระบบ', 401);
  return u;
}

export function hasPriv(user: User, priv: PrivKey): boolean {
  // FORBIDDEN_PRIVS is re-checked server-side — a forbidden priv in the DB is ignored
  if ((FORBIDDEN_PRIVS[user.role as RoleKey] || []).includes(priv)) return false;
  return user.privileges.includes(priv);
}

export function requirePriv(user: User, priv: PrivKey) {
  if (!hasPriv(user, priv)) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณไม่มีสิทธิ์ทำรายการนี้', 403);
  }
}

export function requireRole(user: User, ...roles: RoleKey[]) {
  if (!roles.includes(user.role as RoleKey)) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณไม่มีสิทธิ์ทำรายการนี้', 403);
  }
}

/** Row-level scope filter (§12.2 #2): scope 'own' → WHERE owner = me. */
export function scopeWhere(user: User, ownerField = 'assigneeId'): Record<string, string> {
  if (user.scope === 'own') return { [ownerField]: user.id };
  return {};
}
