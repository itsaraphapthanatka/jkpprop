/* PUT /api/users/:id/permissions (§12.5) — owner only.
   Server re-validates everything the UI enforces, because a direct API call
   bypasses the UI entirely (§12.2 #1, §12.4):
   - FORBIDDEN_PRIVS per role
   - scopeLocked roles (owner=all, co_agent=own)
   - co_agent must carry an expiry date */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { ROLES, privAllowed, PRIVILEGES, type PrivKey, type RoleKey, type Scope } from '@/lib/rbac';

export const PUT = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const actor = await requireUser();
  requireRole(actor, 'owner');
  const { id } = await ctx.params;

  const target = await db.user.findFirst({ where: { id, orgId: actor.orgId } });
  if (!target) throw new ApiError('NOT_FOUND', 'ไม่พบผู้ใช้นี้', 404);

  const body = (await req.json().catch(() => null)) as
    | { role?: string; scope?: string; privileges?: string[]; expiresAt?: string }
    | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const roleDef = ROLES.find((r) => r.key === body.role);
  if (!roleDef) throw new ApiError('VALIDATION', 'บทบาทไม่ถูกต้อง', 400);
  const role = roleDef.key as RoleKey;

  // scopeLocked roles ignore whatever the client sent
  const scope: Scope = roleDef.scopeLocked ? roleDef.defaultScope : (body.scope === 'all' ? 'all' : 'own');

  const known = new Set(PRIVILEGES.map((p) => p.key));
  const requested = Array.isArray(body.privileges) ? body.privileges.filter((p): p is PrivKey => known.has(p as PrivKey)) : [];
  const rejected = requested.filter((p) => !privAllowed(role, p));
  if (rejected.length) {
    throw new ApiError('FORBIDDEN_PRIV', `บทบาท "${roleDef.label}" ให้สิทธิ์นี้ไม่ได้: ${rejected.join(', ')}`, 400);
  }

  // external roles (co_agent) must have an expiry (§12.3)
  let expiresAt: Date | null = null;
  if (body.expiresAt) {
    const d = new Date(body.expiresAt);
    if (!isNaN(d.getTime())) expiresAt = d;
  }
  if (roleDef.external && !expiresAt) {
    throw new ApiError('VALIDATION', 'บทบาทภายนอกต้องกำหนดวันหมดอายุ', 400, { expiresAt: 'กรุณากำหนดวันหมดอายุ' });
  }

  const before = { role: target.role, scope: target.scope, privileges: target.privileges, expiresAt: target.expiresAt };
  const updated = await db.user.update({
    where: { id },
    data: { role, scope, privileges: requested, expiresAt },
  });

  await audit({
    user: actor, orgId: actor.orgId, action: 'user.permissions', entity: 'user', entityId: id,
    before, after: { role, scope, privileges: requested, expiresAt },
  });

  return ok({
    id: updated.id, role: updated.role, scope: updated.scope,
    privileges: updated.privileges,
    expiresAt: updated.expiresAt ? updated.expiresAt.toISOString().slice(0, 10) : '',
  });
});
