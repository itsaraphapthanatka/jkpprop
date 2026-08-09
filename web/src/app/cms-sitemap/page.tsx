import type { Metadata } from 'next';
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = { title: 'CMS Sitemap · JKP Property', robots: { index: false } };

/* Ported from design/CMS Sitemap.dc.html — standalone admin architecture map:
   Core Identity + 5 bounded domains, the Lead Pipeline (9 statuses),
   the 5 flows (A–E), and cross-cutting rules. Static reference page. */

const css = `
#cms-sitemap-root a{text-decoration:none;}
.smx-doclink{transition:color .15s;}
.smx-doclink:hover{color:#023742 !important;}
.smx-screen{transition:background .15s;border-radius:12px;}
.smx-screen:hover{background:var(--tint);}
@media (max-width:900px){ #dom-grid{grid-template-columns:1fr !important;} }
@media (max-width:760px){ #flow-grid{grid-template-columns:repeat(2,1fr) !important;} #cc-grid{grid-template-columns:1fr !important;} }
@media (max-width:560px){ #flow-grid{grid-template-columns:1fr !important;} #cc-grid{grid-template-columns:1fr !important;} #dash-row{flex-direction:column !important;} }
`;

type Screen = { name: string; route: string; desc: string; tags: string[] };
type Domain = { title: string; sub: string; headBg: string; titleColor: string; subColor: string; dot: string; iconBg: string; icon: string; screens: Screen[] };

const legend = [
  { color: '#034956', label: 'Core / Identity' },
  { color: '#273c33', label: 'Property & Listing' },
  { color: '#0D6C3B', label: 'CRM & Ops' },
  { color: '#D9A62B', label: 'CMS & GEO' },
];

const dashCards = ['Leads ใหม่ (7 วัน)', 'Requirements รอ review', 'Shortlists รอส่ง', 'Visits สัปดาห์นี้', 'Deals เปิดอยู่'];

const domains: Domain[] = [
  {
    title: 'Core Identity', sub: 'Users · Roles · Agents · Audit', headBg: '#EEF4F3', titleColor: '#034956', subColor: '#5F8891', dot: '#034956', iconBg: '#034956',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"></path></svg>',
    screens: [
      { name: 'Users & Roles', route: '/admin/users', desc: 'CRUD users + หลาย role · ปิดใช้งานแทนลบ · RBAC 6 roles', tags: ['FR-SEC-02', 'audit'] },
      { name: 'Audit Logs', route: '/admin/audit', desc: 'ทุก mutation: user · entity · action · before/after JSON', tags: ['FR-SEC-03'] },
    ],
  },
  {
    title: 'Geography & Taxonomy', sub: 'พื้นที่ · นิคม · ประเภททรัพย์', headBg: '#EEF4F3', titleColor: '#034956', subColor: '#5F8891', dot: '#034956', iconBg: '#034956',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    screens: [
      { name: 'พื้นที่ 3 ระดับ', route: '/admin/geography', desc: 'จังหวัด → อำเภอ → ตำบล (3 ภาษา) — ใช้ cascade ทุกฟอร์ม', tags: ['provinces', 'districts'] },
      { name: 'นิคมอุตสาหกรรม', route: '/admin/geography', desc: 'industrial_zones + zone type + active flag', tags: ['taxonomy'] },
      { name: 'Landlord / Developer', route: '/admin/settings', desc: 'เจ้าของทรัพย์/ดีเวลลอปเปอร์ + ภาษาที่สะดวก', tags: ['party'] },
    ],
  },
  {
    title: 'Property & Listing', sub: 'หัวใจระบบ · ทรัพย์ ≠ ประกาศ', headBg: '#273c33', titleColor: '#fff', subColor: '#B9C2BD', dot: '#273c33', iconBg: '#2DFB91',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#04140C" stroke-width="1.8"><path d="M3 21V8l9-5 9 5v13"></path><path d="M3 21h18"></path><path d="M7 21v-8h10v8"></path></svg>',
    screens: [
      { name: 'Properties', route: '/admin/properties', desc: '5 tabs: หลัก / Specs / Features / Media (ลายน้ำ) / Translations · public_code auto-gen', tags: ['FR-ADM-01', 'FR-ADM-08'] },
      { name: 'Listings', route: '/admin/listings', desc: 'Index + filter + bulk publish + Export .xlsx/.csv · publish rule · price history', tags: ['FR-ADM-04', 'FR-ADM-10'] },
      { name: 'Availability Checks', route: '/admin/shortlists', desc: 'บันทึกผลเช็คว่างกับ landlord + valid_until (gate ก่อน shortlist)', tags: ['FR-AVL-04'] },
    ],
  },
  {
    title: 'CRM / Leads', sub: 'Lead → Requirement → Shortlist', headBg: '#E8F3EC', titleColor: '#0D6C3B', subColor: '#5F8871', dot: '#0D6C3B', iconBg: '#0D6C3B',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"></path></svg>',
    screens: [
      { name: 'Leads', route: '/admin/leads', desc: 'Pipeline + timeline notes/tasks · agent เห็นเฉพาะที่ assign', tags: ['FR-CRM-01', 'FR-CRM-04'] },
      { name: 'Requirement Detail', route: '/admin/requirements', desc: 'Confirm → เกณฑ์พิเศษ → เช็คว่าง · Cancel บังคับเหตุผล+ข้อ', tags: ['Flow B', 'FR-CRM-07'] },
      { name: 'Shortlist Builder', route: '/admin/shortlists', desc: 'เพิ่มทรัพย์ published+ว่าง · rank · ส่ง client link (token) · feedback', tags: ['FR-SHL', 'token'] },
    ],
  },
  {
    title: 'Visit & Deal Ops', sub: 'พาชม → เจรจา → ปิดดีล', headBg: '#E8F3EC', titleColor: '#0D6C3B', subColor: '#5F8871', dot: '#0D6C3B', iconBg: '#0D6C3B',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>',
    screens: [
      { name: 'Visit Plans', route: '/admin/visits', desc: 'ยืนยัน criteria → appointments (landlord+เวลา) → บันทึกผล', tags: ['Flow C', 'FR-VIS-07'] },
      { name: 'Negotiations', route: '/admin/deals', desc: 'offers/counter วนหลายรอบ · stage state machine', tags: ['FR-DEA-01'] },
      { name: 'Deals', route: '/admin/deals', desc: 'agreed amount · documents → S3 · close (freeze เงิน) · commission', tags: ['FR-DEA-05'] },
    ],
  },
  {
    title: 'CMS / GEO', sub: 'เนื้อหา 3 ภาษา + Schema', headBg: '#FBF3E1', titleColor: '#9A741C', subColor: '#A08A5A', dot: '#D9A62B', iconBg: '#D9A62B',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path></svg>',
    screens: [
      { name: 'Pages / Articles / FAQ', route: '/admin/cms', desc: 'CRUD + tab ภาษา th/en/zh · rich text · publish workflow · slug ต่อภาษา', tags: ['FR-CMS', 'i18n'] },
      { name: 'SEO Module', route: '/admin/seo', desc: 'meta + JSON-LD ต่อ entity ต่อภาษา · preview schema · hreflang', tags: ['FR-GEO-02', 'FR-GEO-06'] },
      { name: 'Field Builder', route: '/admin/field-builder', desc: 'สร้างฟิลด์ทรัพย์เอง + ตัวเลือก dropdown ต่อ tenant (no-code)', tags: ['FR-CMS-01'] },
    ],
  },
];

const pipeline = [
  { label: 'new', bg: '#EEF4F3', fg: '#034956', arrow: true },
  { label: 'qualified', bg: '#EEF4F3', fg: '#034956', arrow: true },
  { label: 'profile_received', bg: '#EEF4F3', fg: '#034956', arrow: true },
  { label: 'requirements_confirmed', bg: '#E8F3EC', fg: '#0D6C3B', arrow: true },
  { label: 'shortlisted', bg: '#E8F3EC', fg: '#0D6C3B', arrow: true },
  { label: 'visit_scheduled', bg: '#E8F3EC', fg: '#0D6C3B', arrow: true },
  { label: 'negotiating', bg: '#273c33', fg: '#fff', arrow: true },
  { label: 'won', bg: '#0D6C3B', fg: '#fff', arrow: true },
  { label: 'lost', bg: '#F3E1E1', fg: '#9A2B2B', arrow: false },
];

const flows = [
  { key: 'A', title: 'Inquiry', steps: 'ค้นหา → detail → ส่ง inquiry → lead ใน CRM' },
  { key: 'B', title: 'Requirement', steps: 'wizard → confirm → เช็คว่าง → shortlist → ส่งลูกค้า → feedback' },
  { key: 'C', title: 'Visit', steps: 'ยืนยัน criteria → visit plan → ยืนยัน landlord → บันทึกผล' },
  { key: 'D', title: 'Deal', steps: 'negotiation → offers → deal → เอกสาร → close + commission' },
  { key: 'E', title: 'Content', steps: 'เขียน GEO-ready → แปล 3 ภาษา → SEO/schema → publish' },
];

const crosscut = [
  { title: 'RBAC ที่ API layer', desc: '6 roles · enforce ที่ API ไม่ใช่แค่ซ่อน UI (FR-SEC-02)' },
  { title: 'Audit ทุก mutation', desc: 'บันทึก before/after JSON ทุกการเปลี่ยนข้อมูล (FR-SEC-03)' },
  { title: 'ซ่อนพิกัดจริง', desc: 'API ไม่ส่ง lat/long เมื่อ map_visibility ≠ exact (FR-LST-02)' },
  { title: 'SSR/SSG บังคับ', desc: 'เนื้อหาครบใน HTML แรก เพื่อ GEO/AI crawler (NFR-03)' },
  { title: 'i18n ไม่ hardcode', desc: 'label/error ทุกตัวมาจาก translation file (NFR-04)' },
  { title: 'Status = state machine', desc: 'เปลี่ยนได้เฉพาะ transition ที่ถูกต้อง · lead เดินหน้าเท่านั้น' },
];

const section: React.CSSProperties = { maxWidth: 1280, margin: '0 auto' };

export default function CmsSitemapPage() {
  return (
    <div id="cms-sitemap-root" style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh', paddingBottom: 80, ['--bg2' as string]: '#F3F0EC' } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(249,248,245,.92)', WebkitBackdropFilter: 'blur(16px) saturate(1.5)', backdropFilter: 'blur(16px) saturate(1.5)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image width={226} height={100} src="/assets/jkp-logo-green.png" alt="JKP Property" style={{ height: 32, width: 'auto', display: 'block' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted2)', borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>CMS Sitemap</span>
          </Link>
          <Link href="/site-index" className="smx-doclink" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>สารบัญทั้งหมด →</Link>
        </div>
      </header>

      {/* HERO */}
      <section style={{ ...section, padding: '56px 24px 28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: '#273c33', textTransform: 'uppercase' }}>Admin Architecture</span>
        </div>
        <h1 style={{ margin: '12px 0 10px', fontSize: 38, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>แผนผังระบบหลังบ้าน (CMS Sitemap)</h1>
        <p style={{ margin: 0, maxWidth: 720, fontSize: '15.5px', color: 'var(--muted)', lineHeight: 1.7 }}>โครงสร้างหน้าจอ Admin/Ops ทั้งหมด จัดกลุ่มตาม 5 Bounded Domains + Core Identity ตาม Requirement &amp; Functional Spec v1.1 — สีของแต่ละกล่องอ้างอิง Design Token ของแบรนด์</p>
        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {legend.map((lg) => (
            <div key={lg.label} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 30, padding: '0 13px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: lg.color }} />{lg.label}
            </div>
          ))}
        </div>
      </section>

      {/* LOGIN + DASHBOARD ROW */}
      <section style={{ ...section, padding: '0 24px' }}>
        <div id="dash-row" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, background: '#0A0E0C', borderRadius: 16, padding: '22px 24px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(45,251,145,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              </div>
              <div><div style={{ fontSize: 15, fontWeight: 800 }}>/admin/login</div><code style={{ fontSize: 11, color: '#8FE6B6' }}>FR-SEC-01 · JWT</code></div>
            </div>
            <p style={{ margin: '12px 0 0', fontSize: '12.5px', color: '#B9C2BD', lineHeight: 1.6 }}>Email + password · lock 5 ครั้ง/15 นาที · session httpOnly</p>
          </div>
          <div style={{ flex: 2, minWidth: 280, background: 'linear-gradient(135deg,#0B7A45 0%,#0A5C39 45%,#043F20 100%)', borderRadius: 16, padding: '22px 24px', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
              </div>
              <div><div style={{ fontSize: 15, fontWeight: 800 }}>/admin/dashboard</div><code style={{ fontSize: 11, color: '#C3FED5' }}>การ์ดสรุป + activity 20 ล่าสุด</code></div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {dashCards.map((d) => (
                <span key={d} style={{ height: 26, padding: '0 11px', borderRadius: 9999, background: 'rgba(255,255,255,.14)', color: '#fff', fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DOMAIN GRID */}
      <section style={{ ...section, padding: '24px 24px 0' }}>
        <div className="rs-cols-2" id="dom-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {domains.map((dom) => (
            <div key={dom.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--border)', background: dom.headBg }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: dom.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: dom.icon }} />
                <div>
                  <div style={{ fontSize: '15.5px', fontWeight: 800, color: dom.titleColor }}>{dom.title}</div>
                  <div style={{ fontSize: '11.5px', color: dom.subColor }}>{dom.sub}</div>
                </div>
              </div>
              <div style={{ padding: 12 }}>
                {dom.screens.map((sc) => (
                  <a key={sc.name} href={sc.route} className="smx-screen" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 12px', color: 'inherit' }}>
                    <div style={{ width: 7, height: 7, borderRadius: 9999, background: dom.dot, marginTop: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{sc.name}</span>
                        <code style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>{sc.route}</code>
                      </div>
                      <div style={{ marginTop: 3, fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>{sc.desc}</div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {sc.tags.map((t) => (
                          <code key={t} style={{ height: 19, padding: '0 7px', borderRadius: 6, background: 'var(--bg2,#F3F0EC)', color: 'var(--muted2)', fontSize: 10, display: 'inline-flex', alignItems: 'center' }}>{t}</code>
                        ))}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LEAD PIPELINE */}
      <section style={{ ...section, padding: '36px 24px 0' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>แกนกลาง — Lead Pipeline (9 สถานะ · auto-advance เดินหน้าเท่านั้น)</div>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: 'var(--muted)' }}>ทุก flow (A–E) หมุนรอบสถานะ lead นี้ — ระบบเลื่อนสถานะอัตโนมัติตาม event</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {pipeline.map((p) => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ height: 34, padding: '0 14px', borderRadius: 9999, background: p.bg, color: p.fg, fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>{p.label}</div>
                {p.arrow && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2.4"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FLOWS */}
      <section style={{ ...section, padding: '16px 24px 0' }}>
        <div id="flow-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {flows.map((f) => (
            <div key={f.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: '#273c33', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.key}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{f.title}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.6 }}>{f.steps}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CROSS-CUTTING */}
      <section style={{ ...section, padding: '24px 24px 0' }}>
        <div style={{ background: '#0A0E0C', borderRadius: 18, padding: 28, color: '#fff' }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>กติกาข้ามทุกโมดูล (Cross-cutting)</div>
          <div id="cc-grid" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {crosscut.map((c) => (
              <div key={c.title} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2DFB91' }}>{c.title}</div>
                <div style={{ marginTop: 5, fontSize: 12, color: '#B9C2BD', lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
