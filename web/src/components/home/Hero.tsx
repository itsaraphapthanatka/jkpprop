'use client';

import { useState } from 'react';

type FilterTab = 'type' | 'size' | 'price';
type PropType = 'warehouse' | 'factory';

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
const activeChip: React.CSSProperties = { ...CHIP_BASE, background: '#2DFB91', border: '1px solid #2DFB91', color: '#022310', fontWeight: 700 };
const idleChip: React.CSSProperties = { ...CHIP_BASE, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.42)', color: '#fff', fontWeight: 600 };

const SIZE_VALS = ['500 ตร.ม.', '1,000 ตร.ม.', '2,000 ตร.ม.', '3,000 ตร.ม.', '5,000 ตร.ม.', '10,000 ตร.ม.+'];
const PRICE_VALS = ['ต่ำกว่า ฿50,000', '฿50,000–100,000', '฿100,000–200,000', '฿200,000–500,000', 'สูงกว่า ฿500,000'];
const ZONE_ITEMS = ['เขตปลอดอากร', 'เขตสีม่วง', 'นิคมอุตสาหกรรม'];
const FEATURE_ITEMS = ['เครนเหนือศีรษะ', 'บนถนนสายหลัก', 'พนักงานรักษาความปลอดภัย', 'พร้อมพื้นที่สำนักงาน', 'พื้นที่ขนถ่ายสินค้าแบบยกพื้น', 'อาคารเดี่ยว'];
const LOAD_VALS: [string, string][] = [['any', 'ไม่ระบุต่ำสุด'], ['0.5', '0.5 ton per sqm'], ['1', '1 ton per sqm'], ['2', '2 ton per sqm'], ['3', '3 ton per sqm']];

const pillStyle = (on: boolean): React.CSSProperties => ({
  padding: '10px 16px', borderRadius: 9999, fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
  border: '1.5px solid ' + (on ? '#273c33' : 'var(--border)'), background: on ? '#273c33' : 'transparent', color: on ? '#fff' : 'var(--text)',
});
const rowSelStyle = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, cursor: 'pointer', background: on ? 'rgba(39,60,51,.06)' : 'transparent' });
const boxStyle = (on: boolean, round = false): React.CSSProperties => ({ width: 19, height: 19, borderRadius: round ? 9999 : 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (on ? '#273c33' : 'var(--border)'), background: on ? '#273c33' : 'transparent' });

const CloseBtn = ({ onClick }: { onClick: () => void }) => (
  <div className="close-btn" onClick={onClick} style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', transition: 'background .2s,color .2s' }}>
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
  </div>
);

const checkIcon = (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

export function Hero() {
  const [listingMode, setListingMode] = useState<'rent' | 'sale'>('rent');
  const [propType, setPropType] = useState<PropType>('warehouse');
  const [sizeSel, setSizeSel] = useState<string | null>(null);
  const [priceSel, setPriceSel] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('type');

  const [moreOpen, setMoreOpen] = useState(false);
  const [secOpen, setSecOpen] = useState<{ zone: boolean; feature: boolean; load: boolean }>({ zone: true, feature: true, load: true });
  const [zoneSel, setZoneSel] = useState<string[]>([]);
  const [featureSel, setFeatureSel] = useState<string[]>([]);
  const [loadSel, setLoadSel] = useState('any');

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
      style={{ padding: '0 0 12px', fontSize: 14, fontWeight: 700, color: filterTab === key ? '#273c33' : 'var(--muted)', borderBottom: filterTab === key ? '2.5px solid #273c33' : '2.5px solid transparent', cursor: 'pointer' }}
    >
      {label}
    </div>
  );

  return (
    <section style={{ position: 'relative', height: '620px', background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderBottomRightRadius: '72px' }}>
        <div id="hero-parallax" style={{ position: 'absolute', inset: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=1600&q=80" alt="โกดัง/โรงงาน" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderBottomRightRadius: '72px',
          background: 'linear-gradient(90deg,rgba(2,29,14,.88) 0%,rgba(2,29,14,.64) 36%,rgba(2,29,14,.34) 66%,rgba(2,29,14,.16) 100%),linear-gradient(180deg,rgba(2,29,14,.32) 0%,rgba(2,29,14,0) 24%,rgba(2,29,14,0) 52%,rgba(2,29,14,.58) 100%)',
        }}
      />

      <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h1 style={{ margin: '0 auto', maxWidth: '760px', fontSize: '44px', lineHeight: 1.2, fontWeight: 700, color: '#FFFFFF' }}>
          <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '.08em' }}>
            <span style={{ display: 'inline-block', animation: 'lineUp .85s cubic-bezier(.16,.8,.24,1) both' }}>
              ค้นหา
              <span id="hero-rotator" style={{ display: 'inline-flex', flexDirection: 'column', height: '1.18em', overflow: 'hidden', verticalAlign: 'bottom' }}>
                <span style={{ display: 'block', color: '#2DFB91', animation: 'rotWords 9s cubic-bezier(.7,0,.2,1) infinite' }}>
                  <span style={{ display: 'block', height: '1.18em' }}>โกดัง</span>
                  <span style={{ display: 'block', height: '1.18em' }}>โรงงาน</span>
                  <span style={{ display: 'block', height: '1.18em' }}>คลังสินค้า</span>
                  <span style={{ display: 'block', height: '1.18em' }}>ที่ดิน</span>
                  <span style={{ display: 'block', height: '1.18em' }}>โกดัง</span>
                </span>
              </span>
              ที่เหมาะกับคุณ
            </span>
          </span>
          <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '.08em' }}>
            <span style={{ display: 'inline-block', animation: 'lineUp .85s cubic-bezier(.16,.8,.24,1) .13s both' }}>หรือโรงงานทั่วประเทศไทย</span>
          </span>
        </h1>

        <p style={{ margin: '16px auto 0', maxWidth: '560px', fontSize: 16, color: '#E8FFF0', animation: 'fadeUp .8s ease .34s both' }}>
          รวมรายการโรงงานและโกดังให้เช่า–ขายทั่วประเทศ ที่ผ่านการตรวจสอบและคัดกรองโดยทีมงานมืออาชีพ
        </p>

        {/* search panel */}
        <div style={{ marginTop: 28, width: '100%', maxWidth: '860px', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.30)', borderRadius: 16, boxShadow: '0 12px 34px rgba(0,0,0,.22)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', padding: 16, textAlign: 'left' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,.12)', padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7974" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <span style={{ fontSize: 15, color: 'var(--muted2)' }}>ค้นหาตามทำเล, จังหวัด, รหัสทรัพย์…</span>
            </div>
            <button className="search-btn" style={{ border: 0, height: 44, padding: '0 26px', background: '#2DFB91', color: '#022310', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, borderRadius: 8, cursor: 'pointer', transition: 'transform .15s' }}>ค้นหา</button>
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            <div onClick={() => setListingMode('rent')} style={listingMode === 'rent' ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M9 21v-6h6v6" /></svg>
              สำหรับเช่า
            </div>
            <div onClick={() => setListingMode('sale')} style={listingMode === 'sale' ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4L13 21a2 2 0 01-2.8 0l-7-7A2 2 0 013 12.6V4h8.6a2 2 0 011.4.6l7.6 7.6a2 2 0 010 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" /></svg>
              สำหรับขาย
            </div>
            <div onClick={() => openFilter('type')} style={propType === 'factory' ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
              {propType === 'factory' ? 'โรงงาน' : 'โกดัง'}
            </div>
            <div onClick={() => openFilter('size')} style={sizeSel ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
              {sizeSel || 'ขนาดพื้นที่'}
            </div>
            <div onClick={() => openFilter('price')} style={priceSel ? activeChip : idleChip}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M14.5 9a2.5 2.5 0 00-2.5-1.8c-1.4 0-2.5.9-2.5 2s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2A2.5 2.5 0 019.5 15" /><path d="M12 6v1.2M12 16.8V18" /></svg>
              {priceSel || 'ช่วงราคา'}
            </div>
            <div onClick={() => setMoreOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 9999, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.42)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /><circle cx="9" cy="6" r="2" fill="#fff" /><circle cx="15" cy="12" r="2" fill="#fff" /><circle cx="8" cy="18" r="2" fill="#fff" /></svg>
              ตัวกรองเพิ่มเติม
            </div>
          </div>
        </div>
      </div>

      {/* scroll indicator */}
      <div onClick={scrollToListings} style={{ position: 'absolute', left: '50%', bottom: '-26px', transform: 'translateX(-50%)', zIndex: 5, display: 'flex', alignItems: 'center', gap: 12, height: 52, padding: '0 10px 0 12px', background: 'var(--surface)', borderRadius: 9999, boxShadow: '0 10px 30px rgba(2,35,16,.20)', cursor: 'pointer', animation: 'scrollBob 2.4s ease-in-out infinite' }}>
        <div style={{ position: 'relative', width: 22, height: 34, border: '2px solid #273c33', borderRadius: 12, flexShrink: 0 }}>
          <div style={{ position: 'absolute', left: '50%', top: 6, transform: 'translateX(-50%)', width: 3, height: 7, borderRadius: 2, background: '#273c33', animation: 'scrollDot 1.7s ease-in-out infinite' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>สำรวจอสังหาริมทรัพย์อุตสาหกรรม</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9999, background: '#034956', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'chevPulse 1.7s ease-in-out infinite' }}><path d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>

      {/* ===== MORE FILTERS MODAL ===== */}
      {moreOpen && (
        <div onClick={() => setMoreOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 22, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>ตัวกรองเพิ่มเติม</div>
              <CloseBtn onClick={() => setMoreOpen(false)} />
            </div>
            <div style={{ overflow: 'auto', padding: '0 24px', flex: 1 }}>
              {/* zone */}
              <MoreSection title="โซน" open={secOpen.zone} onToggle={() => setSecOpen((s) => ({ ...s, zone: !s.zone }))} icon="zone">
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                  {ZONE_ITEMS.map((label) => {
                    const on = zoneSel.includes(label);
                    return (
                      <div key={label} onClick={() => setZoneSel((a) => toggleIn(a, label))} style={rowSelStyle(on)}>
                        <div style={boxStyle(on)}>{on && checkIcon}</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </MoreSection>
              {/* feature */}
              <MoreSection title="คุณสมบัติ" open={secOpen.feature} onToggle={() => setSecOpen((s) => ({ ...s, feature: !s.feature }))} icon="feature">
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {FEATURE_ITEMS.map((label) => {
                    const on = featureSel.includes(label);
                    return (
                      <div key={label} onClick={() => setFeatureSel((a) => toggleIn(a, label))} style={rowSelStyle(on)}>
                        <div style={boxStyle(on)}>{on && checkIcon}</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </MoreSection>
              {/* load */}
              <MoreSection title="รับน้ำหนักพื้น" open={secOpen.load} onToggle={() => setSecOpen((s) => ({ ...s, load: !s.load }))} icon="load">
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
                  {LOAD_VALS.map(([key, label]) => {
                    const on = loadSel === key;
                    return (
                      <div key={key} onClick={() => setLoadSel(key)} style={rowSelStyle(on)}>
                        <div style={boxStyle(on, true)}>{on && checkIcon}</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </MoreSection>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '18px 24px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <div onClick={() => { setZoneSel([]); setFeatureSel([]); setLoadSel('any'); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 9999, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer' }}>ล้างค่า</div>
              <div onClick={() => setMoreOpen(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 9999, background: '#273c33', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer' }}>นำไปใช้</div>
            </div>
          </div>
        </div>
      )}

      {/* ===== SEARCH FILTER MODAL (type/size/price tabs) ===== */}
      {filterOpen && (
        <div onClick={() => setFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', maxHeight: '86vh', overflow: 'auto', background: 'var(--surface)', borderRadius: 22, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>ตัวกรองการค้นหา</div>
              <CloseBtn onClick={() => setFilterOpen(false)} />
            </div>
            <div style={{ display: 'flex', gap: 22, marginTop: 18, padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
              {tabDef('type', 'ประเภทอสังหา')}
              {tabDef('size', 'ขนาดพื้นที่')}
              {tabDef('price', 'ช่วงราคา')}
            </div>
            <div style={{ padding: 24 }}>
              {filterTab === 'type' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {([['warehouse', 'โกดัง'], ['factory', 'โรงงาน']] as [PropType, string][]).map(([key, label]) => {
                    const on = propType === key;
                    return (
                      <div key={key} onClick={() => setPropType(key)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: '1.5px solid ' + (on ? '#273c33' : 'var(--border)'), background: on ? 'rgba(39,60,51,.06)' : 'transparent', cursor: 'pointer', color: 'var(--text)' }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#273c33' : 'var(--tint)', color: on ? '#fff' : 'var(--accent)', flexShrink: 0 }}>
                          {key === 'warehouse' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 21h20" /><path d="M4 21V10l5 3V10l5 3V10l5 3v8" /><path d="M6 6h.01M10 6h.01" /></svg>
                          )}
                        </div>
                        <div style={{ flex: 1, fontSize: '14.5px', fontWeight: 600 }}>{label}</div>
                        <div style={{ width: 20, height: 20, borderRadius: 9999, border: '2px solid ' + (on ? '#273c33' : 'var(--border)'), background: on ? '#273c33' : 'transparent', boxShadow: on ? 'inset 0 0 0 3px var(--surface)' : 'none' }} />
                      </div>
                    );
                  })}
                </div>
              )}
              {filterTab === 'size' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {SIZE_VALS.map((label) => {
                    const on = sizeSel === label;
                    return <div key={label} onClick={() => setSizeSel(on ? null : label)} style={pillStyle(on)}>{label}</div>;
                  })}
                </div>
              )}
              {filterTab === 'price' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {PRICE_VALS.map((label) => {
                    const on = priceSel === label;
                    return <div key={label} onClick={() => setPriceSel(on ? null : label)} style={pillStyle(on)}>{label}</div>;
                  })}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '18px 24px 24px', borderTop: '1px solid var(--border)' }}>
              <div onClick={() => { setPropType('warehouse'); setSizeSel(null); setPriceSel(null); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 9999, border: '1.5px solid var(--border)', color: 'var(--text)', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer' }}>ล้างค่า</div>
              <div onClick={() => setFilterOpen(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 9999, background: '#273c33', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer' }}>นำไปใช้</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MoreSection({ title, open, onToggle, icon, children }: { title: string; open: boolean; onToggle: () => void; icon: 'zone' | 'feature' | 'load'; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>
          <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon === 'zone' && <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>}
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
