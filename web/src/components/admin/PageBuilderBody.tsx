'use client';

import * as React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

/* ============================================================
   Ported from AdminPageBuilder.dc.html — interactive CMS page
   builder. Left = section list (drag handle, toggle, remove, add
   menu), centre = editor (image + headline/sub/cta inputs, language
   tabs), right = live preview. The topbar right cluster (page tabs +
   "เผยแพร่") is stateful and shares state with the body, so this
   client component renders <AdminShell> itself and passes the
   `actions` prop.
   ============================================================ */

type PageKey = 'home' | 'about' | 'contact';
type SecType = 'hero' | 'section';

interface Sec {
  id: string;
  type: SecType;
  name: string;
  on: boolean;
  eyebrow: string;
  headline: string;
  sub: string;
  cta?: string;
  img?: string;
  credit?: string;
  creditHref?: string;
}

type EditEntry = { headline?: string; sub?: string; cta?: string; img?: string; eyebrow?: string; on?: boolean };

const INITIAL_PAGE_DATA: Record<PageKey, Sec[]> = {
  home: [
    { id: 'h', type: 'hero', name: 'Hero', img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=500&q=70', credit: 'Photo by Petrebels on Unsplash', creditHref: 'https://unsplash.com/@petrebels', on: true, eyebrow: 'ทำเลยุทธศาสตร์', headline: 'ค้นหาโกดังที่เหมาะกับคุณ หรือโรงงานทั่วประเทศไทย', sub: 'รวมรายการโรงงานและโกดังให้เช่า–ขายทั่วประเทศ', cta: 'ค้นหาทรัพย์' },
    { id: 'n', type: 'section', name: 'ทรัพย์มาใหม่', on: true, eyebrow: 'ทรัพย์มาใหม่', headline: 'อสังหาริมทรัพย์ล่าสุด', sub: 'คัดสรรทรัพย์คุณภาพที่ผ่านการตรวจสอบ', img: '', credit: '', creditHref: '' },
    { id: 'l', type: 'section', name: 'ค้นหาทำเล', img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&q=70', credit: 'Photo by Ian Cylkowski on Unsplash', creditHref: 'https://unsplash.com/@ijcylkowski', on: true, eyebrow: 'ทำเลยุทธศาสตร์', headline: 'ค้นหาทำเลธุรกิจที่เหมาะกับคุณ', sub: 'ใกล้สนามบิน ท่าเรือ และ EEC' },
    { id: 'w', type: 'section', name: 'ทำไมต้องเลือกเรา', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&q=70', credit: 'Photo by Sebastian Herrmann on Unsplash', creditHref: 'https://unsplash.com/@herrherrmann', on: true, eyebrow: 'ความน่าเชื่อถือ', headline: 'เหตุผลที่ลูกค้าเลือกเรา', sub: 'ได้รับความไว้วางใจจากนักลงทุนต่างชาติและเจ้าของทรัพย์ไทย' },
    { id: 'c', type: 'section', name: 'CTA ท้ายหน้า', img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&q=70', credit: 'Photo by Sebastian Herrmann on Unsplash', creditHref: 'https://unsplash.com/@herrherrmann', on: true, eyebrow: 'เริ่มต้นวันนี้', headline: 'พร้อมหาโรงงานหรือโกดังที่ใช่', sub: 'ให้ทีมผู้เชี่ยวชาญช่วยคัดทรัพย์ที่ตรงโจทย์', cta: 'ปรึกษาฟรี' },
  ],
  about: [
    { id: 'ah', type: 'hero', name: 'Hero', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&q=70', credit: 'Photo by Denys Nevozhai on Unsplash', creditHref: 'https://unsplash.com/@dnevozhai', on: true, eyebrow: 'เกี่ยวกับเรา', headline: 'ทีมผู้เชี่ยวชาญด้านอสังหาฯ อุตสาหกรรม', sub: 'ที่เชื่อถือได้' },
    { id: 'as', type: 'section', name: 'เรื่องราวของเรา', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=70', credit: 'Photo by LinkedIn Sales Solutions on Unsplash', creditHref: 'https://unsplash.com/@linkedinsalesnavigator', on: true, eyebrow: 'จุดเริ่มต้น', headline: 'เรื่องราวของเรา', sub: 'JKP Property ก่อตั้งเพื่อเป็นตัวกลางที่น่าเชื่อถือ' },
  ],
  contact: [
    { id: 'ch', type: 'hero', name: 'Hero', img: 'https://images.unsplash.com/photo-1536599424071-0b215a388ba7?w=500&q=70', credit: 'Photo by Manson Yim on Unsplash', creditHref: 'https://unsplash.com/@mansonyim', on: true, eyebrow: 'ติดต่อเรา', headline: 'ติดต่อเรา', sub: 'สอบถามข้อมูลอสังหาฯ ของเรา' },
    { id: 'cm', type: 'section', name: 'แผนที่ที่ตั้ง', img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&q=70', credit: 'Photo by Ian Cylkowski on Unsplash', creditHref: 'https://unsplash.com/@ijcylkowski', on: true, eyebrow: 'ที่ตั้ง', headline: 'ที่ตั้งของเรา', sub: 'สมุทรปราการ, ประเทศไทย' },
  ],
};

const PAGE_NAMES: Record<PageKey, string> = { home: 'หน้าแรก', about: 'เกี่ยวกับเรา', contact: 'ติดต่อเรา' };

const pageCss = `
@media (max-width:1200px){ #pb-grid{grid-template-columns:1fr !important;} #pb-preview{position:static !important;top:auto !important;} }
@media (max-width:640px){ #pb-actions{flex-wrap:wrap !important;width:100% !important;row-gap:8px !important;} }
.pb-remove:hover{background:#F9E4E1 !important;color:#C0392B !important;}
.pb-addbtn:hover{border-color:#0D6C3B !important;color:#0D6C3B !important;}
.pb-addtype:hover{background:var(--tint) !important;}
`;

const ic = (p: string) => ({ __html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + p + '</svg>' });

export function PageBuilderBody() {
  const [page, setPage] = React.useState<PageKey>('home');
  const [sel, setSel] = React.useState(0);
  const [lang, setLang] = React.useState<'th' | 'en' | 'zh'>('th');
  const [addSecOpen, setAddSecOpen] = React.useState(false);
  const [edits, setEdits] = React.useState<Record<string, EditEntry>>({});
  const [removed, setRemoved] = React.useState<Record<string, boolean>>({});
  const [pageData, setPageData] = React.useState<Record<PageKey, Sec[]>>(INITIAL_PAGE_DATA);

  const rawSecs = (pageData[page] || []).filter((s) => !removed[s.id]);

  const ov = (id: string | undefined, field: keyof EditEntry, fallback: string | undefined): string | undefined => {
    if (!id) return fallback;
    const e = edits[page + '_' + id];
    const v = e ? e[field] : undefined;
    return v !== undefined ? (v as string) : fallback;
  };
  const setOv = (id: string | undefined, field: keyof EditEntry, val: string | boolean) => {
    if (!id) return;
    const key = page + '_' + id;
    setEdits((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: val } }));
  };
  const secOn = (s: Sec): boolean => {
    const e = edits[page + '_' + s.id];
    return e && e.on !== undefined ? e.on : s.on;
  };

  const pageTabs = ([['home', 'หน้าแรก'], ['about', 'เกี่ยวกับเรา'], ['contact', 'ติดต่อเรา']] as [PageKey, string][]).map(([k, label]) => ({
    label,
    select: () => { setPage(k); setSel(0); setAddSecOpen(false); },
    style: { height: 32, padding: '0 15px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', background: page === k ? '#273c33' : 'transparent', color: page === k ? '#fff' : 'var(--muted)' } as React.CSSProperties,
  }));

  const sections = rawSecs.map((s, i) => {
    const on = secOn(s);
    return {
      id: s.id,
      name: ov(s.id, 'headline', s.headline) || s.name,
      typeLabel: s.type === 'hero' ? 'Hero section' : 'Content section',
      select: () => setSel(i),
      cardStyle: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1.5px solid ' + (i === sel ? '#0D6C3B' : 'var(--border)'), borderRadius: 12, padding: '11px 12px', cursor: 'pointer' } as React.CSSProperties,
      toggle: (e: React.MouseEvent) => { e.stopPropagation(); setOv(s.id, 'on', !on); },
      switchStyle: { width: 34, height: 20, borderRadius: 9999, flexShrink: 0, cursor: 'pointer', position: 'relative', background: on ? '#0D6C3B' : 'var(--border)' } as React.CSSProperties,
      knobStyle: { position: 'absolute', top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: 9999, background: '#fff', transition: 'left .2s' } as React.CSSProperties,
      remove: (e: React.MouseEvent) => { e.stopPropagation(); setRemoved((prev) => ({ ...prev, [s.id]: true })); setSel(0); },
    };
  });

  const addOne = (type: SecType, name: string) => {
    const id = 'new' + Date.now();
    const newItem: Sec = { id, type, name, on: true, eyebrow: 'หัวข้อใหม่', headline: name, sub: 'คำอธิบาย…', img: '', credit: '', creditHref: '' };
    setPageData((prev) => ({ ...prev, [page]: [...prev[page], newItem] }));
    setAddSecOpen(false);
    setSel(rawSecs.length);
  };

  const addTypes = [
    { label: 'Hero (แบนเนอร์)', icon: ic('<rect x="3" y="4" width="18" height="10" rx="2"></rect><path d="M3 18h18"></path>'), add: () => addOne('hero', 'Hero ใหม่') },
    { label: 'ข้อความ + รูป', icon: ic('<rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18"></path>'), add: () => addOne('section', 'Section ใหม่') },
    { label: 'การ์ด/รายการ', icon: ic('<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'), add: () => addOne('section', 'การ์ดใหม่') },
    { label: 'CTA band', icon: ic('<rect x="2" y="7" width="20" height="10" rx="2"></rect><path d="M7 12h6"></path>'), add: () => addOne('section', 'CTA ใหม่') },
  ];

  const langTabs = ([['th', 'ไทย'], ['en', 'EN'], ['zh', '中文']] as ['th' | 'en' | 'zh', string][]).map(([k, label]) => ({
    label,
    select: () => setLang(k),
    style: { height: 30, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', background: lang === k ? '#273c33' : 'transparent', color: lang === k ? '#fff' : 'var(--muted)' } as React.CSSProperties,
  }));

  const curRaw: Partial<Sec> = rawSecs[sel] || rawSecs[0] || {};
  const cur = {
    name: curRaw.name || '',
    hasImage: curRaw.type !== 'section' ? true : ('img' in curRaw),
    img: ov(curRaw.id, 'img', curRaw.img),
    headline: ov(curRaw.id, 'headline', curRaw.headline),
    sub: ov(curRaw.id, 'sub', curRaw.sub),
    hasCta: 'cta' in curRaw,
    cta: ov(curRaw.id, 'cta', curRaw.cta),
  };

  const onHeadline = (e: React.ChangeEvent<HTMLInputElement>) => setOv(curRaw.id, 'headline', e.target.value);
  const onSub = (e: React.ChangeEvent<HTMLTextAreaElement>) => setOv(curRaw.id, 'sub', e.target.value);
  const onCta = (e: React.ChangeEvent<HTMLInputElement>) => setOv(curRaw.id, 'cta', e.target.value);

  const previewSecs = rawSecs.filter((s) => secOn(s)).map((s) => ({
    key: 'pb-pv-' + page + '-' + s.id,
    isHero: s.type === 'hero',
    isSection: s.type !== 'hero',
    eyebrow: ov(s.id, 'eyebrow', s.eyebrow),
    headline: ov(s.id, 'headline', s.headline),
    sub: ov(s.id, 'sub', s.sub),
    cta: ov(s.id, 'cta', s.cta),
    hasImg: !!ov(s.id, 'img', s.img),
    img: ov(s.id, 'img', s.img),
    ring: rawSecs[sel] && rawSecs[sel].id === s.id ? 'inset 0 0 0 2px #2DFB91' : undefined,
  }));

  const pageName = PAGE_NAMES[page];

  const actions = (
    <div id="pb-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, padding: 4, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {pageTabs.map((p) => (
          <div key={p.label} onClick={p.select} style={p.style}>{p.label}</div>
        ))}
      </div>
      <div className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"></path></svg>เผยแพร่
      </div>
    </div>
  );

  return (
    <AdminShell active="cms" eyebrow="เนื้อหา / CMS / Page Builder" title="Page Builder" actions={actions} css={pageCss}>
      <div id="pb-grid" style={{ display: 'grid', gridTemplateColumns: '300px 1fr 420px', gap: 18, alignItems: 'start' }}>
        {/* SECTION LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Sections · {pageName}</div>
          {sections.map((s) => (
            <div key={s.id} onClick={s.select} style={s.cardStyle}>
              <div style={{ color: 'var(--muted3)', cursor: 'grab', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1"></circle><circle cx="15" cy="6" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="18" r="1"></circle><circle cx="15" cy="18" r="1"></circle></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>{s.typeLabel}</div>
              </div>
              <div onClick={s.toggle} style={s.switchStyle}><div style={s.knobStyle}></div></div>
              <div onClick={s.remove} className="pb-remove" style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path></svg>
              </div>
            </div>
          ))}
          <div style={{ position: 'relative' }}>
            <div onClick={() => setAddSecOpen(!addSecOpen)} className="pb-addbtn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 44, border: '1.5px dashed var(--border)', borderRadius: 12, color: 'var(--muted)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', background: 'var(--surface)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"></path></svg>เพิ่ม Section
            </div>
            {addSecOpen && (
              <div style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 30, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 13, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 7 }}>
                {addTypes.map((t) => (
                  <div key={t.label} onClick={t.add} className="pb-addtype" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                    <span style={{ display: 'flex', width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} dangerouslySetInnerHTML={t.icon}></span>{t.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* EDITOR */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>กำลังแก้</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{cur.name}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {langTabs.map((l) => (
                <div key={l.label} onClick={l.select} style={l.style}>{l.label}</div>
              ))}
            </div>
          </div>
          <div className="a-scroll" style={{ maxHeight: 620, overflowY: 'auto', padding: 20 }}>
            {cur.hasImage && (
              <>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>รูปภาพ</label>
                <div style={{ marginTop: 8, position: 'relative', borderRadius: 14, overflow: 'hidden', height: 150, background: 'var(--tint)' }}>
                  {cur.img ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cur.img} alt="รูป section" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)', fontSize: 12 }}>รูป section</div>
                  )}
                  <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.95)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>เลือกจากคลัง
                    </div>
                  </div>
                </div>
              </>
            )}
            <label style={{ display: 'block', marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>หัวข้อ (Headline)</label>
            <input value={cur.headline ?? ''} onChange={onHeadline} style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', fontWeight: 600, background: 'var(--surface)', outline: 'none' }} />
            <label style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>คำโปรย (Subheadline)</label>
            <textarea value={cur.sub ?? ''} onChange={onSub} style={{ marginTop: 6, width: '100%', height: 74, padding: '12px 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', outline: 'none', resize: 'none' }} />
            {cur.hasCta && (
              <>
                <label style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ข้อความปุ่ม (CTA)</label>
                <input value={cur.cta ?? ''} onChange={onCta} style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--surface)', outline: 'none' }} />
              </>
            )}
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 11, background: 'var(--tint)', display: 'flex', alignItems: 'center', gap: 9 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" style={{ flexShrink: 0 }}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <span style={{ fontSize: 12, color: 'var(--accent)' }}>แก้ตรงนี้ พรีวิวขวาอัปเดตทันที · เปลี่ยนภาษาเพื่อแก้ทีละภาษา</span>
            </div>
          </div>
        </div>

        {/* LIVE PREVIEW */}
        <div id="pb-preview" style={{ position: 'sticky', top: 88 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}><span style={{ width: 8, height: 8, borderRadius: 9999, background: '#2DFB91' }}></span>พรีวิวสด — {pageName}</div>
          <div className="a-scroll" style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 18px 40px rgba(0,0,0,.1)', background: '#fff', maxHeight: 640, overflowY: 'auto' }}>
            <div style={{ background: '#fff', borderBottom: '1px solid #ECE8E1', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#034956', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>J</div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#28251D' }}>JKP Property</span>
              </div>
              <div style={{ height: 24, padding: '0 11px', borderRadius: 9999, background: '#2DFB91', color: '#04140C', fontSize: '9.5px', fontWeight: 800, display: 'flex', alignItems: 'center' }}>ติดต่อทีมงาน</div>
            </div>
            {previewSecs.map((ps) => (
              <React.Fragment key={ps.key}>
                {ps.isHero && (
                  <div style={{ position: 'relative', height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 22px', overflow: 'hidden', background: 'linear-gradient(120deg,#021D0E,#034956)', boxShadow: ps.ring }}>
                    <div style={{ position: 'absolute', inset: 0, background: '#04140C', opacity: .28 }}></div>
                    <div style={{ position: 'relative', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', color: '#2DFB91', textTransform: 'uppercase' }}>{ps.eyebrow}</div>
                    <div style={{ position: 'relative', marginTop: 6, fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>{ps.headline}</div>
                    <div style={{ position: 'relative', marginTop: 8, fontSize: 11, color: '#E8FFF0', maxWidth: '80%' }}>{ps.sub}</div>
                    {ps.cta && (
                      <div style={{ position: 'relative', marginTop: 12, height: 32, width: 'fit-content', padding: '0 16px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center' }}>{ps.cta}</div>
                    )}
                  </div>
                )}
                {ps.isSection && (
                  <div style={{ padding: '20px 22px', borderBottom: '1px solid #F0ECE5', boxShadow: ps.ring }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <span style={{ width: 20, height: 2, background: '#034956', borderRadius: 2 }}></span>
                      <span style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '.05em', color: '#034956', textTransform: 'uppercase' }}>{ps.eyebrow}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#28251D', lineHeight: 1.3 }}>{ps.headline}</div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#5F5A52', lineHeight: 1.6 }}>{ps.sub}</div>
                    {ps.hasImg && (
                      <div style={{ marginTop: 12, height: 90, borderRadius: 10, overflow: 'hidden', background: '#EEF4F3' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ps.img} alt="รูป" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
