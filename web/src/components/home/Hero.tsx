'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/useDict';
import { useRouter } from 'next/navigation';
import { SIZE_ITEMS, PRICE_ITEMS } from '@/lib/listingFilters';
import { LOAD_STEPS, PUBLIC_TYPE_KEYS, writeFilterParams, type Facets, type PublicTypeKey } from '@/lib/publicFilters';
import { propertyType } from '@/lib/propertySchema';
import { zoneSwatch } from '@/lib/zoneSwatch';
import { enumLabel } from '@/i18n/enums';
import type { SectionCopy } from '@/lib/server/sectionCopy';

type FilterTab = 'type' | 'size' | 'price';
type PropType = PublicTypeKey;

/* ไอคอนของแต่ละประเภทในแผงค้นหา — วาดเป็นเส้น currentColor เพื่อให้กลับสีตาม
   สถานะที่เลือกอยู่ ไอคอนใน propertySchema ฝังสีมาแล้วใช้ตรงนี้ไม่ได้ */
const TYPE_ICON: Record<PropType, string[]> = {
  warehouse: ['M3 21V8l9-5 9 5v13', 'M3 21h18', 'M7 21v-8h10v8'],
  factory: ['M2 21h20', 'M4 21V10l5 3V10l5 3V10l5 3v8', 'M6 6h.01M10 6h.01'],
  showroom: ['M3 9l1.5-5h15L21 9', 'M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0', 'M5 11v10h14V11', 'M9 21v-6h6v6'],
  land: ['M3 20h18M5 20V9l7-4 7 4v11', 'M9 20v-5h6v5'],
};

const CHIP_BASE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  height: 36,
  padding: '0 16px',
  borderRadius: 9999,
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all .2s',
};
const activeChip: React.CSSProperties = { ...CHIP_BASE, background: 'var(--neon)', border: '1px solid var(--neon)', color: 'var(--ink)', fontWeight: 700 };
const idleChip: React.CSSProperties = { ...CHIP_BASE, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.42)', color: '#fff', fontWeight: 600 };

/* the same buckets the listing page filters by — the six sizes and five
   price bands this file used to offer could not be honoured there */
const SIZE_VALS = SIZE_ITEMS;

/* ตัวเลือกทั้งสี่หมวดเคยเป็นรายการที่พิมพ์ไว้ตรงนี้ และไม่ตรงกับค่าที่บันทึก
   จริงสักค่า — เมนูเขียน "บนถนนสายหลัก" ส่วนข้อมูลเก็บว่า "ใกล้ถนนหลัก"
   ตอนนี้มาจากทรัพย์ที่เผยแพร่อยู่จริง ผ่าน props */
const PRICE_VALS = PRICE_ITEMS;

const pillStyle = (on: boolean): React.CSSProperties => ({
  padding: '10px 16px', borderRadius: 9999, fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
  border: '1.5px solid ' + (on ? 'var(--pine)' : 'var(--border)'), background: on ? 'var(--pine)' : 'transparent', color: on ? '#fff' : 'var(--text)',
});
const rowSelStyle = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, cursor: 'pointer', background: on ? 'rgba(var(--pine-rgb),.06)' : 'transparent' });
const boxStyle = (on: boolean, round = false): React.CSSProperties => ({ width: 19, height: 19, borderRadius: round ? 9999 : 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (on ? 'var(--pine)' : 'var(--border)'), background: on ? 'var(--pine)' : 'transparent' });

const CloseBtn = ({ onClick }: { onClick: () => void }) => (
  <div className="close-btn" onClick={onClick} style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', transition: 'background .2s,color .2s' }}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
  </div>
);

const checkIcon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

export function Hero({ copy, facets = { areas: [], colors: [], zones: [], features: [], types: [] } }: { copy: SectionCopy; facets?: Facets }) {
  const { d, locale } = useI18n();
  const pick = (v: string, fallback: string) => v || fallback;
  /* Nothing is chosen until someone chooses it. These both started applied —
     ให้เช่า and โกดัง — so typing a factory's code into the search box and
     pressing search returned nothing at all, filtered out by a pair of
     conditions the visitor never set. */
  const [listingMode, setListingMode] = useState<'rent' | 'sale' | null>(null);
  const [propType, setPropType] = useState<PropType | null>(null);
  const [sizeSel, setSizeSel] = useState<string | null>(null);
  const [priceSel, setPriceSel] = useState<string | null>(null);
  const [term, setTerm] = useState('');
  const router = useRouter();

  /* Everything the panel collects, handed to the listing page as a query it
     knows how to read. Before this the whole panel was decoration: the chips
     set state that nothing ever sent anywhere. */
  const submitSearch = () => {
    const p = new URLSearchParams();
    if (term.trim()) p.set('q', term.trim());
    if (listingMode) p.set('deal', listingMode);
    if (propType) p.set('type', propertyType(propType).label);
    if (sizeSel) p.set('size', sizeSel);
    if (priceSel) p.set('price', priceSel);
    /* สี่หมวดในแผง "ตัวกรองเพิ่มเติม" เคยเก็บ state ไว้เฉย ๆ ไม่เคยส่งไปไหน */
    writeFilterParams(p, { areas: zoneSel, colors: colorSel, zones: estateSel, features: featureSel, load: loadSel });
    router.push(`/${locale}/listing?${p}`);
  };

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('type');

  const [moreOpen, setMoreOpen] = useState(false);
  const [secOpen, setSecOpen] = useState<{ zone: boolean; color: boolean; feature: boolean; load: boolean }>({ zone: true, color: true, feature: true, load: true });
  const [zoneSel, setZoneSel] = useState<string[]>([]);      // ทำเล
  const [estateSel, setEstateSel] = useState<string[]>([]);  // โซน (ปลอดอากร · กนอ. · DG)
  const [colorSel, setColorSel] = useState<string[]>([]);
  const [featureSel, setFeatureSel] = useState<string[]>([]);
  const [loadSel, setLoadSel] = useState<number | null>(null);

  const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const scrollToListings = () => {
    const secs = document.querySelectorAll('section');
    const target = secs[1];
    if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth' });
  };

  const openFilter = (tab: FilterTab) => { setFilterTab(tab); setFilterOpen(true); };

  const tabDef = (key: FilterTab, label: string) => (
    <div
      key={key}
      onClick={() => setFilterTab(key)}
      style={{ padding: '0 0 12px', fontSize: 14, fontWeight: 700, color: filterTab === key ? 'var(--pine)' : 'var(--muted)', borderBottom: filterTab === key ? '2.5px solid var(--pine)' : '2.5px solid transparent', cursor: 'pointer' }}
    >
      {label}
    </div>
  );

  return (
    <section style={{ position: 'relative', height: '620px', background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderBottomRightRadius: '72px' }}>
        <div id="hero-parallax" style={{ position: 'absolute', inset: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={copy.img || "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1600&q=80"} alt={d.nav.warehouse} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderBottomRightRadius: '72px',
          background: 'linear-gradient(90deg,rgba(var(--ink2-rgb),.88) 0%,rgba(var(--ink2-rgb),.64) 36%,rgba(var(--ink2-rgb),.34) 66%,rgba(var(--ink2-rgb),.16) 100%),linear-gradient(180deg,rgba(var(--ink2-rgb),.32) 0%,rgba(var(--ink2-rgb),0) 24%,rgba(var(--ink2-rgb),0) 52%,rgba(var(--ink2-rgb),.58) 100%)',
        }}
      />

      <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h1 style={{ margin: '0 auto', maxWidth: '760px', fontSize: '44px', lineHeight: 1.2, fontWeight: 700, color: '#FFFFFF' }}>
          {/* The stock headline is assembled from three dictionary pieces
              around a rotating property-type word, so there was nothing for a
              CMS headline to replace and the field was ignored. A headline
              typed in the editor now wins outright — the rotator goes with it,
              which is the trade for saying what you want on your own masthead. */}
          {copy.headline ? (
            <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '.08em' }}>
              <span style={{ display: 'inline-block', animation: 'lineUp .85s cubic-bezier(.16,.8,.24,1) both' }}>{copy.headline}</span>
            </span>
          ) : (
          <>
          <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '.08em' }}>
            <span style={{ display: 'inline-block', animation: 'lineUp .85s cubic-bezier(.16,.8,.24,1) both' }}>
              {d.common.search}
              {/* ความสูงทุกที่อ่านจาก --rot-step ตัวเดียว ที่ประกาศไว้ใน globals.css
                  คู่กับคีย์เฟรม rotWords — แก้ตัวเลขที่เดียวแล้วตรงกันทั้งชุด */}
              <span id="hero-rotator" style={{ display: 'inline-flex', flexDirection: 'column', height: 'var(--rot-step)', overflow: 'hidden', verticalAlign: 'bottom' }}>
                <span style={{ display: 'block', color: 'var(--neon)', animation: 'rotWords 9s cubic-bezier(.7,0,.2,1) infinite' }}>
                  <span style={{ display: 'block', height: 'var(--rot-step)' }}>{enumLabel('โกดัง', locale)}</span>
                  <span style={{ display: 'block', height: 'var(--rot-step)' }}>{enumLabel('โรงงาน', locale)}</span>
                  <span style={{ display: 'block', height: 'var(--rot-step)' }}>{enumLabel('คลังสินค้า', locale)}</span>
                  <span style={{ display: 'block', height: 'var(--rot-step)' }}>{enumLabel('ที่ดิน', locale)}</span>
                  <span style={{ display: 'block', height: 'var(--rot-step)' }}>{enumLabel('โกดัง', locale)}</span>
                </span>
              </span>
              {d.hero.headlineTail}
            </span>
          </span>
          <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '.08em' }}>
            <span style={{ display: 'inline-block', animation: 'lineUp .85s cubic-bezier(.16,.8,.24,1) .13s both' }}>{d.hero.headline2}</span>
          </span>
          </>
          )}
        </h1>

        <p style={{ margin: '16px auto 0', maxWidth: '560px', fontSize: 16, color: '#E8FFF0', animation: 'fadeUp .8s ease .34s both' }}>
          {pick(copy.sub, d.hero.sub)}
        </p>

        {/* search panel */}
        <div style={{ marginTop: 28, width: '100%', maxWidth: '860px', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.30)', borderRadius: 16, boxShadow: '0 12px 34px rgba(0,0,0,.22)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: 16, textAlign: 'left' }}>
          <div id="hero-search-bar" style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,.12)', padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* This was a <span> with the placeholder written into it and a
                button with no handler: the search box on the front page could
                not be typed in at all. */}
            <div id="hero-search-textwrap" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7974" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input
                id="hero-search-input"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
                placeholder={d.hero.searchPlaceholder}
                aria-label={d.hero.searchPlaceholder}
                style={{ flex: 1, minWidth: 0, border: 0, outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: 'var(--text)' }}
              />
            </div>
            <button id="hero-search-btn" type="button" onClick={submitSearch} className="search-btn" style={{ border: 0, height: 44, padding: '0 26px', background: 'var(--neon)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, borderRadius: 8, cursor: 'pointer', transition: 'transform .15s', flexShrink: 0 }}>{d.common.search}</button>
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            <div data-hero-chip="rent" onClick={() => setListingMode((m) => (m === 'rent' ? null : 'rent'))} style={listingMode === 'rent' ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M9 21v-6h6v6" /></svg>
              {d.nav.forRent}
            </div>
            <div data-hero-chip="sale" onClick={() => setListingMode((m) => (m === 'sale' ? null : 'sale'))} style={listingMode === 'sale' ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4L13 21a2 2 0 01-2.8 0l-7-7A2 2 0 013 12.6V4h8.6a2 2 0 011.4.6l7.6 7.6a2 2 0 010 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg>
              {d.nav.forSale}
            </div>
            <div data-hero-chip="type" onClick={() => openFilter('type')} style={propType ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
              {propType ? enumLabel(propertyType(propType).label, locale) : enumLabel('ประเภททรัพย์', locale)}
            </div>
            <div data-hero-chip="size" onClick={() => openFilter('size')} style={sizeSel ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
              {sizeSel ? enumLabel(sizeSel, locale) : d.hero.size}
            </div>
            <div data-hero-chip="price" onClick={() => openFilter('price')} style={priceSel ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M14.5 9a2.5 2.5 0 00-2.5-1.8c-1.4 0-2.5.9-2.5 2s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2A2.5 2.5 0 019.5 15" /><path d="M12 6v1.2M12 16.8V18" /></svg>
              {priceSel ? enumLabel(priceSel, locale) : d.hero.priceRange}
            </div>
            <div onClick={() => setMoreOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 9999, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.42)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /><circle cx="9" cy="6" r="2" fill="#fff" /><circle cx="15" cy="12" r="2" fill="#fff" /><circle cx="8" cy="18" r="2" fill="#fff" /></svg>
              {d.hero.moreFilters}
            </div>
          </div>
        </div>
      </div>

      {/* scroll indicator */}
      <div onClick={scrollToListings} style={{ position: 'absolute', left: '50%', bottom: '-26px', transform: 'translateX(-50%)', zIndex: 5, display: 'flex', alignItems: 'center', gap: 12, height: 52, padding: '0 10px 0 12px', background: 'var(--surface)', borderRadius: 9999, boxShadow: '0 10px 30px rgba(var(--ink-rgb),.20)', cursor: 'pointer', animation: 'scrollBob 2.4s ease-in-out infinite' }}>
        <div style={{ position: 'relative', width: 22, height: 34, border: '2px solid var(--pine)', borderRadius: 12, flexShrink: 0 }}>
          <div style={{ position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)', width: 3, height: 7, borderRadius: 2, background: 'var(--pine)', animation: 'scrollDot 1.7s ease-in-out infinite' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{d.hero.headline1}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9999, background: 'var(--accent)', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'chevPulse 1.7s ease-in-out infinite' }}><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>

      {/* ===== MORE FILTERS MODAL ===== */}
      {moreOpen && (
        <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 22, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{d.hero.moreFilters}</div>
              <CloseBtn onClick={() => setMoreOpen(false)} />
            </div>
            <div style={{ overflow: 'auto', padding: '0 24px', flex: 1 }}>
              {/* zone */}
              <MoreSection title={d.hero.zone} open={secOpen.zone} onToggle={() => setSecOpen((s) => ({ ...s, zone: !s.zone }))} icon="zone">
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                  {facets.zones.map((label) => {
                    const on = estateSel.includes(label);
                    return (
                      <div key={label} data-more-opt="estate" onClick={() => setEstateSel((a) => toggleIn(a, label))} style={rowSelStyle(on)}>
                        <div style={boxStyle(on)}>{on && checkIcon}</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{enumLabel(label, locale)}</div>
                      </div>
                    );
                  })}
                </div>
              </MoreSection>
              {/* color zone (ผังเมือง) */}
              <MoreSection title={d.hero.zoneColor} open={secOpen.color} onToggle={() => setSecOpen((s) => ({ ...s, color: !s.color }))} icon="color">
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                  {facets.colors.map((value) => {
                    const on = colorSel.includes(value);
                    const sw = zoneSwatch(value);
                    return (
                      <div key={value} data-more-opt="color" onClick={() => setColorSel((a) => toggleIn(a, value))} style={rowSelStyle(on)}>
                        <div style={boxStyle(on)}>{on && checkIcon}</div>
                        <div
                          style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: '1px solid rgba(0,0,0,.14)',
                            background: !sw ? 'var(--border)'
                              : sw.hatch ? `repeating-linear-gradient(45deg, ${sw.hatch} 0 3px, ${sw.fill} 3px 6px)`
                                : sw.dots ? `radial-gradient(#fff 1.4px, ${sw.fill} 1.5px) 0 0/6px 6px`
                                  : sw.fill,
                          }}
                        />
                        <div style={{ minWidth: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{enumLabel(value, locale)}</div>
                      </div>
                    );
                  })}
                </div>
              </MoreSection>
              {/* feature */}
              <MoreSection title={d.hero.features} open={secOpen.feature} onToggle={() => setSecOpen((s) => ({ ...s, feature: !s.feature }))} icon="feature">
                <div id="hero-feature-grid" style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {facets.features.map((label) => {
                    const on = featureSel.includes(label);
                    return (
                      <div key={label} data-more-opt="feature" onClick={() => setFeatureSel((a) => toggleIn(a, label))} style={rowSelStyle(on)}>
                        <div style={boxStyle(on)}>{on && checkIcon}</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{enumLabel(label, locale)}</div>
                      </div>
                    );
                  })}
                </div>
              </MoreSection>
              {/* load */}
              <MoreSection title={d.hero.floorLoading} open={secOpen.load} onToggle={() => setSecOpen((s) => ({ ...s, load: !s.load }))} icon="load">
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                  {LOAD_STEPS.map((n) => {
                    const on = loadSel === n;
                    return (
                      <div key={n} onClick={() => setLoadSel((cur) => (cur === n ? null : n))} style={rowSelStyle(on)}>
                        <div style={boxStyle(on, true)}>{on && checkIcon}</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{n} {d.common.tonPerSqm}</div>
                      </div>
                    );
                  })}
                </div>
              </MoreSection>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '18px 24px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <div onClick={() => { setZoneSel([]); setEstateSel([]); setColorSel([]); setFeatureSel([]); setLoadSel(null); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 9999, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer' }}>{d.common.clear}</div>
              <div onClick={() => setMoreOpen(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 9999, background: 'var(--pine)', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer' }}>{d.common.apply}</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SEARCH FILTER MODAL (type/size/price tabs) ===== */}
      {filterOpen && (
        <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 22, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px 0', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{d.hero.filters}</div>
              <CloseBtn onClick={() => setFilterOpen(false)} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, marginTop: 18, padding: '0 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              {tabDef('type', d.hero.propertyType)}
              {tabDef('size', d.hero.size)}
              {tabDef('price', d.hero.priceRange)}
            </div>
            <div style={{ padding: 24, overflow: 'auto', flex: 1 }}>
              {filterTab === 'type' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PUBLIC_TYPE_KEYS.map((key) => {
                    const on = propType === key;
                    return (
                      <div key={key} data-hero-type={key} onClick={() => setPropType(on ? null : key)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: '1.5px solid ' + (on ? 'var(--pine)' : 'var(--border)'), background: on ? 'rgba(var(--pine-rgb),.06)' : 'transparent', cursor: 'pointer', color: 'var(--text)' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--pine)' : 'var(--tint)', color: on ? '#fff' : 'var(--accent)', flexShrink: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            {TYPE_ICON[key].map((dPath) => <path key={dPath} d={dPath} />)}
                          </svg>
                        </div>
                        <div style={{ flex: 1, fontSize: '14.5px', fontWeight: 600 }}>{enumLabel(propertyType(key).label, locale)}</div>
                        <div style={{ width: 20, height: 20, borderRadius: 9999, border: '2px solid ' + (on ? 'var(--pine)' : 'var(--border)'), background: on ? 'var(--pine)' : 'transparent', boxShadow: on ? 'inset 0 0 0 3px var(--surface)' : 'none' }} />
                      </div>
                    );
                  })}
                </div>
              )}
              {filterTab === 'size' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {SIZE_VALS.map((label) => {
                    const on = sizeSel === label;
                    return <div key={label} onClick={() => setSizeSel(on ? null : label)} style={pillStyle(on)}>{enumLabel(label, locale)}</div>;
                  })}
                </div>
              )}
              {filterTab === 'price' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {PRICE_VALS.map((label) => {
                    const on = priceSel === label;
                    return <div key={label} onClick={() => setPriceSel(on ? null : label)} style={pillStyle(on)}>{enumLabel(label, locale)}</div>;
                  })}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '18px 24px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              {/* "ล้างค่า" เคยตั้งประเภทเป็นโกดังให้ ซึ่งไม่ใช่การล้าง — คนกดล้างแล้ว
                  ยังติดตัวกรองอยู่โดยไม่รู้ตัว */}
              <div onClick={() => { setPropType(null); setSizeSel(null); setPriceSel(null); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 9999, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer' }}>{d.common.clear}</div>
              <div onClick={() => setFilterOpen(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 9999, background: 'var(--pine)', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer' }}>{d.common.apply}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MoreSection({ title, open, onToggle, icon, children }: { title: string; open: boolean; onToggle: () => void; icon: 'zone' | 'color' | 'feature' | 'load'; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>
          <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon === 'zone' && <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>}
            {icon === 'color' && <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="1.4" /><circle cx="17.5" cy="10.5" r="1.4" /><circle cx="8.5" cy="7.5" r="1.4" /><circle cx="6.5" cy="12.5" r="1.4" /><path d="M12 22a10 10 0 110-20 8 8 0 018 8c0 2-2 3-4 3h-2a2 2 0 00-1 3.7A2 2 0 0112 22z" /></svg>}
            {icon === 'feature' && <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
            {icon === 'load' && <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="M5 8h14" /><path d="M2 8a3 3 0 006 0M16 8a3 3 0 006 0" /><path d="M2 8l2-4M22 8l-2-4" /></svg>}
          </div>
          {title}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
      </div>
      {open && children}
    </div>
  );
}
