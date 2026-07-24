'use client';

import * as React from 'react';

/* ============================================================
   Ported from AdminBranding.dc.html — the DCLogic-driven theme
   editor (presets, brand colors, fonts, radius, logo/identity)
   plus a live multi-tenant preview (desktop/mobile).
   The topbar "รีเซ็ต" button (rendered inside AdminShell's header
   via the `actions` prop) mutates the same theme state as the body,
   so state lives in a shared client context wrapping AdminShell.
   ============================================================ */

type Radius = 'sharp' | 'sm' | 'md' | 'round';
type FontKey = 'noto' | 'plex' | 'inter';
type Device = 'desktop' | 'mobile';

interface BrandState {
  primary: string;
  accent: string;
  neon: string;
  pine: string;
  font: FontKey;
  radius: Radius;
  device: Device;
}

/* --- pure helpers (verbatim from DCLogic renderVals) --- */
const darken = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * 0.45); g = Math.round(g * 0.45); b = Math.round(b * 0.45);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
};
const hexA = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
};

/* --- shared state context (spans AdminShell header + body) --- */
interface BrandingCtxValue {
  state: BrandState;
  setState: (patch: Partial<BrandState>) => void;
}
const BrandingContext = React.createContext<BrandingCtxValue | null>(null);

function useBranding(): BrandingCtxValue {
  const ctx = React.useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = React.useState<BrandState>({
    primary: '#034956', accent: '#034956', neon: '#2DFB91', pine: '#273c33', font: 'noto', radius: 'md', device: 'desktop',
  });
  const setState = React.useCallback(
    (patch: Partial<BrandState>) => setStateRaw((s) => ({ ...s, ...patch })),
    [],
  );
  return <BrandingContext.Provider value={{ state, setState }}>{children}</BrandingContext.Provider>;
}

/* --- topbar right cluster (design <header> right side) --- */
export function BrandingHeaderActions() {
  const { setState } = useBranding();
  const resetTheme = () =>
    setState({ primary: '#034956', accent: '#034956', neon: '#2DFB91', pine: '#273c33', font: 'noto', radius: 'md' });
  return (
    <div id="brand-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div onClick={resetTheme} style={{ height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"></path><path d="M3 3v5h5"></path></svg>รีเซ็ต
      </div>
      <div className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"></path></svg>บันทึกธีม
      </div>
    </div>
  );
}

/* --- render-value shapes --- */
interface SwatchVal { val: string; select: () => void; active: boolean; style: React.CSSProperties; }
interface ColorRow { label: string; value: string; options: SwatchVal[]; }
interface PresetVal { name: string; primary: string; accent: string; neon: string; pine: string; active: boolean; select: () => void; style: React.CSSProperties; }
interface FontVal { key: FontKey; name: string; sample: string; stack: string; active: boolean; select: () => void; style: React.CSSProperties; }
interface RadiusVal { label: string; value: Radius; select: () => void; style: React.CSSProperties; }
interface PreviewCard { title: string; price: string; img: string; }

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 };

export function BrandingBody() {
  const { state: S, setState } = useBranding();

  const radiusMap: Record<Radius, string> = { sharp: '4px', sm: '10px', md: '16px', round: '22px' };
  const fontMap: Record<FontKey, string> = { noto: "'Noto Sans Thai',sans-serif", plex: "'IBM Plex Sans Thai',sans-serif", inter: "'Inter','Noto Sans Thai',sans-serif" };

  const primaries = ['#034956', '#0D6C3B', '#1E5AA8', '#7A3FB0', '#B0403F'];
  const accents = ['#034956', '#0D6C3B', '#9A741C', '#B0403F', '#1E5AA8'];
  const neons = ['#2DFB91', '#3FD9A6', '#FFD23F', '#4FC3F7', '#FF8A65'];

  const swatch = (val: string, active: boolean, on: () => void): SwatchVal => ({
    val, select: on, active,
    style: {
      width: 36, height: 36, borderRadius: 9, background: val, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: active ? '0 0 0 2px #fff, 0 0 0 4px ' + val : 'inset 0 0 0 1px rgba(0,0,0,.08)',
      transition: 'box-shadow .15s',
    },
  });

  const presetDefs = [
    { name: 'JKP เขียว', primary: '#034956', accent: '#034956', neon: '#2DFB91', pine: '#273c33' },
    { name: 'โคบอลต์', primary: '#1E5AA8', accent: '#1E5AA8', neon: '#4FC3F7', pine: '#1B3A5C' },
    { name: 'รอยัลม่วง', primary: '#7A3FB0', accent: '#7A3FB0', neon: '#C9A0FF', pine: '#3D2159' },
    { name: 'ซันเซ็ต', primary: '#B0403F', accent: '#9A741C', neon: '#FF8A65', pine: '#5C2A29' },
    { name: 'ป่าดิบ', primary: '#0D6C3B', accent: '#0D6C3B', neon: '#8BE04E', pine: '#123924' },
    { name: 'มหาสมุทร', primary: '#0E6E7A', accent: '#0E6E7A', neon: '#38E0D0', pine: '#0A3B42' },
    { name: 'ทองคำ', primary: '#8A6A16', accent: '#9A741C', neon: '#FFD23F', pine: '#4A3A0E' },
    { name: 'กราไฟต์', primary: '#2E3338', accent: '#3E4650', neon: '#7DEFA1', pine: '#1A1D20' },
    { name: 'ชมพูกุหลาบ', primary: '#B03A6E', accent: '#B03A6E', neon: '#FF9FC4', pine: '#5C2039' },
    { name: 'อินดิโก', primary: '#3C3F9E', accent: '#3C3F9E', neon: '#A5B4FF', pine: '#22245C' },
    { name: 'ส้มเพลิง', primary: '#C2500F', accent: '#C2500F', neon: '#FFB067', pine: '#5E2707' },
    { name: 'เทอร์ควอยซ์', primary: '#0B7285', accent: '#0B7285', neon: '#5FE3F0', pine: '#073E48' },
  ];
  const presets: PresetVal[] = presetDefs.map((p) => {
    const active = S.primary === p.primary && S.neon === p.neon;
    return {
      ...p, active,
      select: () => setState({ primary: p.primary, accent: p.accent, neon: p.neon, pine: p.pine }),
      style: {
        display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 12, cursor: 'pointer',
        border: '1.5px solid ' + (active ? '#0D6C3B' : 'var(--border)'),
        background: active ? 'rgba(13,108,59,.05)' : 'transparent',
      },
    };
  });

  const colorRows: ColorRow[] = [
    { label: 'สีหลัก (Primary)', value: S.primary, options: primaries.map((v) => swatch(v, S.primary === v, () => setState({ primary: v, accent: v }))) },
    { label: 'สีเน้น (Accent)', value: S.accent, options: accents.map((v) => swatch(v, S.accent === v, () => setState({ accent: v }))) },
    { label: 'สี CTA (Neon)', value: S.neon, options: neons.map((v) => swatch(v, S.neon === v, () => setState({ neon: v }))) },
  ];

  const fontDefs: { key: FontKey; name: string; sample: string; stack: string }[] = [
    { key: 'noto', name: 'Noto Sans Thai', sample: 'ทันสมัย อ่านง่าย (ค่าเริ่มต้น)', stack: fontMap.noto },
    { key: 'plex', name: 'IBM Plex Sans Thai', sample: 'โมเดิร์น มีเอกลักษณ์', stack: fontMap.plex },
    { key: 'inter', name: 'Inter + Noto', sample: 'สากล เหมาะ B2B', stack: fontMap.inter },
  ];
  const fonts: FontVal[] = fontDefs.map((f) => ({
    ...f, active: S.font === f.key,
    select: () => setState({ font: f.key }),
    style: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
      border: '1.5px solid ' + (S.font === f.key ? '#0D6C3B' : 'var(--border)'),
      background: S.font === f.key ? 'rgba(13,108,59,.05)' : 'var(--bg)',
    },
  }));

  const radiusEntries: [Radius, string][] = [['sharp', 'เหลี่ยม'], ['sm', 'เล็ก'], ['md', 'กลาง'], ['round', 'มน']];
  const radiusOpts: RadiusVal[] = radiusEntries.map(([k, label]) => ({
    label, value: k,
    select: () => setState({ radius: k }),
    style: {
      flex: 1, height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1.5px solid ' + (S.radius === k ? '#0D6C3B' : 'var(--border)'),
      background: S.radius === k ? '#0D6C3B' : 'transparent',
      color: S.radius === k ? '#fff' : 'var(--text)',
    },
  }));

  const radiusLabel = radiusMap[S.radius];
  const isDesktop = S.device === 'desktop';

  const deviceDesktopStyle: React.CSSProperties = { height: 28, padding: '0 14px', borderRadius: 9999, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', background: S.device === 'desktop' ? '#273c33' : 'transparent', color: S.device === 'desktop' ? '#fff' : 'var(--muted)' };
  const deviceMobileStyle: React.CSSProperties = { height: 28, padding: '0 14px', borderRadius: 9999, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', background: S.device === 'mobile' ? '#273c33' : 'transparent', color: S.device === 'mobile' ? '#fff' : 'var(--muted)' };

  const previewFrameStyle: React.CSSProperties = { border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 44px rgba(0,0,0,.1)', transition: 'max-width .35s cubic-bezier(.2,.8,.3,1)', margin: '0 auto', maxWidth: S.device === 'mobile' ? 390 : '100%' };

  const primary = S.primary;
  const primaryDark = darken(S.primary);
  const accent = S.accent;
  const neon = S.neon;
  const pine = S.pine;
  const neonGlow = hexA(S.neon, 0.18);
  const fontStack = fontMap[S.font];
  const brandName = 'JKP Property';
  const pillRadius = radiusMap[S.radius] === '4px' ? '6px' : '9999px';
  const cardRadius = radiusMap[S.radius];
  const cardCols = S.device === 'mobile' ? '1fr' : '1fr 1fr';

  const previewCards: PreviewCard[] = [
    { title: 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', price: '฿405,000', img: '#D8DDD9' },
    { title: 'โรงงาน ร.ง.4 บางนา', price: '฿9.7M', img: '#CFD8D4' },
  ];

  return (
    <div id="brand-split" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'start' }}>

      {/* CONTROLS */}
      <div className="a-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* preset */}
        <div style={card}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>พรีเซ็ตธีมสำเร็จรูป</div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted2)', marginBottom: 14 }}>คลิกเปลี่ยนทั้งชุดสีในคลิกเดียว</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {presets.map((p) => (
              <div key={p.name} onClick={p.select} style={p.style}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: p.primary }}></span>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: p.accent }}></span>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: p.neon }}></span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* brand colors */}
        <div style={card}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>สีแบรนด์</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {colorRows.map((c) => (
              <div key={c.label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>{c.label}</span>
                  <code style={{ fontSize: 11, color: 'var(--muted2)' }}>{c.value}</code>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {c.options.map((o) => (
                    <div key={o.val} onClick={o.select} style={o.style}>
                      {o.active && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* typography */}
        <div style={card}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>ฟอนต์</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {fonts.map((f) => (
              <div key={f.key} onClick={f.select} style={f.style}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: f.stack }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{f.sample}</div>
                </div>
                {f.active && (
                  <div style={{ width: 20, height: 20, borderRadius: 9999, background: '#0D6C3B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* radius */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)' }}>ความโค้งมุม</span>
            <code style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 700 }}>{radiusLabel}</code>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {radiusOpts.map((r) => (
              <div key={r.value} onClick={r.select} style={r.style}>{r.label}</div>
            ))}
          </div>
        </div>

        {/* logo + identity */}
        <div style={card}>
          <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>โลโก้ &amp; ข้อมูล</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, border: '1.5px dashed var(--border)', borderRadius: 12, cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>ลากโลโก้มาวาง</div>
              <div style={{ fontSize: 11, color: 'var(--muted3)' }}>PNG โปร่งใส แนะนำสูง 80px</div>
            </div>
          </div>
          <input placeholder="ชื่อแบรนด์" defaultValue="JKP Property" style={{ marginTop: 12, width: '100%', height: 42, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }} />
        </div>
      </div>

      {/* LIVE PREVIEW */}
      <div id="brand-preview" style={{ position: 'sticky', top: 88 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)', minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#2DFB91', flexShrink: 0 }}></span>ตัวอย่างสด — อัปเดตทันทีเมื่อปรับ
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9999, padding: 3, flexShrink: 0 }}>
            <div onClick={() => setState({ device: 'desktop' })} style={deviceDesktopStyle}>เดสก์ท็อป</div>
            <div onClick={() => setState({ device: 'mobile' })} style={deviceMobileStyle}>มือถือ</div>
          </div>
        </div>

        <div style={previewFrameStyle}>
          {/* mini header */}
          <div style={{ background: '#fff', borderBottom: '1px solid #ECE8E1', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>J</div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#28251D', fontFamily: fontStack }}>{brandName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {isDesktop && (
                <span style={{ fontSize: 11, color: '#5F5A52', fontFamily: fontStack }}>โรงงาน · โกดัง · เกี่ยวกับเรา</span>
              )}
              <div style={{ height: 30, padding: '0 14px', borderRadius: pillRadius, background: neon, color: '#04140C', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', fontFamily: fontStack, whiteSpace: 'nowrap', flexShrink: 0 }}>ติดต่อทีมงาน</div>
            </div>
          </div>
          {/* mini hero */}
          <div style={{ position: 'relative', height: 200, background: 'linear-gradient(120deg,' + primaryDark + ' 0%,' + primary + ' 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 26px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: 9999, background: neonGlow }}></div>
            <div style={{ position: 'relative', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: neon, textTransform: 'uppercase', fontFamily: fontStack }}>ทำเลยุทธศาสตร์</div>
            <div style={{ position: 'relative', marginTop: 6, fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.25, maxWidth: '70%', fontFamily: fontStack }}>ค้นหา<span style={{ color: neon }}>โกดัง</span>ที่เหมาะกับคุณ</div>
            <div style={{ position: 'relative', marginTop: 16, display: 'flex', gap: 10 }}>
              <div style={{ height: 38, padding: '0 20px', borderRadius: pillRadius, background: neon, color: '#04140C', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', fontFamily: fontStack }}>ค้นหาทรัพย์</div>
              <div style={{ height: 38, padding: '0 20px', borderRadius: pillRadius, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', fontFamily: fontStack }}>ปรึกษาฟรี</div>
            </div>
          </div>
          {/* mini content */}
          <div style={{ padding: '20px 26px', background: '#F9F8F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 22, height: 2, background: accent, borderRadius: 2 }}></span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: accent, textTransform: 'uppercase', fontFamily: fontStack }}>ทรัพย์มาใหม่</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: cardCols, gap: 14 }}>
              {previewCards.map((pc) => (
                <div key={pc.title} style={{ background: '#fff', border: '1.5px solid #E7E3DC', borderRadius: cardRadius, overflow: 'hidden' }}>
                  <div style={{ height: 90, background: pc.img, position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 8, left: 8, height: 20, padding: '0 8px', borderRadius: 9999, background: 'rgba(255,255,255,.95)', color: accent, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', fontFamily: fontStack }}>ให้เช่า</span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#28251D', fontFamily: fontStack }}>{pc.title}</div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap', rowGap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: accent, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{pc.price}</span>
                      <div style={{ height: 26, padding: '0 12px', borderRadius: pillRadius, background: '#fff', border: '1px solid ' + pine, color: pine, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', fontFamily: fontStack, whiteSpace: 'nowrap', flexShrink: 0 }}>ดูรายละเอียด</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF4F3', color: '#034956', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 2l2 5 5 .5-4 3.5 1 5-4-2.5-4 2.5 1-5-4-3.5 5-.5z"></path></svg>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>ธีมนี้จะใช้กับ <b style={{ color: 'var(--text)' }}>ทั้งเว็บสาธารณะและ CMS</b> ของ tenant นี้ — clone tenant ใหม่แล้วปรับสีที่นี่ = rebrand ทั้งระบบใน 2 นาที</div>
        </div>
      </div>
    </div>
  );
}
