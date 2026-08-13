'use client';

import * as React from 'react';
import { DynamicFieldForm } from './DynamicFieldForm';
import { PROPERTY_TYPES, enabledPropertyTypes } from '@/lib/propertySchema';
import { useSchemaSync } from '@/lib/schemaSync';
import { apiGet, apiPost, apiPatch, apiDelete, ApiClientError } from '@/lib/apiClient';
import { placeMenu, type MenuBox } from '@/lib/menuPlacement';
import { relTime } from '@/lib/leadStore';
import Link from 'next/link';

/* ============================================================
   AdminProperties.dc.html — ported <main> content (interactive):
   summary strip, filter bar with dropdown chips, properties table
   with per-row action menus, pagination, and the "เพิ่มทรัพย์ใหม่"
   slide-in drawer (tabs / feature toggles / media / translations).
   The topbar "add" button (rendered in AdminShell's header) shares
   the drawer-open state with this body through PropertiesCtx, so
   page.tsx can keep rendering <AdminShell> as the brief requires.
   ============================================================ */

/* The Export button lives in the topbar and the rows live in the body, so the
   handler is registered here for the button to call — otherwise Export would
   have to guess what the filters are currently showing. */
type NewCtx = {
  newOpen: boolean;
  setNewOpen: (v: boolean) => void;
  exportCsv: () => void;
  registerExport: (fn: () => void) => void;
};
const PropertiesCtx = React.createContext<NewCtx | null>(null);

export function PropertiesProvider({ children }: { children: React.ReactNode }) {
  const [newOpen, setNewOpen] = React.useState(false);
  const exportRef = React.useRef<() => void>(() => {});
  const value = React.useMemo<NewCtx>(() => ({
    newOpen,
    setNewOpen,
    exportCsv: () => exportRef.current(),
    registerExport: (fn: () => void) => { exportRef.current = fn; },
  }), [newOpen]);
  return <PropertiesCtx.Provider value={value}>{children}</PropertiesCtx.Provider>;
}

function useNew(): NewCtx {
  const ctx = React.useContext(PropertiesCtx);
  if (!ctx) throw new Error('PropertiesProvider is missing');
  return ctx;
}

/* ---- injected (dangerouslySetInnerHTML) icon markup ---- */
const WH_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21V8l9-5 9 5v13"></path><path d="M3 21h18"></path><path d="M7 21v-8h10v8"></path></svg>';
const FAC_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 21h20"></path><path d="M4 21V10l5 3V10l5 3V10l5 3v8"></path><path d="M6 6h.01M10 6h.01"></path></svg>';
const LAND_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 20h18M5 20V10l7-5 7 5v10"></path><path d="M3 20l9-14 9 14"></path></svg>';

const FLAG_TH = '<svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" fill="#012169"></rect><path d="M0 0L24 24M24 0L0 24" stroke="#fff" stroke-width="3"></path><path d="M12 0V24M0 12H24" stroke="#fff" stroke-width="5"></path><path d="M12 0V24M0 12H24" stroke="#C8102E" stroke-width="2.4"></path></svg>';
const FLAG_ZH = '<svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" fill="#EE1C25"></rect><path d="M6 5l1 3 3-1-2 2.4 2 2.4-3-1-1 3-1-3-3 1 2-2.4-2-2.4 3 1z" fill="#FFDE00"></path></svg>';

const menuIcon = (paths: string, color: string) =>
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';

/* ---- static data ---- */
const SUMMARY = [
  { label: 'ทรัพย์ทั้งหมด', value: '246', color: '#28251D' },
  { label: 'มีประกาศเผยแพร่', value: '198', color: '#0D6C3B' },
  { label: 'ร่าง / รอข้อมูล', value: '34', color: '#D9A62B' },
  { label: 'แปลไม่ครบ 3 ภาษา', value: '12', color: '#C0392B' },
];


type FilterKey = 'type' | 'province' | 'status';
const FILTER_DEFS: { key: FilterKey; label: string; opts: string[] }[] = [
  { key: 'type', label: 'ประเภท', opts: ['ทั้งหมด', 'โกดัง', 'โรงงาน', 'ที่ดิน'] },
  { key: 'province', label: 'จังหวัด', opts: ['ทั้งหมด', 'สมุทรปราการ', 'ชลบุรี', 'ระยอง', 'ปทุมธานี', 'อยุธยา'] },
  { key: 'status', label: 'สถานะ', opts: ['ทั้งหมด', 'เผยแพร่', 'ร่าง', 'แปลไม่ครบ'] },
];

type MenuItem =
  | { divider: true }
  | { divider: false; label: string; href: string; icon: string; danger: boolean };
const ROW_MENU: MenuItem[] = [
  /* `href` is a base; the row's code is appended when the menu renders.
     Without it every row opened the same record. */
  { divider: false, label: 'ดูรายละเอียด', href: '/admin/property-view', icon: menuIcon('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"></path><circle cx="12" cy="12" r="3"></circle>', '#034956'), danger: false },
  { divider: false, label: 'แก้ไขทรัพย์', href: '/admin/property-edit', icon: menuIcon('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"></path>', '#034956'), danger: false },
  { divider: false, label: 'จัดการประกาศ', href: '/admin/listings', icon: menuIcon('<rect x="3" y="4" width="18" height="4" rx="1"></rect><rect x="3" y="10" width="18" height="4" rx="1"></rect><rect x="3" y="16" width="18" height="4" rx="1"></rect>', '#034956'), danger: false },
  { divider: false, label: 'ทำสำเนา', href: '#', icon: menuIcon('<rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>', '#034956'), danger: false },
  { divider: true },
  { divider: false, label: 'ลบทรัพย์', href: '#', icon: menuIcon('<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path>', '#C0392B'), danger: true },
];

const TAB_DEFS: { key: string; label: string; done: boolean }[] = [
  { key: 'main', label: 'รายละเอียดทรัพย์', done: true },
  { key: 'trans', label: 'การแปลภาษา', done: false },
];

const TRANS_LANGS = [
  { name: 'English', code: 'EN', flag: FLAG_TH, badge: 'ยังไม่แปล', title: '', titlePh: 'Warehouse with office, Bangna', descPh: 'Describe the property in English…' },
  { name: '中文', code: 'ZH', flag: FLAG_ZH, badge: 'ยังไม่แปล', title: '', titlePh: '带办公室的仓库，邦纳', descPh: '用中文描述该物业…' },
];

/* ---- style helpers ---- */
const thBase: React.CSSProperties = { padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em' };

const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--muted)' };
const drawerInput: React.CSSProperties = { marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--surface)', outline: 'none' };

const chipStyle = (hot: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: hot ? 700 : 600, cursor: 'pointer', background: hot ? '#273c33' : 'var(--bg)', color: hot ? '#fff' : 'var(--text)', border: '1px solid ' + (hot ? '#273c33' : 'var(--border)') });
const ddOption = (active: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: active ? 700 : 600, cursor: 'pointer', color: active ? '#0D6C3B' : 'var(--text)', background: active ? 'rgba(13,108,59,.06)' : 'transparent' });
const tabStyle = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 12px', fontSize: 13, fontWeight: on ? 700 : 600, color: on ? '#0D6C3B' : 'var(--muted2)', borderBottom: '2.5px solid ' + (on ? '#0D6C3B' : 'transparent'), cursor: 'pointer', whiteSpace: 'nowrap' });
const menuItemStyle = (danger: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: danger ? '#C0392B' : 'var(--text)' });
const badgeYet: React.CSSProperties = { height: 22, padding: '0 10px', borderRadius: 9999, background: '#FBF3E1', color: '#9A741C', fontSize: '10.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center' };

const COMPLETE_PCT = '45%';

/* The row and header boxes were `<div>`s with a border — they looked like
   checkboxes and did nothing at all. A real input carries the state, keyboard
   focus and the accessible name; the square is drawn over it. */
function Check({ on, mixed, onChange, label }: { on: boolean; mixed?: boolean; onChange: (v: boolean) => void; label: string }) {
  const ref = React.useRef<HTMLInputElement | null>(null);
  // "some but not all" is not expressible in HTML — it is a DOM property
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!mixed && !on; }, [mixed, on]);
  const filled = on || mixed;
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <input
        ref={ref}
        type="checkbox"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        style={{ position: 'absolute', opacity: 0, width: 16, height: 16, margin: 0, cursor: 'pointer' }}
      />
      <span style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (filled ? '#0D6C3B' : 'var(--border)'), background: filled ? '#0D6C3B' : 'transparent', transition: 'all .15s' }}>
        {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6"><path d="M20 6L9 17l-5-5" /></svg>}
        {!on && mixed && <span style={{ width: 8, height: 2, borderRadius: 2, background: '#fff' }} />}
      </span>
    </label>
  );
}

const bulkBtn = (danger: boolean): React.CSSProperties => ({ height: 34, padding: '0 14px', borderRadius: 9999, border: '1px solid ' + (danger ? '#E8C4BC' : 'var(--border)'), background: 'var(--surface)', color: danger ? '#C0392B' : 'var(--text)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' });

/* ---- topbar right cluster (design's <header> right side) ---- */
export function PropertiesActions() {
  const { setNewOpen, exportCsv } = useNew();
  return (
    <div id="prop-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <a id="prop-export" href="#" onClick={(e) => { e.preventDefault(); exportCsv(); }} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>Export
      </a>
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); setNewOpen(true); }}
        className="admin-primary-btn"
        style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, transition: 'transform .2s,box-shadow .2s' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>เพิ่มทรัพย์ใหม่
      </a>
    </div>
  );
}

/* ---- API row shape (GET /api/properties) ---- */
type ApiProperty = {
  id: string;
  publicCode: string;
  typeKey: string;
  typeLabel: string;
  title: string;
  status: string;
  values: Record<string, unknown>;
  location: string;
  area: number | null;
  updatedAt: number;
};
type ApiSummary = { total: number; published: number; draft: number; transIncomplete: number };

const iconFor = (typeKey: string) =>
  typeKey === 'factory' ? FAC_ICON : typeKey === 'land' ? LAND_ICON : WH_ICON;

/* ---- main content ---- */
export function PropertiesBody() {
  const { newOpen, setNewOpen, registerExport } = useNew();
  const [tab, setTab] = React.useState('main');
  const [selType, setSelType] = React.useState('house');
  const [types, setTypes] = React.useState(PROPERTY_TYPES);
  const schemaV = useSchemaSync();
  React.useEffect(() => {
    const en = enabledPropertyTypes();
    setTypes(en);
    setSelType((k) => (en.some((t) => t.key === k) ? k : en[0].key));
  }, [schemaV]);
  /* the menu is keyed by row id, not row index — a filter or a reload
     reorders the list under an index and the menu jumps to another property */
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [menuBox, setMenuBox] = React.useState<MenuBox | null>(null);
  const menuBtns = React.useRef<Record<string, HTMLElement | null>>({});
  const [openFilter, setOpenFilter] = React.useState<FilterKey | null>(null);
  const [sel, setSel] = React.useState<Set<string>>(new Set());
  const [filterVals, setFilterVals] = React.useState<Record<FilterKey, string>>({ type: 'ทั้งหมด', province: 'ทั้งหมด', status: 'ทั้งหมด' });

  /* live data — GET /api/properties with the chip filters + search */
  const [items, setItems] = React.useState<ApiProperty[] | null>(null);
  const [summary, setSummary] = React.useState<ApiSummary | null>(null);
  const [q, setQ] = React.useState('');
  const reload = React.useCallback(async (fv: Record<FilterKey, string>, query: string) => {
    try {
      const params = new URLSearchParams();
      if (fv.type !== 'ทั้งหมด') params.set('type', fv.type);
      if (fv.province !== 'ทั้งหมด') params.set('province', fv.province);
      if (fv.status !== 'ทั้งหมด') params.set('status', fv.status);
      if (query.trim()) params.set('q', query.trim());
      const r = await apiGet<{ items: ApiProperty[]; summary: ApiSummary }>(`/api/properties?${params}`);
      setItems(r.items);
      setSummary(r.summary);
      /* Drop ticks on rows the new list no longer shows. Keeping a hidden row
         selected is how a bulk action publishes a property nobody can see. */
      setSel((prev) => {
        if (!prev.size) return prev;
        const live = new Set(r.items.map((i) => i.id));
        const next = new Set([...prev].filter((id) => live.has(id)));
        return next.size === prev.size ? prev : next;
      });
    } catch { /* keep last data (§2.2) */ }
  }, []);
  React.useEffect(() => {
    const t = window.setTimeout(() => { void reload(filterVals, q); }, q ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [filterVals, q, reload]);

  /* the row menu is fixed-positioned to escape the table's clipping, so it has
     to follow its button when anything scrolls rather than drift away from it */
  React.useEffect(() => {
    if (!openMenu) return;
    const follow = () => {
      const r = menuBtns.current[openMenu]?.getBoundingClientRect();
      setMenuBox(r ? placeMenu(r, { width: 210, align: 'right', maxHeight: 280 }) : null);
    };
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
  }, [openMenu]);

  /* create-form state (values stream from DynamicFieldForm) */
  const [newTitle, setNewTitle] = React.useState('');
  const newVals = React.useRef<Record<string, unknown>>({});
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');
  const saveNew = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError('');
    try {
      await apiPost('/api/properties', { typeKey: selType, title: newTitle, values: newVals.current, status: 'draft' });
      setNewOpen(false);
      setNewTitle('');
      newVals.current = {};
      await reload(filterVals, q);
    } catch (e) {
      setSaveError(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  /* Export was href="#". A CSV of exactly what the filters are showing is
     what the button always looked like it did. BOM first so Excel on Windows
     opens Thai without turning it into mojibake. */
  const exportCsv = () => {
    const all = items ?? [];
    // ticking rows and pressing Export should give those rows, not the page
    const rows = sel.size ? all.filter((r) => sel.has(r.id)) : all;
    if (!rows.length) { window.alert('ไม่มีทรัพย์ให้ export ตามเงื่อนไขที่เลือก'); return; }
    const cell = (v: unknown) => {
      const t = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const head = ['รหัส', 'ชื่อทรัพย์', 'ประเภท', 'ทำเล', 'พื้นที่ (ตร.ม.)', 'สถานะ', 'อัปเดตล่าสุด'];
    const body = rows.map((r) => [
      r.publicCode, r.title, r.typeLabel, r.location,
      r.area ?? '', r.status, new Date(r.updatedAt).toISOString().slice(0, 10),
    ].map(cell).join(','));
    const csv = '\uFEFF' + [head.map(cell).join(','), ...body].join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `properties-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => { registerExport(exportCsv); });

  /* "ทำสำเนา" was href="#". A copy starts as a draft with its own code — the
     server issues that, and it is deliberately never inherited. */
  const duplicate = async (p: ApiProperty) => {
    try {
      const full = await apiGet<{ typeKey: string; title: string; values: Record<string, unknown> }>(`/api/properties/${p.id}`);
      await apiPost('/api/properties', {
        typeKey: full.typeKey,
        title: `${full.title} (สำเนา)`.slice(0, 300),
        values: full.values,
        status: 'draft',
      });
      await reload(filterVals, q);
    } catch (e) {
      window.alert(e instanceof ApiClientError ? e.message : 'ทำสำเนาไม่สำเร็จ');
    }
  };

  /* Bulk actions on the ticked rows. Each row is its own request, so a row the
     account may not touch fails on its own instead of taking the batch with
     it — and the ones that failed are named rather than counted. */
  const [busy, setBusy] = React.useState('');
  const runBulk = async (label: string, act: (p: ApiProperty) => Promise<unknown>) => {
    const rows = (items ?? []).filter((r) => sel.has(r.id));
    if (!rows.length || busy) return;
    setBusy(label);
    const failed: string[] = [];
    for (const r of rows) {
      try { await act(r); } catch { failed.push(r.publicCode); }
    }
    setBusy('');
    setSel(new Set());
    await reload(filterVals, q);
    if (failed.length) {
      window.alert(`${label}: สำเร็จ ${rows.length - failed.length} · ไม่สำเร็จ ${failed.length} (${failed.join(', ')})`);
    }
  };

  const bulkStatus = (status: 'active' | 'draft', label: string) =>
    runBulk(label, (r) => apiPatch(`/api/properties/${r.id}`, { status }));

  const bulkDelete = () => {
    const rows = (items ?? []).filter((r) => sel.has(r.id));
    if (!window.confirm(`ลบทรัพย์ ${rows.length} รายการ?\n${rows.map((r) => `· ${r.publicCode} ${r.title}`).join('\n')}`)) return;
    void runBulk('ลบทรัพย์', (r) => apiDelete(`/api/properties/${r.id}`));
  };

  const remove = async (p: ApiProperty) => {
    if (!window.confirm(`ลบทรัพย์ ${p.publicCode} · ${p.title}?`)) return;
    try {
      await apiDelete(`/api/properties/${p.id}`);
      await reload(filterVals, q);
    } catch (e) {
      window.alert(e instanceof ApiClientError ? e.message : 'ลบไม่สำเร็จ');
    }
  };

  const summaryCards = [
    { label: 'ทรัพย์ทั้งหมด', value: summary ? String(summary.total) : SUMMARY[0].value, color: '#28251D' },
    { label: 'มีประกาศเผยแพร่', value: summary ? String(summary.published) : SUMMARY[1].value, color: '#0D6C3B' },
    { label: 'ร่าง / รอข้อมูล', value: summary ? String(summary.draft) : SUMMARY[2].value, color: '#D9A62B' },
    { label: 'แปลไม่ครบ 3 ภาษา', value: summary ? String(summary.transIncomplete) : SUMMARY[3].value, color: '#C0392B' },
  ];

  const stopP = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      {/* SUMMARY STRIP */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        {summaryCards.map((s) => (
          <div key={s.label} style={{ flex: 1, minWidth: 160, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
            <div style={{ marginTop: 4, fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', flex: 1, minWidth: 220 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาด้วยรหัส (JKP…) หรือชื่อทรัพย์" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
        </div>
        {FILTER_DEFS.map((f) => {
          const val = filterVals[f.key];
          const on = openFilter === f.key;
          const set = val !== 'ทั้งหมด';
          const hot = set || on;
          return (
            <div key={f.key} style={{ position: 'relative' }}>
              <div
                onClick={() => { setOpenFilter(on ? null : f.key); setOpenMenu(null); }}
                style={chipStyle(hot)}
              >
                {set ? val : f.label}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={hot ? '#fff' : 'var(--muted2)'} strokeWidth="2.4" style={on ? { transform: 'rotate(180deg)', transition: 'transform .2s' } : { transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
              </div>
              {on && (
                <div onClick={stopP} style={{ position: 'absolute', top: 46, right: 0, zIndex: 40, width: 180, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 13, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 }}>
                  {f.opts.map((o) => (
                    <div key={o} onClick={() => { setFilterVals({ ...filterVals, [f.key]: o }); setOpenFilter(null); }} style={ddOption(val === o)}>
                      <span>{o}</span>
                      {val === o && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {openFilter !== null && (
          <div onClick={() => setOpenFilter(null)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />
        )}
      </div>

      {/* BULK BAR — only exists once something is ticked */}
      {sel.size > 0 && (
        <div id="prop-bulk" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--tint)', border: '1px solid rgba(3,73,86,.2)' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--accent)' }}>เลือกไว้ {sel.size} รายการ</span>
          <span style={{ flex: 1 }} />
          {busy && <span style={{ fontSize: 12, color: 'var(--muted)' }}>กำลัง{busy}…</span>}
          <button type="button" disabled={!!busy} onClick={() => void bulkStatus('active', 'เผยแพร่')} style={bulkBtn(false)}>เผยแพร่</button>
          <button type="button" disabled={!!busy} onClick={() => void bulkStatus('draft', 'พักเป็นร่าง')} style={bulkBtn(false)}>พักเป็นร่าง</button>
          <button type="button" disabled={!!busy} onClick={exportCsv} style={bulkBtn(false)}>Export ที่เลือก</button>
          <button type="button" disabled={!!busy} onClick={bulkDelete} style={bulkBtn(true)}>ลบ</button>
          <button type="button" onClick={() => setSel(new Set())} style={{ ...bulkBtn(false), border: 0, background: 'transparent' }}>ล้างการเลือก</button>
        </div>
      )}

      {/* TABLE */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }} className="a-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th style={{ ...thBase, width: 40 }}>
                  <Check
                    label="เลือกทรัพย์ทั้งหมดที่แสดงอยู่"
                    on={!!items?.length && sel.size === items.length}
                    mixed={sel.size > 0}
                    onChange={(v) => setSel(v ? new Set((items ?? []).map((r) => r.id)) : new Set())}
                  />
                </th>
                <th style={thBase}>รหัส / ทรัพย์</th>
                <th style={thBase}>ประเภท</th>
                <th style={thBase}>ทำเล</th>
                <th style={{ ...thBase, textAlign: 'right' }}>พื้นที่</th>
                <th style={{ ...thBase, textAlign: 'center' }}>สถานะ</th>
                <th style={{ ...thBase, textAlign: 'center' }}>แปล</th>
                <th style={thBase}>อัปเดต</th>
                <th style={{ padding: '13px 16px', width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((r) => {
                const menuOpen = openMenu === r.id;
                const ticked = sel.has(r.id);
                return (
                  <tr key={r.id} className="prop-row" style={{ borderTop: '1px solid var(--border)', transition: 'background .15s', background: ticked ? 'rgba(13,108,59,.04)' : undefined }}>
                    <td style={{ padding: '14px 16px' }}>
                      <Check
                        label={`เลือก ${r.publicCode}`}
                        on={ticked}
                        onChange={(v) => setSel((prev) => {
                          const next = new Set(prev);
                          if (v) next.add(r.id); else next.delete(r.id);
                          return next;
                        })}
                      />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--tint)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }} dangerouslySetInnerHTML={{ __html: iconFor(r.typeKey) }} />
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                          <code style={{ fontSize: '11.5px', color: '#0D6C3B', fontWeight: 700 }}>{r.publicCode}</code>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}><span style={{ height: 24, padding: '0 10px', borderRadius: 9999, background: 'var(--bg2,#F3F0EC)', border: '1px solid var(--border)', fontSize: '11.5px', fontWeight: 600, color: 'var(--text)', display: 'inline-flex', alignItems: 'center' }}>{r.typeLabel}</span></td>
                    <td style={{ padding: '14px 16px', fontSize: '12.5px', color: 'var(--muted)' }}>{r.location || '—'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12.5px', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{r.area !== null ? r.area.toLocaleString('th-TH') : '—'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{ height: 24, padding: '0 10px', borderRadius: 9999, fontSize: '11.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: r.status === 'active' ? 'rgba(13,108,59,.08)' : 'var(--bg2,#F3F0EC)', color: r.status === 'active' ? '#0D6C3B' : 'var(--muted2)' }}>
                        {r.status === 'active' ? 'เผยแพร่' : r.status === 'draft' ? 'ร่าง' : r.status === 'hidden' ? 'ซ่อน' : 'เก็บถาวร'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}><span style={{ fontSize: '11.5px', fontWeight: 700, color: '#9B968D' }}>—</span></td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--muted3)' }}>{relTime(r.updatedAt)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div
                        ref={(el) => { menuBtns.current[r.id] = el; }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (menuOpen) { setOpenMenu(null); return; }
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuBox(placeMenu(rect, { width: 210, align: 'right', maxHeight: 280 }));
                          setOpenMenu(r.id);
                          setOpenFilter(null);
                        }}
                        className="prop-menu-btn"
                        aria-label={`เมนูของ ${r.publicCode}`}
                        style={{ width: 30, height: 30, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)', cursor: 'pointer', ...(menuOpen ? { background: 'var(--border)' } : {}) }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></svg>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items !== null && items.length === 0 && (
                <tr style={{ borderTop: '1px solid var(--border)' }}>
                  <td colSpan={9} style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted3)' }}>ไม่พบทรัพย์ตามเงื่อนไขที่เลือก</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', rowGap: 10 }}>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>แสดง {items?.length ?? 0} จาก {summary?.total ?? 0} ทรัพย์</div>
          {/* The buttons here read 1 · 2 · 3 · … whatever the data was — three
              pages offered above a list of three items on a single page. The
              API returns everything it has, so there is nothing to page
              through; the count is stated instead of faked. */}
          {(summary?.total ?? 0) > (items?.length ?? 0) && (
            <div style={{ fontSize: '12.5px', color: 'var(--muted3)' }}>
              แสดงได้สูงสุด {items?.length ?? 0} รายการต่อครั้ง — ใช้ตัวกรองด้านบนเพื่อแคบผลลัพธ์
            </div>
          )}
        </div>
      </div>

      {/* ROW MENU — rendered here, outside the table card. Inside it the card's
          `overflow: hidden` and the horizontal scroller cut the last items off,
          which is why "ลบทรัพย์" was unreachable on every row. */}
      {openMenu !== null && menuBox !== null && (() => {
        const r = (items ?? []).find((p) => p.id === openMenu);
        if (!r) return null;
        return (
          <>
            <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 890 }} />
            <div
              id="prop-row-menu"
              onClick={stopP}
              style={{ position: 'fixed', top: menuBox.top, left: menuBox.left, width: menuBox.width, maxHeight: menuBox.maxHeight, overflowY: 'auto', zIndex: 900, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 20px 44px rgba(0,0,0,.18)', padding: 7, textAlign: 'left' }}
            >
              {ROW_MENU.map((mi, mIdx) => {
                if (mi.divider) return <div key={mIdx} style={{ height: 1, background: 'var(--border)', margin: '6px 4px' }} />;
                if (mi.danger) {
                  return (
                    <a key={mIdx} href="#" onClick={(e) => { e.preventDefault(); setOpenMenu(null); void remove(r); }} style={menuItemStyle(true)}>
                      <span style={{ display: 'flex', width: 16, height: 16, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: mi.icon }} />
                      {mi.label}
                    </a>
                  );
                }
                if (mi.label === 'ทำสำเนา') {
                  return (
                    <a key={mIdx} href="#" onClick={(e) => { e.preventDefault(); setOpenMenu(null); void duplicate(r); }} style={menuItemStyle(false)}>
                      <span style={{ display: 'flex', width: 16, height: 16, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: mi.icon }} />
                      {mi.label}
                    </a>
                  );
                }
                const href = mi.href === '#' ? '#' : `${mi.href}?code=${encodeURIComponent(r.publicCode)}`;
                return (
                  <a key={mIdx} href={href} style={menuItemStyle(false)}>
                    <span style={{ display: 'flex', width: 16, height: 16, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: mi.icon }} />
                    {mi.label}
                  </a>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* NEW PROPERTY MODAL — centered popup (matches Listings "สร้างประกาศใหม่") */}
      {newOpen && (
        <div id="np-overlay" onClick={() => setNewOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div id="np-modal" onClick={stopP} style={{ width: '100%', maxWidth: 640, maxHeight: '88vh', zIndex: 801, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>เพิ่มทรัพย์ใหม่</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)' }}>public_code จะถูกสร้างอัตโนมัติหลังเลือกจังหวัด</div>
              </div>
              <div onClick={() => setNewOpen(false)} style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg></div>
            </div>

            {/* completeness bar */}
            <div style={{ padding: '14px 24px 0', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)' }}>ความสมบูรณ์ของข้อมูล</span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0D6C3B', fontFamily: "'JetBrains Mono',monospace" }}>{COMPLETE_PCT}</span>
              </div>
              <div style={{ height: 6, borderRadius: 9999, background: 'var(--bg)', overflow: 'hidden' }}><div style={{ height: '100%', width: COMPLETE_PCT, background: 'linear-gradient(90deg,#0D6C3B,#2DFB91)', borderRadius: 9999, transition: 'width .4s' }} /></div>
            </div>

            <div style={{ padding: '14px 24px 0', display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', background: 'var(--surface)', overflowX: 'auto' }} className="a-scroll">
              {TAB_DEFS.map((t) => (
                <div key={t.key} onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>
                  {t.label}
                  {t.done && <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#0D6C3B' }} />}
                </div>
              ))}
            </div>

            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg)' }}>
              {/* TAB: รายละเอียดทรัพย์ — schema-driven per property type */}
              {tab === 'main' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* property-type selector — drives which field form is loaded */}
                  <div>
                    <label style={fieldLabel}>ประเภททรัพย์ *</label>
                    <div id="np-type-picker" style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {types.map((pt) => {
                        const on = selType === pt.key;
                        return (
                          <button type="button" key={pt.key} onClick={() => setSelType(pt.key)} aria-pressed={on} style={{ flex: '1 1 auto', minWidth: 120, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)' }}>
                            <span style={{ display: 'flex', width: 16, height: 16 }} dangerouslySetInnerHTML={{ __html: pt.icon }} />
                            {pt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* auto-code hint */}
                  <div style={{ background: 'var(--tint)', border: '1px dashed rgba(3,73,86,.3)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                    <span style={{ fontSize: '12.5px', color: 'var(--accent)' }}>รหัสตัวอย่าง: <code style={{ fontWeight: 700 }}>JKP-SPK0043</code> — ระบบสร้างให้อัตโนมัติเมื่อบันทึก</span>
                  </div>

                  <div><label style={fieldLabel}>ชื่อทรัพย์ (ไทย) *</label><input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="เช่น บ้านเดี่ยว 2 ชั้น หมู่บ้านเดอะแกรนด์" style={drawerInput} /></div>

                  {/* schema-driven fields for the selected type */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>รายละเอียด: {PROPERTY_TYPES.find((p) => p.key === selType)?.label}</div>
                      <Link href="/admin/field-builder" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>ปรับฟิลด์ที่ Field Builder →</Link>
                    </div>
                    <DynamicFieldForm typeKey={selType} onValuesChange={(v) => { newVals.current = v; }} />
                  </div>
                </div>
              )}

              {/* TAB: Translations */}
              {tab === 'trans' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {TRANS_LANGS.map((l) => (
                    <div key={l.code} style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span dangerouslySetInnerHTML={{ __html: l.flag }} style={{ width: 22, height: 22, borderRadius: 5, overflow: 'hidden', display: 'flex' }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{l.name}</span>
                        </div>
                        <span style={badgeYet}>{l.badge}</span>
                      </div>
                      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div><label style={fieldLabel}>ชื่อทรัพย์ ({l.code})</label><input defaultValue={l.title} placeholder={l.titlePh} style={{ marginTop: 6, width: '100%', height: 42, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', outline: 'none' }} /></div>
                        <div><label style={fieldLabel}>คำอธิบาย ({l.code})</label><textarea placeholder={l.descPh} style={{ marginTop: 6, width: '100%', height: 64, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', outline: 'none', resize: 'none', fontFamily: 'inherit' }} /></div>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 11, background: 'var(--tint)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" style={{ flexShrink: 0 }}><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" /></svg>
                    <span style={{ fontSize: 12, color: 'var(--accent)' }}>ปุ่ม &quot;แปลอัตโนมัติ&quot; ช่วยร่างจากภาษาไทย แล้วให้ทีมตรวจก่อนเผยแพร่</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {saveError && <span role="alert" style={{ fontSize: 12.5, color: '#C0392B', marginRight: 'auto' }}>{saveError}</span>}
              <div onClick={() => setNewOpen(false)} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div onClick={saveNew} style={{ height: 44, padding: '0 26px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'กำลังบันทึก…' : 'บันทึกร่าง'}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
