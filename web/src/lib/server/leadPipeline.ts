/* The nine lead statuses, and the only rule about them: they move forward.
 *
 * The list itself lived inside the leads PATCH route, so nothing else could
 * see it — and the spec's auto-advance ("สร้าง shortlist → shortlisted") was
 * never implemented, leaving the pipeline to be dragged along by hand. It is
 * shared from here now, and `advanceLead` is what events call.
 */
import { db } from './db';
import { audit } from './audit';
import type { User } from '@prisma/client';

export const PIPELINE = [
  'new',
  'qualified',
  'profile_received',
  'requirements_confirmed',
  'shortlisted',
  'visit_scheduled',
  'negotiating',
  'won',
  'lost',
] as const;

export type LeadStatus = (typeof PIPELINE)[number];

/** ชื่อสถานะที่คนอ่านรู้เรื่อง สำหรับบันทึกลงไทม์ไลน์ของ lead */
export const STATUS_LABEL: Record<string, string> = {
  new: 'ใหม่',
  qualified: 'คัดกรองแล้ว',
  profile_received: 'ได้ข้อมูลลูกค้าแล้ว',
  requirements_confirmed: 'ยืนยันความต้องการแล้ว',
  shortlisted: 'ส่ง shortlist แล้ว',
  visit_scheduled: 'นัดเข้าชมแล้ว',
  negotiating: 'กำลังเจรจา',
  won: 'ปิดดีลสำเร็จ',
  lost: 'ไม่สำเร็จ',
};

/** 'lost' is an exit, not a later stage — nothing may auto-advance past it. */
const TERMINAL = new Set<string>(['won', 'lost']);

export const rank = (status: string) => PIPELINE.indexOf(status as LeadStatus);

/** true when `to` is strictly later in the pipeline than `from` */
export function isForward(from: string, to: string): boolean {
  const a = rank(from);
  const b = rank(to);
  return a >= 0 && b >= 0 && b > a;
}

/* Move a lead to `target` if that is forward progress, and say nothing
 * otherwise. Called from the events the spec ties statuses to, so a stage that
 * already happened is never announced twice and a manual jump ahead is never
 * undone.
 *
 * Deliberately never throws: the caller's real work (confirming a requirement,
 * creating a shortlist) has already succeeded by the time this runs, and
 * failing the request over a status nudge would be worse than the nudge not
 * landing. It is audited either way.
 */
export async function advanceLead(
  leadId: string | null | undefined,
  target: LeadStatus,
  ctx: { user: User; orgId: string; reason: string },
): Promise<void> {
  if (!leadId) return;
  try {
    const lead = await db.lead.findFirst({ where: { id: leadId, orgId: ctx.orgId } });
    if (!lead) return;
    if (TERMINAL.has(lead.status)) return;
    if (!isForward(lead.status, target)) return;

    await db.lead.update({ where: { id: leadId }, data: { status: target } });

    /* ลูกค้าแจ้งว่า "ปิดดีลแล้วไม่ขึ้นประวัติใน Leads ภาพรวม" — เดิมเหตุการณ์นี้
       ลงแค่ audit log ซึ่งเปิดดูได้เฉพาะเจ้าของระบบ ส่วนไทม์ไลน์ในหน้า Lead
       อ่านจาก LeadNote อย่างเดียว คนดูแล lead จึงไม่เห็นว่าเกิดอะไรขึ้น */
    await db.leadNote.create({
      data: {
        leadId,
        userId: ctx.user.id,
        text: `สถานะเปลี่ยนเป็น "${STATUS_LABEL[target] ?? target}" · ${ctx.reason}`,
      },
    }).catch(() => { /* ไทม์ไลน์เป็นของแถม ไม่ควรทำให้การเปลี่ยนสถานะล้ม */ });

    await audit({
      user: ctx.user,
      orgId: ctx.orgId,
      action: 'lead.auto_advance',
      entity: 'lead',
      entityId: leadId,
      before: { status: lead.status },
      after: { status: target, reason: ctx.reason },
    });
  } catch {
    /* status is a side effect of the caller's action, never its purpose */
  }
}
