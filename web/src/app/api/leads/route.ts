/* Leads (§6.1, admin side).
   GET  — list, newest first · scope 'own' → only my assigned leads (§12.2 #2)
   POST — manual create from the Leads page modal */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole, scopeWhere } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { leadDto } from '@/lib/server/leadDto';
import { nextRequirementCode, requirementFromForm, type ReqItem } from '@/lib/server/requirements';
import type { Prisma } from '@prisma/client';

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const source = url.searchParams.get('source') || '';

  const where: Prisma.LeadWhereInput = { orgId: user.orgId, ...scopeWhere(user, 'assigneeId') };
  if (status && status !== 'ทั้งหมด') where.status = status;
  if (source && source !== 'ทั้งหมด') where.source = source;

  const rows = await db.lead.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 });
  const agentIds = [...new Set(rows.map((r) => r.assigneeId).filter((x): x is string => !!x))];
  const agents = agentIds.length
    ? await db.user.findMany({ where: { id: { in: agentIds } }, select: { id: true, name: true } })
    : [];
  const nameOf = new Map(agents.map((a) => [a.id, a.name]));
  return ok({ items: rows.map((l) => leadDto(l, user, l.assigneeId ? nameOf.get(l.assigneeId) : null)) });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent', 'ops');

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = String(body?.name || '').trim();
  if (!name) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อ lead', 400, { name: 'กรุณากรอกชื่อ lead' });

  const lead = await db.lead.create({
    data: {
      orgId: user.orgId,
      name: name.slice(0, 200),
      phone: String(body?.phone || '').trim().slice(0, 50),
      email: String(body?.email || '').trim().slice(0, 200),
      company: String(body?.company || '').trim().slice(0, 200) || null,
      message: String(body?.message || '').trim().slice(0, 2000),
      typeKey: String(body?.typeKey || 'warehouse').slice(0, 40),
      typeLabel: String(body?.typeLabel || '').slice(0, 100),
      dealIntent: String(body?.dealIntent || '').slice(0, 40),
      req: (Array.isArray(body?.req) ? body.req : []) as Prisma.InputJsonValue,
      /* ลูกค้า/นายหน้า — คอลัมน์มีมาตลอด แต่เส้นทางสร้างจากหลังบ้านไม่เคยส่ง
         มา ลีดที่เซลล์คีย์เองจึงไม่มีข้อมูลนี้เลย (สไลด์ 16) */
      respondentType: String(body?.respondentType || '').trim().slice(0, 100) || null,
      source: String(body?.source || 'inquiry').slice(0, 60),
      status: typeof body?.status === 'string' && body.status ? String(body.status).slice(0, 40) : 'new',
      assigneeId: user.scope === 'own' ? user.id : (typeof body?.assigneeId === 'string' ? body.assigneeId : null),
    },
  });

  /* สไลด์ 36 · "Leads ไม่มีให้คีย์ข้อมูลความต้องการลูกค้า" — ฟอร์มบนเว็บสร้าง
     Requirement ให้ทันทีเพื่อให้งานเข้าคิว Flow B แต่ลีดที่เซลล์คีย์เองจบแค่
     แถวใน Lead งานจึงไม่ไปไหนต่อ ตอนนี้เดินเส้นเดียวกัน: ถ้าคีย์ความต้องการ
     มาด้วย จะได้ Requirement พร้อมรหัสเหมือนกัน */
  let requirementCode = '';
  if (Array.isArray(body?.req) && body.req.length) {
    try {
      requirementCode = await nextRequirementCode(user.orgId);
      await db.requirement.create({
        data: {
          orgId: user.orgId,
          code: requirementCode,
          leadId: lead.id,
          ...requirementFromForm(body.req as ReqItem[], lead),
        },
      });
    } catch {
      /* ลีดบันทึกไปแล้ว — ถ้าสร้างใบงานต่อไม่ได้ ให้ทีมไปสร้างเองทีหลัง
         ดีกว่าบอกว่าบันทึกไม่สำเร็จทั้งที่ข้อมูลลูกค้าเก็บไว้แล้ว */
    }
  }

  await audit({ user, orgId: user.orgId, action: 'lead.create', entity: 'lead', entityId: lead.id, after: { name: lead.name, source: lead.source, requirement: requirementCode } });
  return ok(leadDto(lead, user), { status: 201 });
});
