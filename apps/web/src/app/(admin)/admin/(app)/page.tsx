import Link from 'next/link';
import type { Metadata } from 'next';
import {
  CalendarCheck,
  ClipboardCheck,
  Handshake,
  Send,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@jkp/ui';
import {
  getDashboardStats,
  type TaskPriority,
} from '@/data/admin/leads';
import { LEAD_STATUS_LABEL } from '@/data/admin/labels';
import { getSession } from '@/data/admin/session';

export const metadata: Metadata = {
  title: 'แดชบอร์ด · JKP Admin',
};

/** Thai date formatter (DD MMM YYYY, Buddhist locale). */
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));

/** Task priority → Badge variant + Thai label. */
const PRIORITY: Record<TaskPriority, { variant: 'danger' | 'warning' | 'neutral'; label: string }> = {
  high: { variant: 'danger', label: 'ด่วน' },
  medium: { variant: 'warning', label: 'ปานกลาง' },
  low: { variant: 'neutral', label: 'ทั่วไป' },
};

const cardBase = 'rounded-lg border border-line bg-surface-card p-6 shadow-sm';

export default async function AdminDashboardPage() {
  const [stats, user] = await Promise.all([getDashboardStats(), getSession()]);

  const statCards: {
    value: number;
    label: string;
    href: string;
    icon: LucideIcon;
  }[] = [
    { value: stats.newLeads7d, label: 'Lead ใหม่ (7 วัน)', href: '/admin/leads?status=new', icon: UserPlus },
    { value: stats.requirementsToReview, label: 'Requirement รอตรวจ', href: '/admin/leads', icon: ClipboardCheck },
    { value: stats.shortlistsToSend, label: 'Shortlist รอส่ง', href: '/admin/leads?status=requirements_confirmed', icon: Send },
    { value: stats.visitsThisWeek, label: 'การเข้าชมสัปดาห์นี้', href: '/admin/leads?status=visit_scheduled', icon: CalendarCheck },
    { value: stats.openDeals, label: 'ดีลที่เปิดอยู่', href: '/admin/leads?status=negotiating', icon: Handshake },
  ];

  const funnelMax = Math.max(1, ...stats.funnel.map((f) => f.count));

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <header>
        <h1 className="text-2xl font-bold text-content-primary">
          สวัสดี, {user?.name ?? 'ผู้ใช้งาน'}
        </h1>
        <p className="mt-1 text-sm text-content-secondary">ภาพรวมงานขาย</p>
      </header>

      {/* Stat cards */}
      <section aria-label="สรุปตัวเลข" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map(({ value, label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className={`${cardBase} group flex flex-col gap-3 transition-all duration-fast hover:-translate-y-0.5 hover:shadow-md`}
          >
            <span className="inline-flex size-10 items-center justify-center rounded-md bg-surface-tint text-content-brand">
              <Icon strokeWidth={1.7} className="size-5" aria-hidden="true" />
            </span>
            <span className="text-3xl font-bold tabular-nums text-content-primary">{value}</span>
            <span className="text-sm text-content-secondary">{label}</span>
          </Link>
        ))}
      </section>

      {/* Lead pipeline funnel */}
      <section className={cardBase} aria-label="ช่องทางการขาย">
        <h2 className="text-lg font-semibold text-content-primary">ช่องทางการขาย (Pipeline)</h2>
        <ul className="mt-5 flex flex-col gap-4">
          {stats.funnel.map(({ status, count }) => (
            <li key={status} className="flex items-center gap-4">
              <span className="w-36 shrink-0 truncate text-sm text-content-secondary">
                {LEAD_STATUS_LABEL[status]}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${(count / funnelMax) * 100}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-content-primary">
                {count}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Lower two-column area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activities */}
        <section className={cardBase} aria-label="กิจกรรมล่าสุด">
          <h2 className="text-lg font-semibold text-content-primary">กิจกรรมล่าสุด</h2>
          {stats.recentActivities.length === 0 ? (
            <p className="mt-4 text-sm text-content-muted">ยังไม่มีกิจกรรม</p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-line-subtle">
              {stats.recentActivities.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm text-content-primary">{a.text}</p>
                    <Link
                      href={`/admin/leads/${a.leadId}`}
                      className="mt-0.5 inline-block font-mono text-xs text-content-accent hover:underline"
                    >
                      {a.leadCode}
                    </Link>
                  </div>
                  <time className="shrink-0 whitespace-nowrap text-xs text-content-muted" dateTime={a.createdAt}>
                    {fmtDate(a.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Today's tasks */}
        <section className={cardBase} aria-label="งานวันนี้">
          <h2 className="text-lg font-semibold text-content-primary">งานวันนี้</h2>
          {stats.todayTasks.length === 0 ? (
            <p className="mt-4 text-sm text-content-muted">ไม่มีงานค้าง</p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-line-subtle">
              {stats.todayTasks.map((t) => {
                const p = PRIORITY[t.priority];
                return (
                  <li key={t.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm text-content-primary">{t.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-content-muted">
                        <Link
                          href={`/admin/leads/${t.leadId}`}
                          className="font-mono text-content-accent hover:underline"
                        >
                          {t.leadCode}
                        </Link>
                        {t.dueAt && (
                          <span className="whitespace-nowrap">กำหนด {fmtDate(t.dueAt)}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={p.variant} className="shrink-0">
                      {p.label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
