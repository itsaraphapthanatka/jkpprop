/* Dashboard aggregation — shared by the /admin server page (direct call, so
   the numbers are in the first paint) and GET /api/dashboard. */
import type { User } from '@prisma/client';
import { db } from './db';
import { scopeWhere, hasPriv } from './auth';
import { actionLabel } from './auditLabel';

const DAY = 86400000;

const FUNNEL_ROWS: { label: string; statuses: string[]; color: string }[] = [
  { label: 'New', statuses: ['new'], color: '#034956' },
  { label: 'Qualified', statuses: ['qualified'], color: '#0B6B4F' },
  { label: 'Profile received', statuses: ['profile_received'], color: '#0D6C3B' },
  { label: 'Requirements confirmed', statuses: ['requirements_confirmed'], color: '#1E8A4C' },
  { label: 'Shortlisted', statuses: ['shortlisted'], color: '#3AAE5F' },
  { label: 'Visit scheduled', statuses: ['visit_scheduled'], color: '#5BC97C' },
  { label: 'Negotiating → Won', statuses: ['negotiating', 'won'], color: '#2DFB91' },
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

export async function buildDashboard(user: User) {
  const orgId = user.orgId;
  const leadScope = scopeWhere(user, 'assigneeId');
  const weekAgo = new Date(Date.now() - 7 * DAY);
  const weekAhead = new Date(Date.now() + 7 * DAY);

  const [newLeads, allLeads, shortlists, visits, deals, properties, tasks] = await Promise.all([
    db.lead.count({ where: { orgId, ...leadScope, createdAt: { gte: weekAgo } } }),
    db.lead.findMany({ where: { orgId, ...leadScope }, select: { status: true } }),
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

  const countOf = (statuses: string[]) => allLeads.filter((l) => statuses.includes(l.status)).length;
  const top = Math.max(1, countOf(FUNNEL_ROWS[0].statuses));

  // the activity feed is the audit trail — only for users allowed to read it
  const activity = hasPriv(user, 'audit')
    ? await db.auditLog.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 6 })
    : [];

  return {
    stats: {
      leads: newLeads,
      requirements: allLeads.filter((l) => ['qualified', 'profile_received'].includes(l.status)).length,
      shortlists,
      visits,
      deals,
    } as Record<string, number>,
    funnel: FUNNEL_ROWS.map((r) => {
      const count = countOf(r.statuses);
      return { label: r.label, count, pct: `${Math.round((count / top) * 100)}%`, color: r.color };
    }),
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
