/* PATCH /api/leads/:id — status change + assignment (§6.1).
   Lead pipeline is forward-only (SPEC_PACK §4): moving a lead backwards is
   rejected except by owner/manager (correction path). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { rank, STATUS_LABEL } from '@/lib/server/leadPipeline';
import { leadDto } from '@/lib/server/leadDto';
import type { Prisma } from '@prisma/client';
import { displayNoteText } from '@/lib/server/leadNoteText';


export const PATCH = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const lead = await db.lead.findFirst({ where: { id, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);
  if (user.scope === 'own' && lead.assigneeId !== user.id) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณเข้าถึงได้เฉพาะ lead ที่ได้รับมอบหมาย', 403);
  }

  const body = (await req.json().catch(() => null)) as { status?: string; assigneeId?: string | null } | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const data: Prisma.LeadUncheckedUpdateInput = {};
  if (typeof body.status === 'string') {
    if (rank(body.status) < 0) throw new ApiError('VALIDATION', 'สถานะไม่ถูกต้อง', 400);
    const from = rank(lead.status);
    const to = rank(body.status);
    const isManager = user.role === 'owner' || user.role === 'manager';
    if (to < from && !isManager) {
      throw new ApiError('PIPELINE_FORWARD_ONLY', 'สถานะ lead เดินหน้าอย่างเดียว — ถอยกลับได้เฉพาะผู้จัดการขึ้นไป', 400);
    }
    data.status = body.status;
  }
  if (body.assigneeId !== undefined) {
    if (body.assigneeId) {
      const agent = await db.user.findFirst({ where: { id: body.assigneeId, orgId: user.orgId } });
      if (!agent) throw new ApiError('VALIDATION', 'ไม่พบผู้ใช้ที่มอบหมาย', 400);
    }
    data.assigneeId = body.assigneeId;
  }

  const before = { status: lead.status, assigneeId: lead.assigneeId };
  const updated = await db.lead.update({ where: { id }, data });

  /* ไทม์ไลน์ของ lead อ่านจาก LeadNote อย่างเดียว การเปลี่ยนสถานะจึงเคยหายไป
     ทั้งหมด — ทั้งที่กดเองในหน้าจอ และที่ระบบเลื่อนให้ตอนปิดดีล (ดู
     lib/server/leadPipeline) คนดูแล lead เปิดมาก็ไม่เห็นว่าเกิดอะไรขึ้น */
  if (data.status && data.status !== lead.status) {
    await db.leadNote.create({
      data: {
        leadId: id,
        userId: user.id,
        text: `สถานะเปลี่ยนเป็น "${STATUS_LABEL[String(data.status)] ?? String(data.status)}"`,
      },
    }).catch(() => { /* ไทม์ไลน์เป็นของแถม ไม่ควรทำให้การบันทึกล้ม */ });
  }
  await audit({
    user, orgId: user.orgId, action: 'lead.update', entity: 'lead', entityId: id,
    before, after: { status: updated.status, assigneeId: updated.assigneeId },
  });
  return ok(leadDto(updated, user));
});

/* GET — everything the lead panel shows.
 *
 * There was no way to read a lead back: the screen POSTed notes and tasks but
 * never fetched them, so "Timeline & Notes" was four hardcoded events and
 * "งานติดตาม" three hardcoded tasks, identical on every lead. Anything typed
 * showed up once and was gone on refresh — and the POST's failure was
 * swallowed, so a rejected save looked exactly like a successful one.
 *
 * The linked-records strip ("Requirement #REQ-1042 · Shortlist #SL-208") was
 * hardcoded too; it is real now that requirements exist.
 */
export const GET = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const lead = await db.lead.findFirst({ where: { id, orgId: user.orgId } });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);
  if (user.scope === 'own' && lead.assigneeId !== user.id) {
    throw new ApiError('FORBIDDEN', 'บัญชีของคุณเข้าถึงได้เฉพาะ lead ที่ได้รับมอบหมาย', 403);
  }

  const [notes, tasks, requirements, shortlists, visits, deals, authors] = await Promise.all([
    db.leadNote.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } }),
    db.leadTask.findMany({ where: { leadId: id }, orderBy: [{ done: 'asc' }, { createdAt: 'asc' }] }),
    db.requirement.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } }),
    db.shortlist.findMany({ where: { leadId: id }, include: { items: true }, orderBy: { createdAt: 'desc' } }),
    db.visit.findMany({ where: { leadId: id }, orderBy: { date: 'desc' }, include: { stops: true } }),
    /* สไลด์ 43 · "ปิดดีลแล้วไม่ขึ้นประวัติใน Leads ภาพรวม" — การปิดดีลเขียน
       audit log กับเลื่อนสถานะ lead แต่ตัว lead ไม่เคยรู้ว่ามีดีลอยู่เลย
       หน้านี้ไม่เคยถามถึงตาราง Deal สักครั้ง */
    db.deal.findMany({ where: { leadId: id, orgId: user.orgId }, orderBy: { createdAt: 'desc' } }),
    db.user.findMany({ where: { orgId: user.orgId }, select: { id: true, name: true } }),
  ]);
  const nameOf = new Map(authors.map((u) => [u.id, u.name]));
  /* ใบงานของลูกค้ารายนี้ทั้งหมด — ใช้แปลง requirementId เป็นรหัสที่พูดออกเสียงได้ */
  const codeOfReq = new Map(requirements.map((r) => [r.id, r.code]));

  /* รูปกับรหัสของทรัพย์ที่ถูกอ้างถึงในประวัติ — สไลด์ 43 (และ 32/39/42 ที่เขียน
     เหมือนกัน) "จำเป็นต้องมีรูปเพราะ 1 ใช้ระบบรัน code ไม่รู้รหัส 2 คนทำงานหลาย
     คน · ต้องมีรูปภาพเพื่อยืนยัน" — รหัส JKPBKK1005 ไม่ได้บอกอะไรกับคนที่ไม่ได้
     เป็นคนลงเอง */
  const propertyIds = [...new Set([
    ...deals.map((d) => d.propertyId),
    ...visits.flatMap((v) => v.stops.map((st) => st.propertyId)),
  ].filter((x): x is string => !!x))];
  const props = propertyIds.length
    ? await db.property.findMany({
      where: { orgId: user.orgId, id: { in: propertyIds } },
      select: { id: true, publicCode: true, title: true, values: true },
    })
    : [];
  const propOf = new Map(props.map((pr) => {
    const raw = ((pr.values ?? {}) as Record<string, unknown>).photos;
    const img = Array.isArray(raw) && typeof raw[0] === 'string' ? raw[0] : null;
    return [pr.id, { code: pr.publicCode, title: pr.title, img }];
  }));

  /* ประวัติจริงของ lead นี้ — สไลด์ 43 "ไม่มีสรุปและประวัติการติดต่อ"
     เดิมไทม์ไลน์คือโน้ตที่พิมพ์มือล้วน ๆ บวกบรรทัด "สร้าง lead" หนึ่งบรรทัด
     สิ่งที่เกิดขึ้นจริงกับ lead — เปิด REQ, ยืนยัน REQ, ส่ง shortlist, นัดเข้าชม,
     ปิดดีล — ไม่มีอันไหนโผล่เลย ทั้งที่ทุกอย่างมีแถวของตัวเองในฐานข้อมูล
     ประกอบจากแถวจริง ไม่ใช่รอให้ใครมาพิมพ์บันทึกไว้ ประวัติเก่าจึงครบไปด้วย */
  type Ev = {
    kind: string; at: number; text: string; by: string;
    property?: { code: string; title: string; img: string | null };
  };
  const events: Ev[] = [
    { kind: 'created', at: lead.createdAt.getTime(), text: `สร้าง lead จาก ${lead.source || 'ฟอร์ม'}`, by: 'ระบบ' },
    ...notes.map((n) => ({
      /* บันทึกที่ระบบเขียนเองตอนเลื่อนสถานะ แยกออกจากบันทึกที่คนพิมพ์ — ไม่งั้น
         "ติดต่อแล้ว 3 ครั้ง" จะนับการเปลี่ยนสถานะเป็นการติดต่อลูกค้าไปด้วย */
      kind: n.text.startsWith('สถานะเปลี่ยนเป็น "') ? 'status' : 'note',
      at: n.createdAt.getTime(), text: displayNoteText(n.text),
      by: n.userId ? nameOf.get(n.userId) ?? 'ทีมงาน' : 'ระบบ',
    })),
    ...requirements.flatMap((r) => [
      { kind: 'req', at: r.createdAt.getTime(), text: `เปิดใบความต้องการ ${r.code}`, by: 'ทีมงาน' },
      ...(r.confirmedAt ? [{ kind: 'req_confirmed', at: r.confirmedAt.getTime(), text: `ยืนยันความต้องการ ${r.code}`, by: 'ทีมงาน' }] : []),
      ...(r.cancelledAt ? [{ kind: 'req_cancelled', at: r.cancelledAt.getTime(), text: `ยกเลิก ${r.code}${r.cancelReason ? ` — ${r.cancelReason}` : ''}`, by: 'ทีมงาน' }] : []),
    ]),
    ...shortlists.map((sl) => ({
      kind: 'shortlist', at: sl.createdAt.getTime(),
      text: `ส่งรายการคัดเลือก "${sl.name}" ${sl.items.length} ทรัพย์ให้ลูกค้า`, by: 'ทีมงาน',
    })),
    ...visits.map((v) => ({
      kind: `visit_${v.status}`, at: v.date.getTime(),
      text: `${v.status === 'done' ? 'เข้าชมแล้ว' : v.status === 'cancelled' ? 'ยกเลิกนัดเข้าชม' : 'นัดเข้าชม'} ${v.stops.length} จุด${v.note ? ` — ${v.note}` : ''}`,
      by: 'ทีมงาน',
      property: v.stops[0] ? propOf.get(v.stops[0].propertyId) : undefined,
    })),
    ...deals.flatMap((dl) => {
      const pr = dl.propertyId ? propOf.get(dl.propertyId) : undefined;
      const money = dl.amount ? ` ฿${dl.amount.toLocaleString('th-TH')}` : '';
      return [
        { kind: 'deal', at: dl.createdAt.getTime(), text: `เปิดดีล${dl.title ? ` ${dl.title}` : ''}`, by: 'ทีมงาน', property: pr },
        ...(dl.closedAt ? [{
          kind: dl.status === 'won' ? 'deal_won' : 'deal_lost',
          at: dl.closedAt.getTime(),
          text: `${dl.status === 'won' ? 'ปิดดีลสำเร็จ' : 'ปิดดีลไม่สำเร็จ'}${money}${dl.note ? ` — ${dl.note}` : ''}`,
          by: 'ทีมงาน',
          property: pr,
        }] : []),
      ];
    }),
  ].sort((a, b) => b.at - a.at);

  /* สรุปการติดต่อ — ตอบคำถามที่คนเปิดหน้านี้ถามก่อนเสมอ: คุยกันไปกี่ครั้งแล้ว
     ครั้งล่าสุดเมื่อไร ค้างอะไรอยู่ */
  const contactKinds = new Set(['note', 'visit_done', 'shortlist']);
  const contacts = events.filter((e) => contactKinds.has(e.kind));

  return ok({
    ...leadDto(lead, user),
    history: events,
    summary: {
      contacts: contacts.length,
      lastContactAt: contacts[0]?.at ?? null,
      firstContactAt: contacts[contacts.length - 1]?.at ?? null,
      openTasks: tasks.filter((t) => !t.done).length,
      visitsDone: visits.filter((v) => v.status === 'done').length,
      dealsWon: deals.filter((dl) => dl.status === 'won').length,
      dealsLost: deals.filter((dl) => dl.status === 'lost').length,
      dealsOpen: deals.filter((dl) => dl.status === 'negotiating').length,
    },
    notes: notes.map((n) => ({
      id: n.id, text: displayNoteText(n.text), createdAt: n.createdAt.getTime(),
      by: n.userId ? nameOf.get(n.userId) ?? 'ทีมงาน' : 'ระบบ',
    })),
    tasks: tasks.map((t) => ({
      id: t.id, title: t.title, done: t.done,
      due: t.due ? t.due.getTime() : null, createdAt: t.createdAt.getTime(),
    })),
    linked: {
      requirements: requirements.map((r) => ({ id: r.id, code: r.code, status: r.status })),
      shortlists: shortlists.map((s) => ({ id: s.id, name: s.name, status: s.status, count: s.items.length })),
      /* รหัสงานติดไปกับทุกชิป · ลูกค้ารายเดียวเปิดได้หลายใบ (REQ-1009/1010/
         1011 มีอยู่จริง) แถบนี้จึงเคยบอกแค่ "2 Visits" โดยไม่บอกว่าของใบไหน */
      visits: visits.map((v) => ({
        id: v.id, date: v.date.getTime(), status: v.status,
        requirementCode: v.requirementId ? codeOfReq.get(v.requirementId) ?? '' : '',
      })),
      deals: deals.map((dl) => ({
        id: dl.id, title: dl.title, status: dl.status, amount: dl.amount,
        requirementCode: dl.requirementId ? codeOfReq.get(dl.requirementId) ?? '' : '',
        closedAt: dl.closedAt ? dl.closedAt.getTime() : null,
        property: dl.propertyId ? propOf.get(dl.propertyId) ?? null : null,
      })),
    },
  });
});


/* DELETE /api/leads/:id — เด็ค Web 2026 ข้อ 14 · "มีปุ่มที่สามารถลบหลีดได้
   มีสิทธ์เฉพาะเจ้าของเท่านั้น"

   ลบ lead แล้ว requirement · เช็คว่าง · shortlist · โน้ต · งานติดตาม
   ของใบนั้นหายตามทั้งหมด (FK cascade) จึงกันไว้สองชั้น:
     · owner เท่านั้น — ไม่ใช่ manager ด้วย เพราะลูกค้าสั่งมาแบบนั้น
     · ถ้ามีดีลผูกอยู่ ไม่ให้ลบ — Deal.leadId ไม่มี FK ลบไปแล้วดีลจะชี้ไปที่ว่าง
       และประวัติรายได้จะอ่านไม่ออก ปิดดีลก่อนค่อยลบ */
export const DELETE = handler(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  requireRole(user, 'owner');
  const { id } = await ctx.params;

  const lead = await db.lead.findFirst({
    where: { id, orgId: user.orgId },
    include: { _count: { select: { requirements: true, notes: true, tasks: true } } },
  });
  if (!lead) throw new ApiError('NOT_FOUND', 'ไม่พบ lead นี้', 404);

  const deals = await db.deal.count({ where: { leadId: lead.id, orgId: user.orgId } });
  if (deals > 0) {
    throw new ApiError('LEAD_HAS_DEAL', `lead นี้มีดีลผูกอยู่ ${deals} ดีล — ลบไม่ได้ ต้องปิดหรือย้ายดีลก่อน`, 409);
  }

  await db.lead.delete({ where: { id: lead.id } });
  await audit({
    user, orgId: user.orgId, action: 'lead.delete', entity: 'lead', entityId: lead.id,
    /* เก็บไว้ว่าลบอะไรไปบ้าง เพราะของที่ตามไปด้วยไม่เหลือให้ดูแล้ว */
    before: {
      name: lead.name, phone: lead.phone, company: lead.company, status: lead.status,
      requirements: lead._count.requirements, notes: lead._count.notes, tasks: lead._count.tasks,
    },
  });
  return ok({ ok: true });
});
