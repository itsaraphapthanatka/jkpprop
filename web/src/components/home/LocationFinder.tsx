'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/i18n/LocaleLink';
import { useI18n } from '@/i18n/useDict';
import { enumLabel } from '@/i18n/enums';
import { BeltMap } from './BeltMap';
import { PROVINCE } from '@/lib/thaiProvinces';
import type { SectionCopy } from '@/lib/server/sectionCopy';

type Loc = 'air' | 'port' | 'bkk' | 'eec';
type PinCat = 'air' | 'port' | 'bkk';

interface FactorDef { key: Loc; title: string; desc: string; }
interface PinDef { name: string; cat: PinCat; prov: string; eec?: boolean; lat: number; lng: number; }

interface ChipDef { key: Loc; label: string; c: string; }
interface OptionDef { key: string; label: string; href: string; }
/* `count` used to live here as 640+/820+/1,150+/930+ — the panel reads the
   real number from the inventory, so nothing rendered them; they were four
   more invented figures waiting for someone to wire them up by mistake. */
interface Stat { dist: string; prov: string; title: string; }

/* Pin colours in the site's own family — they were a stock blue, teal and
   violet, three hues that appear nowhere else on a cream and deep-green page. */
const CAT: Record<PinCat, string> = { air: '#2E6E8E', port: '#0B6E72', bkk: '#3C6B52' };

const factorDefs: FactorDef[] = [
  { key: 'air', title: 'ใกล้สนามบิน', desc: 'ขนส่งทางอากาศและด่วน' },
  { key: 'port', title: 'ใกล้ท่าเรือ', desc: 'ศูนย์กลางนำเข้า / ส่งออก' },
  { key: 'bkk', title: 'ใกล้กรุงเทพฯ', desc: 'เข้าเมืองสะดวก โลจิสติกส์เมือง' },
  { key: 'eec', title: 'ระเบียงเศรษฐกิจภาคตะวันออก (EEC)', desc: 'หัวใจอุตสาหกรรม EEC' },
];

/* `prov` is the province each one stands in — checked against the real
   boundaries in tests/unit/mapPins.test.ts, and what the pin's card and its
   click are both about */
const pinDefs: PinDef[] = [
  { name: 'ดอนเมือง', cat: 'air', prov: 'bangkok', lat: 13.9126, lng: 100.6068 },
  { name: 'สุวรรณภูมิ', cat: 'air', prov: 'samut_prakan', lat: 13.6900, lng: 100.7501 },
  { name: 'CBD กรุงเทพฯ', cat: 'bkk', prov: 'bangkok', lat: 13.7280, lng: 100.5340 },
  { name: 'ท่าเรือมหาชัย', cat: 'port', prov: 'samut_sakhon', lat: 13.5470, lng: 100.2740 },
  { name: 'ท่าเรือแหลมฉบัง', cat: 'port', eec: true, prov: 'chonburi', lat: 13.0827, lng: 100.8836 },
  { name: 'ท่าเรือมาบตาพุด', cat: 'port', eec: true, prov: 'rayong', lat: 12.6800, lng: 101.1500 },
];

/* what a pin is, in words — the chips already name the three categories */
const CAT_LABEL: Record<PinCat, string> = { air: 'สนามบิน', port: 'ท่าเรือ', bkk: 'ใจกลางกรุงเทพฯ' };

/* the listing's province is free text ("ชลบุรี", "ศรีราชา, ชลบุรี"), so it is
   matched the same way the area counts match it */
function countIn(counts: Record<string, number>, key: string) {
  const th = PROVINCE[key]?.th ?? '';
  const short = th.replace(/^จังหวัด/, '').replace('มหานคร', '');
  return Object.entries(counts).reduce((n, [name, c]) => (short && name.includes(short) ? n + c : n), 0);
}

const chipDefs: ChipDef[] = [
  { key: 'air', label: 'สนามบิน', c: CAT.air },
  { key: 'port', label: 'ท่าเรือ', c: CAT.port },
  { key: 'bkk', label: 'ใจกลางกรุงเทพฯ', c: CAT.bkk },
  { key: 'eec', label: 'EEC', c: 'var(--accent)' },
];

const STATS: Record<Loc, Stat> = {
  air: { dist: '8 กม.', prov: 'สมุทรปราการ · กรุงเทพฯ', title: 'ใกล้สนามบิน' },
  port: { dist: '15 กม.', prov: 'ชลบุรี · ระยอง', title: 'ใกล้ท่าเรือ' },
  bkk: { dist: '12 กม.', prov: 'กรุงเทพฯ · นนทบุรี', title: 'ใกล้กรุงเทพฯ' },
  eec: { dist: 'ในเขต', prov: 'ชลบุรี · ระยอง · ฉะเชิงเทรา', title: 'EEC' },
};

const OPTION_DEFS: Record<Loc, OptionDef[]> = {
  air: [
    { key: 'donmuang', label: 'ดอนเมือง', href: '/airport-donmuang' },
    { key: 'suvarnabhumi', label: 'สุวรรณภูมิ', href: '/airport-suvarnabhumi' },
  ],
  port: [
    { key: 'mahachai', label: 'ท่าเรือมหาชัย', href: '/port-mahachai' },
    { key: 'laemchabang', label: 'ท่าเรือแหลมฉบัง', href: '/port-laem-chabang' },
    { key: 'maptaphut', label: 'ท่าเรือมาบตาพุด', href: '/port-map-ta-phut' },
  ],
  bkk: [
    { key: 'cbd', label: 'กรุงเทพฯ', href: '/bangkok-cbd' },
    { key: 'nonthaburi', label: 'นนทบุรี', href: '/bangkok-nonthaburi' },
  ],
  eec: [
    { key: 'laemchabang', label: 'ท่าเรือแหลมฉบัง', href: '/port-laem-chabang' },
    { key: 'maptaphut', label: 'ท่าเรือมาบตาพุด', href: '/port-map-ta-phut' },
  ],
};

const TITLE_DEFS: Record<Loc, string> = { air: 'เลือกสนามบิน', port: 'เลือกท่าเรือ', bkk: 'เลือกพื้นที่ในกรุงเทพฯ', eec: 'เลือกพื้นที่ใน EEC' };
const SUB_DEFS: Record<Loc, string> = {
  air: 'เลือกสนามบินที่ต้องการดูทรัพย์ใกล้เคียง',
  port: 'เลือกท่าเรือที่ต้องการดูทรัพย์ใกล้เคียง',
  bkk: 'เลือกพื้นที่ที่ต้องการดูทรัพย์ใกล้เคียง',
  eec: 'เลือกพื้นที่ในเขต EEC ที่ต้องการดูทรัพย์ใกล้เคียง',
};

/* ---- style helpers (verbatim from locationVals / adviceVals) ---- */
const factorCardStyle = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '14px', background: on ? 'rgba(var(--pine-rgb),.05)' : 'var(--surface)', border: '1.5px solid ' + (on ? 'var(--pine)' : 'var(--border)'), borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all .2s' });
const iconWrapStyle: React.CSSProperties = { flexShrink: 0, width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#28251D' };
const checkStyle = (on: boolean): React.CSSProperties => ({ flexShrink: 0, width: '20px', height: '20px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--pine)' : 'transparent', border: '1.5px solid ' + (on ? 'var(--pine)' : '#D4D1CA'), transition: 'all .2s' });

const chipStyle = (c: ChipDef, on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '7px', height: '32px', padding: '0 13px', borderRadius: '9999px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 700, background: on ? '#fff' : 'rgba(255,255,255,.72)', color: on ? '#28251D' : '#5F5A52', boxShadow: on ? ('0 4px 12px rgba(0,0,0,.16), inset 0 0 0 1.5px ' + c.c) : '0 2px 6px rgba(0,0,0,.08)', backdropFilter: 'blur(4px)', transition: 'all .2s' });
const chipDotStyle = (c: ChipDef): React.CSSProperties => ({ width: '8px', height: '8px', borderRadius: '9999px', background: c.c, flexShrink: 0 });

const optionStyle = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 15px', borderRadius: '12px', cursor: 'pointer', border: '1.5px solid ' + (on ? 'var(--pine)' : 'var(--border)'), background: on ? 'rgba(var(--pine-rgb),.05)' : 'transparent', color: on ? 'var(--pine)' : 'var(--text)' });
const radioStyle = (on: boolean): React.CSSProperties => ({ width: '19px', height: '19px', borderRadius: '9999px', border: '1.5px solid ' + (on ? 'var(--pine)' : 'var(--border)'), background: on ? 'var(--pine)' : 'transparent', boxShadow: on ? 'inset 0 0 0 3px var(--surface)' : 'none' });

const adviceFabStyle = (hov: boolean): React.CSSProperties => ({ position: 'absolute', bottom: '16px', right: '16px', zIndex: 850, display: 'flex', alignItems: 'center', gap: hov ? '10px' : '0', height: '46px', padding: hov ? '0 20px' : '0', width: hov ? 'auto' : '46px', borderRadius: '9999px', background: 'var(--deep)', cursor: 'pointer', boxShadow: '0 10px 26px rgba(var(--deep-rgb),.35)', transition: 'all .3s cubic-bezier(.2,.8,.3,1)', justifyContent: 'center', overflow: 'hidden' });

/* ---- icon helpers ---- */
function factorIcon(key: Loc) {
  if (key === 'air') return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5a2.1 2.1 0 00-3-3L13 8 4.8 6.2a1 1 0 00-.9 1.7L9 11l-2 3H4l-1 1 4 2 2 4 1-1v-3l3-2 3.1 5.1a1 1 0 001.7-.9z" /></svg>);
  if (key === 'port') return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16l1.5 4h13L20 16" /><path d="M6 16V9h3V6h6v3h3v7" /><path d="M10 9V7h4v2" /></svg>);
  if (key === 'bkk') return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M6 21V5a2 2 0 012-2h5a2 2 0 012 2v16M15 9h3a2 2 0 012 2v10M9 7h0M9 11h0M9 15h0" /></svg>);
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>);
}

/* markup rather than elements: these are handed to Leaflet, which builds the
   marker's HTML itself */
function pinIcon(cat: PinCat) {
  if (cat === 'air') return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5a2.1 2.1 0 00-3-3L13 8 4.8 6.2a1 1 0 00-.9 1.7L9 11l-2 3H4l-1 1 4 2 2 4 1-1v-3l3-2 3.1 5.1a1 1 0 001.7-.9z" /></svg>';
  if (cat === 'port') return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16l1.5 4h13L20 16" /><path d="M6 16V9h3V6h6v3h3v7" /><path d="M10 9V7h4v2" /></svg>';
  return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M6 21V5a2 2 0 012-2h5a2 2 0 012 2v16M15 9h3a2 2 0 012 2v10" /></svg>';
}

export function LocationFinder({ counts = {}, provinceCounts = {}, copy }: { counts?: Partial<Record<Loc, number>>; provinceCounts?: Record<string, number>; copy: SectionCopy }) {
  const { d, locale } = useI18n();
  const pick = (v: string, fallback: string) => v || fallback;
  const router = useRouter();
  const [loc, setLocState] = useState<Loc>('air');
  /* Hovering is a preview, not a choice: the map lifts and the pins for the
     factor under the cursor light up, but the selection only changes on a
     click. */
  const [mapHover, setMapHover] = useState(false);
  const [hoverPin, setHoverPin] = useState<string | null>(null);
  const [hoverFactor, setHoverFactor] = useState<Loc | null>(null);
  const [, setBurstNonce] = useState(0);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationChoice, setLocationChoice] = useState('');
  const [adviceHover, setAdviceHover] = useState(false);
  const [adviceModalOpen, setAdviceModalOpen] = useState(false);

  const setLoc = (k: Loc) => { setLocState(k); setBurstNonce((n) => n + 1); };

  // what the map is showing: the hovered factor if there is one, else the choice
  const shown: Loc = hoverFactor ?? loc;
  const result = STATS[loc];
  const activeDefs = OPTION_DEFS[loc] || [];

  const openLocationModal = () => {
    const defs = OPTION_DEFS[loc] || [];
    setLocationChoice(defs[0] ? defs[0].key : '');
    setLocationModalOpen(true);
  };
  const closeLocationModal = () => setLocationModalOpen(false);
  const submitLocation = () => {
    const sel = (OPTION_DEFS[loc] || []).find((d) => d.key === locationChoice);
    setLocationModalOpen(false);
    if (sel) router.push(sel.href);
  };

  const hov = adviceHover;
  const adviceTooltipVisible = hov && !adviceModalOpen;
  const adviceExpanded = hov;

  return (
    <div style={{ width: '100%', background: 'var(--bg)' }}>
      <section data-anim="1" style={{ maxWidth: '1200px', margin: '0 auto', padding: '88px 24px' }}>
        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, letterSpacing: '.06em', color: 'var(--accent)', textTransform: 'uppercase' }}>{pick(copy.eyebrow, d.locations.eyebrow)}</div>
        <h2 style={{ margin: '8px 0 40px', textAlign: 'center', fontSize: '30px', fontWeight: 700, color: 'var(--text)' }}>{pick(copy.headline, d.locations.heading)}</h2>
        {/* สไลด์ 5-6 ของลูกค้าเขียนว่า "ขยายให้ใหญ่ขึ้น" ทั้งสองหน้า — แผนที่คือ
            สิ่งที่คนใช้เลือกทำเล แต่เดิมได้พื้นที่พอ ๆ กับคอลัมน์ตัวเลือก */}
        <div className="rs-split-l" style={{ display: 'grid', gridTemplateColumns: '0.72fr 1.28fr', gap: '28px', alignItems: 'stretch' }}>

          {/* LEFT: factor selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{d.locations.adviceQuestion}</div>
            {factorDefs.map((f) => {
              const on = loc === f.key;
              return (
                <div
                  key={f.key}
                  data-factor={f.key}
                  onClick={() => setLoc(f.key)}
                  onMouseEnter={() => setHoverFactor(f.key)}
                  onMouseLeave={() => setHoverFactor((c) => (c === f.key ? null : c))}
                  style={factorCardStyle(on)}
                >
                  <div style={iconWrapStyle}>{factorIcon(f.key)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{enumLabel(f.title, locale)}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted2)', marginTop: '1px' }}>{enumLabel(f.desc, locale)}</div>
                  </div>
                  <div style={checkStyle(on)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></div>
                </div>
              );
            })}

            {/* live result card */}
            <div style={{ position: 'relative', overflow: 'hidden', marginTop: '2px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(120deg,#0A0E0C 0%,#0A0E0C 50%,#0E3A22 100%)', borderRadius: '16px', padding: '24px 20px', color: '#fff', boxShadow: '0 18px 40px rgba(0,0,0,.4)' }}>
              <div style={{ position: 'absolute', bottom: '-45%', right: '-12%', width: '64%', height: '180%', background: 'radial-gradient(ellipse at center,rgba(var(--neon-rgb),.28) 0%,rgba(var(--neon-rgb),0) 62%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', fontSize: '12px', fontWeight: 600, letterSpacing: '.04em', color: '#5FE39B', textTransform: 'uppercase' }}>{d.locations.available}</div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1, letterSpacing: '-.02em', color: '#FFFFFF' }}>{counts[loc] ?? 0}</div>
                <div style={{ fontSize: '14px', color: '#C3FED5' }}>{d.locations.results}</div>
              </div>
              <div style={{ position: 'relative', display: 'flex', gap: '22px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,.14)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#7FB89A' }}>{d.locations.avgDistance}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{enumLabel(result.dist, locale)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#7FB89A' }}>{d.locations.topProvinces}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{result.prov.split(' · ').map((x) => enumLabel(x, locale)).join(' · ')}</div>
                </div>
              </div>
              <div onClick={openLocationModal} style={{ position: 'relative', marginTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '46px', borderRadius: '9999px', background: 'var(--neon)', color: '#04140C', fontSize: '14px', fontWeight: 800, cursor: 'pointer', transition: 'transform .15s' }}>{d.locations.seeInArea}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#04140C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
              </div>
            </div>
          </div>

          {/* RIGHT: interactive map */}
          <div
            onMouseEnter={() => setMapHover(true)}
            onMouseLeave={() => { setMapHover(false); setHoverPin(null); }}
            style={{ position: 'relative', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', minHeight: 'min(760px, 78vh)', transform: mapHover ? 'translateY(-4px)' : 'none', boxShadow: mapHover ? '0 26px 60px rgba(var(--ink-rgb),.20), inset 0 0 0 1px rgba(255,255,255,.5)' : '0 18px 44px rgba(var(--ink-rgb),.12), inset 0 0 0 1px rgba(255,255,255,.4)', transition: 'transform .3s cubic-bezier(.2,.8,.3,1), box-shadow .3s' }}
          >
            <BeltMap
              factor={shown}
              pins={pinDefs.map((pd) => ({
                name: enumLabel(pd.name, locale), lat: pd.lat, lng: pd.lng,
                color: CAT[pd.cat], iconSvg: pinIcon(pd.cat), province: pd.prov,
                catLabel: enumLabel(CAT_LABEL[pd.cat], locale),
                count: countIn(provinceCounts, pd.prov),
              }))}
              countLabel={d.locations.properties}
              provinceCount={(key) => countIn(provinceCounts, key)}
              hrefFor={(prov) => `/${locale}/listing?province=${encodeURIComponent(prov.th)}`}
              activePin={hoverPin}
              onPinHover={setHoverPin}
              locale={locale}
              label={d.locations.mapAlt}
              provinceHint={d.locations.seeInArea}
              onProvinceClick={(prov) => router.push(`/${locale}/listing?province=${encodeURIComponent(prov.th)}`)}
            />

            {/* result pill */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 850, display: 'flex', alignItems: 'center', gap: '9px', height: '40px', padding: '0 16px', borderRadius: '9999px', background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(6px)', boxShadow: '0 6px 18px rgba(0,0,0,.14)' }}>
              <span style={{ position: 'relative', display: 'flex', width: '9px', height: '9px' }}><span style={{ position: 'absolute', inset: 0, borderRadius: '9999px', background: 'var(--neon)', animation: 'pinPulse 1.8s ease-out infinite' }} /><span style={{ position: 'relative', width: '9px', height: '9px', borderRadius: '9999px', background: 'var(--accent)' }} /></span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{counts[shown] ?? 0} {d.locations.properties} · {enumLabel(STATS[shown].title, locale)}</span>
            </div>

            {/* legend / filter chips */}
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 850, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {chipDefs.map((c) => {
                const on = loc === c.key;
                return (
                  <div key={c.key} onClick={() => setLoc(c.key)} style={chipStyle(c, on)}>
                    <span style={chipDotStyle(c)} />{enumLabel(c.label, locale)}
                  </div>
                );
              })}
            </div>

            {/* ask for advice fab */}
            {adviceTooltipVisible && (
              <div style={{ position: 'absolute', bottom: '70px', right: '16px', zIndex: 850, maxWidth: '260px', padding: '12px 16px', borderRadius: '14px', background: '#04140C', color: '#fff', fontSize: '12.5px', lineHeight: 1.6, boxShadow: '0 14px 32px rgba(0,0,0,.3)' }}>{d.locations.unsureTitle}</div>
            )}
            <div onMouseEnter={() => setAdviceHover(true)} onMouseLeave={() => setAdviceHover(false)} onClick={() => { setAdviceModalOpen(true); setAdviceHover(false); }} style={adviceFabStyle(hov)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#04140C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 2a7 7 0 00-7 7c0 2.4 1.2 4.2 2.5 5.3.4.3.5.8.5 1.2v1c0 .8.7 1.5 1.5 1.5h5c.8 0 1.5-.7 1.5-1.5v-1c0-.4.1-.9.5-1.2C17.8 13.2 19 11.4 19 9a7 7 0 00-7-7z" /><path d="M10 22h4" /></svg>
              {adviceExpanded && <span style={{ whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 800, color: '#04140C' }}>{d.locations.getAdvice}</span>}
            </div>

            {/* advice modal */}
            {adviceModalOpen && (
              <div onClick={() => setAdviceModalOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: '460px', background: 'var(--surface)', borderRadius: '22px', boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '38px 34px 34px', textAlign: 'center' }}>
                  <div className="close-btn" onClick={() => setAdviceModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', width: '30px', height: '30px', borderRadius: '9999px', background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', transition: 'background .2s,color .2s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>{d.locations.adviceCta}</h3>
                  <p style={{ margin: '14px 0 0', fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.7 }}>{d.locations.adviceHeading}</p>
                  {/* was href="Contact.dc.html" — the prototype filename, a 404 on the live site */}
                  <Link href="/contact" style={{ marginTop: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '52px', borderRadius: '9999px', background: 'var(--neon)', color: 'var(--ink)', fontSize: '15px', fontWeight: 800, transition: 'transform .2s,box-shadow .2s' }}>{d.locations.contactExpert}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.6"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LOCATION PICK MODAL */}
      {locationModalOpen && (
        <div onClick={closeLocationModal} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', background: 'var(--surface)', borderRadius: '22px', boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>{enumLabel(TITLE_DEFS[loc], locale)}</div>
              <div className="close-btn" onClick={closeLocationModal} style={{ width: '30px', height: '30px', borderRadius: '9999px', background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', transition: 'background .2s,color .2s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
              </div>
            </div>
            <p style={{ margin: '6px 0 18px', fontSize: '13.5px', color: 'var(--muted)' }}>{enumLabel(SUB_DEFS[loc], locale)}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeDefs.map((ap) => {
                const on = locationChoice === ap.key;
                return (
                  <div key={ap.key} onClick={() => setLocationChoice(ap.key)} style={optionStyle(on)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <div style={{ flex: 1, fontSize: '14.5px', fontWeight: 700 }}>{ap.label}</div>
                    <div style={radioStyle(on)} />
                  </div>
                );
              })}
            </div>
            <div onClick={submitLocation} style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', borderRadius: '9999px', background: 'var(--pine)', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer' }}>{d.common.confirm}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" style={{ marginLeft: '6px' }}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
