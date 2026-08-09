'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
type SecKey = 'zone' | 'type' | 'size' | 'price';

const SORT_DEFS: { key: SortKey; label: string }[] = [
  { key: 'new', label: 'ใหม่ล่าสุด' },
  { key: 'price_asc', label: 'ราคา (น้อย → มาก)' },
  { key: 'price_desc', label: 'ราคา (มาก → น้อย)' },
  { key: 'size_asc', label: 'ขนาด (เล็ก → ใหญ่)' },
  { key: 'size_desc', label: 'ขนาด (ใหญ่ → เล็ก)' },
];

const SHARE_DEFS: { key: string; label: string; char: string; bg: string; color: string }[] = [
  { key: 'copy', label: 'คัดลอกลิงก์', char: '⛓', bg: 'var(--tint)', color: 'var(--accent)' },
  { key: 'email', label: 'อีเมล', char: '✉', bg: '#FDECC8', color: '#D9A62B' },
  { key: 'line', label: 'Line', char: 'L', bg: '#E3F5DC', color: '#06C755' },
  { key: 'whatsapp', label: 'Whatsapp', char: 'W', bg: '#DCF3E5', color: '#25D366' },
  { key: 'wechat', label: 'Wechat', char: '微', bg: '#DDF0DD', color: '#1AAD19' },
];

const ZONE_ITEMS = ['บางนา, กรุงเทพฯ', 'ศรีราชา, ชลบุรี', 'บางปะกง, ฉะเชิงเทรา', 'บางพลี, สมุทรปราการ'];
const TYPE_ITEMS = ['โรงงาน', 'โกดัง/คลังสินค้า'];
const SIZE_ITEMS = ['ต่ำกว่า 1,000 ตร.ม.', '1,000–3,000 ตร.ม.', 'สูงกว่า 3,000 ตร.ม.'];
const PRICE_ITEMS = ['ต่ำกว่า ฿100,000', '฿100,000–300,000', 'สูงกว่า ฿300,000'];

type RawListing = {
  slot: string;
  deal: string;
  photos: string;
  code: string;
  title: string;
  loc: string;
  price: string;
  img: string;
  credit: string;
  creditHref: string;
};

const rawListings: RawListing[] = [
  { slot: 'g1', deal: 'ให้เช่า', photos: '12', code: 'TIP-2041', title: 'โรงงานพร้อมสำนักงาน พื้นที่ 2,700 ตร.ม.', loc: 'บางนา, กรุงเทพฯ', price: '฿ 405,000 / เดือน', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', credit: 'Photo by ThisisEngineering on Unsplash', creditHref: 'https://unsplash.com/@thisisengineering' },
  { slot: 'g2', deal: 'ให้เช่า', photos: '8', code: 'TIP-1987', title: 'โกดังคลังสินค้าไฟฟ้า 3 เฟส พื้นที่ 1,300 ตร.ม.', loc: 'ศรีราชา, ชลบุรี', price: '฿ 176,000 / เดือน', img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80', credit: 'Photo by Petrebels on Unsplash', creditHref: 'https://unsplash.com/@petrebels' },
  { slot: 'g3', deal: 'ขาย', photos: '15', code: 'TIP-1802', title: 'โรงงานในนิคมอุตสาหกรรม พื้นที่ 650 ตร.ม.', loc: 'พานทอง, ชลบุรี', price: '฿ 9.7 ล้าน', img: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80', credit: 'Photo by Simone Hutsch on Unsplash', creditHref: 'https://unsplash.com/@heysupersimi' },
  { slot: 'g4', deal: 'ให้เช่า', photos: '10', code: 'TIP-1755', title: 'โกดังริมถนนเมนใกล้มอเตอร์เวย์ พื้นที่ 1,800 ตร.ม.', loc: 'บางปะกง, ฉะเชิงเทรา', price: '฿ 245,000 / เดือน', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80', credit: 'Photo by Petrebels on Unsplash', creditHref: 'https://unsplash.com/@petrebels' },
  { slot: 'g5', deal: 'ขาย', photos: '9', code: 'TIP-1698', title: 'โรงงานพร้อมออฟฟิศ 2 ชั้น พื้นที่ 3,200 ตร.ม.', loc: 'บางพลี, สมุทรปราการ', price: '฿ 58 ล้าน', img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80', credit: 'Photo by Simone Hutsch on Unsplash', creditHref: 'https://unsplash.com/@heysupersimi' },
  { slot: 'g6', deal: 'ให้เช่า', photos: '14', code: 'TIP-1642', title: 'คลังสินค้าห้องเย็นพร้อมระบบ พื้นที่ 900 ตร.ม.', loc: 'วังน้อย, พระนครศรีอยุธยา', price: '฿ 132,000 / เดือน', img: 'https://images.unsplash.com/photo-1601599963565-b7f49deb352a?w=800&q=80', credit: 'Photo by ThisisEngineering on Unsplash', creditHref: 'https://unsplash.com/@thisisengineering' },
  { slot: 'g7', deal: 'ให้เช่า', photos: '6', code: 'TIP-1601', title: 'โกดังพร้อมสำนักงาน พื้นที่ 1,300 ตร.ม.', loc: 'สมุทรปราการ', price: '฿ 170,000 / เดือน', img: 'https://images.unsplash.com/photo-1601758228041-3caa20ccff67?w=800&q=80', credit: 'Photo by Petrebels on Unsplash', creditHref: 'https://unsplash.com/@petrebels' },
  { slot: 'g8', deal: 'ให้เช่า', photos: '5', code: 'TIP-1571', title: 'โรงงานพื้นที่ 650 ตร.ม. ใกล้สาธุประดิษฐ์', loc: 'กรุงเทพฯ', price: '฿ 87,750 / เดือน', img: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80', credit: 'Photo by Simone Hutsch on Unsplash', creditHref: 'https://unsplash.com/@heysupersimi' },
  { slot: 'g9', deal: 'ขาย', photos: '5', code: 'TIP-1569', title: 'อาคารสำนักงานพร้อมโกดัง พื้นที่ 1,131 ตร.ม.', loc: 'สมุทรปราการ', price: '฿ 203,580 / เดือน', img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80', credit: 'Photo by Petrebels on Unsplash', creditHref: 'https://unsplash.com/@petrebels' },
];

type Listing = RawListing & { type: string; area: string };

export type ListingFilterKey = 'factory-rent' | 'factory-sale' | 'warehouse-rent' | 'warehouse-sale';
const FILTERS: Record<ListingFilterKey, (it: RawListing) => boolean> = {
  'factory-rent': (it) => /โรงงาน/.test(it.title) && !/โกดัง|คลัง/.test(it.title) && it.deal === 'ให้เช่า',
  'factory-sale': (it) => /โรงงาน/.test(it.title) && !/โกดัง|คลัง/.test(it.title) && it.deal === 'ขาย',
  'warehouse-rent': (it) => /โกดัง|คลัง/.test(it.title) && it.deal === 'ให้เช่า',
  'warehouse-sale': (it) => /โกดัง|คลัง/.test(it.title) && it.deal === 'ขาย',
};
function deriveListings(filterKey?: ListingFilterKey): Listing[] {
  const base = filterKey ? rawListings.filter(FILTERS[filterKey]) : rawListings;
  return base.map((it) => {
    const m = it.title.match(/([\d,]+)\s*ตร\.ม\./);
    return { ...it, type: /โกดัง|คลัง/.test(it.title) ? 'โกดัง/คลังสินค้า' : 'โรงงาน', area: m ? m[1] + ' ตร.ม.' : '—' };
  });
}

/** Preset config for SEO/area pages (Listing with a preset filter). */
export interface ListingPreset {
  breadcrumb: string;
  totalCount: string;
  listingMode?: Mode;
  typeSel?: string[];
  filterKey?: ListingFilterKey;
}
const DEFAULT_PRESET: ListingPreset = { breadcrumb: 'อสังหาริมทรัพย์ทั้งหมด', totalCount: '2,956' };

const PAGE_NUMS: (number | '...')[] = [1, 2, 3, '...', 86];

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
  background: active ? '#034956' : 'var(--tint)',
  color: active ? '#fff' : 'var(--text)',
});
const checkStyle = (on: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '7px 8px',
  borderRadius: 9,
  cursor: 'pointer',
  background: on ? 'rgba(3,73,86,.06)' : 'transparent',
});
const boxStyle = (on: boolean): React.CSSProperties => ({
  width: 18,
  height: 18,
  borderRadius: 6,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1.5px solid ' + (on ? '#034956' : 'var(--border)'),
  background: on ? '#034956' : 'transparent',
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

function ListingCard({ it, favFill, onToggleFav }: { it: Listing; favFill: string; onToggleFav: () => void }) {
  const [hover, setHover] = useState(false);
  const [favHover, setFavHover] = useState(false);
  const [detailHover, setDetailHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: '1px solid ' + (hover ? 'var(--accent)' : 'var(--border)'),
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: hover ? '0 20px 40px rgba(2,35,16,.14)' : '0 1px 3px rgba(0,0,0,.05)',
        transform: hover ? 'translateY(-6px)' : 'none',
        transition: 'transform .28s cubic-bezier(.2,.7,.3,1),box-shadow .28s,border-color .28s',
      }}
    >
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transition: 'transform .5s cubic-bezier(.2,.7,.3,1)', transform: hover ? 'scale(1.07)' : 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.img} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(2,35,16,.24) 0%,rgba(2,35,16,0) 34%,rgba(2,35,16,0) 62%,rgba(2,35,16,.38) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 11px', borderRadius: 9999, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.42)', color: '#fff', fontSize: '11.5px', fontWeight: 700, pointerEvents: 'none', backdropFilter: 'blur(6px)' }}>
          <span style={{ width: 5, height: 5, borderRadius: 9999, background: '#fff' }} />
          {it.deal}
        </div>
        <div
          onClick={onToggleFav}
          onMouseEnter={() => setFavHover(true)}
          onMouseLeave={() => setFavHover(false)}
          style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 9999, background: '#2DFB91', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.14)', transition: 'transform .2s', transform: favHover ? 'scale(1.12)' : 'none' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={favFill} stroke="#022310" strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
          </svg>
        </div>
        <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', borderRadius: 6, background: 'rgba(2,35,16,.6)', color: '#fff', fontSize: '10.5px', fontWeight: 600, pointerEvents: 'none', backdropFilter: 'blur(3px)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="M21 15l-5-4-4 3" />
          </svg>
          {it.photos}
        </div>
      </div>
      <div style={{ padding: '16px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(3,73,86,.05)', borderTop: '1px solid rgba(3,73,86,.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--muted2)', letterSpacing: '.04em' }}>{it.code}</span>
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: 'var(--border)' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 9px', borderRadius: 6, background: 'var(--tint)', color: 'var(--accent)', fontSize: '10.5px', fontWeight: 600 }}>{it.type}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: '15.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, minHeight: 44 }}>{it.title}</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7974" strokeWidth="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {it.loc}
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7974" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
          ขนาดพื้นที่รวม {it.area}
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted3)', fontWeight: 500 }}>ราคา</div>
            <div style={{ marginTop: 2, fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-.01em' }}>{it.price}</div>
          </div>
          <Link
            href="/property"
            onMouseEnter={() => setDetailHover(true)}
            onMouseLeave={() => setDetailHover(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 9999, background: detailHover ? '#273c33' : 'var(--surface)', border: '1px solid #273c33', color: detailHover ? '#fff' : '#273c33', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .2s' }}
          >
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </div>
  );
}

/* GET /api/public/listings item */
type ApiListing = {
  code: string; title: string; deal: string; loc: string; price: string;
  area: number | null; areaLabel: string; typeKey: string; img: string | null; photos: string;
};

/* preset filter key → API query (the demo set filters by regex on the title;
   real data filters on deal_type + typeKey server-side) */
const PRESET_QUERY: Record<ListingFilterKey, string> = {
  'factory-rent': 'deal=rent&type=factory',
  'factory-sale': 'deal=sale&type=factory',
  'warehouse-rent': 'deal=rent&type=warehouse',
  'warehouse-sale': 'deal=sale&type=warehouse',
};

export function ListingBody({ preset = DEFAULT_PRESET }: { preset?: ListingPreset }) {
  /* published inventory from the public API; the ported demo set stays as the
     first paint and as the offline fallback (FRONTEND_API_SPEC §2.1/§2.2) */
  const [listings, setListings] = useState<Listing[]>(() => deriveListings(preset.filterKey));
  useEffect(() => {
    let alive = true;
    const q = preset.filterKey ? PRESET_QUERY[preset.filterKey] : '';
    fetch(`/api/public/listings?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items: ApiListing[] } | null) => {
        if (!alive || !d || !Array.isArray(d.items) || !d.items.length) return;
        setListings(d.items.map((it) => ({
          slot: it.code,
          deal: it.deal,
          photos: it.photos,
          code: it.code,
          title: it.title,
          loc: it.loc,
          price: it.price,
          img: it.img || 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
          credit: '',
          creditHref: '',
          type: it.typeKey === 'factory' ? 'โรงงาน' : 'โกดัง/คลังสินค้า',
          area: it.areaLabel || '—',
        })));
      })
      .catch(() => { /* keep the demo set */ });
    return () => { alive = false; };
  }, [preset.filterKey]);
  const [favs, setFavs] = useState<Record<string, boolean>>({});
  const [listingMode, setListingMode] = useState<Mode>(preset.listingMode ?? 'rent');
  const [secOpen, setSecOpen] = useState<Record<SecKey, boolean>>({ zone: true, type: true, size: true, price: true });
  const [zoneSel, setZoneSel] = useState<string[]>([]);
  const [typeSel, setTypeSel] = useState<string[]>(preset.typeSel ?? []);
  const [sizeSel, setSizeSel] = useState<string | null>(null);
  const [priceSel, setPriceSel] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('new');
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activePage, setActivePage] = useState<number>(1);

  const totalCount = preset.totalCount;
  const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const sortLabel = (SORT_DEFS.find((d) => d.key === sortKey) || SORT_DEFS[0]).label;

  const toggleSec = (key: SecKey) => setSecOpen((s) => ({ ...s, [key]: !s[key] }));
  const clearAll = () => {
    setZoneSel([]);
    setTypeSel([]);
    setSizeSel(null);
    setPriceSel(null);
  };
  const toggleSort = () => {
    setSortOpen((v) => !v);
    setShareOpen(false);
  };
  const toggleShare = () => {
    setShareOpen((v) => !v);
    setSortOpen(false);
  };

  type Section = { key: SecKey; title: string; items: { label: string; checked: boolean; select: () => void }[] };
  const sections: Section[] = [
    { key: 'zone', title: 'ทำเล', items: ZONE_ITEMS.map((label) => ({ label, checked: zoneSel.includes(label), select: () => setZoneSel((a) => toggleIn(a, label)) })) },
    { key: 'type', title: 'ประเภทอสังหา', items: TYPE_ITEMS.map((label) => ({ label, checked: typeSel.includes(label), select: () => setTypeSel((a) => toggleIn(a, label)) })) },
    { key: 'size', title: 'ขนาดพื้นที่', items: SIZE_ITEMS.map((label) => ({ label, checked: sizeSel === label, select: () => setSizeSel((cur) => (cur === label ? null : label)) })) },
    { key: 'price', title: 'ช่วงราคา', items: PRICE_ITEMS.map((label) => ({ label, checked: priceSel === label, select: () => setPriceSel((cur) => (cur === label ? null : label)) })) },
  ];

  const renderModePills = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <div onClick={() => setListingMode('rent')} style={pillStyle(listingMode === 'rent')}>ให้เช่า</div>
      <div onClick={() => setListingMode('sale')} style={pillStyle(listingMode === 'sale')}>ขาย</div>
    </div>
  );

  const renderSections = () =>
    sections.map((sec) => (
      <div key={sec.key} style={{ borderTop: '1px solid var(--border)', padding: '14px 0' }}>
        <div onClick={() => toggleSec(sec.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{sec.title}</div>
          {secChev(secOpen[sec.key])}
        </div>
        {secOpen[sec.key] && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sec.items.map((it) => (
              <div key={it.label} onClick={it.select} style={checkStyle(it.checked)}>
                <div style={boxStyle(it.checked)}>{it.checked && checkIcon}</div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{it.label}</div>
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
        <Link href="/" style={{ color: 'var(--muted2)' }}>หน้าแรก</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2">
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{preset.breadcrumb}</span>
      </div>

      {/* TOOLBAR */}
      <div id="toolbar-row" style={{ maxWidth: '1320px', margin: '0 auto', padding: '14px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div id="mobile-filter-btn" onClick={() => setMobileFilterOpen((v) => !v)} style={{ alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            ติวกรอง
          </div>
          <div style={{ fontSize: 15, color: 'var(--muted)' }}>
            พบ <span style={{ fontWeight: 800, color: 'var(--text)' }}>{totalCount}</span> รายการ
          </div>
        </div>
        <div id="sort-share-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '13.5px', color: 'var(--muted2)' }}>เรียงตาม:</span>
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
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 11, cursor: 'pointer', fontSize: '13.5px', fontWeight: active ? 700 : 600, color: active ? '#0D6C3B' : 'var(--text)', background: active ? 'rgba(3,73,86,.06)' : 'transparent' }}
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
          <div style={{ position: 'relative' }}>
            <div onClick={toggleShare} style={{ width: 40, height: 40, borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--accent)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" />
              </svg>
            </div>
            {shareOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 190, background: 'var(--surface)', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,.18)', padding: 8, zIndex: 60 }}>
                {SHARE_DEFS.map((s) => (
                  <div key={s.key} className="share-opt" onClick={() => setShareOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 11, cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{s.char}</div>
                    {s.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LAYOUT */}
      <div id="listing-layout" style={{ maxWidth: '1320px', margin: '0 auto', padding: '20px 24px 80px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28, alignItems: 'start' }}>
        {/* SIDEBAR (desktop) */}
        <aside id="filter-sidebar" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, position: 'sticky', top: 96 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>ตัวกรองการค้นหา</div>
          {renderModePills()}
          {renderSections()}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <div onClick={clearAll} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 9999, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>ล้างค่า</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 9999, background: '#034956', color: '#fff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>ค้นหา</div>
          </div>
        </aside>

        {/* GRID */}
        <div id="listing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
          {listings.map((it) => (
            <ListingCard
              key={it.slot}
              it={it}
              favFill={favs[it.slot] ? '#022310' : 'none'}
              onToggleFav={() => setFavs((f) => ({ ...f, [it.slot]: !f[it.slot] }))}
            />
          ))}
        </div>
      </div>

      {/* PAGINATION */}
      <div id="pagination-row" style={{ maxWidth: '1320px', margin: '-40px auto 0', padding: '0 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9999, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)', cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </div>
        {PAGE_NUMS.map((n, i) => {
          const isActive = n === activePage;
          return (
            <div
              key={`${n}-${i}`}
              onClick={n === '...' ? undefined : () => setActivePage(n)}
              style={{ minWidth: 38, height: 38, padding: '0 6px', borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, cursor: n === '...' ? 'default' : 'pointer', background: isActive ? '#034956' : 'transparent', color: isActive ? '#fff' : n === '...' ? 'var(--muted3)' : 'var(--text)' }}
            >
              {n}
            </div>
          );
        })}
        <div style={{ width: 38, height: 38, borderRadius: 9999, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {mobileFilterOpen && (
        <div onClick={() => setMobileFilterOpen((v) => !v)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.5)', backdropFilter: 'blur(2px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '88%', maxWidth: 340, background: 'var(--bg)', overflow: 'auto', padding: 20, boxShadow: '20px 0 50px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>ตัวกรองการค้นหา</div>
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
              <div onClick={clearAll} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 9999, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>ล้างค่า</div>
              <div onClick={() => setMobileFilterOpen((v) => !v)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 9999, background: '#034956', color: '#fff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>ค้นหา</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
