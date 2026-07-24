'use client';

import * as React from 'react';

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

type CreateCtx = { createOpen: boolean; setCreateOpen: (v: boolean) => void };
const ListingsCtx = React.createContext<CreateCtx | null>(null);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [createOpen, setCreateOpen] = React.useState(false);
  return <ListingsCtx.Provider value={{ createOpen, setCreateOpen }}>{children}</ListingsCtx.Provider>;
}

function useCreate(): CreateCtx {
  const ctx = React.useContext(ListingsCtx);
  if (!ctx) throw new Error('ListingsProvider is missing');
  return ctx;
}

type DealK = 'rent' | 'sale' | 'both';
type StatusK = 'published' | 'review' | 'draft' | 'hidden' | 'unavailable';
type CreateStatusK = 'draft' | 'published';

type Row = {
  id: string;
  title: string;
  code: string;
  location: string;
  deal: string;
  dealK: DealK;
  price: string;
  status: StatusK;
  featured: boolean;
  updated: string;
};

type MenuItem =
  | { divider: true }
  | { divider: false; label: string; href: string; icon: React.ReactNode; danger?: boolean };

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

const RAW_DATA: Row[] = [
  { id: 'l1', title: 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', code: 'JKP-SPK0042', location: 'สมุทรปราการ', deal: 'เช่า', dealK: 'rent', price: '฿176,000/ด.', status: 'published', featured: true, updated: 'วันนี้ 09:20' },
  { id: 'l2', title: 'โรงงาน ร.ง.4 บางนา กม.23', code: 'JKP0118', location: 'กรุงเทพฯ', deal: 'ทั้งสอง', dealK: 'both', price: '฿9.7M', status: 'published', featured: true, updated: 'เมื่อวาน' },
  { id: 'l3', title: 'คลังสินค้าแหลมฉบัง โซน A', code: 'JKP-CBI0007', location: 'ชลบุรี', deal: 'ขาย', dealK: 'sale', price: '฿45M', status: 'review', featured: false, updated: '2 วันก่อน' },
  { id: 'l4', title: 'ที่ดินอุตสาหกรรม วังน้อย', code: 'JKP-AYA0021', location: 'อยุธยา', deal: 'ขาย', dealK: 'sale', price: '฿120M', status: 'draft', featured: false, updated: '3 วันก่อน' },
  { id: 'l5', title: 'โรงงานผลิตอาหาร นวนคร', code: 'JKP-PTE0033', location: 'ปทุมธานี', deal: 'เช่า', dealK: 'rent', price: '฿245,000/ด.', status: 'published', featured: false, updated: '4 วันก่อน' },
  { id: 'l6', title: 'โกดังให้เช่า มหาชัย', code: 'JKP-SKN0015', location: 'สมุทรสาคร', deal: 'เช่า', dealK: 'rent', price: '฿88,000/ด.', status: 'hidden', featured: false, updated: '5 วันก่อน' },
  { id: 'l7', title: 'โรงงาน + โกดัง ปิ่นทอง', code: 'JKP-CBI0019', location: 'ชลบุรี', deal: 'ทั้งสอง', dealK: 'both', price: '฿15.5M', status: 'published', featured: true, updated: '1 สัปดาห์' },
  { id: 'l8', title: 'คลังห้องเย็น บางปะกง', code: 'JKP-CCO0004', location: 'ฉะเชิงเทรา', deal: 'เช่า', dealK: 'rent', price: '฿310,000/ด.', status: 'unavailable', featured: false, updated: '1 สัปดาห์' },
  { id: 'l9', title: 'โกดังโลจิสติกส์ ลาดกระบัง', code: 'JKP0231', location: 'กรุงเทพฯ', deal: 'ขาย', dealK: 'sale', price: '฿78M', status: 'published', featured: false, updated: '2 สัปดาห์' },
];

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

const rowMenu = (d: Row): MenuItem[] => {
  const list: MenuItem[] = [
    { divider: false, label: 'ดูรายละเอียด', href: '/admin/property-view', icon: menuIcon(<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>, '#034956') },
    { divider: false, label: 'แก้ไขประกาศ', href: '/admin/property-edit', icon: menuIcon(<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />, '#034956') },
  ];
  if (d.status === 'published') list.push({ divider: false, label: 'ยกเลิกเผยแพร่', href: '#', icon: menuIcon(<path d="M18.4 18.4A9.9 9.9 0 0112 20c-7 0-10-8-10-8a18 18 0 015-6M1 1l22 22M9.9 4.2A9.9 9.9 0 0112 4c7 0 10 8 10 8a18 18 0 01-2.2 3.2" />, '#9A741C') });
  else list.push({ divider: false, label: 'เผยแพร่', href: '#', icon: menuIcon(<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />, '#0D6C3B') });
  list.push({ divider: false, label: d.featured ? 'เอาออกจากแนะนำ' : 'ตั้งเป็นแนะนำ', href: '#', icon: menuIcon(<path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z" />, '#D9A62B') });
  list.push({ divider: false, label: 'ทำสำเนา', href: '#', icon: menuIcon(<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></>, '#034956') });
  list.push({ divider: true });
  list.push({ divider: false, label: 'ลบประกาศ', href: '#', icon: menuIcon(<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />, '#C0392B'), danger: true });
  return list;
};

const STATUS_TABS: { key: 'all' | StatusK; label: string; count: string; danger: boolean }[] = [
  { key: 'all', label: 'ทั้งหมด', count: '2,956', danger: false },
  { key: 'published', label: 'เผยแพร่', count: '2,410', danger: false },
  { key: 'review', label: 'รอตรวจ', count: '48', danger: false },
  { key: 'draft', label: 'ร่าง', count: '372', danger: false },
  { key: 'hidden', label: 'ซ่อน', count: '96', danger: false },
  { key: 'unavailable', label: 'ไม่ว่าง', count: '30', danger: true },
];

/* ---- filter dropdowns (type / province / deal / featured) ---- */
type TypeK = 'factory' | 'warehouse' | 'land';
type FiltersState = { type?: string; province?: string; deal?: string; featured?: string };
const typeOf = (d: Row): TypeK => (/โกดัง|คลัง/.test(d.title) ? 'warehouse' : /ที่ดิน/.test(d.title) ? 'land' : 'factory');
const PROVINCE_OPTS: [string, string][] = Array.from(new Set(RAW_DATA.map((d) => d.location))).map((p) => [p, p]);
const FILTER_DEFS: { key: keyof FiltersState; label: string; options: [string, string][] }[] = [
  { key: 'type', label: 'ประเภท', options: [['factory', 'โรงงาน'], ['warehouse', 'โกดัง/คลัง'], ['land', 'ที่ดิน']] },
  { key: 'province', label: 'จังหวัด', options: PROVINCE_OPTS },
  { key: 'deal', label: 'ดีล', options: [['rent', 'ให้เช่า'], ['sale', 'ขาย'], ['both', 'ทั้งสอง']] },
  { key: 'featured', label: 'Featured', options: [['yes', 'แนะนำ'], ['no', 'ไม่แนะนำ']] },
];

const filterTriggerStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 14px', borderRadius: 10,
  background: active ? 'rgba(13,108,59,.06)' : 'var(--bg)', border: '1px solid ' + (active ? '#0D6C3B' : 'var(--border)'),
  fontSize: 13, fontWeight: active ? 700 : 600, color: active ? '#0D6C3B' : 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap',
});
const filterOptStyle = (on: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 11px', borderRadius: 9,
  fontSize: 13, fontWeight: on ? 700 : 600, color: on ? '#0D6C3B' : 'var(--text)',
  background: on ? 'rgba(13,108,59,.06)' : 'transparent', cursor: 'pointer',
});
const optCheck = (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>);

function FilterDropdown({ def, value, open, onToggle, onSelect }: {
  def: { key: keyof FiltersState; label: string; options: [string, string][] };
  value?: string; open: boolean; onToggle: () => void; onSelect: (v: string | null) => void;
}) {
  const selLabel = value ? (def.options.find(([v]) => v === value)?.[1] ?? def.label) : def.label;
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={onToggle} style={filterTriggerStyle(!!value)}>
        {selLabel}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={value ? '#0D6C3B' : 'var(--muted2)'} strokeWidth="2.4" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 190, maxHeight: 260, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 20px 44px rgba(0,0,0,.16)', padding: 7, zIndex: 60 }}>
          <div onClick={() => onSelect(null)} style={filterOptStyle(!value)}><span>ทั้งหมด</span>{!value && optCheck}</div>
          {def.options.map(([v, l]) => (
            <div key={v} onClick={() => onSelect(v)} style={filterOptStyle(value === v)}><span>{l}</span>{value === v && optCheck}</div>
          ))}
        </div>
      )}
    </div>
  );
}

const CREATE_PROPS: { title: string; code: string; area: string; type: string }[] = [
  { title: 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', code: 'JKP-SPK0042', area: '2,700', type: 'โกดัง' },
  { title: 'โรงงาน ร.ง.4 บางนา กม.23', code: 'JKP0118', area: '3,500', type: 'โรงงาน' },
  { title: 'คลังสินค้าแหลมฉบัง โซน A', code: 'JKP-CBI0007', area: '5,000', type: 'โกดัง' },
];

const DEAL_OPTS: [DealK, string][] = [['rent', 'ให้เช่า'], ['sale', 'ขาย'], ['both', 'ทั้งสอง']];
const STATUS_OPTS: [CreateStatusK, string][] = [['draft', 'บันทึกร่าง'], ['published', 'เผยแพร่ทันที']];

const PAGES: { n: string; style: React.CSSProperties }[] = [
  { n: '1', style: { width: 34, height: 34, borderRadius: 9, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
  { n: '2', style: { width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } },
  { n: '3', style: { width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } },
  { n: '…', style: { width: 34, height: 34, color: 'var(--muted3)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
];

/* ---- topbar right cluster: Export dropdown + create trigger ---- */
export function ListingsActions() {
  const { setCreateOpen } = useCreate();
  const [exportOpen, setExportOpen] = React.useState(false);
  return (
    <div id="lst-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <div onClick={() => setExportOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>Export<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg>
        </div>
        {exportOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 20px 44px rgba(0,0,0,.16)', padding: 7, zIndex: 60 }}>
            <div className="lst-exp-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><span style={{ width: 26, height: 26, borderRadius: 7, background: '#E8F3EC', color: '#0D6C3B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>XLS</span>Excel (.xlsx)</div>
            <div className="lst-exp-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><span style={{ width: 26, height: 26, borderRadius: 7, background: '#EEF4F3', color: '#034956', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>CSV</span>CSV (Google Sheets)</div>
          </div>
        )}
      </div>
      <div onClick={() => setCreateOpen(true)} className="admin-primary-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>สร้างประกาศ
      </div>
    </div>
  );
}

/* ---- main content ---- */
export function ListingsAdminBody() {
  const { createOpen, setCreateOpen } = useCreate();
  const [sel, setSel] = React.useState<Record<string, boolean>>({});
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [cProp, setCProp] = React.useState(0);
  const [cDeal, setCDeal] = React.useState<DealK>('rent');
  const [cStatus, setCStatus] = React.useState<CreateStatusK>('draft');

  // ---- filters (status tabs + search + dropdowns) ----
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | StatusK>('all');
  const [filters, setFilters] = React.useState<FiltersState>({});
  const [openFilter, setOpenFilter] = React.useState<string | null>(null);

  const filtered = RAW_DATA.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (filters.type && typeOf(d) !== filters.type) return false;
    if (filters.province && d.location !== filters.province) return false;
    if (filters.deal && d.dealK !== filters.deal) return false;
    if (filters.featured && (filters.featured === 'yes') !== d.featured) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (![d.title, d.code, d.location].some((f) => f.toLowerCase().includes(q))) return false;
    }
    return true;
  });
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + Object.values(filters).filter(Boolean).length + (query.trim() ? 1 : 0);
  const clearFilters = () => { setStatusFilter('all'); setFilters({}); setQuery(''); setOpenFilter(null); };

  const selCount = Object.values(sel).filter(Boolean).length;
  const allChecked = filtered.length > 0 && filtered.every((d) => sel[d.id]);
  const anyMenuOpen = openMenu !== null;

  const cur = CREATE_PROPS[cProp];
  const isWh = cur.type === 'โกดัง';
  const showRent = cDeal === 'rent' || cDeal === 'both';
  const showSale = cDeal === 'sale' || cDeal === 'both';
  const dest: string[] = [];
  if (cDeal === 'rent' || cDeal === 'both') dest.push(isWh ? 'โกดังให้เช่า' : 'โรงงานให้เช่า');
  if (cDeal === 'sale' || cDeal === 'both') dest.push(isWh ? 'โกดังสำหรับขาย' : 'โรงงานสำหรับขาย');
  dest.push('อสังหาริมทรัพย์ทั้งหมด');

  const toggleAll = () => {
    if (allChecked) { setSel({}); }
    else { const s: Record<string, boolean> = { ...sel }; filtered.forEach((d) => { s[d.id] = true; }); setSel(s); }
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
                <input placeholder="ค้นด้วยรหัส JKP หรือชื่อทรัพย์" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CREATE_PROPS.map((p, i) => {
                  const pon = cProp === i;
                  return (
                    <div key={p.code} onClick={() => setCProp(i)} style={propOptStyle(pon)}>
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                        <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#0D6C3B', fontWeight: 700 }}>{p.code}</code> <span style={{ fontSize: 11, color: 'var(--muted3)' }}>· {p.area} ตร.ม.</span>
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
                    <input placeholder="0" style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--surface)', outline: 'none' }} />
                  </div>
                )}
                {showSale && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ราคาขาย (บาท)</label>
                    <input placeholder="0" style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--surface)', outline: 'none' }} />
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
            <div id="lc-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <div onClick={() => setCreateOpen(false)} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap' }}>ยกเลิก</div>
              <a href="/admin/property-edit" style={{ height: 44, padding: '0 26px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: '13.5px', fontWeight: 700, whiteSpace: 'nowrap' }}>สร้างและแก้ไขต่อ<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
            </div>
          </div>
        </div>
      )}

      {/* CLICK-CATCHER FOR ROW MENUS */}
      {anyMenuOpen && (<div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />)}
      {/* CLICK-CATCHER FOR FILTER DROPDOWNS */}
      {openFilter && (<div onClick={() => setOpenFilter(null)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />)}

      {/* STATUS TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_TABS.map((t) => {
          const active = statusFilter === t.key;
          return (
            <div key={t.key} onClick={() => setStatusFilter(t.key)} style={tabStyle(active)}>{t.label}<span style={tabCountStyle(active, t.danger)}>{t.count}</span></div>
          );
        })}
      </div>

      {/* FILTER + SEARCH */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, position: 'relative', zIndex: openFilter ? 51 : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid ' + (query.trim() ? '#0D6C3B' : 'var(--border)'), flex: 1, minWidth: 220 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหา listing code หรือชื่อ" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
          {query && (<div onClick={() => setQuery('')} title="ล้าง" style={{ cursor: 'pointer', color: 'var(--muted3)', display: 'flex', flexShrink: 0 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg></div>)}
        </div>
        {FILTER_DEFS.map((f) => (
          <FilterDropdown
            key={f.key}
            def={f}
            value={filters[f.key]}
            open={openFilter === f.key}
            onToggle={() => setOpenFilter(openFilter === f.key ? null : f.key)}
            onSelect={(v) => { setFilters((p) => ({ ...p, [f.key]: v ?? undefined })); setOpenFilter(null); }}
          />
        ))}
        {activeFilterCount > 0 && (
          <div onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 12px', borderRadius: 10, color: '#C0392B', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>ล้างตัวกรอง
          </div>
        )}
      </div>

      {/* BULK BAR */}
      {selCount > 0 && (
        <div style={{ background: '#04140C', borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', rowGap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 13, fontWeight: 600 }}><span style={{ height: 24, minWidth: 24, padding: '0 8px', borderRadius: 9999, background: '#2DFB91', color: '#04140C', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{String(selCount)}</span>เลือกแล้ว</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div onClick={() => setSel({})} style={{ height: 36, padding: '0 16px', borderRadius: 9999, border: '1px solid rgba(255,255,255,.24)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>ยกเลิก</div>
            <div style={{ height: 36, padding: '0 16px', borderRadius: 9999, background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>Unpublish</div>
            <div style={{ height: 36, padding: '0 16px', borderRadius: 9999, background: '#2DFB91', color: '#04140C', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#04140C" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>Publish ทั้งหมด</div>
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
                <th style={{ ...thStyle, textAlign: 'left' }}>อัปเดต</th>
                <th style={{ padding: '13px 16px', width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
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
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                      <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11.5px', color: '#0D6C3B', fontWeight: 700 }}>{d.code}</code> <span style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>· {d.location}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}><span style={DEAL_MAP[d.dealK]}>{d.deal}</span></td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12.5px', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{d.price}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}><span style={STATUS_MAP[d.status]}>{STATUS_LABEL[d.status]}</span></td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span>{d.featured
                        ? (<svg width="17" height="17" viewBox="0 0 24 24" fill="#D9A62B" stroke="#D9A62B" strokeWidth="1"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z" /></svg>)
                        : (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#D4D1CA" strokeWidth="1.7"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z" /></svg>)}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--muted3)' }}>{d.updated}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', position: 'relative' }}>
                      <div className="lst-menu-btn" onClick={(e) => { e.stopPropagation(); setOpenMenu(mOpen ? null : d.id); }} style={{ width: 30, height: 30, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)', cursor: 'pointer', ...(mOpen ? { background: 'var(--border)' } : {}) }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="5" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="12" cy="19" r="1.4" /></svg>
                      </div>
                      {mOpen && (
                        <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 44, right: 14, zIndex: 30, width: 210, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 20px 44px rgba(0,0,0,.18)', padding: 7, textAlign: 'left' }}>
                          {rowMenu(d).map((mItem, mi2) => {
                            if (mItem.divider) return <div key={'div' + mi2} style={{ height: 1, background: 'var(--border)', margin: '6px 4px' }} />;
                            return (
                              <a key={mItem.label} href={mItem.href} style={mItem.danger ? { ...miBase, color: '#C0392B' } : miBase}>
                                <span style={{ display: 'flex', width: 16, height: 16, flexShrink: 0 }}>{mItem.icon}</span>{mItem.label}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '44px 16px', textAlign: 'center', color: 'var(--muted2)', fontSize: 13 }}>
                    ไม่พบประกาศที่ตรงกับตัวกรอง — <span onClick={clearFilters} style={{ color: '#0D6C3B', fontWeight: 700, cursor: 'pointer' }}>ล้างตัวกรอง</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', rowGap: 10 }}>
          <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>แสดง {filtered.length} จาก 2,956 ประกาศ · <span style={{ color: 'var(--muted3)' }}>20 ต่อหน้า</span></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 6l-6 6 6 6" /></svg></div>
            {PAGES.map((p) => (<div key={p.n} style={p.style}>{p.n}</div>))}
            <div style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg></div>
          </div>
        </div>
      </div>
    </>
  );
}
