'use client';

import * as React from 'react';
import { TablePager, pageSlice, pageCountOf } from './TablePager';
import { InventoryFilters, EMPTY_FILTERS, matchesFilters, sortInventory, type InventoryFilterState, type InventoryRow } from './InventoryFilters';
import { thumb } from '@/lib/mediaThumb';
import { apiGet, apiPost, apiPatch, apiDelete, ApiClientError } from '@/lib/apiClient';
import { propertyType } from '@/lib/propertySchema';
import { placeMenu, type MenuBox } from '@/lib/menuPlacement';
import { relTime } from '@/lib/leadStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PicCell, PIC_TH } from './PicCell';
import { useMe } from '@/lib/useMe';
import { buildPropertyCsv } from '@/lib/propertyExportCsv';

/* ============================================================
   AdminListings.dc.html — ported <main> content (interactive):
   status tabs, filter/search bar, row selection + select-all with
   a bulk action bar, the listings table with per-row action menus,
   pagination, and the "สร้างประกาศ" create modal.
   The topbar right cluster (Export dropdown + "สร้างประกาศ" button)
   is rendered in AdminShell's header via <ListingsActions>; the
   create button shares its open-state with this body through
   ListingsCtx, so page.tsx can keep rendering <AdminShell> as the
   brief requires.
   ============================================================ */

/* Export sits in the topbar and the rows sit in the body, so the body hands
   its handler up through here — the same arrangement the Properties screen uses. */
type CreateCtx = {
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  exportCsv: () => void;
  registerExport: (fn: () => void) => void;
};
const ListingsCtx = React.createContext<CreateCtx | null>(null);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const exportRef = React.useRef<() => void>(() => {});
  const value = React.useMemo<CreateCtx>(() => ({
    createOpen,
    setCreateOpen,
    exportCsv: () => exportRef.current(),
    registerExport: (fn: () => void) => { exportRef.current = fn; },
  }), [createOpen]);
  return <ListingsCtx.Provider value={value}>{children}</ListingsCtx.Provider>;
}

function useCreate(): CreateCtx {
  const ctx = React.useContext(ListingsCtx);
  if (!ctx) throw new Error('ListingsProvider is missing');
  return ctx;
}

type DealK = 'rent' | 'sale' | 'both';
type StatusK = 'published' | 'review' | 'draft' | 'hidden' | 'unavailable';
type CreateStatusK = 'draft' | 'published';

export type Row = {
  id: string;
  title: string;
  code: string;
  typeKey: string;
  area: number | null;
  location: string;
  deal: string;
  dealK: DealK;
  price: string;
  status: StatusK;
  featured: boolean;
  updated: string;
  /* ช่องสำหรับเมนูค้นหาชุดร่วม */
  zoning: string;
  dealLabel: string;
  sizeSqm: number | null;
  priceValue: number | null;
  available: boolean;
  pic: string;
  /** ทรัพย์กลาง — ทุกคนในทีมเห็นเบอร์ผู้ให้เช่าได้ (ข้อรวม ข) */
  contactShared?: boolean;
  img: string | null;
  /** รูปทั้งหมดของทรัพย์ — หน้า Social Status รวมเป็นไฟล์เดียวให้โหลด (สไลด์ 35) */
  photos?: string[];
};

/* `act` is what the item does; `href` is where it goes. Every item used to
   carry href="#" — four of the six did nothing at all when clicked. */
type MenuAct = 'publish' | 'unpublish' | 'feature' | 'duplicate' | 'delete';
type MenuItem =
  | { divider: true }
  | { divider: false; label: string; href?: string; act?: MenuAct; icon: React.ReactNode; danger?: boolean };

const badgeStyle = (bg: string, fg: string): React.CSSProperties => ({
  height: 24, padding: '0 11px', borderRadius: 9999, background: bg, color: fg,
  fontSize: '11.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5,
});
const dealBadgeStyle = (bg: string, fg: string): React.CSSProperties => ({
  height: 22, padding: '0 10px', borderRadius: 9999, background: bg, color: fg,
  fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center',
});
const checkStyle = (on: boolean): React.CSSProperties => ({
  width: 16, height: 16, borderRadius: 5, border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
  background: on ? '#0D6C3B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
});
const tabStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 15px', borderRadius: 9999,
  fontSize: 13, fontWeight: active ? 700 : 600, cursor: 'pointer',
  background: active ? '#273c33' : 'var(--surface)', color: active ? '#fff' : 'var(--muted)',
  border: '1px solid ' + (active ? '#273c33' : 'var(--border)'),
});
const tabCountStyle = (active: boolean, danger: boolean): React.CSSProperties => ({
  height: 19, minWidth: 19, padding: '0 6px', borderRadius: 9999,
  background: active ? 'rgba(255,255,255,.18)' : 'var(--bg)',
  color: active ? '#fff' : (danger ? '#C0392B' : 'var(--muted2)'),
  fontSize: '10.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
});
const pillStyle = (on: boolean): React.CSSProperties => ({
  flex: 1, height: 42, borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
  background: on ? '#0D6C3B' : 'transparent', color: on ? '#fff' : 'var(--text)',
});
const propOptStyle = (on: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 12, cursor: 'pointer',
  border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
  background: on ? 'rgba(13,108,59,.05)' : 'var(--surface)',
});
const thStyle: React.CSSProperties = {
  padding: '13px 16px', fontSize: 11, fontWeight: 700, color: 'var(--muted2)',
  textTransform: 'uppercase', letterSpacing: '.04em',
};
const miBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9,
  fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text)',
};

const menuIcon = (paths: React.ReactNode, color: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);

/* Nine invented listings used to live here and were shown whenever the API
   returned nothing — with the Social Status page importing the same list. The
   screen now shows what the org actually has, or says it has none. */
export type ApiListing = Omit<Row, 'updated'> & { updatedAt: number };
export const fetchListings = () => apiGet<{ items: ApiListing[] }>('/api/listings');

const STATUS_MAP: Record<StatusK, React.CSSProperties> = {
  published: badgeStyle('#E8F3EC', '#0D6C3B'),
  review: badgeStyle('#FBF3E1', '#9A741C'),
  draft: badgeStyle('#F0EEE9', '#7A7974'),
  hidden: badgeStyle('#EDEBE6', '#5F5A52'),
  unavailable: badgeStyle('#F9E4E1', '#C0392B'),
};
const STATUS_LABEL: Record<StatusK, string> = { published: 'เผยแพร่', review: 'รอตรวจ', draft: 'ร่าง', hidden: 'ซ่อน', unavailable: 'ไม่ว่าง' };
const DEAL_MAP: Record<DealK, React.CSSProperties> = {
  rent: dealBadgeStyle('#EEF4F3', '#034956'),
  sale: dealBadgeStyle('#E8F3EC', '#0D6C3B'),
  both: dealBadgeStyle('#273c33', '#fff'),
};

/* Each property type spells its deal field differently ("เช่า / ขาย" on a
   warehouse, "ขายและปล่อยเช่า" on the generic set) and the stored string is
   the enum key the rest of the site matches on — so take the wording from the
   type's own schema rather than writing our own. */
const dealValue = (typeKey: string, deal: DealK): string => {
  const opts = propertyType(typeKey).fields.find((f) => f.key === 'deal_type')?.options ?? [];
  const wantRent = deal !== 'sale';
  const wantSale = deal !== 'rent';
  const hit = opts.find((o) => o.includes('เช่า') === wantRent && o.includes('ขาย') === wantSale);
  return hit ?? (deal === 'rent' ? 'เช่า' : deal === 'sale' ? 'ขาย' : 'เช่า / ขาย');
};

const rowMenu = (d: Row): MenuItem[] => {
  const code = encodeURIComponent(d.code);
  const list: MenuItem[] = [
    // the code was never passed, so both links opened whatever record the page defaulted to
    { divider: false, label: 'ดูรายละเอียด', href: `/admin/property-view?code=${code}`, icon: menuIcon(<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>, '#034956') },
    { divider: false, label: 'แก้ไขประกาศ', href: `/admin/property-edit?code=${code}`, icon: menuIcon(<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />, '#034956') },
  ];
  if (d.status === 'published') list.push({ divider: false, label: 'ยกเลิกเผยแพร่', act: 'unpublish', icon: menuIcon(<path d="M18.4 18.4A9.9 9.9 0 0112 20c-7 0-10-8-10-8a18 18 0 015-6M1 1l22 22M9.9 4.2A9.9 9.9 0 0112 4c7 0 10 8 10 8a18 18 0 01-2.2 3.2" />, '#9A741C') });
  else list.push({ divider: false, label: 'เผยแพร่', act: 'publish', icon: menuIcon(<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />, '#0D6C3B') });
  list.push({ divider: false, label: d.featured ? 'เอาออกจากแนะนำ' : 'ตั้งเป็นแนะนำ', act: 'feature', icon: menuIcon(<path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z" />, '#D9A62B') });
  list.push({ divider: false, label: 'ทำสำเนา', act: 'duplicate', icon: menuIcon(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>, '#034956') });
  list.push({ divider: true });
  list.push({ divider: false, label: 'ลบประกาศ', act: 'delete', icon: menuIcon(<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />, '#C0392B'), danger: true });
  return list;
};

/* The counts read 2,956 · 2,410 · 48 · 372 · 96 · 30 whatever was in the
   table below them — the org has three properties. They are counted now. */
const STATUS_TABS: { key: 'all' | StatusK; label: string; danger: boolean }[] = [
  { key: 'all', label: 'ทั้งหมด', danger: false },
  { key: 'published', label: 'เผยแพร่', danger: false },
  { key: 'review', label: 'รอตรวจ', danger: false },
  { key: 'draft', label: 'ร่าง', danger: false },
  { key: 'hidden', label: 'ซ่อน', danger: false },
  { key: 'unavailable', label: 'ไม่ว่าง', danger: true },
];


const DEAL_OPTS: [DealK, string][] = [['rent', 'ให้เช่า'], ['sale', 'ขาย'], ['both', 'ทั้งสอง']];
const STATUS_OPTS: [CreateStatusK, string][] = [['draft', 'บันทึกร่าง'], ['published', 'เผยแพร่ทันที']];

/* ---- topbar right cluster: Export + create trigger ---- */
export function ListingsActions() {
  const { setCreateOpen, exportCsv } = useCreate();
  return (
    <div id="lst-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* The dropdown behind this offered "Excel (.xlsx)" and "CSV (Google
          Sheets)"; neither had a handler and nothing here can write an .xlsx.
          One button, one file, and the BOM makes Excel read the Thai. */}
      <div id="lst-export" onClick={exportCsv} title="ไฟล์ CSV เปิดใน Excel และ Google Sheets ได้" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>Export CSV
      </div>
      <div onClick={() => setCreateOpen(true)} className="admin-primary-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>สร้างประกาศ
      </div>
    </div>
  );
}

/* ---- main content ---- */
export function ListingsAdminBody() {
  const { createOpen, setCreateOpen, registerExport } = useCreate();
  const router = useRouter();
  const [sel, setSel] = React.useState<Record<string, boolean>>({});
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  /* the menu is fixed-positioned and rendered outside the table: inside it,
     the card's `overflow: hidden` cut off everything below "แก้ไขประกาศ" */
  const [menuBox, setMenuBox] = React.useState<MenuBox | null>(null);
  const menuBtns = React.useRef<Record<string, HTMLElement | null>>({});
  React.useEffect(() => {
    if (!openMenu) return;
    const follow = () => {
      const r = menuBtns.current[openMenu]?.getBoundingClientRect();
      setMenuBox(r ? placeMenu(r, { width: 210, align: 'right', maxHeight: 320 }) : null);
    };
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
  }, [openMenu]);
  /* create modal — the picker used to offer three hardcoded properties and
     the Save button was a link to an empty edit page */
  const [cCode, setCCode] = React.useState('');
  const [cQuery, setCQuery] = React.useState('');
  const [cDeal, setCDeal] = React.useState<DealK>('rent');
  const [cRent, setCRent] = React.useState('');
  const [cSale, setCSale] = React.useState('');
  const [cStatus, setCStatus] = React.useState<CreateStatusK>('draft');
  const [cSaving, setCSaving] = React.useState(false);
  const [cErr, setCErr] = React.useState('');

  /* ---- live rows: GET /api/listings. There is no demo fallback any more —
     an empty org shows an empty table, because a bulk Publish over invented
     rows would have gone looking for listing codes that do not exist. ---- */
  const [rows, setRows] = React.useState<Row[] | null>(null);
  /* ข้อรวม ข · "เห็นได้แค่เจ้าของ" — คนอื่นเปิดปิดไม่ได้อยู่แล้ว (กันที่ API) */
  const me = useMe();
  const isOwner = me?.role === 'owner';
  const [loadErr, setLoadErr] = React.useState('');
  const reload = React.useCallback(async () => {
    try {
      const r = await fetchListings();
      setRows(r.items.map((it) => ({ ...it, updated: relTime(it.updatedAt) })));
      setLoadErr('');
    } catch (e) {
      setRows((prev) => prev ?? []);
      setLoadErr(e instanceof ApiClientError ? e.message : 'โหลดรายการประกาศไม่สำเร็จ');
    }
  }, []);
  React.useEffect(() => { void reload(); }, [reload]);

  // ---- filters (status tabs + search + dropdowns) ----
  const [statusFilter, setStatusFilter] = React.useState<'all' | StatusK>('all');
  const [page, setPage] = React.useState(1);
  /* เมนูค้นหาชุดเดียวกับ Property และ Social Status (สไลด์ 22) */
  const [inv, setInv] = React.useState<InventoryFilterState>(EMPTY_FILTERS);

  const all = rows ?? [];
  // ชื่อผู้ดูแลที่มีอยู่จริงในรายการนี้ ไม่ใช่รายชื่อพนักงานทั้งบริษัท
  const picOptions = Array.from(new Set(all.map((d) => d.pic).filter(Boolean))).sort();
  const view = (d: Row): InventoryRow => ({
    code: d.code, title: d.title, typeKey: d.typeKey, province: d.location,
    zoning: d.zoning, deal: d.dealLabel, size: d.sizeSqm, price: d.priceValue,
    available: d.available, pic: d.pic ?? '',
  });
  const filtered = sortInventory(
    all.filter((d) => (statusFilter === 'all' || d.status === statusFilter) && matchesFilters(view(d), inv)).map((d) => ({ ...d, ...view(d) })),
    inv.sort,
  ).map((d) => all.find((r) => r.code === d.code)!);

  const selCount = Object.values(sel).filter(Boolean).length;
  /* เปลี่ยนตัวกรองหรือแท็บสถานะแล้วกลับหน้าแรก ไม่งั้นค้างอยู่หน้าที่ไม่มีของ */
  React.useEffect(() => { setPage(1); }, [inv, statusFilter]);
  const pageCount = pageCountOf(filtered.length);
  React.useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const rowsOnPage = pageSlice(filtered, page);

  const allChecked = rowsOnPage.length > 0 && rowsOnPage.every((d) => sel[d.id]);
  const anyMenuOpen = openMenu !== null;
  const statusCount = (k: 'all' | StatusK) => (k === 'all' ? all.length : all.filter((d) => d.status === k).length);

  const toggleAll = () => {
    if (allChecked) { setSel({}); }
    else { const s: Record<string, boolean> = { ...sel }; rowsOnPage.forEach((d) => { s[d.id] = true; }); setSel(s); }
  };

  /* ---- actions ----------------------------------------------------------
     Publish goes through PATCH /api/listings/:code, which holds the publish
     gate (title + at least one photo) and the 'publish' privilege. Rows are
     sent one at a time so a rejection names the listing it belongs to
     instead of failing the whole batch anonymously. */
  const [busy, setBusy] = React.useState('');
  const setStatus = (code: string, status: 'published' | 'hidden') =>
    apiPatch(`/api/listings/${encodeURIComponent(code)}`, { status });

  const runBulk = async (label: string, status: 'published' | 'hidden') => {
    const picked = filtered.filter((d) => sel[d.id]);
    if (!picked.length || busy) return;
    setBusy(label);
    const failed: string[] = [];
    for (const d of picked) {
      try { await setStatus(d.code, status); }
      catch (e) { failed.push(`${d.code} (${e instanceof ApiClientError ? e.message : 'ไม่สำเร็จ'})`); }
    }
    setBusy('');
    setSel({});
    await reload();
    if (failed.length) window.alert(`${label}: สำเร็จ ${picked.length - failed.length} · ไม่สำเร็จ ${failed.length}\n${failed.join('\n')}`);
  };

  const rowAct = async (d: Row, act: MenuAct) => {
    setOpenMenu(null);
    try {
      if (act === 'publish') await setStatus(d.code, 'published');
      else if (act === 'unpublish') await setStatus(d.code, 'hidden');
      else if (act === 'feature') {
        /* "แนะนำ" lives inside the property's values, and PATCH replaces that
           object wholesale — read it back first or the edit erases the record. */
        const full = await apiGet<{ values: Record<string, unknown> }>(`/api/properties/${d.id}`);
        await apiPatch(`/api/properties/${d.id}`, { values: { ...full.values, featured: !d.featured } });
      } else if (act === 'duplicate') {
        const full = await apiGet<{ typeKey: string; title: string; values: Record<string, unknown> }>(`/api/properties/${d.id}`);
        await apiPost('/api/properties', { typeKey: full.typeKey, title: `${full.title} (สำเนา)`.slice(0, 300), values: full.values, status: 'draft' });
      } else if (act === 'delete') {
        // v1 has one listing per property, so this really does remove the record
        if (!window.confirm(`ลบ ${d.code} · ${d.title}?\n\nประกาศนี้ผูกกับทรัพย์โดยตรง การลบจะลบทรัพย์ออกจากระบบด้วย`)) return;
        await apiDelete(`/api/properties/${d.id}`);
      }
      await reload();
    } catch (e) {
      window.alert(e instanceof ApiClientError ? e.message : 'ทำรายการไม่สำเร็จ');
    }
  };

  /* Export was a dropdown with two dead entries. CSV of what the filters are
     showing, BOM first so Excel on Windows reads the Thai. */
  const exportCsv = async () => {
    /* rows === null คือยังโหลดไม่เสร็จ ไม่ใช่ "ไม่มีประกาศ" — กด Export ทันทีที่
       เปิดหน้าเคยได้กล่องบอกว่าไม่มีอะไรให้ export ทั้งที่ของกำลังมา */
    if (rows === null) { window.alert('กำลังโหลดรายการอยู่ — รอสักครู่แล้วกดใหม่'); return; }
    if (!filtered.length) { window.alert('ไม่มีประกาศให้ export ตามเงื่อนไขที่เลือก'); return; }

    /* หน้านี้ไม่ได้โหลด values มาด้วย (จะหนักโดยใช่เหตุ เพราะตารางไม่ได้ใช้)
       ตอนกด Export จึงไปดึงของเต็มมาทีเดียว แล้วจับคู่ด้วยรหัสทรัพย์ */
    type FullRow = { publicCode: string; updatedAt?: number; available?: boolean; values?: Record<string, unknown>; i18n?: Record<string, { title?: string; description?: string } | undefined> };
    let full: Record<string, FullRow> = {};
    try {
      const r = await apiGet<{ items: FullRow[] }>('/api/properties');
      full = Object.fromEntries((r.items ?? []).map((p) => [p.publicCode, p]));
    } catch (e) {
      window.alert(e instanceof ApiClientError ? e.message : 'ดึงข้อมูลเต็มไม่สำเร็จ');
      return;
    }

    const csv = buildPropertyCsv(filtered.map((d) => {
      const p = full[d.code];
      return {
        code: d.code,
        title: d.title,
        typeLabel: propertyType(d.typeKey).label,
        status: STATUS_LABEL[d.status],
        location: d.location,
        updatedAt: p?.updatedAt ?? null,
        available: p?.available ?? d.available,
        values: (p?.values ?? {}) as Record<string, unknown>,
        i18n: p?.i18n,
      };
    }), window.location.origin);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `listings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  React.useEffect(() => { registerExport(() => { void exportCsv(); }); });

  /* ---- create modal ---- */
  const createChoices = all.filter((p) => {
    const q = cQuery.trim().toLowerCase();
    return !q || [p.title, p.code, p.location].some((f) => f.toLowerCase().includes(q));
  });
  const cur = all.find((p) => p.code === cCode) ?? createChoices[0] ?? null;
  const isWh = cur?.typeKey === 'warehouse';
  const showRent = cDeal === 'rent' || cDeal === 'both';
  const showSale = cDeal === 'sale' || cDeal === 'both';
  const dest: string[] = [];
  if (showRent) dest.push(isWh ? 'โกดังให้เช่า' : 'โรงงานให้เช่า');
  if (showSale) dest.push(isWh ? 'โกดังสำหรับขาย' : 'โรงงานสำหรับขาย');
  dest.push('อสังหาริมทรัพย์ทั้งหมด');

  const saveListing = async () => {
    if (cSaving) return;
    if (!cur) { setCErr('เลือกทรัพย์ก่อน'); return; }
    const money = (s: string) => {
      const n = Number(s.replace(/[,\s฿]/g, ''));
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    const rent = money(cRent);
    const sale = money(cSale);
    if (showRent && cRent.trim() && rent === null) { setCErr('ราคาเช่าต้องเป็นตัวเลข'); return; }
    if (showSale && cSale.trim() && sale === null) { setCErr('ราคาขายต้องเป็นตัวเลข'); return; }

    setCSaving(true);
    setCErr('');
    try {
      const full = await apiGet<{ values: Record<string, unknown> }>(`/api/properties/${cur.id}`);
      const values: Record<string, unknown> = {
        ...full.values,
        deal_type: dealValue(cur.typeKey, cDeal),
        ...(showRent && rent !== null ? { price_rent: rent } : {}),
        ...(showSale && sale !== null ? { price_sale: sale } : {}),
      };
      await apiPatch(`/api/properties/${cur.id}`, { values });
      /* Publishing goes through the listings route so the same gate applies
         here as everywhere else — a photoless record is refused, with the
         deal and price already saved. */
      if (cStatus === 'published') await setStatus(cur.code, 'published');
      setCreateOpen(false);
      router.push(`/admin/property-edit?code=${encodeURIComponent(cur.code)}`);
    } catch (e) {
      setCErr(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setCSaving(false);
    }
  };

  return (
    <>
      {/* CREATE MODAL */}
      {createOpen && (
        <div onClick={() => setCreateOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>สร้างประกาศใหม่</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)' }}>เลือกทรัพย์ที่มีอยู่ → ตั้งดีลและราคา</div>
              </div>
              <div onClick={() => setCreateOpen(false)} style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </div>
            </div>
            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>1. เลือกทรัพย์ *</label>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px', borderRadius: 11, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                <input value={cQuery} onChange={(e) => setCQuery(e.target.value)} placeholder="ค้นด้วยรหัส JKP หรือชื่อทรัพย์" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
              </div>
              <div id="lst-create-props" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }} className="a-scroll">
                {createChoices.length === 0 && (
                  <div style={{ padding: '18px 12px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted3)', lineHeight: 1.7 }}>
                    {all.length === 0 ? <>ยังไม่มีทรัพย์ในระบบ — <Link href="/admin/properties" style={{ color: '#0D6C3B', fontWeight: 700 }}>เพิ่มทรัพย์ก่อน</Link></> : 'ไม่พบทรัพย์ที่ตรงกับคำค้น'}
                  </div>
                )}
                {createChoices.map((p) => {
                  const pon = cCode === p.code;
                  return (
                    <div key={p.code} onClick={() => setCCode(p.code)} style={propOptStyle(pon)}>
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                        <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#0D6C3B', fontWeight: 700 }}>{p.code}</code>
                        {p.area !== null && <span style={{ fontSize: 11, color: 'var(--muted3)' }}> · {p.area.toLocaleString('th-TH')} ตร.ม.</span>}
                      </div>
                      {pon && (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>)}
                    </div>
                  );
                })}
              </div>
              <label style={{ display: 'block', marginTop: 20, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>2. ประเภทดีล *</label>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                {DEAL_OPTS.map(([k, label]) => (
                  <div key={k} onClick={() => setCDeal(k)} style={pillStyle(cDeal === k)}>{label}</div>
                ))}
              </div>
              <div id="lst-create-grid" style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {showRent && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ราคาเช่า (บาท/เดือน)</label>
                    <input id="lc-rent" value={cRent} onChange={(e) => setCRent(e.target.value)} inputMode="numeric" placeholder="0" style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--surface)', outline: 'none' }} />
                  </div>
                )}
                {showSale && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ราคาขาย (บาท)</label>
                    <input id="lc-sale" value={cSale} onChange={(e) => setCSale(e.target.value)} inputMode="numeric" placeholder="0" style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--surface)', outline: 'none' }} />
                  </div>
                )}
              </div>
              <label style={{ display: 'block', marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>3. สถานะเริ่มต้น</label>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                {STATUS_OPTS.map(([k, label]) => (
                  <div key={k} onClick={() => setCStatus(k)} style={pillStyle(cStatus === k)}>{label}</div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#043F20,#022310)', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="1.9" style={{ flexShrink: 0, marginTop: 1 }}><path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /></svg>
                <div>
                  <div style={{ fontSize: '11.5px', color: '#8FE6B6', fontWeight: 700 }}>ประกาศนี้จะไปแสดงบนหน้าเว็บ</div>
                  <div style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {dest.map((dp) => (
                      <span key={dp} style={{ height: 24, padding: '0 11px', borderRadius: 9999, background: 'rgba(45,251,145,.14)', border: '1px solid rgba(45,251,145,.3)', color: '#2DFB91', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>{dp}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div id="lc-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {cErr && <span role="alert" id="lc-error" style={{ marginRight: 'auto', fontSize: '12.5px', color: '#C0392B', fontWeight: 600 }}>{cErr}</span>}
              <div onClick={() => setCreateOpen(false)} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap' }}>ยกเลิก</div>
              {/* was a plain link to /admin/property-edit with no record — it
                  opened a blank editor and nothing had been created */}
              <div id="lc-save" onClick={() => void saveListing()} style={{ height: 44, padding: '0 26px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: '13.5px', fontWeight: 700, whiteSpace: 'nowrap', cursor: cSaving ? 'default' : 'pointer', opacity: cSaving ? .7 : 1 }}>
                {cSaving ? 'กำลังบันทึก…' : 'บันทึกและแก้ไขต่อ'}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROW MENU — outside the table card, which clips anything inside it */}
      {anyMenuOpen && menuBox && (() => {
        const d = filtered.find((r) => r.id === openMenu);
        if (!d) return null;
        return (
          <>
            <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 890 }} />
            <div
              id="lst-row-menu"
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'fixed', top: menuBox.top, left: menuBox.left, width: menuBox.width, maxHeight: menuBox.maxHeight, overflowY: 'auto', zIndex: 900, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 20px 44px rgba(0,0,0,.18)', padding: 7, textAlign: 'left' }}
            >
              {rowMenu(d).map((mItem, mi2) => {
                if (mItem.divider) return <div key={'div' + mi2} style={{ height: 1, background: 'var(--border)', margin: '6px 4px' }} />;
                const style = mItem.danger ? { ...miBase, color: '#C0392B' } : miBase;
                if (mItem.href) {
                  return (
                    <a key={mItem.label} href={mItem.href} style={style}>
                      <span style={{ display: 'flex', width: 16, height: 16, flexShrink: 0 }}>{mItem.icon}</span>{mItem.label}
                    </a>
                  );
                }
                return (
                  <div key={mItem.label} onClick={() => void rowAct(d, mItem.act!)} style={style}>
                    <span style={{ display: 'flex', width: 16, height: 16, flexShrink: 0 }}>{mItem.icon}</span>{mItem.label}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
      {/* STATUS TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_TABS.map((t) => {
          const active = statusFilter === t.key;
          return (
            <div key={t.key} onClick={() => setStatusFilter(t.key)} style={tabStyle(active)}>{t.label}<span style={tabCountStyle(active, t.danger)}>{statusCount(t.key)}</span></div>
          );
        })}
      </div>

      {/* เมนูค้นหาชุดเดียวกับ Property และ Social Status */}
      <InventoryFilters value={inv} onChange={setInv} picOptions={picOptions} />

      {/* BULK BAR */}
      {selCount > 0 && (
        <div style={{ background: '#04140C', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', rowGap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 13, fontWeight: 600 }}><span style={{ height: 24, minWidth: 24, padding: '0 8px', borderRadius: 9999, background: '#2DFB91', color: '#04140C', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{String(selCount)}</span>เลือกแล้ว</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {busy && <span style={{ display: 'flex', alignItems: 'center', color: '#8FE6B6', fontSize: '12.5px', fontWeight: 700 }}>กำลัง{busy}…</span>}
            <div onClick={() => setSel({})} style={{ height: 36, padding: '0 16px', borderRadius: 9999, border: '1px solid rgba(255,255,255,.24)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>ยกเลิก</div>
            <div id="lst-bulk-unpublish" onClick={() => void runBulk('ยกเลิกเผยแพร่', 'hidden')} style={{ height: 36, padding: '0 16px', borderRadius: 9999, background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: busy ? 'default' : 'pointer', opacity: busy ? .6 : 1 }}>Unpublish</div>
            <div id="lst-bulk-publish" onClick={() => void runBulk('เผยแพร่', 'published')} style={{ height: 36, padding: '0 16px', borderRadius: 9999, background: '#2DFB91', color: '#04140C', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: busy ? 'default' : 'pointer', opacity: busy ? .6 : 1 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#04140C" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>Publish ทั้งหมด</div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div className="a-scroll" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th style={{ padding: '13px 16px', width: 40 }}>
                  <div onClick={toggleAll} style={checkStyle(allChecked)}>
                    {allChecked && (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>)}
                  </div>
                </th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Listing</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>ดีล</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>ราคา</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>สถานะ</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Featured</th>
                {/* ตัวกรอง PIC มีมาตลอด แต่ไม่เคยมีคอลัมน์ให้เห็นว่าใครดูแล */}
                <th style={{ ...thStyle, textAlign: 'left', whiteSpace: 'nowrap' }}>{PIC_TH}</th>
                {isOwner && <th style={{ ...thStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>ทรัพย์กลาง</th>}
                <th style={{ ...thStyle, textAlign: 'left' }}>อัปเดต</th>
                <th style={{ padding: '13px 16px', width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {rowsOnPage.map((d) => {
                const on = !!sel[d.id];
                const mOpen = openMenu === d.id;
                return (
                  <tr key={d.id} className="lst-row" style={{ borderTop: '1px solid var(--border)', transition: 'background .15s' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div onClick={() => setSel((prev) => ({ ...prev, [d.id]: !prev[d.id] }))} style={checkStyle(on)}>
                        {on && (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* รูปหน้าปกเหมือนหน้า Properties — ทรัพย์ที่ยังไม่มีรูป
                            เห็นเป็นกรอบว่าง จะได้รู้ว่ายังขาดรูป */}
                        {d.img
                          /* eslint-disable-next-line @next/next/no-img-element */
                          ? <img src={thumb(d.img, 160)} alt="" data-row-cover style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                          : <div data-row-cover="none" style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--tint)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 15l-5-4-4 3" /></svg>
                            </div>}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                          <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11.5px', color: '#0D6C3B', fontWeight: 700 }}>{d.code}</code> <span style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>· {d.location}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}><span style={DEAL_MAP[d.dealK]}>{d.deal}</span></td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12.5px', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{d.price}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}><span style={STATUS_MAP[d.status]}>{STATUS_LABEL[d.status]}</span></td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span>{d.featured
                        ? (<svg width="17" height="17" viewBox="0 0 24 24" fill="#D9A62B" stroke="#D9A62B" strokeWidth="1"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z" /></svg>)
                        : (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#D4D1CA" strokeWidth="1.7"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z" /></svg>)}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}><PicCell name={d.pic} /></td>
                    {isOwner && (
                      <td style={{ padding: '14px 16px', textAlign: 'center' }} data-shared={d.contactShared ? 'on' : 'off'}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 9px', borderRadius: 9999, fontSize: 11, fontWeight: 700, background: d.contactShared ? '#E8F3EC' : 'var(--bg)', color: d.contactShared ? '#0D6C3B' : 'var(--muted3)', border: '1px solid ' + (d.contactShared ? '#BFE0CC' : 'var(--border)') }}>
                          {d.contactShared ? 'เปิด' : 'ปิด'}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--muted3)' }}>{d.updated}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div
                        className="lst-menu-btn"
                        ref={(el) => { menuBtns.current[d.id] = el; }}
                        aria-label={`เมนูของ ${d.code}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mOpen) { setOpenMenu(null); return; }
                          setMenuBox(placeMenu(e.currentTarget.getBoundingClientRect(), { width: 210, align: 'right', maxHeight: 320 }));
                          setOpenMenu(d.id);
                        }}
                        style={{ width: 30, height: 30, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)', cursor: 'pointer', ...(mOpen ? { background: 'var(--border)' } : {}) }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></svg>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '44px 16px', textAlign: 'center', color: 'var(--muted2)', fontSize: 13, lineHeight: 1.8 }}>
                    {rows === null ? 'กำลังโหลด…'
                      : loadErr ? <span style={{ color: '#C0392B' }}>{loadErr}</span>
                        : all.length === 0 ? <>ยังไม่มีประกาศในระบบ — <Link href="/admin/properties" style={{ color: '#0D6C3B', fontWeight: 700 }}>เพิ่มทรัพย์ที่หน้า Properties</Link> แล้วกลับมาตั้งดีลและราคา</>
                          : <>ไม่พบประกาศที่ตรงกับตัวกรอง — <span onClick={() => { setInv(EMPTY_FILTERS); setStatusFilter('all'); }} style={{ color: '#0D6C3B', fontWeight: 700, cursor: 'pointer' }}>ล้างตัวกรอง</span></>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* เดิม "แสดง N จาก 2,956 ประกาศ · 20 ต่อหน้า" กับปุ่มหน้า 1 · 2 · 3 เป็น
            ของปลอมที่เขียนไว้ใต้ตารางซึ่งมีทุกแถวอยู่แล้ว ตอนนี้แบ่งหน้าจริง */}
        <div style={{ padding: '10px 18px 14px', borderTop: '1px solid var(--border)' }}>
          <TablePager page={page} total={filtered.length} onPage={setPage} unit="ประกาศ" />
          {filtered.length !== all.length && (
            <div style={{ marginTop: 4, fontSize: '11.5px', color: 'var(--muted3)' }}>กรองจากทั้งหมด {all.length} ประกาศ</div>
          )}
        </div>
      </div>
    </>
  );
}
