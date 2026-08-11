'use client';

import * as React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiGet, apiPut, ApiClientError } from '@/lib/apiClient';
import { SECTION_CATALOG, sectionDef } from '@/lib/sectionCatalog';
import type { Locale } from '@/i18n/config';

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

/* Shown only if /api/sections cannot be reached — the catalogue describes the
   same blocks, minus any copy, so an offline editor still lists the right
   sections instead of a set of invented ones with stock photos attached. */
const SEC_DATA: Record<PageKey, Section[]> = Object.fromEntries(
  PAGE_TABS.map((p) => [
    p.key,
    SECTION_CATALOG[p.key].map((d) => ({ name: d.name, desc: d.desc, noImage: true, headline: d.name, sub: '' })),
  ]),
) as Record<PageKey, Section[]>;

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
type Item = { title?: string; desc?: string; role?: string; img?: string };
type Block = { eyebrow?: string; headline?: string; sub?: string; cta?: string; note?: string; items?: Item[] };
type ApiSection = {
  key: string; name: string; desc: string; enabled: boolean; img: string | null;
  content: Record<string, Block>;
};
const LANGS: { key: Locale; label: string }[] = [
  { key: 'th', label: 'ไทย' }, { key: 'en', label: 'EN' }, { key: 'zh', label: '中文' },
];

/* What each block is, which fields it renames, and whether it holds a
   repeating list all come from src/lib/sectionCatalog — the same list the
   seed and the sync script read, so the editor cannot offer a section the
   page does not render, or miss one it does. */
const FIELD_LABELS: Record<'eyebrow' | 'headline' | 'sub' | 'cta' | 'note', string> = {
  eyebrow: 'ป้ายเล็กเหนือหัวข้อ (Eyebrow)',
  headline: 'หัวข้อ (Headline)',
  sub: 'คำโปรย (Subheadline)',
  cta: 'ข้อความปุ่ม / บรรทัดเสริม (CTA)',
  note: 'บรรทัดเล็กใต้คำโปรย',
};

const rowBtn = (disabled: boolean): React.CSSProperties => ({
  width: 24, height: 24, borderRadius: 7, border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--muted2)', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1, padding: 0,
});

/* The same grid of uploaded images, wherever an image is being chosen —
   the section background, or one row of the list editor. */
function MediaPicker({ items, current, onPick }: { items: { id: string; src: string; name: string }[]; current: string; onPick: (src: string) => void }) {
  return (
    <div style={{ marginTop: 8, padding: 10, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', maxHeight: 220, overflowY: 'auto' }}>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--muted2)', padding: 8 }}>ยังไม่มีรูปในคลัง — อัปโหลดที่หน้า “คลังสื่อ” ก่อน</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {items.map((m) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={m.id}
              src={m.src}
              alt={m.name}
              onClick={() => onPick(m.src)}
              style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: current === m.src ? '2px solid #0D6C3B' : '1px solid var(--border)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const isPageKey = (v: string): v is PageKey => PAGE_TABS.some((p) => p.key === v);

export function SectionsBody() {
  const [page, setPage] = React.useState<PageKey>('home');
  const [selected, setSelected] = React.useState(0);
  // enablement is keyed by section KEY, not list index — the old 's{i}' keys
  // leaked toggles across pages
  const [on, setOn] = React.useState<Record<string, boolean>>({});
  const [apiList, setApiList] = React.useState<ApiSection[] | null>(null);
  /* the edit panel used to write s.content.th only, while the hint below it
     promised TH/EN/ZH tabs. The tabs are real now — draft holds one block per
     locale and only the edited locales are written back. */
  const [lang, setLang] = React.useState<Locale>('th');
  const [draft, setDraft] = React.useState<Record<string, Block>>({});
  const [img, setImg] = React.useState<string>('');
  /* which field the media picker will write into: the section image, or the
     `img` of one row in the list editor */
  const [picker, setPicker] = React.useState<'section' | number | null>(null);
  const [mediaItems, setMediaItems] = React.useState<{ id: string; src: string; name: string }[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  /* A failed load used to leave the editor showing a plausible list of
     sections that nothing could be saved to: `saveSection` returned early on
     a null list, so the button was a no-op with no message. Now the failure
     is on screen and retryable. */
  const [loadError, setLoadError] = React.useState('');
  const [reloadNonce, setReloadNonce] = React.useState(0);

  /* `?page=about` opens on that tab, so a link to one page's sections lands
     where it says it does. Applied after mount rather than as the initial
     state: the server renders this component too, and it only knows 'home',
     so seeding from the URL up front would be a hydration mismatch. */
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('page') ?? '';
    if (isPageKey(p)) setPage(p);
  }, []);

  // keep the address bar on the tab being edited, so the page can be linked
  const openPage = (p: PageKey) => {
    setPage(p);
    setSelected(0);
    const url = new URL(window.location.href);
    url.searchParams.set('page', p);
    window.history.replaceState(null, '', url);
  };

  React.useEffect(() => {
    let alive = true;
    setLoadError('');
    apiGet<{ items: ApiSection[] }>(`/api/sections?page=${page}`)
      .then((r) => {
        if (!alive) return;
        if (!Array.isArray(r.items) || !r.items.length) {
          setApiList(null);
          setLoadError('หน้านี้ยังไม่มี section ในฐานข้อมูล — รัน npm run sections:sync');
          return;
        }
        setApiList(r.items);
        setOn(Object.fromEntries(r.items.map((s) => [s.key, s.enabled])));
        setSelected(0);
      })
      .catch((e) => {
        if (!alive) return;
        setApiList(null);
        setLoadError(e instanceof ApiClientError ? e.message : 'โหลดรายการ section ไม่สำเร็จ');
      });
    return () => { alive = false; };
  }, [page, reloadNonce]);

  const list: Section[] = apiList
    ? apiList.map((s) => ({
      name: s.name,
      desc: s.desc || sectionDef(page, s.key)?.desc || '',
      img: s.img ?? undefined,
      noImage: !s.img,
      headline: s.content?.th?.headline ?? s.name,
      sub: s.content?.th?.sub ?? '',
    }))
    : SEC_DATA[page];
  const cur = list[selected] || list[0];
  const curKey = apiList?.[selected]?.key ?? 's' + selected;

  // reload the editor fields whenever the selection or page changes
  const curApi = apiList?.[selected];
  React.useEffect(() => {
    setDraft((curApi?.content ?? {}) as Record<string, Block>);
    setImg(curApi?.img ?? '');
  }, [curApi]);

  const field = (name: 'eyebrow' | 'headline' | 'sub' | 'cta' | 'note') => draft[lang]?.[name] ?? '';
  const setField = (name: 'eyebrow' | 'headline' | 'sub' | 'cta' | 'note', v: string) =>
    setDraft((prev) => ({ ...prev, [lang]: { ...(prev[lang] ?? {}), [name]: v } }));

  /* ---- the repeating list, when this section has one ---------------------- */
  const def = sectionDef(page, curKey);
  const spec = def?.items;
  const labelFor = (f: keyof typeof FIELD_LABELS) => def?.labels?.[f] ?? FIELD_LABELS[f];
  const items: Item[] = draft[lang]?.items ?? [];
  const setItems = (next: Item[]) =>
    setDraft((prev) => ({ ...prev, [lang]: { ...(prev[lang] ?? {}), items: next } }));
  const setItemField = (i: number, name: keyof Item, v: string) =>
    setItems(items.map((it, n) => (n === i ? { ...it, [name]: v } : it)));
  const addItem = () => setItems([...items, {}]);
  const removeItem = (i: number) => setItems(items.filter((_, n) => n !== i));
  const moveItem = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[i], next[to]] = [next[to], next[i]];
    setItems(next);
  };
  /* a locale with nothing in it should not save an empty `items: []`, or the
     strict reader would treat it as "deliberately blank" and hide the
     dictionary default */
  const hasCopy = (b?: Block) =>
    !!(b && (b.eyebrow || b.headline || b.sub || b.cta || b.note || (b.items?.length && b.items.some((it) => it.title || it.desc || it.role || it.img))));

  const openPicker = async (target: 'section' | number) => {
    setPicker(target);
    if (mediaItems.length) return;
    try {
      const r = await apiGet<{ items: { id: string; src: string; name: string }[] }>('/api/media');
      setMediaItems(Array.isArray(r.items) ? r.items : []);
    } catch { setMediaItems([]); }
  };
  const chooseMedia = (src: string) => {
    if (picker === 'section') setImg(src);
    else if (typeof picker === 'number') setItemField(picker, 'img', src);
    setPicker(null);
  };

  const saveSection = async () => {
    if (saving) return;
    if (!apiList) {
      setNotice('ยังโหลดรายการ section ไม่สำเร็จ — กดโหลดใหม่ก่อน');
      return;
    }
    setSaving(true);
    setNotice('');

    /* drop rows the editor left blank — an "add" the user never filled in
       should not become an empty card on the public page */
    const cleaned: Record<string, Block> = {};
    for (const [loc, block] of Object.entries(draft)) {
      const rows = (block.items ?? []).filter((it) => it.title || it.desc || it.role || it.img);
      cleaned[loc] = block.items ? { ...block, items: rows } : block;
    }

    try {
      await apiPut('/api/sections', {
        page,
        sections: apiList.map((s) => ({
          key: s.key, name: s.name, desc: s.desc,
          enabled: on[s.key] !== false,
          img: s.key === curKey ? (img || null) : s.img,
          // only the edited section sends content; the server merges the rest
          content: s.key === curKey ? cleaned : undefined,
        })),
      });
      /* keep the in-memory list in step with what was just written, so a
         second save does not push the pre-edit content back up */
      setApiList((prev) => prev && prev.map((s) => (s.key === curKey ? { ...s, img: img || null, content: cleaned } : s)));
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
              onClick={() => openPage(p.key)}
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
              <div key={sk} data-section-key={sk} onClick={() => setSelected(i)} style={cardStyle}>
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
        <div id="sec-preview" data-editing-key={curKey} style={{ position: 'sticky', top: 88, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>กำลังแก้ section</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{cur.name}</div>
          </div>
          {loadError && (
            <div role="alert" style={{ margin: '12px 20px 0', padding: '12px 14px', borderRadius: 12, background: '#FDECEA', border: '1px solid #F5C2BE', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B4231F" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></svg>
              <span style={{ flex: 1, fontSize: 12, color: '#8C1D18', lineHeight: 1.5 }}>{loadError} — แก้ตอนนี้แล้วจะบันทึกไม่ได้</span>
              <button type="button" onClick={() => setReloadNonce((n) => n + 1)} style={{ flexShrink: 0, height: 30, padding: '0 12px', borderRadius: 9, border: '1px solid #F5C2BE', background: '#fff', color: '#8C1D18', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>โหลดใหม่</button>
            </div>
          )}
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

            <label style={{ display: 'block', marginTop: 18, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{def?.labels?.img ?? 'รูปประกอบ'}</label>
            <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
              <input
                value={img}
                onChange={(e) => setImg(e.target.value)}
                placeholder="เลือกจากคลังสื่อ หรือวาง URL"
                style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }}
              />
              <div onClick={() => openPicker('section')} style={{ height: 44, padding: '0 16px', borderRadius: 11, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>เลือกรูป</div>
            </div>
            {picker === 'section' && <MediaPicker items={mediaItems} current={img} onPick={chooseMedia} />}

            <div style={{ marginTop: 18, display: 'flex', gap: 6 }}>
              {LANGS.map((l) => (
                <div
                  key={l.key}
                  onClick={() => setLang(l.key)}
                  style={{ flex: 1, height: 34, borderRadius: 9, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, border: '1.5px solid ' + (lang === l.key ? '#0D6C3B' : 'var(--border)'), background: lang === l.key ? '#0D6C3B' : 'transparent', color: lang === l.key ? '#fff' : 'var(--text)' }}
                >
                  {l.label}
                  {/* a dot marks a language that already has copy */}
                  {hasCopy(draft[l.key]) && (
                    <span style={{ width: 5, height: 5, borderRadius: 9999, background: lang === l.key ? '#2DFB91' : '#0D6C3B' }} />
                  )}
                </div>
              ))}
            </div>

            <label htmlFor={'sec-f-eyebrow'} style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{labelFor('eyebrow')}</label>
            <input id={'sec-f-eyebrow'} value={field('eyebrow')} onChange={(e) => setField('eyebrow', e.target.value)} style={{ marginTop: 6, width: '100%', height: 40, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }} />

            <label htmlFor={'sec-f-headline'} style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{labelFor('headline')}</label>
            <input id={'sec-f-headline'} value={field('headline')} onChange={(e) => setField('headline', e.target.value)} style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', fontWeight: 600, background: 'var(--bg)', outline: 'none' }} />

            <label htmlFor={'sec-f-sub'} style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{labelFor('sub')}</label>
            <textarea id={'sec-f-sub'} value={field('sub')} onChange={(e) => setField('sub', e.target.value)} style={{ marginTop: 6, width: '100%', height: 70, padding: '12px 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none', resize: 'none' }} />

            <label htmlFor={'sec-f-cta'} style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{labelFor('cta')}</label>
            <input id={'sec-f-cta'} value={field('cta')} onChange={(e) => setField('cta', e.target.value)} style={{ marginTop: 6, width: '100%', height: 40, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }} />

            <label htmlFor={'sec-f-note'} style={{ display: 'block', marginTop: 14, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{labelFor('note')}</label>
            <input id={'sec-f-note'} value={field('note')} onChange={(e) => setField('note', e.target.value)} placeholder="เช่น ชื่อรางวัลและปีที่ได้รับ" style={{ marginTop: 6, width: '100%', height: 40, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }} />

            {/* ---- repeating list, for the sections that have one ---- */}
            {spec && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{spec.title}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted3)' }}>{items.length}/{spec.max}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted2)', lineHeight: 1.5 }}>{spec.hint}</div>

                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map((it, i) => (
                    <div key={i} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted2)' }}>{spec.rowLabel} {i + 1}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button type="button" aria-label="เลื่อนขึ้น" disabled={i === 0} onClick={() => moveItem(i, -1)} style={rowBtn(i === 0)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 15l6-6 6 6" /></svg>
                          </button>
                          <button type="button" aria-label="เลื่อนลง" disabled={i === items.length - 1} onClick={() => moveItem(i, 1)} style={rowBtn(i === items.length - 1)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                          <button type="button" aria-label="ลบ" onClick={() => removeItem(i)} style={{ ...rowBtn(false), color: '#B4231F' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                          </button>
                        </div>
                      </div>
                      {spec.fields.map((f) => (
                        <div key={f.key} style={{ marginTop: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{f.label}</label>
                          {f.kind === 'textarea' ? (
                            <textarea
                              value={it[f.key] ?? ''} placeholder={f.placeholder}
                              onChange={(e) => setItemField(i, f.key, e.target.value)}
                              style={{ marginTop: 4, width: '100%', height: 56, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '12.5px', background: 'var(--surface)', outline: 'none', resize: 'none' }}
                            />
                          ) : f.kind === 'image' ? (
                            <>
                              <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                                {it.img && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={it.img} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                                )}
                                <input
                                  value={it.img ?? ''} placeholder="เลือกจากคลังสื่อ หรือวาง URL"
                                  onChange={(e) => setItemField(i, 'img', e.target.value)}
                                  style={{ flex: 1, minWidth: 0, height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '12.5px', background: 'var(--surface)', outline: 'none' }}
                                />
                                <div onClick={() => openPicker(i)} style={{ height: 38, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>เลือก</div>
                              </div>
                              {picker === i && <MediaPicker items={mediaItems} current={it.img ?? ''} onPick={chooseMedia} />}
                            </>
                          ) : (
                            <input
                              value={it[f.key] ?? ''} placeholder={f.placeholder}
                              onChange={(e) => setItemField(i, f.key, e.target.value)}
                              style={{ marginTop: 4, width: '100%', height: 38, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '12.5px', background: 'var(--surface)', outline: 'none' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {items.length < spec.max && (
                  <div onClick={addItem} style={{ marginTop: 10, height: 40, borderRadius: 11, border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>เพิ่ม{spec.rowLabel}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: 'var(--tint)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" style={{ flexShrink: 0 }}><path d="M12 2a7 7 0 00-7 7c0 2.4 1.2 4.2 2.5 5.3.4.3.5.8.5 1.2v1c0 .8.7 1.5 1.5 1.5h5c.8 0 1.5-.7 1.5-1.5v-1c0-.4.1-.9.5-1.2C17.8 13.2 19 11.4 19 9a7 7 0 00-7-7z" /><path d="M10 22h4" /></svg>
              <span style={{ fontSize: 12, color: 'var(--accent)', lineHeight: 1.5 }}>เว้นช่องไหนว่างไว้ หน้าเว็บจะใช้ข้อความตั้งต้นของภาษานั้นแทน — จุดเขียวบนแท็บคือภาษาที่กรอกแล้ว</span>
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
