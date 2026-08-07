/* Users & RBAC (§12.5). Owner-only — MATRIX "ผู้ใช้ & บทบาท". */
import { ok, handler } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

export const GET = handler(async () => {
  const user = await requireUser();
  requireRole(user, 'owner');
  const rows = await db.user.findMany({ where: { orgId: user.orgId }, orderBy: { createdAt: 'asc' } });
  return ok({
    items: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      scope: u.scope,
      privileges: u.privileges,
      expiresAt: u.expiresAt ? u.expiresAt.toISOString().slice(0, 10) : '',
      active: u.active,
    })),
  });
});
