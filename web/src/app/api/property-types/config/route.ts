/* Property-type enablement (§3.2).
   GET  — public read (the /contact requirement form needs it without login).
   PUT  — owner only (MATRIX "เปิด / ปิดประเภททรัพย์").
   Rule: at least one type must stay enabled (§8). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { PROPERTY_TYPES } from '@/lib/propertySchema';

async function orgIdForPublic(): Promise<string | null> {
  // single-tenant v1: the one org (FRONTEND_API_SPEC §11 #2 — revisit for multi-tenant)
  const org = await db.org.findFirst({ select: { id: true } });
  return org?.id ?? null;
}

export const GET = handler(async () => {
  const orgId = await orgIdForPublic();
  if (!orgId) return ok({ disabled: [] });
  const org = await db.org.findUnique({ where: { id: orgId }, select: { disabledTypes: true } });
  return ok({ disabled: org?.disabledTypes ?? [] });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner');

  const body = (await req.json().catch(() => null)) as { disabled?: unknown } | null;
  const known = new Set(PROPERTY_TYPES.map((t) => t.key));
  const disabled = Array.isArray(body?.disabled)
    ? body.disabled.map(String).filter((k) => known.has(k))
    : null;
  if (disabled === null) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);
  if (disabled.length >= PROPERTY_TYPES.length) {
    throw new ApiError('VALIDATION', 'ต้องเปิดอย่างน้อย 1 ประเภททรัพย์', 400);
  }

  const before = await db.org.findUnique({ where: { id: user.orgId }, select: { disabledTypes: true } });
  await db.org.update({ where: { id: user.orgId }, data: { disabledTypes: disabled } });

  await audit({
    user, orgId: user.orgId, action: 'typeConfig.save', entity: 'org', entityId: user.orgId,
    before: { disabled: before?.disabledTypes ?? [] }, after: { disabled },
  });

  return ok({ disabled });
});
