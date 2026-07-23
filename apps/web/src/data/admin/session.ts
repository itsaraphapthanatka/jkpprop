import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Role } from '@jkp/domain';

/**
 * Admin session (mock). DEMO auth: the login route accepts any credentials and
 * grants super_admin, storing a base64 JSON cookie. Replace with real auth
 * (JWT/session, bcrypt, brute-force protection) per FR-SEC-01/04 — the guard and
 * RBAC helpers below stay the same. Public site has no login.
 */
export const ADMIN_COOKIE = 'jkp_admin';

export interface AdminUser {
  name: string;
  email: string;
  role: Role;
}

export function encodeSession(user: AdminUser): string {
  return Buffer.from(JSON.stringify(user), 'utf8').toString('base64');
}

export async function getSession(): Promise<AdminUser | null> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  try {
    const user = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as AdminUser;
    return user?.email && user?.role ? user : null;
  } catch {
    return null;
  }
}

/** Redirect to login when unauthenticated. Use in the guarded admin layout. */
export async function requireSession(): Promise<AdminUser> {
  const user = await getSession();
  if (!user) redirect('/admin/login');
  return user;
}

/* RBAC (SPEC_PACK Part 2 §5) — coarse map for UI gating. API layer still enforces. */
export type AdminAction =
  | 'leads'
  | 'listings'
  | 'shortlists'
  | 'visits'
  | 'deals'
  | 'dealUnlock'
  | 'cms'
  | 'seo'
  | 'users'
  | 'availability';

const MATRIX: Record<Role, AdminAction[]> = {
  super_admin: ['leads', 'listings', 'shortlists', 'visits', 'deals', 'dealUnlock', 'cms', 'seo', 'users', 'availability'],
  listing_manager: ['listings', 'availability'],
  sales_agent: ['leads', 'shortlists', 'visits', 'deals', 'availability'],
  operations_coordinator: ['leads', 'shortlists', 'visits', 'availability'],
  content_editor: ['cms', 'seo'],
  translator: ['cms'],
};

export function can(role: Role, action: AdminAction): boolean {
  return MATRIX[role].includes(action);
}
