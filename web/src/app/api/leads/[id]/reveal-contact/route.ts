/* POST /api/leads/:id/reveal-contact — full PII for one lead (§12.5).
   Requires the 'pii' privilege; EVERY call lands in the audit log
   (PDPA ม.37 / GDPR Art.30). */
import { ok, handler, ApiError, clientIp } from '@/lib/server/api';
import { requireUser, requirePriv } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const POST = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requirePriv(user, 'pii');
  const { id } = await ctx.params;

  const lead = await db.lead.findFirst({ where: { id, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);
  if (user.scope === 'own' && lead.assigneeId !== user.id) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณเข้าถึงได้เฉพาะ lead ที่ได้รับมอบหมาย', 403);
  }

  await audit({
    user, orgId: user.orgId, action: 'pii.reveal', entity: 'lead', entityId: id,
    after: { field: 'phone,email' }, ip: clientIp(req),
  });

  return ok({ phone: lead.phone, email: lead.email });
});
