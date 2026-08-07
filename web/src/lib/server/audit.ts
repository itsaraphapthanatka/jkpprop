/* Audit middleware (SPEC_PACK cross-cutting rule): every mutation is logged
   with before/after JSON. Failures never fail the request. */
import type { Prisma, User } from '@prisma/client';
import { db } from './db';

export async function audit(opts: {
  user?: User | null;
  orgId: string;
  action: string; // e.g. 'property.create', 'lead.status', 'pii.reveal'
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        orgId: opts.orgId,
        userId: opts.user?.id ?? null,
        userName: opts.user?.name ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        before: (opts.before ?? undefined) as Prisma.InputJsonValue | undefined,
        after: (opts.after ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: opts.ip,
      },
    });
  } catch (e) {
    console.error('[audit] failed', e);
  }
}
