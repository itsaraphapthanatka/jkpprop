/* GET /api/me/permissions — who am I + effective permissions (§12.5).
   The frontend calls this after login to know which menus to hide. */
import { ok, handler } from '@/lib/server/api';
import { requireUser, hasPriv } from '@/lib/server/auth';
import { PRIVILEGES } from '@/lib/rbac';

export const GET = handler(async () => {
  const u = await requireUser();
  return ok({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    scope: u.scope,
    // effective set — FORBIDDEN_PRIVS already applied server-side
    privileges: PRIVILEGES.map((p) => p.key).filter((k) => hasPriv(u, k)),
    expiresAt: u.expiresAt ? u.expiresAt.toISOString() : null,
    mustChangePassword: u.mustChangePassword,
  });
});
