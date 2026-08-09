import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { currentUser } from '@/lib/server/auth';
import { buildDashboard } from '@/lib/server/dashboard';

export const metadata: Metadata = { title: 'Dashboard · JKP CMS', robots: { index: false } };

/* Ported verbatim from AdminDashboard.dc.html — stat cards, lead
   pipeline funnel, recent activity, today's tasks, top listings. */

const sic = (paths: React.ReactNode, color: string) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9">{paths}</svg>
);
const aic = (paths: React.ReactNode, color: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">{paths}</svg>
);

/* icon/colour definitions only — the numbers come from buildDashboard() */
const STATS = [
  { key: 'leads', value: '18', label: 'Leads ใหม่ (7 วัน)', href: '/admin/leads', iconBg: '#E8F3EC', icon: sic(<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" />, '#0D6C3B'), trend: '▲ 12%', trendColor: '#0D6C3B' },
  { key: 'requirements', value: '7', label: 'Requirements รอ review', href: '/admin/requirements', iconBg: '#EEF4F3', icon: sic(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></>, '#034956'), trend: '▲ 3', trendColor: '#0D6C3B' },
  { key: 'shortlists', value: '5', label: 'Shortlists รอส่ง', href: '/admin/shortlists', iconBg: '#EEF4F3', icon: sic(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>, '#034956'), trend: '—', trendColor: '#9B968D' },
  { key: 'visits', value: '12', label: 'Visits สัปดาห์นี้', href: '/admin/visits', iconBg: '#FBF3E1', icon: sic(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>, '#D9A62B'), trend: '▲ 4', trendColor: '#0D6C3B' },
  { key: 'deals', value: '9', label: 'Deals เปิดอยู่', href: '/admin/deals', iconBg: '#E8F3EC', icon: sic(<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />, '#0D6C3B'), trend: '▲ 2', trendColor: '#0D6C3B' },
];





const dashCss = `
#dash-cols > div{ min-width:0; }
@media (max-width:1000px){ #stat-grid{grid-template-columns:repeat(2,1fr) !important;} #dash-cols{grid-template-columns:1fr !important;} }
@media (max-width:640px){ #admin-main > main{ padding:16px 14px 44px !important; } }
@media (max-width:480px){
  #stat-grid{grid-template-columns:repeat(1,1fr) !important;}
  .dash-funnel-row{gap:8px !important;}
  .dash-funnel-label{width:82px !important;font-size:11px !important;}
  .dash-funnel-count{width:32px !important;font-size:12px !important;}
}
`;

const panel: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 };

export default async function AdminDashboardPage() {
  // the guard middleware already ran; this resolves the session for scoping
  const user = await currentUser();
  if (!user) redirect('/admin/login?next=/admin');
  const data = await buildDashboard(user);

  return (
    <AdminShell active="dashboard" eyebrow="ภาพรวมระบบ" title="Dashboard" css={dashCss}>
      {/* STAT CARDS */}
      <div id="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
        {STATS.map((s) => (
          <a key={s.label} href={s.href} className="admin-statcard" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '11.5px', fontWeight: 700, color: '#9B968D' }}>7 วัน</span>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--text)' }}>{data.stats[s.key] ?? 0}</div>
              <div style={{ marginTop: 2, fontSize: '12.5px', color: 'var(--muted)' }}>{s.label}</div>
            </div>
          </a>
        ))}
      </div>

      {/* TWO COLUMNS */}
      <div id="dash-cols" style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Lead Pipeline</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)' }}>สถานะ lead ทั้งหมดในระบบ</div>
              </div>
              <a href="/admin/leads" style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)' }}>ดู leads ทั้งหมด →</a>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {data.funnel.map((f) => (
                <div key={f.label} className="dash-funnel-row" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="dash-funnel-label" style={{ width: 150, flexShrink: 0, fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{f.label}</div>
                  <div style={{ flex: 1, height: 26, borderRadius: 8, background: 'var(--bg)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: f.pct, background: f.color, borderRadius: 8, transition: 'width .6s cubic-bezier(.2,.8,.3,1)' }} />
                  </div>
                  <div className="dash-funnel-count" style={{ width: 44, textAlign: 'right', fontSize: 13, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{f.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>กิจกรรมล่าสุด</div>
              <span style={{ fontSize: 12, color: 'var(--muted2)' }}>{data.activity.length} รายการล่าสุด</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {data.activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9999, background: '#EEF4F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{aic(<><path d="M12 5v14" /><path d="M5 12h14" /></>, '#034956')}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}><b>{a.who}</b> {a.action} <b>{a.target}</b></div>
                    <div style={{ marginTop: 2, fontSize: '11.5px', color: 'var(--muted3)' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>งานของฉันวันนี้</div>
              <span style={{ height: 22, padding: '0 9px', borderRadius: 9999, background: '#FDECC8', color: '#9A741C', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center' }}>{data.tasks.length} งาน</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.tasks.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: 11, borderRadius: 12, background: 'var(--bg)' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 6, border: '1.5px solid ' + (t.overdue ? '#C0392B' : '#0D6C3B'), flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.title}</div>
                    <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ height: 18, padding: '0 7px', borderRadius: 6, background: t.overdue ? '#F9E4E1' : '#E8F3EC', color: t.overdue ? '#C0392B' : '#0D6C3B', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center' }}>{t.overdue ? 'เลยกำหนด' : 'ปกติ'}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted3)' }}>{t.lead}{t.due ? ` · ${new Date(t.due).toLocaleDateString('th-TH')}` : ''}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={panel}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>ทรัพย์ที่อัปเดตล่าสุด</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.topListings.map((l) => (
                <div key={l.code} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                    <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--muted3)' }}>{l.code}</code>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted3)', whiteSpace: 'nowrap' }}>{l.updated}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
