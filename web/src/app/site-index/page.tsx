import type { Metadata } from 'next';
import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = { title: 'สารบัญทั้งหมด · JKP Property', robots: { index: false } };

/* Ported from design/index.dc.html — the full page directory (สารบัญ):
   website (customer) + back-office (CMS) pages, grouped, each linking to
   its real route in this app. */

const css = `
#idx-root a{text-decoration:none;color:inherit;}
#idx-root .wrap{max-width:1120px;margin:0 auto;padding:0 28px;}
.idx-card{transition:transform .2s,box-shadow .2s,border-color .2s;}
.idx-card:hover{transform:translateY(-3px);box-shadow:0 12px 26px rgba(0,0,0,.07);border-color:var(--dot);}
.idx-cta:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(45,251,145,.35);}
@media (max-width:760px){ .idx-cardgrid{grid-template-columns:1fr !important;} }
@media (max-width:520px){ .idx-h1{font-size:26px !important;} }
`;

type Item = { n: string; name: string; desc: string; href: string };
type Group = { title: string; badgeBg: string; dot: string; icon: string; items: Item[] };

const svg = (paths: string, c: string) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8">${paths}</svg>`;

const groups: Group[] = [
  {
    title: 'เว็บไซต์ (ส่วนลูกค้า)', badgeBg: '#EEF4F3', dot: '#034956',
    icon: svg('<path d="M3 21V8l9-5 9 5v13"></path><path d="M3 21h18"></path><path d="M7 21v-8h10v8"></path>', '#034956'),
    items: [
      { n: '1', name: 'หน้าแรก', desc: 'Home + ค้นหาทรัพย์', href: '/' },
      { n: '2', name: 'รวมทรัพย์ทั้งหมด', desc: 'Listing + ตัวกรอง', href: '/listing' },
      { n: '3', name: 'รายละเอียดทรัพย์', desc: 'Property Detail', href: '/property' },
      { n: '4', name: 'โรงงานให้เช่า', desc: 'Factory Rent', href: '/factory-rent' },
      { n: '5', name: 'โรงงานขาย', desc: 'Factory Sale', href: '/factory-sale' },
      { n: '6', name: 'โกดังให้เช่า', desc: 'Warehouse Rent', href: '/warehouse-rent' },
      { n: '7', name: 'โกดังขาย', desc: 'Warehouse Sale', href: '/warehouse-sale' },
      { n: '8', name: 'เกี่ยวกับเรา', desc: 'About', href: '/about' },
      { n: '9', name: 'คำถามพบบ่อย', desc: 'FAQ', href: '/faq' },
      { n: '10', name: 'ติดต่อเรา', desc: 'Contact', href: '/contact' },
      { n: '11', name: 'Shortlist ลูกค้า', desc: 'ลิงก์ที่ลูกค้าเปิดดู', href: '/client-shortlist' },
    ],
  },
  {
    title: 'ระบบขาย (หลังบ้าน)', badgeBg: '#E8F3EC', dot: '#0D6C3B',
    icon: svg('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>', '#0D6C3B'),
    items: [
      { n: '1', name: 'Dashboard', desc: 'ภาพรวมงาน', href: '/admin' },
      { n: '2', name: 'Leads', desc: 'รายชื่อผู้สนใจ', href: '/admin/leads' },
      { n: '3', name: 'Requirement', desc: 'สรุปความต้องการ', href: '/admin/requirements' },
      { n: '4', name: 'Shortlist', desc: 'คัดทรัพย์เสนอ', href: '/admin/shortlists' },
      { n: '5', name: 'Visit', desc: 'นัดเข้าชม', href: '/admin/visits' },
      { n: '6', name: 'Deal', desc: 'เจรจา/ปิดการขาย', href: '/admin/deals' },
    ],
  },
  {
    title: 'จัดการทรัพย์ + เนื้อหา', badgeBg: '#E8F3EC', dot: '#0D6C3B',
    icon: svg('<path d="M3 21V8l9-5 9 5v13"></path><path d="M7 21v-8h10v8"></path>', '#0D6C3B'),
    items: [
      { n: '1', name: 'Properties', desc: 'คลังทรัพย์', href: '/admin/properties' },
      { n: '2', name: 'เพิ่ม/แก้ทรัพย์', desc: 'Property Edit', href: '/admin/property-edit' },
      { n: '3', name: 'ดูทรัพย์ (หลังบ้าน)', desc: 'Property View', href: '/admin/property-view' },
      { n: '4', name: 'Listings', desc: 'ประกาศ', href: '/admin/listings' },
      { n: '5', name: 'CMS จัดการหน้าเว็บ', desc: 'Page Builder', href: '/admin/page-builder' },
      { n: '6', name: 'CMS บทความ', desc: 'Content', href: '/admin/cms' },
      { n: '7', name: 'Media', desc: 'คลังรูป', href: '/admin/media' },
    ],
  },
  {
    title: 'ตั้งค่าระบบ + บริการเสริม', badgeBg: '#F0ECF9', dot: '#7A3FB0',
    icon: svg('<circle cx="12" cy="12" r="3"></circle><path d="M12 2a2 2 0 012 2 2 2 0 002 2 2 2 0 012 2 2 2 0 000 4 2 2 0 01-2 2 2 2 0 00-2 2 2 2 0 01-4 0 2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 000-4 2 2 0 012-2 2 2 0 002-2 2 2 0 012-2z"></path>', '#7A3FB0'),
    items: [
      { n: '1', name: 'Settings', desc: 'ศูนย์รวมตั้งค่า', href: '/admin/settings' },
      { n: '2', name: 'Branding & Theme', desc: 'โลโก้/สี/ฟอนต์', href: '/admin/branding' },
      { n: '3', name: 'Users & Roles', desc: 'ผู้ใช้+สิทธิ์', href: '/admin/users' },
      { n: '4', name: 'Geography', desc: 'พื้นที่/นิคม', href: '/admin/geography' },
      { n: '5', name: 'Field Builder', desc: 'สร้างฟิลด์', href: '/admin/field-builder' },
      { n: '6', name: 'Audit Logs', desc: 'ประวัติแก้ไข', href: '/admin/audit' },
      { n: '7', name: 'SEO · GEO · AEO', desc: 'บริการเสริม', href: '/admin/seo' },
      { n: '8', name: 'CMS Sitemap', desc: 'แผนผังระบบ', href: '/cms-sitemap' },
    ],
  },
];

export default function SiteIndexPage() {
  return (
    <div id="idx-root" style={{ width: '100%', minHeight: '100vh', background: 'var(--bg)' }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg,#043F20 0%,#022310 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: 60, width: 280, height: 280, borderRadius: 9999, background: 'rgba(45,251,145,.1)', pointerEvents: 'none' }} />
        <div className="wrap" style={{ padding: '52px 28px 48px', position: 'relative' }}>
          <Image width={226} height={100} src="/assets/jkp-logo-white.png" alt="JKP Property" style={{ height: 42, width: 'auto', display: 'block', marginBottom: 22 }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 30, padding: '0 14px', borderRadius: 9999, background: 'rgba(45,251,145,.14)', border: '1px solid rgba(45,251,145,.35)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#2DFB91' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#2DFB91' }}>สารบัญหน้าทั้งหมด · เว็บไซต์ + ระบบหลังบ้าน</span>
          </div>
          <h1 className="idx-h1" style={{ margin: '16px 0 10px', fontSize: 34, fontWeight: 800, letterSpacing: '-.01em' }}>JKP Property — ทุกหน้าในระบบ</h1>
          <p style={{ margin: 0, maxWidth: 620, fontSize: 15, color: '#C3FED5', lineHeight: 1.7 }}>คลิกเข้าดูได้ทุกหน้า — เว็บไซต์ (ส่วนลูกค้า) และระบบหลังบ้าน (CMS) เชื่อมโยงกันจริง แต่ละหน้ากดนำทางต่อได้</p>
          <Link href="/cms-sitemap" className="idx-cta" style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 22px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: 14, fontWeight: 800, transition: 'transform .2s,box-shadow .2s' }}>
            ดูแผนผังระบบหลังบ้าน (CMS Sitemap)
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </section>

      <div className="wrap" style={{ padding: '48px 28px 70px' }}>
        {groups.map((g) => (
          <div key={g.title} style={{ marginBottom: 38 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: g.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: g.icon }} />
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>{g.title}</div>
              <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            </div>
            <div className="idx-cardgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {g.items.map((p) => (
                <a key={p.name} href={p.href} className="idx-card" style={{ ['--dot' as string]: g.dot, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13 } as React.CSSProperties}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: g.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: g.dot, fontSize: 13, fontWeight: 800 }}>{p.n}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.desc}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2.2" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6" /></svg>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
