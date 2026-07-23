import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = { title: 'Settings · JKP CMS', robots: { index: false } };

/* Ported verbatim from AdminSettings.dc.html — 3-column grid of
   settings entry cards (Users & Roles, Geography, Field Builder,
   Branding, SEO, Audit Logs). Purely static. */

const ic = (paths: React.ReactNode, color: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">{paths}</svg>
);

const CARDS = [
  { title: 'Users & Roles', desc: 'จัดการผู้ใช้ + สิทธิ์ RBAC 6 บทบาท', meta: '12 ผู้ใช้ · 6 roles', href: '/admin/users', iconBg: '#EEF4F3', icon: ic(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>, '#034956') },
  { title: 'Geography & โซน', desc: 'จังหวัด/อำเภอ/ตำบล + นิคมอุตสาหกรรม', meta: '77 จังหวัด · 6 นิคม', href: '/admin/geography', iconBg: '#EEF4F3', icon: ic(<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></>, '#034956') },
  { title: 'Field Builder', desc: 'สร้างฟิลด์ทรัพย์เอง + ตัวเลือก dropdown', meta: 'no-code · ต่อ tenant', href: '/admin/field-builder', iconBg: '#F0ECF9', icon: ic(<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />, '#7A3FB0') },
  { title: 'Branding & Theme', desc: 'โลโก้ สี ฟอนต์ — พรีวิวสด multi-tenant', meta: '12 พรีเซ็ต', href: '/admin/branding', iconBg: '#E8F3EC', icon: ic(<><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" /><circle cx="8.5" cy="7.5" r="2.5" /><circle cx="6.5" cy="12.5" r="2.5" /><path d="M12 22a10 10 0 110-20 8 8 0 018 8c0 2-2 3-4 3h-2a2 2 0 00-1 3.7A2 2 0 0112 22z" /></>, '#0D6C3B') },
  { title: 'SEO / GEO / AEO', desc: 'meta, schema, hreflang, AI answer', meta: '3 ภาษา', href: '/admin/seo', iconBg: '#EEF4F3', icon: ic(<><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" /></>, '#034956') },
  { title: 'Audit Logs', desc: 'ประวัติ mutation ทั้งระบบ + before/after', meta: '2,847 รายการ', href: '/admin/audit', iconBg: '#FBF3E1', icon: ic(<><path d="M12 8v4l3 2" /><circle cx="12" cy="12" r="9" /></>, '#9A741C') },
];

const setCss = `
.set-card{transition:transform .25s cubic-bezier(.2,.7,.3,1),box-shadow .25s,border-color .25s;}
.set-card:hover{transform:translateY(-4px);box-shadow:0 16px 32px rgba(0,0,0,.08);border-color:#0D6C3B;}
@media (max-width:760px){ #set-grid{grid-template-columns:1fr !important;} }
`;

export default function AdminSettingsPage() {
  return (
    <AdminShell active="settings" eyebrow="ระบบ" title="Settings" actions={<></>} css={setCss}>
      <div id="set-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {CARDS.map((c) => (
          <a key={c.title} href={c.href} className="set-card" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </div>
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text)' }}>{c.title}</div>
              <div style={{ marginTop: 4, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.55 }}>{c.desc}</div>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>{c.meta}</div>
          </a>
        ))}
      </div>
    </AdminShell>
  );
}
