/* Deals (§9 /admin/deals) — GET list + POST create. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { advanceLead } from '@/lib/server/leadPipeline';
import { displayNoteText } from '@/lib/server/leadNoteText';

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await db.deal.findMany({ where: { orgId: user.orgId }, orderBy: { updatedAt: 'desc' }, take: 200 });

  /* which property and which customer — the screen showed a fixed
     "โกดังพร้อมสำนักงาน 2,700 ตร.ม. · JKP-SPK0042 · บ. ไทยโลจิสติกส์" card
     above whatever deal was open */
  const propIds = [...new Set(rows.map((d) => d.propertyId).filter(Boolean) as string[])];
  const leadIds = [...new Set(rows.map((d) => d.leadId).filter(Boolean) as string[])];
  /* รหัสงานต้นทาง — หัวเรื่องดีลเคยตัดท้าย id มา 6 ตัวได้ 'DEAL-7RS13H'
     ที่ไม่ตรงกับ REQ ของงานเดียวกัน (ลูกค้าแจ้ง 25 ส.ค.) */
  const reqIds = [...new Set(rows.map((d) => d.requirementId).filter(Boolean) as string[])];
  const reqRows = reqIds.length
    ? await db.requirement.findMany({ where: { orgId: user.orgId, id: { in: reqIds } }, select: { id: true, code: true } })
    : [];
  const reqById = new Map(reqRows.map((r) => [r.id, r]));
  const [props, leads] = await Promise.all([
    /* values ด้วย — รูปทรัพย์อยู่ในนั้น หน้าดีลโชว์แต่ไอคอนบ้านสีเทาเหมือนกัน
       ทุกดีล (สไลด์ 43 "ต้องมีรูปภาพเพื่อยืนยัน" · ลูกค้าชี้ซ้ำว่า "รูปยังไม่ขึ้น") */
    propIds.length ? db.property.findMany({ where: { id: { in: propIds } }, select: { id: true, publicCode: true, title: true, values: true } }) : [],
    leadIds.length ? db.lead.findMany({ where: { id: { in: leadIds } }, select: { id: true, name: true, company: true, phone: true, email: true, status: true } }) : [],
  ]);
  const propById = new Map(props.map((p) => [p.id, p]));
  /** รูปแรกของทรัพย์ — ช่อง photos เก็บ src ที่เสิร์ฟได้เลย */
  const propImg = (values: unknown): string | null => {
    const raw = ((values ?? {}) as Record<string, unknown>).photos;
    return Array.isArray(raw) && typeof raw[0] === 'string' ? raw[0] : null;
  };
  const leadById = new Map(leads.map((l) => [l.id, l]));

  /* สไลด์ 42 · "ไม่มีสรุปและประวัติการติดต่อ" — หน้าดีลมีไทม์ไลน์การเจรจา
     (ยื่นข้อเสนอกี่รอบ) แต่ไม่มีประวัติว่าคุยอะไรกับลูกค้ามาบ้าง ทั้งที่บันทึก
     อยู่ใน LeadNote ตั้งแต่ตอนทำ lead แล้ว */
  const notes = leadIds.length
    ? await db.leadNote.findMany({
      where: { leadId: { in: leadIds } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    : [];
  const notesByLead = new Map<string, { text: string; at: number }[]>();
  for (const n of notes) {
    const list = notesByLead.get(n.leadId) ?? [];
    if (list.length < 20) list.push({ text: displayNoteText(n.text), at: n.createdAt.getTime() });
    notesByLead.set(n.leadId, list);
  }

  return ok({
    items: rows.map((d) => ({
      id: d.id, title: d.title, leadId: d.leadId, propertyId: d.propertyId,
      requirementId: d.requirementId,
      requirementCode: d.requirementId ? reqById.get(d.requirementId)?.code ?? '' : '',
      propertyCode: d.propertyId ? propById.get(d.propertyId)?.publicCode ?? '' : '',
      propertyTitle: d.propertyId ? propById.get(d.propertyId)?.title ?? '' : '',
      propertyImg: d.propertyId ? propImg(propById.get(d.propertyId)?.values) : null,
      customer: d.leadId ? (leadById.get(d.leadId)?.company || leadById.get(d.leadId)?.name || '') : '',
      customerContact: d.leadId ? (leadById.get(d.leadId)?.name ?? '') : '',
      customerPhone: d.leadId ? (leadById.get(d.leadId)?.phone ?? '') : '',
      customerEmail: d.leadId ? (leadById.get(d.leadId)?.email ?? '') : '',
      leadStatus: d.leadId ? (leadById.get(d.leadId)?.status ?? '') : '',
      history: d.leadId ? (notesByLead.get(d.leadId) ?? []) : [],
      amount: d.amount, status: d.status, locked: d.locked,
      closedAt: d.closedAt?.getTime() ?? null, note: d.note, updatedAt: d.updatedAt.getTime(),
    })),
  });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'manager', 'agent');

  const body = (await req.json().catch(() => null)) as { title?: string; leadId?: string; requirementId?: string; propertyCode?: string; amount?: number; visitId?: string } | null;
  const title = String(body?.title || '').trim();
  if (!title) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อดีล', 400);

  /* เด็ค Web 2026 ข้อ 21 · เปิดดีลจากแผนเข้าชมได้ต่อเมื่อยืนยันเกณฑ์แล้ว
     ปุ่มบนหน้าจอล็อกไว้แล้ว แต่ต้องกันที่นี่ด้วย ไม่งั้นยิง API ตรงก็ข้ามด่านได้ */
  const leadId = typeof body?.leadId === 'string' ? body.leadId : null;
  /* ใบงานต้นทาง — ดีลที่เปิดจากแผนเข้าชมสืบรหัสต่อจากแผนนั้น */
  let requirementId: string | null = null;

  if (typeof body?.visitId === 'string' && body.visitId) {
    const visit = await db.visit.findFirst({ where: { id: body.visitId, orgId: user.orgId } });
    if (!visit) throw new ApiError('NOT_FOUND', 'ไม่พบแผนเข้าชมนี้', 404);
    if (!visit.gateConfirmed) {
      throw new ApiError('VISIT_GATE_PENDING', 'ยังไม่ได้ยืนยันเกณฑ์ของแผนเข้าชมนี้ — กด "ยืนยันเกณฑ์" ก่อนจึงเปิดดีลได้', 409);
    }
    requirementId = visit.requirementId;
  }

  if (typeof body?.requirementId === 'string' && body.requirementId) {
    const r = await db.requirement.findFirst({ where: { id: body.requirementId, orgId: user.orgId }, select: { id: true } });
    if (!r) throw new ApiError('VALIDATION', 'ไม่พบใบงานที่อ้างถึง', 400);
    requirementId = r.id;
  }

  /* เปิดดีลตรง ๆ โดยไม่ผ่านแผนเข้าชม — เดาให้เฉพาะตอนที่ลูกค้ามีใบงานใบเดียว */
  if (!requirementId && leadId) {
    const rs = await db.requirement.findMany({ where: { orgId: user.orgId, leadId }, select: { id: true }, take: 2 });
    if (rs.length === 1) requirementId = rs[0].id;
  }

  let propertyId: string | null = null;
  if (body?.propertyCode) {
    const p = await db.property.findFirst({ where: { orgId: user.orgId, publicCode: String(body.propertyCode) } });
    propertyId = p?.id ?? null;
  }

  const deal = await db.deal.create({
    data: {
      orgId: user.orgId,
      title: title.slice(0, 300),
      leadId,
      requirementId,
      propertyId,
      amount: Number.isFinite(body?.amount) ? Math.max(0, Math.round(body!.amount!)) : 0,
    },
  });
  // Flow D: opening a deal is what makes the lead `negotiating`
  await advanceLead(deal.leadId, 'negotiating', { user, orgId: user.orgId, reason: `deal ${deal.id}` });
  await audit({ user, orgId: user.orgId, action: 'deal.create', entity: 'deal', entityId: deal.id, after: { title: deal.title, amount: deal.amount } });
  return ok({ id: deal.id }, { status: 201 });
});
