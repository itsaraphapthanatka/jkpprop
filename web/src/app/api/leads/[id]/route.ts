/* PATCH /api/leads/:id — status change + assignment (§6.1).
   Lead pipeline is forward-only (SPEC_PACK §4): moving a lead backwards is
   rejected except by owner/manager (correction path). */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { rank, STATUS_LABEL } from '@/lib/server/leadPipeline';
import { leadDto } from '@/lib/server/leadDto';
import type { Prisma } from '@prisma/client';


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

  const [notes, tasks, requirements, shortlists, visits, authors] = await Promise.all([
    db.leadNote.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } }),
    db.leadTask.findMany({ where: { leadId: id }, orderBy: [{ done: 'asc' }, { createdAt: 'asc' }] }),
    db.requirement.findMany({ where: { leadId: id }, orderBy: { createdAt: 'desc' } }),
    db.shortlist.findMany({ where: { leadId: id }, include: { items: true }, orderBy: { createdAt: 'desc' } }),
    db.visit.findMany({ where: { leadId: id }, orderBy: { date: 'desc' } }),
    db.user.findMany({ where: { orgId: user.orgId }, select: { id: true, name: true } }),
  ]);
  const nameOf = new Map(authors.map((u) => [u.id, u.name]));

  return ok({
    ...leadDto(lead, user),
    notes: notes.map((n) => ({
      id: n.id, text: n.text, createdAt: n.createdAt.getTime(),
      by: n.userId ? nameOf.get(n.userId) ?? 'ทีมงาน' : 'ระบบ',
    })),
    tasks: tasks.map((t) => ({
      id: t.id, title: t.title, done: t.done,
      due: t.due ? t.due.getTime() : null, createdAt: t.createdAt.getTime(),
    })),
    linked: {
      requirements: requirements.map((r) => ({ id: r.id, code: r.code, status: r.status })),
      shortlists: shortlists.map((s) => ({ id: s.id, name: s.name, status: s.status, count: s.items.length })),
      visits: visits.map((v) => ({ id: v.id, date: v.date.getTime(), status: v.status })),
    },
  });
});
