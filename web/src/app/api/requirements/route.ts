/* Requirements (Flow B, SPEC_PACK §3.6).
   GET  ?status=… — the list screen
   POST — create one against a lead, for a request that arrived by phone

   Until now this stage existed only as a hardcoded mock-up: no table, no
   route, no list. What the public form submits still lands in `Lead.req`; a
   Requirement is the working copy Ops confirm, cancel and build from. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import {
  REQUIREMENT_STATUSES, nextRequirementCode, requirementInput, requirementDto,
} from '@/lib/server/requirements';

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const q = (url.searchParams.get('q') || '').trim();

  const rows = await db.requirement.findMany({
    where: {
      orgId: user.orgId,
      ...(REQUIREMENT_STATUSES.includes(status as never) ? { status } : {}),
      ...(q
        ? {
          OR: [
            { code: { contains: q, mode: 'insensitive' as const } },
            { lead: { name: { contains: q, mode: 'insensitive' as const } } },
            { lead: { company: { contains: q, mode: 'insensitive' as const } } },
          ],
        }
        : {}),
    },
    include: {
      lead: { select: { id: true, name: true, company: true, status: true } },
      _count: { select: { checks: true, shortlists: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // counts per status for the filter chips — from the table, never a literal
  const grouped = await db.requirement.groupBy({
    by: ['status'],
    where: { orgId: user.orgId },
    _count: true,
  });

  return ok({
    items: rows.map(requirementDto),
    counts: Object.fromEntries(grouped.map((g) => [g.status, g._count])),
    total: rows.length,
  });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'ops');

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const leadId = String(body.leadId || '').trim();
  if (!leadId) throw new ApiError('VALIDATION', 'ต้องระบุ lead', 400, { leadId: 'ต้องระบุ lead' });
  const lead = await db.lead.findFirst({ where: { id: leadId, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);

  const code = await nextRequirementCode(user.orgId);
  const created = await db.requirement.create({
    data: {
      orgId: user.orgId,
      code,
      leadId,
      // fall back to what the lead already told us, so the form starts filled
      ...requirementInput({
        dealIntent: lead.dealIntent,
        typeKey: lead.typeKey,
        ...body,
      }),
    },
    include: {
      lead: { select: { id: true, name: true, company: true, status: true } },
      _count: { select: { checks: true, shortlists: true } },
    },
  });

  await audit({
    user, orgId: user.orgId, action: 'requirement.create', entity: 'requirement', entityId: created.id,
    after: { code, leadId },
  });

  return ok(requirementDto(created), { status: 201 });
});
