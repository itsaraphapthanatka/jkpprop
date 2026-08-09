/* POST /api/users/invite (§12.5) — owner only.
   v1 has no mail transport, so this creates the account with a temporary
   password and returns it once for the owner to hand over. */
import { randomBytes } from 'crypto';
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole, hashPassword } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { ROLES, initialPrivs, type RoleKey } from '@/lib/rbac';

export const POST = handler(async (req: Request) => {
  const actor = await requireUser();
  requireRole(actor, 'owner');

  const body = (await req.json().catch(() => null)) as { email?: string; name?: string; role?: string; expiresAt?: string } | null;
  const email = String(body?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) throw new ApiError('VALIDATION', 'กรุณากรอกอีเมลให้ถูกต้อง', 400, { email: 'กรุณากรอกอีเมลให้ถูกต้อง' });

  const roleDef = ROLES.find((r) => r.key === body?.role);
  if (!roleDef) throw new ApiError('VALIDATION', 'บทบาทไม่ถูกต้อง', 400);

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) throw new ApiError('DUPLICATE', 'อีเมลนี้มีบัญชีอยู่แล้ว', 400, { email: 'อีเมลนี้มีบัญชีอยู่แล้ว' });

  let expiresAt: Date | null = null;
  if (body?.expiresAt) {
    const d = new Date(body.expiresAt);
    if (!isNaN(d.getTime())) expiresAt = d;
  }
  if (roleDef.external && !expiresAt) {
    throw new ApiError('VALIDATION', 'บทบาทภายนอกต้องกำหนดวันหมดอายุ', 400, { expiresAt: 'กรุณากำหนดวันหมดอายุ' });
  }

  const tempPassword = randomBytes(6).toString('base64url');
  const created = await db.user.create({
    data: {
      orgId: actor.orgId,
      email,
      name: String(body?.name || email.split('@')[0]).slice(0, 120),
      passwordHash: await hashPassword(tempPassword),
      role: roleDef.key,
      scope: roleDef.defaultScope,
      privileges: initialPrivs(roleDef.key as RoleKey),
      expiresAt,
    },
  });

  await audit({
    user: actor, orgId: actor.orgId, action: 'user.invite', entity: 'user', entityId: created.id,
    after: { email, role: roleDef.key },
  });

  // shown once — there is no mail transport in v1
  return ok({ id: created.id, email, tempPassword }, { status: 201 });
});
