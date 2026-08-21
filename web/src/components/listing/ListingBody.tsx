'use client';

import { useEffect, useState } from 'react';
import { SIZE_ITEMS, PRICE_ITEMS } from '@/lib/listingFilters';
import { useFavourites } from '@/lib/favourites';
import Link from '@/i18n/LocaleLink';
import { PropertyCard } from './PropertyCard';
import { ShareMenu } from '@/components/site/ShareMenu';
import { useI18n } from '@/i18n/useDict';
import { propertyType } from '@/lib/propertySchema';
import { buildFacets, LOAD_STEPS } from '@/lib/publicFilters';
import { HeightRange } from '@/components/common/HeightRange';
import { ZoneDot } from '@/components/common/ZoneDot';
import { enumLabel } from '@/i18n/enums';

/* ============================================================
   Ported verbatim from design/Listing.dc.html — markup + the
   <script data-dc-script> Component logic class. Interactive
   bits (sort/share dropdowns, filter selections, rent/sale
   toggle, favourite hearts, mobile filter drawer, pagination
   active page) mirror the logic class. style-hover attributes
   are replaced by React hover state (see Hero.tsx/Featured.tsx).
   ============================================================ */

type SortKey = 'new' | 'price_asc' | 'price_desc' | 'size_asc' | 'size_desc';
type Mode = 'rent' | 'sale';
type SecKey = 'province' | 'district' | 'subdistrict' | 'zoning' | 'estate' | 'type' | 'size' | 'price' | 'feature' | 'load' | 'height';

/* zone options are derived from the inventory on the page, not listed here */



/* One card's worth of published inventory, handed down from the server
   component that queried it. This file used to carry a nine-item copy of the
   design prototype's demo data, used as the first paint and kept forever
   whenever the API returned nothing — so an empty catalogue still advertised
   nine invented properties, and the server-rendered HTML always did. */
export type ListingItem = {
  code: string;
  title: string;
  deal: string;
  loc: string;
  price: string;
  priceValue: number;
  area: number | null;
  areaLabel: string;
  typeKey: string;
  img: string | null;
  photos: string;
  province: string;
  district: string;
  subdistrict: string;
  dealKey: 'rent' | 'sale' | 'both' | 'none';
  zoning: string;
  zone: string[];
  features: string[];
  loadTon: number | null;
  heightM: number | null;
  available: boolean;
};

type Listing = {
  slot: string;
  deal: string;
  photos: string;
  code: string;
  title: string;
  loc: string;
  price: string;
  img: string | null;
  type: string;
  area: string;
  areaSqm: number | null;
  province: string;
  /* numeric price for sorting and the price filter. Comes straight from the
     server: it used to be parsed back out of `price`, which broke the moment
     that string was translated (the parser looked for the Thai word ล้าน). */
  priceValue: number;
  dealKey: 'rent' | 'sale' | 'both' | 'none';
  district: string;
  subdistrict: string;
  zoning: string;
  zone: string[];
  features: string[];
  loadTon: number | null;
  heightM: number | null;
  available: boolean;
};

const toListing = (it: ListingItem): Listing => ({
  slot: it.code,
  deal: it.deal,
  photos: it.photos,
  code: it.code,
  title: it.title,
  loc: it.loc,
  price: it.price,
  img: it.img,
  type: propertyType(it.typeKey).label,
  area: it.areaLabel || '—',
  areaSqm: it.area,
  province: it.province,
  district: it.district,
  subdistrict: it.subdistrict,
  dealKey: it.dealKey,
  zoning: it.zoning,
  zone: it.zone,
  features: it.features,
  loadTon: it.loadTon,
  heightM: it.heightM,
  priceValue: it.priceValue,
  available: it.available,
});

export type ListingFilterKey = 'factory-rent' | 'factory-sale' | 'warehouse-rent' | 'warehouse-sale';

/** Preset config for SEO/area pages (Listing with a preset filter).
    No `totalCount`: the count shown is however many rows actually matched. */
export interface ListingPreset {
  breadcrumb: string;
  listingMode?: Mode;
  typeSel?: string[];
  filterKey?: ListingFilterKey;
  /** area pages narrow to one province; matched against the property's own */
  province?: string;
  /* what the search box on the home page was told to look for */
  q?: string;
  sizeSel?: string;
  priceSel?: string;
  /** ?zone= — แท็กพื้นที่สีบนหน้ารายละเอียดลิงก์มาที่นี่ */
  zoningSel?: string[];
  /** ?area= ?estate= ?feature= ?load= — แผงตัวกรองบนหน้าแรกส่งมา */
  areaSel?: string[];
  estateSel?: string[];
  featureSel?: string[];
  loadSel?: number | null;
  hMin?: number | null;
  hMax?: number | null;
  /** ?saved=1 — arriving from the heart in the masthead */
  onlyFavs?: boolean;
}
const DEFAULT_PRESET: ListingPreset = { breadcrumb: '' };

const PER_PAGE = 9;

/** 1 … n with ellipses, around the current page — sized to the real result set */
function pageNumbers(total: number, current: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '...')[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push('...');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push('...');
  out.push(total);
  return out;
}

/* --- style helpers (ported from the logic class) --- */
const pillStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 38,
  borderRadius: 9999,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  background: active ? 'var(--accent)' : 'var(--tint)',
  color: active ? '#fff' : 'var(--text)',
});
const checkStyle = (on: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '7px 8px',
  borderRadius: 9,
  cursor: 'pointer',
  background: on ? 'rgba(var(--accent-rgb),.06)' : 'transparent',
});
const boxStyle = (on: boolean): React.CSSProperties => ({
  width: 18,
  height: 18,
  borderRadius: 6,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1.5px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
  background: on ? 'var(--accent)' : 'transparent',
});

const secChev = (open: boolean) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);
const checkIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);


export function ListingBody({ preset = DEFAULT_PRESET, items = [] }: { preset?: ListingPreset; items?: ListingItem[] }) {
  const { d, locale } = useI18n();
  const SORT_DEFS: { key: SortKey; label: string }[] = [
    { key: 'new', label: d.listing.newest },
    { key: 'price_asc', label: d.listing.priceAsc },
    { key: 'price_desc', label: d.listing.priceDesc },
    { key: 'size_asc', label: d.listing.sizeAsc },
    { key: 'size_desc', label: d.listing.sizeDesc },
  ];
  /* Already queried, filtered by the preset and rendered on the server — no
     client fetch, so the markup search engines see is the real inventory. */
  const all = items.map(toListing);
  /* the heart used to fill in and forget — a reload emptied it and there was
     nowhere to find what had been saved */
  const favs = useFavourites();
  const [onlyFavs, setOnlyFavs] = useState(preset.onlyFavs ?? false);
  /* null = both. /listing must not hide every property for sale just because
     the pills default to one of them; preset pages still pin their own. */
  const [listingMode, setListingMode] = useState<Mode | null>(preset.listingMode ?? null);
  const [secOpen, setSecOpen] = useState<Record<SecKey, boolean>>({ province: true, district: true, subdistrict: true, zoning: true, estate: true, type: true, size: true, price: true, feature: true, load: true, height: true });
  /* สไลด์ 9 · "แยกจังหวัดเขตแขวง" — เดิมเป็นหมวดเดียวชื่อ "ทำเล" ที่ไล่ข้อความ
     รวม ("บางพลี, สมุทรปราการ") เลือกได้ทีละก้อน แคบลงทีละชั้นไม่ได้ */
  const [provSel, setProvSel] = useState<string[]>(preset.province ? [preset.province] : []);
  const [distSel, setDistSel] = useState<string[]>([]);
  const [subSel, setSubSel] = useState<string[]>([]);
  /* พื้นที่สีเป็นตัวกรองของตัวเอง — เดิมช่องที่ชื่อ "โซน" กลับไล่ชื่ออำเภอ
     ซึ่งคือคอมเมนต์ "โซนแสดงผลไม่ตรง" ในสไลด์ 12 */
  const [zoningSel, setZoningSel] = useState<string[]>(preset.zoningSel ?? []);
  /* สามหมวดที่เคยมีแต่บนหน้าแรก (สไลด์ 9/14 "ใช้ระบบเมนูเดียวกัน") */
  const [estateSel, setEstateSel] = useState<string[]>(preset.estateSel ?? []);
  const [featureSel, setFeatureSel] = useState<string[]>(preset.featureSel ?? []);
  const [loadSel, setLoadSel] = useState<number | null>(preset.loadSel ?? null);
  const [hMin, setHMin] = useState<number | null>(preset.hMin ?? null);
  const [hMax, setHMax] = useState<number | null>(preset.hMax ?? null);
  const [typeSel, setTypeSel] = useState<string[]>(preset.typeSel ?? []);
  const [sizeSel, setSizeSel] = useState<string | null>(preset.sizeSel ?? null);
  const [priceSel, setPriceSel] = useState<string | null>(preset.priceSel ?? null);
  const [q, setQ] = useState(preset.q ?? '');
  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('new');
  const shareTitle = preset.breadcrumb ? `${d.listing.title} · ${enumLabel(preset.breadcrumb, locale)}` : d.listing.title;
  /* what the share menu hands out: whatever the reader is actually looking at */
  const [shareUrl, setShareUrl] = useState('');
  useEffect(() => setShareUrl(window.location.href), []);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activePage, setActivePage] = useState<number>(1);

  /* The sidebar and the sort menu used to be inert decoration — clicking them
     changed the highlight and nothing else. They filter the real set now. */
  const inSize = (sqm: number | null, sel: string) => {
    if (sqm === null) return false;
    if (sel.startsWith('ต่ำกว่า')) return sqm < 1000;
    if (sel.startsWith('สูงกว่า')) return sqm > 3000;
    return sqm >= 1000 && sqm <= 3000;
  };
  const inPrice = (v: number, sel: string) => {
    if (sel.startsWith('ต่ำกว่า')) return v < 100_000;
    if (sel.startsWith('สูงกว่า')) return v > 300_000;
    return v >= 100_000 && v <= 300_000;
  };

  const term = q.trim().toLowerCase();
  const filtered = all.filter((it) => {
    // the words typed into the home page's search box
    if (term && ![it.title, it.code, it.loc, it.province].some((f) => (f ?? '').toLowerCase().includes(term))) return false;
    /* ทรัพย์ที่ทั้งเช่าและขายต้องขึ้นทั้งสองหน้า — เดิมเทียบกับป้ายบนการ์ด
       ซึ่งเลือกได้คำเดียว หน้าขายจึงว่างเปล่าทั้งที่มีของขายอยู่ */
    if (listingMode === 'rent' && !(it.dealKey === 'rent' || it.dealKey === 'both')) return false;
    if (listingMode === 'sale' && !(it.dealKey === 'sale' || it.dealKey === 'both')) return false;
    if (provSel.length && !provSel.some((p) => it.province.includes(p) || p.includes(it.province))) return false;
    if (distSel.length && !distSel.includes(it.district)) return false;
    if (subSel.length && !subSel.includes(it.subdistrict)) return false;
    if (zoningSel.length && !zoningSel.includes(it.zoning)) return false;
    if (estateSel.length && !estateSel.some((z) => it.zone.includes(z))) return false;
    if (featureSel.length && !featureSel.every((x) => it.features.includes(x))) return false;
    if (loadSel !== null && (it.loadTon === null || it.loadTon < loadSel)) return false;
    if (hMin !== null && (it.heightM === null || it.heightM < hMin)) return false;
    if (hMax !== null && (it.heightM === null || it.heightM > hMax)) return false;
    if (typeSel.length && !typeSel.includes(it.type)) return false;
    if (onlyFavs && !favs.has(it.code)) return false;
    if (sizeSel && !inSize(it.areaSqm, sizeSel)) return false;
    if (priceSel && !inPrice(it.priceValue, priceSel)) return false;
    return true;
  });

  const listings = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'price_asc': return a.priceValue - b.priceValue;
      case 'price_desc': return b.priceValue - a.priceValue;
      case 'size_asc': return (a.areaSqm ?? Infinity) - (b.areaSqm ?? Infinity);
      case 'size_desc': return (b.areaSqm ?? -Infinity) - (a.areaSqm ?? -Infinity);
      default: return 0; // the server already returns newest-first
    }
  });

  const pageCount = Math.max(1, Math.ceil(listings.length / PER_PAGE));
  const page = Math.min(activePage, pageCount);
  const pageItems = listings.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalCount = listings.length.toLocaleString('th-TH');

  /* zone options come from the inventory actually on the page, so the filter
     can never offer a location that returns nothing */
  /* ตัวเลือกแต่ละชั้นแคบตามชั้นบน — เลือกจังหวัดแล้วเห็นเฉพาะเขตในจังหวัดนั้น */
  const inProv = provSel.length ? all.filter((it) => provSel.some((p) => it.province.includes(p) || p.includes(it.province))) : all;
  const inDist = distSel.length ? inProv.filter((it) => distSel.includes(it.district)) : inProv;
  const provItems = Array.from(new Set(all.map((it) => it.province).filter(Boolean))).sort();
  const distItems = Array.from(new Set(inProv.map((it) => it.district).filter(Boolean))).sort();
  const subItems = Array.from(new Set(inDist.map((it) => it.subdistrict).filter(Boolean))).sort();
  // เช่นเดียวกัน — เอาเฉพาะสีที่มีทรัพย์จริง ไม่ใช่รายการสีทั้งหมด
  const zoningItems = Array.from(new Set(all.map((it) => it.zoning).filter(Boolean))).sort();
  /* ประเภทก็มาจากของที่มีจริง เดิมเป็นสองคำที่พิมพ์ไว้ในไฟล์ และคำหนึ่งสะกด
     ไม่ตรงกับที่การ์ดแสดง ("โกดัง/คลังสินค้า" ไม่มีเว้นวรรค) ติ๊กแล้วกรองไม่เจอ
     อะไรเลย ส่วนที่หน้าอื่นส่งมาเป็นตัวเลือกตั้งต้นก็ต้องเห็นเสมอ */
  const typeItems = Array.from(new Set([...all.map((it) => it.type), ...typeSel])).filter(Boolean).sort();
  const facets = buildFacets(all);

  const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const sortLabel = (SORT_DEFS.find((d) => d.key === sortKey) || SORT_DEFS[0]).label;

  const toggleSec = (key: SecKey) => setSecOpen((s) => ({ ...s, [key]: !s[key] }));
  const clearAll = () => {
    setQ('');
    setProvSel([]); setDistSel([]); setSubSel([]);
    setTypeSel([]);
    setSizeSel(null);
    setPriceSel(null);
    /* "บันทึกไว้" มาจาก ?saved=1 ไม่ได้อยู่ในกลุ่มตัวกรองที่ถูกล้าง — คนที่กด
       หัวใจในแถบบนโดยยังไม่ได้บันทึกอะไรเลยจะเจอ "พบ 0 รายการ" กับปุ่มล้างค่า
       ที่กดแล้วไม่มีอะไรเกิดขึ้น เพราะตัวกรองที่ทำให้ว่างคือตัวเดียวที่ปุ่มนี้
       ไม่ได้แตะ และชิปสำหรับปิดมันก็ไม่ขึ้นเมื่อยังไม่มีรายการที่บันทึกไว้ */
    setOnlyFavs(false);
    if (typeof window !== 'undefined' && window.location.search.includes('saved=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('saved');
      window.history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
    }
  };
  const toggleSort = () => setSortOpen((v) => !v);

  type Section = {
    key: SecKey; title: string;
    /* จังหวัด/เขต/แขวง เป็น dropdown — รายการติ๊กยาวเป็นสามสิบกว่าบรรทัด
       ทำให้แถบตัวกรองยาวจนหาหมวดอื่นไม่เจอ และการเลือกทีละหลายจังหวัดพร้อมกัน
       ก็ไม่ใช่สิ่งที่คนหาทำเลทำจริง */
    kind?: 'dropdown' | 'range';
    value?: string;
    onPick?: (v: string) => void;
    items: { label: string; value?: string; checked: boolean; select: () => void }[];
  };
  const sections: Section[] = ([
    {
      key: 'province', title: d.listing.province, kind: 'dropdown',
      value: provSel[0] ?? '',
      onPick: (v) => { setProvSel(v ? [v] : []); setDistSel([]); setSubSel([]); },
      items: provItems.map((label) => ({ label, checked: provSel.includes(label), select: () => undefined })),
    },
    {
      key: 'district', title: d.listing.district, kind: 'dropdown',
      value: distSel[0] ?? '',
      onPick: (v) => { setDistSel(v ? [v] : []); setSubSel([]); },
      items: distItems.map((label) => ({ label, checked: distSel.includes(label), select: () => undefined })),
    },
    {
      key: 'subdistrict', title: d.listing.subdistrict, kind: 'dropdown',
      value: subSel[0] ?? '',
      onPick: (v) => setSubSel(v ? [v] : []),
      items: subItems.map((label) => ({ label, checked: subSel.includes(label), select: () => undefined })),
    },
    { key: 'zoning', title: d.listing.zoneColor, items: zoningItems.map((value) => ({ label: enumLabel(value, locale), value, checked: zoningSel.includes(value), select: () => setZoningSel((a) => toggleIn(a, value)) })) },
    { key: 'type', title: d.listing.type, items: typeItems.map((label) => ({ label, checked: typeSel.includes(label), select: () => setTypeSel((a) => toggleIn(a, label)) })) },
    { key: 'size', title: d.listing.size, items: SIZE_ITEMS.map((label) => ({ label, checked: sizeSel === label, select: () => setSizeSel((cur) => (cur === label ? null : label)) })) },
    { key: 'price', title: d.listing.price, items: PRICE_ITEMS.map((label) => ({ label, checked: priceSel === label, select: () => setPriceSel((cur) => (cur === label ? null : label)) })) },
    { key: 'estate', title: d.hero.zone, items: facets.zones.map((value) => ({ label: value, checked: estateSel.includes(value), select: () => setEstateSel((a) => toggleIn(a, value)) })) },
    { key: 'feature', title: d.hero.features, items: facets.features.map((value) => ({ label: value, checked: featureSel.includes(value), select: () => setFeatureSel((a) => toggleIn(a, value)) })) },
    { key: 'load', title: d.hero.floorLoading, items: LOAD_STEPS.map((n) => ({ label: `${n} ${d.common.tonPerSqm}`, checked: loadSel === n, select: () => setLoadSel((cur) => (cur === n ? null : n)) })) },
    /* ความสูงเป็นช่วง ไม่ใช่รายการติ๊ก — items ว่างจึงต้องยกเว้นจากตัวกรองด้านล่าง */
    { key: 'height', title: d.hero.height, kind: 'range', items: [] },
  ] as Section[]).filter((sec) => sec.kind === 'range' || sec.items.length > 0);

  /* สไลด์ 9 · "เพิ่มช่องค้นหา" — หน้านี้ไม่มีช่องค้นหาเลย มีแต่ชิปแสดงคำที่
     พิมพ์มาจากหน้าแรก ใครเข้ามาตรงหน้านี้จึงค้นด้วยชื่อหรือรหัสไม่ได้ */
  const renderSearch = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px', marginBottom: 14, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input
        data-listing-search
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={d.listing.searchPh}
        style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', fontSize: '13.5px', color: 'var(--text)', fontFamily: 'inherit' }}
      />
      {q && (
        <span onClick={() => setQ('')} title={d.common.clear} style={{ display: 'flex', cursor: 'pointer', color: 'var(--muted3)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </span>
      )}
    </div>
  );

  const renderModePills = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <div onClick={() => setListingMode((m) => (m === 'rent' ? null : 'rent'))} style={pillStyle(listingMode === 'rent')}>{d.nav.forRent}</div>
      <div onClick={() => setListingMode((m) => (m === 'sale' ? null : 'sale'))} style={pillStyle(listingMode === 'sale')}>{d.nav.forSale}</div>
    </div>
  );

  const renderSections = () =>
    sections.map((sec) => (
      <div key={sec.key} style={{ borderTop: '1px solid var(--border)', padding: '14px 0' }}>
        <div onClick={() => toggleSec(sec.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{sec.title}</div>
          {secChev(secOpen[sec.key])}
        </div>
        {secOpen[sec.key] && sec.kind === 'dropdown' && (
          <select
            data-filter-select={sec.key}
            value={sec.value ?? ''}
            onChange={(e) => sec.onPick?.(e.target.value)}
            disabled={sec.items.length === 0}
            style={{
              marginTop: 10, width: '100%', height: 42, padding: '0 12px', borderRadius: 11,
              border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
              fontSize: '13.5px', fontFamily: 'inherit', outline: 'none',
              opacity: sec.items.length === 0 ? 0.55 : 1,
            }}
          >
            <option value="">{sec.items.length === 0 ? d.listing.emptyTitle : d.listing.allOf}</option>
            {sec.items.map((it) => (
              <option key={it.label} value={it.label}>{enumLabel(it.label, locale)}</option>
            ))}
          </select>
        )}
        {secOpen[sec.key] && sec.kind === 'range' && (
          <HeightRange min={hMin} max={hMax} onMin={setHMin} onMax={setHMax} />
        )}
        {secOpen[sec.key] && !sec.kind && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sec.items.map((it) => (
              <div key={enumLabel(it.label, locale)} data-filter-opt={sec.key} data-checked={it.checked ? '1' : '0'} onClick={it.select} style={checkStyle(it.checked)}>
                <div style={boxStyle(it.checked)}>{it.checked && checkIcon}</div>
                {/* จุดสีของผังเมือง — สไลด์ 9/22/25 */}
                {sec.key === 'zoning' ? <ZoneDot value={it.value ?? it.label} size={14} /> : null}
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{enumLabel(it.label, locale)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    ));

  return (
    <>
      {/* BREADCRUMB */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted2)' }}>
        <Link href="/" style={{ color: 'var(--muted2)' }}>{d.common.home}</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2">
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{preset.breadcrumb ? enumLabel(preset.breadcrumb, locale) : d.listing.title}</span>
      </div>

      {/* TOOLBAR */}
      {/* จอมือถือ: ปุ่มตัวกรองกับจำนวนผลลัพธ์อยู่บรรทัดเดียวกัน ชิป (บันทึกไว้ /
          คำค้น) ลงบรรทัดของตัวเอง แล้วแถวเรียงลำดับอยู่ล่างสุด — เดิมทั้งสาม
          ก้อนซ้อนกันเป็นชั้น ๆ ไม่ตรงขอบไหนเลย และชื่อปุ่ม "ตัวกรองการค้นหา"
          ตกบรรทัดกลางปุ่มจนปุ่มสูงกว่าของข้าง ๆ (ลูกค้า: "responsive เรียงไม่สวย")
          ปุ่มกับจำนวนเป็นพี่น้องระดับเดียวกัน ไม่ใช่ห่อซ้อนอีกชั้น ที่จอใหญ่จึง
          เรียงเหมือนเดิมทุกอย่าง ส่วนจอเล็กสั่งให้ชิปขึ้นบรรทัดใหม่ได้ตรง ๆ */}
      <div id="toolbar-row" style={{ maxWidth: '1320px', margin: '0 auto', padding: '14px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div id="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div id="mobile-filter-btn" onClick={() => setMobileFilterOpen((v) => !v)} style={{ alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            {d.listing.filters}
          </div>
          <span id="toolbar-count" style={{ fontSize: 15, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            {d.listing.resultsFound} <span style={{ fontWeight: 800, color: 'var(--text)' }}>{totalCount}</span> {d.listing.results}
          </span>
          <div id="toolbar-chips" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* the saved ones, and a way back to them */}
            {favs.codes.length > 0 && (
              <span
                id="listing-only-favs"
                onClick={() => setOnlyFavs((v) => !v)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 9999, cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: onlyFavs ? 'var(--pine)' : 'var(--surface)', color: onlyFavs ? '#fff' : 'var(--text)', border: '1px solid ' + (onlyFavs ? 'var(--pine)' : 'var(--border)') }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={onlyFavs ? '#fff' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.8 8.6a5.5 5.5 0 00-9-1.8L12 8l-.1-.1a5.5 5.5 0 10-7.8 7.8l7.9 7.9 7.9-7.9a5.5 5.5 0 00.9-7z" /></svg>
                {d.listing.saved} {favs.codes.length}
              </span>
            )}

            {/* what was typed on the home page, and a way out of it */}
            {q.trim() && (
              <span id="listing-q" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 8px 0 12px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '13px', fontWeight: 700 }}>
                {`“${q.trim()}”`}
                <span onClick={() => setQ('')} title={d.common.clear} style={{ display: 'flex', cursor: 'pointer' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </span>
              </span>
            )}
          </div>
        </div>
        <div id="sort-share-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* คำว่า "เรียงตาม" ต้องติดกับกล่องเลือกเสมอ — ตอนแถวนี้กางเต็มความกว้าง
              บนมือถือ space-between เคยดันสามชิ้นแยกกันคนละมุม คำอธิบายลอยอยู่
              ซ้ายสุดห่างจากสิ่งที่มันอธิบาย */}
          <div id="sort-group" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: '13.5px', color: 'var(--muted2)', whiteSpace: 'nowrap' }}>{d.listing.sortBy}</span>
          <div style={{ position: 'relative' }}>
            <div onClick={toggleSort} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', minWidth: 130 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M3 8h6M3 12h4M3 16h2" />
                <path d="M16 4v16M16 4l-4 4M16 4l4 4" />
              </svg>
              <span style={{ flex: 1 }}>{sortLabel}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.4" style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            {sortOpen && (
              <div id="sort-dd-panel" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 220, background: 'var(--surface)', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,.18)', padding: 8, zIndex: 60 }}>
                {SORT_DEFS.map((o) => {
                  const active = o.key === sortKey;
                  return (
                    <div
                      key={o.key}
                      onClick={() => {
                        setSortKey(o.key);
                        setSortOpen(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 11, cursor: 'pointer', fontSize: '13.5px', fontWeight: active ? 700 : 600, color: active ? 'var(--deep)' : 'var(--text)', background: active ? 'rgba(var(--accent-rgb),.06)' : 'transparent' }}
                    >
                      <span>{o.label}</span>
                      {active && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.6">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
          {/* The three items behind this used to close the menu and nothing
              else. It is the same menu the property page uses now. */}
          <ShareMenu target={{ url: shareUrl, title: shareTitle }}>
            <div style={{ width: 40, height: 40, borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" />
              </svg>
            </div>
          </ShareMenu>
        </div>
      </div>

      {/* LAYOUT */}
      <div id="listing-layout" style={{ maxWidth: '1320px', margin: '0 auto', padding: '20px 24px 80px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28, alignItems: 'start' }}>
        {/* SIDEBAR (desktop) */}
        <aside id="filter-sidebar" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, position: 'sticky', top: 96 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>{d.listing.filters}</div>
          {renderSearch()}
          {renderModePills()}
          {renderSections()}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <div onClick={clearAll} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 9999, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>{d.listing.clear}</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 9999, background: 'var(--accent)', color: '#fff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>{d.listing.search}</div>
          </div>
        </aside>

        {/* GRID */}
        {pageItems.length === 0 ? (
          <div id="listing-empty" style={{ padding: '72px 24px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 18, background: 'var(--surface)' }}>
            {/* "ยังไม่มีทรัพย์ที่บันทึกไว้" คนละเรื่องกับ "ไม่พบทรัพย์ตามเงื่อนไข" —
                เดิมพูดถึงตัวกรองทั้งที่ผู้อ่านไม่ได้เลือกตัวกรองอะไรเลย */}
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
              {all.length === 0 ? d.listing.emptyTitle : onlyFavs && !favs.codes.length ? d.listing.noSavedTitle : d.listing.empty}
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--muted2)' }}>
              {all.length === 0
                ? d.listing.emptyBody
                : onlyFavs && !favs.codes.length ? d.listing.noSavedBody : d.listing.emptyHint}
            </p>
            {all.length > 0 && (
              <button type="button" id="listing-clear" onClick={clearAll} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 18, height: 42, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--pine)', background: 'transparent', fontFamily: 'inherit', color: 'var(--pine)', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>
                {onlyFavs && !favs.codes.length ? d.listing.showAll : d.listing.clear}
              </button>
            )}
          </div>
        ) : (
          <div className="rs-cols-3" id="listing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
            {pageItems.map((it) => (
              <PropertyCard
                key={it.slot}
                it={it}
                favFill={favs.has(it.slot) ? 'var(--ink)' : 'none'}
                onToggleFav={() => favs.toggle(it.slot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* PAGINATION — page numbers follow the real result count; the arrows
          used to be decorative and the tail always read "… 86". */}
      {pageCount > 1 && (
        <div id="pagination-row" style={{ maxWidth: '1320px', margin: '-40px auto 0', padding: '0 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {/* ตัวเลขหน้าเคยเป็น <div> ล้วน ๆ กดด้วยเมาส์ได้อย่างเดียว คนที่ใช้
              คีย์บอร์ดหรือโปรแกรมอ่านหน้าจอไปหน้า 2 ไม่ได้เลย */}
          <button
            type="button"
            aria-label={d.listing.prevPage}
            disabled={page === 1}
            onClick={() => setActivePage((p) => Math.max(1, p - 1))}
            style={{ width: 38, height: 38, borderRadius: 9999, border: '1px solid var(--border)', background: 'transparent', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === 1 ? 'var(--muted3)' : 'var(--text)', cursor: page === 1 ? 'default' : 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          {pageNumbers(pageCount, page).map((n, i) => {
            const isActive = n === page;
            return (
              n === '...' ? (
                <span key={`${n}-${i}`} aria-hidden style={{ minWidth: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--muted3)' }}>{n}</span>
              ) : (
                <button
                  type="button"
                  key={`${n}-${i}`}
                  aria-label={`${d.listing.pageN} ${n}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActivePage(n)}
                  style={{ minWidth: 38, height: 38, padding: '0 6px', borderRadius: 9999, border: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', background: isActive ? 'var(--accent)' : 'transparent', color: isActive ? '#fff' : 'var(--text)' }}
                >
                  {n}
                </button>
              )
            );
          })}
          <button
            type="button"
            aria-label={d.listing.nextPage}
            disabled={page === pageCount}
            onClick={() => setActivePage((p) => Math.min(pageCount, p + 1))}
            style={{ width: 38, height: 38, borderRadius: 9999, border: '1px solid var(--border)', background: 'transparent', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page === pageCount ? 'var(--muted3)' : 'var(--text)', cursor: page === pageCount ? 'default' : 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}

      {/* MOBILE FILTER DRAWER */}
      {mobileFilterOpen && (
        <div onClick={() => setMobileFilterOpen((v) => !v)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.5)', backdropFilter: 'blur(2px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '88%', maxWidth: 340, background: 'var(--bg)', overflow: 'auto', padding: 20, boxShadow: '20px 0 50px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{d.listing.filters}</div>
              <div onClick={() => setMobileFilterOpen((v) => !v)} style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </div>
            </div>
            {renderModePills()}
            {renderSections()}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <div onClick={clearAll} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 9999, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>{d.listing.clear}</div>
              <div onClick={() => setMobileFilterOpen((v) => !v)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 9999, background: 'var(--accent)', color: '#fff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>{d.listing.search}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
