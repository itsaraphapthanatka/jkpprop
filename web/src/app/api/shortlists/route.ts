/* Shortlists (§9 /admin/shortlists + /client-shortlist).
   POST — create with property codes → returns the tokenized client link
   GET  — list for the admin page */
import { randomBytes } from 'crypto';
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.shortlist.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: 'desc' },
    /* รหัสใบงานติดมากับทุกแถว — ลูกค้าขอ 25 ส.ค. ให้ทั้งสายอ่านเป็นงานเดียวกัน
       รายการเลือก shortlist เคยบอกแค่ชื่อกับจำนวนทรัพย์ */
    include: { items: true, requirement: { select: { id: true, code: true } } },
    take: 200,
  });
  return ok({
    items: rows.map((s) => ({
      id: s.id,
      name: s.name,
      requirementId: s.requirement?.id ?? null,
      requirementCode: s.requirement?.code ?? '',
      token: s.token,
      url: `/client-shortlist?token=${s.token}`,
      status: s.status,
      count: s.items.length,
      createdAt: s.createdAt.getTime(),
    })),
  });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'co_agent', 'ops');

  const body = (await req.json().catch(() => null)) as { name?: string; leadId?: string; codes?: string[] } | null;
  const codes = Array.isArray(body?.codes) ? body.codes.map(String).slice(0, 20) : [];
  if (!codes.length) throw new ApiError('VALIDATION', 'เลือกทรัพย์อย่างน้อย 1 รายการ', 400);

  const props = await db.property.findMany({ where: { orgId: user.orgId, publicCode: { in: codes } } });
  if (!props.length) throw new ApiError('VALIDATION', 'ไม่พบทรัพย์ตามรหัสที่ส่งมา', 400);

  const token = randomBytes(12).toString('base64url');
  const shortlist = await db.shortlist.create({
    data: {
      orgId: user.orgId,
      name: String(body?.name || '').trim().slice(0, 200) || `Shortlist ${new Date().toLocaleDateString('th-TH')}`,
      leadId: typeof body?.leadId === 'string' ? body.leadId : null,
      token,
      items: { create: props.map((p, i) => ({ propertyId: p.id, sort: i })) },
    },
  });

  await audit({
    user, orgId: user.orgId, action: 'shortlist.create', entity: 'shortlist', entityId: shortlist.id,
    after: { codes, token },
  });

  return ok({ id: shortlist.id, token, url: `/client-shortlist?token=${token}` }, { status: 201 });
});
