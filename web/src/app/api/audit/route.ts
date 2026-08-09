/* GET /api/audit (§9 /admin/audit) — requires the 'audit' privilege
   (MATRIX: owner by default, manager via priv). Rows carry before/after
   JSON so the UI can render the diff. */
import { ok, handler } from '@/lib/server/api';
import { requireUser, requirePriv } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import type { Prisma } from '@prisma/client';

/* action prefix → the tag the design uses */
function tagOf(action: string): string {
  if (action.includes('.delete')) return 'DELETE';
  if (action.includes('.create') || action.includes('.invite') || action.includes('upload')) return 'CREATE';
  if (action.startsWith('pii.') || action.includes('unlock') || action.startsWith('user.') || action.startsWith('auth.')) return 'SECURITY';
  if (action.includes('publish')) return 'PUBLISH';
  return 'UPDATE';
}

const short = (v: Prisma.JsonValue | null): string | undefined => {
  if (v === null || v === undefined) return undefined;
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 160 ? `${s.slice(0, 160)}…` : s;
};

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  requirePriv(user, 'audit');

  const url = new URL(req.url);
  const entity = url.searchParams.get('entity') || '';
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 100)));

  const where: Prisma.AuditLogWhereInput = { orgId: user.orgId };
  if (entity && !entity.startsWith('ทุก')) where.entity = entity;

  const rows = await db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit });
  return ok({
    items: rows.map((r) => ({
      id: r.id,
      user: r.userName || 'ระบบ',
      action: r.action,
      tag: tagOf(r.action),
      entity: r.entityId ? `${r.entity}/${r.entityId}` : r.entity,
      entityType: r.entity,
      createdAt: r.createdAt.getTime(),
      ip: r.ip || '—',
      before: short(r.before),
      after: short(r.after),
    })),
  });
});
