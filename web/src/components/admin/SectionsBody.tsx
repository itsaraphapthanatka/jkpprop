'use client';

import * as React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiGet, apiPut, ApiClientError } from '@/lib/apiClient';

/* Ported from AdminSections.dc.html <main> — CMS "จัดการ Section หน้าเว็บ".
   Interactive: the topbar page tabs (หน้าแรก/เกี่ยวกับเรา/ติดต่อเรา) swap the
   section list, each section card is selectable (drives the sticky edit panel),
   and every card has an on/off publish switch. Because the topbar tabs are
   coupled to the same state as the body, this client component renders the
   whole AdminShell itself (including the interactive `actions` cluster). */

type Section = {
  name: string;
  desc: string;
  img?: string;
  credit?: string;
  creditHref?: string;
  imgCount?: string;
  noImage?: boolean;
  headline: string;
  sub: string;
};

type PageKey = 'home' | 'about' | 'contact';

const PAGE_TABS: { key: PageKey; label: string }[] = [
  { key: 'home', label: 'หน้าแรก' },
  { key: 'about', label: 'เกี่ยวกับเรา' },
  { key: 'contact', label: 'ติดต่อเรา' },
];

const SEC_DATA: Record<PageKey, Section[]> = {
  home: [
    { name: 'Hero', desc: 'หัวข้อหลัก + กล่องค้นหา + รูปพื้นหลัง', img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=70', credit: 'Photo by Petrebels on Unsplash', creditHref: 'https://unsplash.com/@petrebels', imgCount: '1', headline: 'ค้นหาโกดังที่เหมาะกับคุณ หรือโรงงานทั่วประเทศไทย', sub: 'รวมรายการโรงงานและโกดังให้เช่า–ขายทั่วประเทศ ที่ผ่านการตรวจสอบ' },
    { name: 'ทรัพย์มาใหม่ (Carousel)', desc: 'การ์ดทรัพย์ล่าสุด — ดึงอัตโนมัติจาก Listings', noImage: true, headline: 'อสังหาริมทรัพย์ล่าสุด', sub: 'คัดสรรทรัพย์คุณภาพที่ผ่านการตรวจสอบ อัปเดตใหม่ทุกสัปดาห์' },
    { name: 'ค้นหาทำเล (แผนที่)', desc: 'แผนที่ interactive + รูปพื้นหลังแผนที่', img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=70', credit: 'Photo by Ian Cylkowski on Unsplash', creditHref: 'https://unsplash.com/@ijcylkowski', imgCount: '1', headline: 'ค้นหาทำเลธุรกิจที่เหมาะกับคุณ', sub: 'ทำเลยุทธศาสตร์ใกล้สนามบิน ท่าเรือ และ EEC' },
    { name: '4 ขั้นตอน', desc: 'ไอคอน + ข้อความ (ไม่มีรูปถ่าย)', noImage: true, headline: 'ค้นหาทรัพย์ใน 4 ขั้นตอน', sub: 'ตั้งแต่บอกความต้องการจนถึงปิดดีล' },
    { name: 'ทำไมต้องเลือกเรา', desc: 'รูปทีมงาน + รางวัล + KPI', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=70', credit: 'Photo by Sebastian Herrmann on Unsplash', creditHref: 'https://unsplash.com/@herrherrmann', imgCount: '1', headline: 'เหตุผลที่ลูกค้าเลือกเรา', sub: 'ได้รับความไว้วางใจจากนักลงทุนต่างชาติและเจ้าของทรัพย์ไทย' },
    { name: 'CTA Band (ท้ายหน้า)', desc: 'การ์ดเขียว + รูปทีมงานจับมือ', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=70', credit: 'Photo by Sebastian Herrmann on Unsplash', creditHref: 'https://unsplash.com/@herrherrmann', imgCount: '1', headline: 'พร้อมหาโรงงานหรือโกดังที่ใช่ ให้เราช่วยคุณ', sub: 'ให้ทีมผู้เชี่ยวชาญของเราช่วยคัดทรัพย์ที่ตรงโจทย์ที่สุด' },
  ],
  about: [
    { name: 'Hero', desc: 'หัวข้อ + รูปพื้นหลัง', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=70', credit: 'Photo by Denys Nevozhai on Unsplash', creditHref: 'https://unsplash.com/@dnevozhai', imgCount: '1', headline: 'เกี่ยวกับเรา', sub: 'ทีมผู้เชี่ยวชาญด้านอสังหาริมทรัพย์อุตสาหกรรมที่เชื่อถือได้' },
    { name: 'เรื่องราวของเรา', desc: 'รูปผู้ก่อตั้ง + สถิติ', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=70', credit: 'Photo by LinkedIn Sales Solutions on Unsplash', creditHref: 'https://unsplash.com/@linkedinsalesnavigator', imgCount: '1', headline: 'เรื่องราวของเรา', sub: 'JKP Property ก่อตั้งขึ้นเพื่อเป็นตัวกลางที่น่าเชื่อถือ' },
    { name: 'ทีมงาน', desc: 'รูปทีมงาน (carousel)', img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=70', credit: 'Photo by Christina Wocintechchat on Unsplash', creditHref: 'https://unsplash.com/@wocintechchat', imgCount: '4', headline: 'พบกับทีมงานของเรา', sub: 'ทีมผู้เชี่ยวชาญที่คัดเลือกด้วยความรอบคอบ' },
  ],
  contact: [
    { name: 'Hero', desc: 'หัวข้อ + รูปพื้นหลัง', img: 'https://images.unsplash.com/photo-1536599424071-0b215a388ba7?w=400&q=70', credit: 'Photo by Manson Yim on Unsplash', creditHref: 'https://unsplash.com/@mansonyim', imgCount: '1', headline: 'ติดต่อเรา', sub: 'ติดต่อสอบถามข้อมูลเกี่ยวกับอสังหาริมทรัพย์ของเรา' },
    { name: 'แผนที่ที่ตั้ง', desc: 'รูปแผนที่ Google Maps', img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=70', credit: 'Photo by Ian Cylkowski on Unsplash', creditHref: 'https://unsplash.com/@ijcylkowski', imgCount: '1', headline: 'ที่ตั้งของเรา', sub: 'สมุทรปราการ, ประเทศไทย' },
  ],
};

const OVERLAY_OPTS: { label: string; on: boolean }[] = [
  { label: 'อ่อน', on: false },
  { label: 'กลาง', on: true },
  { label: 'เข้ม', on: false },
];

const sectionsCss = `
@media (max-width:1100px){ #sec-split{grid-template-columns:1fr !important;} #sec-preview{position:static !important;} }
@media (max-width:640px){ #sec-actions{flex-wrap:wrap !important;width:100% !important;row-gap:8px !important;} }
`;

/* GET /api/sections item — same table the Page Builder writes */
type ApiSection = {
  key: string; name: string; desc: string; enabled: boolean; img: string | null;
  content: Record<string, { eyebrow?: string; headline?: string; sub?: string; cta?: string }>;
};

export function SectionsBody() {
  const [page, setPage] = React.useState<PageKey>('home');
  const [selected, setSelected] = React.useState(0);
  // enablement is keyed by section KEY, not list index — the old 's{i}' keys
  // leaked toggles across pages
  const [on, setOn] = React.useState<Record<string, boolean>>({});
  const [apiList, setApiList] = React.useState<ApiSection[] | null>(null);
  const [headline, setHeadline] = React.useState('');
  const [sub, setSub] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    apiGet<{ items: ApiSection[] }>(`/api/sections?page=${page}`)
      .then((r) => {
        if (!alive || !Array.isArray(r.items) || !r.items.length) { setApiList(null); return; }
        setApiList(r.items);
        setOn(Object.fromEntries(r.items.map((s) => [s.key, s.enabled])));
        setSelected(0);
      })
      .catch(() => setApiList(null));
    return () => { alive = false; };
  }, [page]);

  const list: Section[] = apiList
    ? apiList.map((s) => ({
      name: s.name,
      desc: s.desc,
      img: s.img ?? undefined,
      noImage: !s.img,
      headline: s.content?.th?.headline ?? s.name,
      sub: s.content?.th?.sub ?? '',
    }))
    : SEC_DATA[page];
  const cur = list[selected] || list[0];
  const curKey = apiList?.[selected]?.key ?? 's' + selected;

  // reload the editor fields whenever the selection or page changes
  React.useEffect(() => { setHeadline(cur?.headline ?? ''); setSub(cur?.sub ?? ''); }, [cur]);

  const saveSection = async () => {
    if (!apiList || saving) return;
    setSaving(true);
    setNotice('');
    try {
      await apiPut('/api/sections', {
        page,
        sections: apiList.map((s) => ({
          key: s.key, name: s.name, desc: s.desc, img: s.img,
          enabled: on[s.key] !== false,
          content: s.key === curKey
            ? { ...s.content, th: { ...(s.content?.th ?? {}), headline, sub } }
            : s.content,
        })),
      });
      setNotice('บันทึกแล้ว');
      window.setTimeout(() => setNotice(''), 1800);
    } catch (e) {
      setNotice(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const actions = (
    <div id="sec-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, padding: 4, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {PAGE_TABS.map((p) => {
          const active = page === p.key;
          return (
            <div
              key={p.key}
              onClick={() => { setPage(p.key); setSelected(0); }}
              style={{ height: 32, padding: '0 15px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', background: active ? '#273c33' : 'transparent', color: active ? '#fff' : 'var(--muted)' }}
            >{p.label}</div>
          );
        })}
      </div>
      <div className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>เผยแพร่
      </div>
    </div>
  );

  return (
    <AdminShell active="cms" eyebrow="CMS / Pages" title="จัดการ Section หน้าเว็บ" actions={actions} css={sectionsCss}>
      <div id="sec-split" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' }}>
        {/* SECTION LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>คลิก section เพื่อแก้รูป/ข้อความ — ลากเพื่อจัดลำดับ · เปิด/ปิดแสดงผลได้
          </div>
          {list.map((s, i) => {
            const sk = apiList?.[i]?.key ?? 's' + i;
            const isOn = on[sk] !== false;
            const hasImage = !s.noImage;
            const cardStyle: React.CSSProperties = {
              background: 'var(--surface)',
              border: '1.5px solid ' + (i === selected ? '#0D6C3B' : 'var(--border)'),
              borderRadius: 14,
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'border-color .15s,box-shadow .2s',
              boxShadow: i === selected ? '0 8px 20px rgba(13,108,59,.1)' : undefined,
            };
            return (
              <div key={sk} onClick={() => setSelected(i)} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ color: 'var(--muted3)', cursor: 'grab', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></svg>
                  </div>
                  {hasImage ? (
                    <div style={{ width: 88, height: 56, borderRadius: 10, overflow: 'hidden', background: 'var(--tint)', flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.img} alt="รูป" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                  ) : (
                    <div style={{ width: 88, height: 56, borderRadius: 10, background: 'var(--bg)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M7 7V4h10v3M9 11h6M9 15h4" /></svg>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{s.name}</span>
                      {hasImage && (
                        <span style={{ height: 20, padding: '0 8px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>{s.imgCount}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12, color: 'var(--muted2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.desc}</div>
                  </div>
                  <div
                    onClick={(e) => { e.stopPropagation(); setOn((prev) => { const c = prev[sk] !== false; return { ...prev, [sk]: !c }; }); }}
                    style={{ width: 40, height: 23, borderRadius: 9999, flexShrink: 0, cursor: 'pointer', position: 'relative', transition: 'background .2s', background: isOn ? '#0D6C3B' : 'var(--border)' }}
                  >
                    <div style={{ position: 'absolute', top: '2.5px', left: isOn ? '19px' : '2.5px', width: 18, height: 18, borderRadius: 9999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* EDIT PANEL */}
        <div id="sec-preview" style={{ position: 'sticky', top: 88, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>กำลังแก้ section</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{cur.name}</div>
          </div>
          <div className="a-scroll" style={{ maxHeight: 620, overflowY: 'auto', padding: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>รูปพื้นหลัง / รูปประกอบ</label>
            <div style={{ marginTop: 8, position: 'relative', borderRadius: 14, overflow: 'hidden', height: 180, background: 'var(--tint)' }}>
              {cur.img ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cur.img} alt="รูป section" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)', fontSize: 12 }}>รูป section</div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(2,29,14,0) 40%,rgba(2,29,14,.55) 100%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.95)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>เลือกจากคลัง
                </div>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.95)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted3)' }}>แนะนำ 1920×1080 · แสดงผลผ่านลายน้ำอัตโนมัติถ้าเปิด</div>

            <label style={{ display: 'block', marginTop: 18, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Overlay (ความเข้มทับรูป)</label>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              {OVERLAY_OPTS.map((o) => (
                <div key={o.label} style={{ flex: 1, height: 38, borderRadius: 10, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (o.on ? '#0D6C3B' : 'var(--border)'), background: o.on ? '#0D6C3B' : 'transparent', color: o.on ? '#fff' : 'var(--text)' }}>{o.label}</div>
              ))}
            </div>

            <label style={{ display: 'block', marginTop: 18, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>หัวข้อ (Headline)</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', fontWeight: 600, background: 'var(--bg)', outline: 'none' }} />
            <label style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>คำโปรย (Subheadline)</label>
            <textarea value={sub} onChange={(e) => setSub(e.target.value)} style={{ marginTop: 6, width: '100%', height: 70, padding: '12px 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none', resize: 'none' }} />

            <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: 'var(--tint)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" style={{ flexShrink: 0 }}><path d="M12 2a7 7 0 00-7 7c0 2.4 1.2 4.2 2.5 5.3.4.3.5.8.5 1.2v1c0 .8.7 1.5 1.5 1.5h5c.8 0 1.5-.7 1.5-1.5v-1c0-.4.1-.9.5-1.2C17.8 13.2 19 11.4 19 9a7 7 0 00-7-7z" /><path d="M10 22h4" /></svg>
              <span style={{ fontSize: 12, color: 'var(--accent)', lineHeight: 1.5 }}>แก้ที่นี่ = อัปเดตทั้ง 3 ภาษาผ่าน tab ภาษาใน section (สลับ TH/EN/ZH ได้)</span>
            </div>

            <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, height: 44, borderRadius: 11, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ดูตัวอย่าง</div>
              <div onClick={saveSection} style={{ flex: 1, height: 44, borderRadius: 11, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'กำลังบันทึก…' : notice || 'บันทึก section'}</div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
