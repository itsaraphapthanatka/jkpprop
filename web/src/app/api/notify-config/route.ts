/* Notify config (§7.2). Split per §11 #5:
   - thresholds (enabled / months / includeExpired) are ORG-wide
     → PUT gated to owner/manager/ops (MATRIX "ตั้งเกณฑ์แจ้งเตือน")
   - readIds are PER-USER (User.readAlertIds) → see /api/notifications/read
   GET merges both into the NotifyConfig shape the client already uses. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

type OrgNotify = { enabled: boolean; months: number[]; includeExpired: boolean };
const DEFAULTS: OrgNotify = { enabled: true, months: [1, 3], includeExpired: true };

function orgNotify(raw: unknown): OrgNotify {
  const o = (raw ?? {}) as Partial<OrgNotify>;
  return {
    enabled: typeof o.enabled === 'boolean' ? o.enabled : DEFAULTS.enabled,
    months: Array.isArray(o.months) ? o.months.filter((m): m is number => [1, 2, 3].includes(m as number)) : DEFAULTS.months,
    includeExpired: typeof o.includeExpired === 'boolean' ? o.includeExpired : DEFAULTS.includeExpired,
  };
}

export const GET = handler(async () => {
  const user = await requireUser();
  const org = await db.org.findUnique({ where: { id: user.orgId }, select: { notifyConfig: true } });
  return ok({ ...orgNotify(org?.notifyConfig), readIds: user.readAlertIds });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'ops');

  const body = (await req.json().catch(() => null)) as Partial<OrgNotify> | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);
  const next = orgNotify(body);
  // §8: at least one criterion (a month milestone or "เลยกำหนด")
  if (next.enabled && next.months.length === 0 && !next.includeExpired) {
    throw new ApiError('VALIDATION', 'ต้องเลือกอย่างน้อย 1 ช่วงเวลา', 400);
  }

  const before = await db.org.findUnique({ where: { id: user.orgId }, select: { notifyConfig: true } });
  await db.org.update({ where: { id: user.orgId }, data: { notifyConfig: next } });
  await audit({
    user, orgId: user.orgId, action: 'notifyConfig.save', entity: 'org', entityId: user.orgId,
    before: orgNotify(before?.notifyConfig), after: next,
  });
  return ok({ ...next, readIds: user.readAlertIds });
});
