/* Dashboard aggregation — shared by the /admin server page (direct call, so
   the numbers are in the first paint) and GET /api/dashboard. */
import type { User } from '@prisma/client';
import { db } from './db';
import { PIPELINE } from './leadPipeline';
import { scopeWhere, hasPriv } from './auth';
import { actionLabel } from './auditLabel';

const DAY = 86400000;

/* กรวยของลีด — แต่ละแถวคือ "ไปถึงขั้นนี้แล้วอย่างน้อย" ไม่ใช่ "ค้างอยู่ขั้นนี้"
 *
 * ของเดิมนับเฉพาะลีดที่ค้างอยู่ในสถานะนั้นพอดี แล้วหารด้วยจำนวนลีดสถานะ new
 * ผลคือกรวยที่ไม่ใช่กรวย — 29 ส.ค. 2569 บนเครื่องจริงมีลีด new 1 ใบ กับ won 3 ใบ
 * แถวสุดท้ายจึงขึ้นเป็น 300% และแถวกลางเป็น 0 ทั้งแถบ
 *
 * และสองขั้น qualified / profile_received ถูกตัดออก เพราะไม่มีปุ่มไหนในระบบ
 * พาลีดไปถึงสองสถานะนั้นได้เลย มันจึงเป็น 0 ตลอดกาลและทำให้กรวยดูเหมือน
 * ลูกค้าหลุดหมดตั้งแต่ต้นทาง ทั้งที่งานเดินต่อไปได้ตามปกติ
 * (ถ้าวันหนึ่งทำสองขั้นนี้ให้ใช้งานได้จริง ให้เพิ่มกลับมาตรงนี้)
 */
const FUNNEL_ROWS: { label: string; stage: string; color: string }[] = [
  { label: 'ลีดเข้ามา', stage: 'new', color: '#034956' },
  { label: 'ยืนยันความต้องการ', stage: 'requirements_confirmed', color: '#1E8A4C' },
  { label: 'ส่ง shortlist', stage: 'shortlisted', color: '#3AAE5F' },
  { label: 'นัดเข้าชม', stage: 'visit_scheduled', color: '#5BC97C' },
  { label: 'กำลังเจรจา', stage: 'negotiating', color: '#26D97F' },
  { label: 'ปิดดีลสำเร็จ', stage: 'won', color: '#2DFB91' },
];

export const agoLabel = (d: Date) => {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const dd = Math.floor(h / 24);
  return dd === 1 ? 'เมื่อวาน' : `${dd} วันก่อน`;
};

export type DashboardData = Awaited<ReturnType<typeof buildDashboard>>;

/**
 * กรวยของลีด — แต่ละแถวคือ "ไปถึงขั้นนี้แล้วอย่างน้อย" ไม่ใช่ "ค้างอยู่ขั้นนี้"
 *
 * แยกออกมาเป็นฟังก์ชันของตัวเองเพราะตรรกะตรงนี้เคยผิดเงียบ ๆ อยู่นาน และการ
 * ทดสอบมันต้องไม่ต้องต่อฐานข้อมูล
 */
export function buildFunnel(leads: { status: string }[]) {
  /* สถานะเลื่อนไปข้างหน้าอย่างเดียว ลำดับในไปป์ไลน์จึงใช้เทียบได้ตรง ๆ
     ยกเว้น lost ที่เป็นทางออก ไม่ใช่ขั้นที่ไกลกว่า won — ลีดที่ไม่สำเร็จนับว่า
     เข้ามาแล้วเท่านั้น เพราะระบบไม่ได้บันทึกว่ามันไปได้ไกลแค่ไหนก่อนจะหลุด */
  const rankOf = (st: string) => PIPELINE.indexOf(st as (typeof PIPELINE)[number]);
  const reached = (stage: string) => leads.filter((l) => (
    l.status === 'lost' ? stage === 'new' : rankOf(l.status) >= rankOf(stage)
  )).length;
  /* ฐานคือลีดทั้งหมด กรวยจึงลดหลั่นลงเสมอและไม่มีทางเกิน 100%
     เดิมหารด้วยจำนวนลีดสถานะ new อย่างเดียว ทำให้แถวท้ายขึ้นเป็น 300% ได้ */
  const top = Math.max(1, leads.length);
  return FUNNEL_ROWS.map((r) => {
    const count = reached(r.stage);
    return { label: r.label, count, pct: `${Math.round((count / top) * 100)}%`, color: r.color };
  });
}

export async function buildDashboard(user: User) {
  const orgId = user.orgId;
  const leadScope = scopeWhere(user, 'assigneeId');
  const weekAgo = new Date(Date.now() - 7 * DAY);
  const weekAhead = new Date(Date.now() + 7 * DAY);

  const [newLeads, allLeads, openRequirements, shortlists, visits, deals, properties, tasks] = await Promise.all([
    db.lead.count({ where: { orgId, ...leadScope, createdAt: { gte: weekAgo } } }),
    db.lead.findMany({ where: { orgId, ...leadScope }, select: { status: true } }),
    /* ใบงานที่ยังทำอยู่ — นับจากตาราง Requirement ตรง ๆ
       การ์ดนี้เคยนับลีดที่อยู่ในสถานะ qualified/profile_received ซึ่งไม่มีปุ่มไหน
       พาไปถึง ตัวเลขจึงเป็น 0 เสมอ ทั้งที่บนเครื่องจริงมีใบงานอยู่เก้าใบ */
    db.requirement.count({ where: { orgId, status: { not: 'cancelled' } } }),
    db.shortlist.count({ where: { orgId, status: 'open' } }),
    db.visit.count({ where: { orgId, date: { gte: new Date(), lte: weekAhead } } }),
    db.deal.count({ where: { orgId, status: 'negotiating' } }),
    db.property.findMany({
      where: { orgId, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      /* values ด้วย — รูปทรัพย์อยู่ในนั้น รายการนี้เคยเป็นไอคอนบ้านสีเทา
         เหมือนกันทุกแถว จำไม่ได้ว่าใบไหนคือใบไหน */
      select: { publicCode: true, title: true, updatedAt: true, values: true },
    }),
    db.leadTask.findMany({
      where: { done: false, lead: { orgId, ...leadScope } },
      orderBy: [{ due: 'asc' }, { createdAt: 'desc' }],
      take: 5,
      include: { lead: { select: { id: true, name: true } } },
    }),
  ]);


  // the activity feed is the audit trail — only for users allowed to read it
  const activity = hasPriv(user, 'audit')
    ? await db.auditLog.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 6 })
    : [];

  return {
    stats: {
      leads: newLeads,
      requirements: openRequirements,
      shortlists,
      visits,
      deals,
    } as Record<string, number>,
    funnel: buildFunnel(allLeads),
    tasks: tasks.map((t) => ({
      id: t.id,
      // the checkbox writes back through /api/leads/:leadId/tasks
      leadId: t.lead?.id ?? '',
      title: t.title,
      lead: t.lead?.name ?? '',
      due: t.due ? t.due.getTime() : null,
      overdue: !!t.due && t.due.getTime() < Date.now(),
    })),
    /* เดิมบรรทัดกิจกรรมเป็นชื่อ action ดิบกับรหัสภายใน เช่น
         กิตติพงษ์ พรหมทอง  media.delete  mediaAsset/cmt49p88x0000od0179vbbvse
       ซึ่งคนใช้งานอ่านไม่รู้เรื่อง และรหัสก็ไม่ได้ช่วยอะไรเพราะกดไปไหนไม่ได้
       ตอนนี้แปลเป็นคำไทยและตัดรหัสทิ้ง — ของเต็มยังดูได้ที่หน้า Audit log */
    activity: activity.map((a) => ({
      who: a.userName || 'ระบบ',
      action: actionLabel(a.action, a.entity),
      time: agoLabel(a.createdAt),
    })),
    topListings: properties.map((p) => ({
      code: p.publicCode,
      title: p.title,
      updated: agoLabel(p.updatedAt),
      img: (() => {
        const ph = ((p.values ?? {}) as Record<string, unknown>).photos;
        return Array.isArray(ph) && typeof ph[0] === 'string' ? (ph[0] as string) : null;
      })(),
    })),
  };
}
