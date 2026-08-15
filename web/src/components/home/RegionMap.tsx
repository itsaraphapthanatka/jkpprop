'use client';

/* The map on the home page, drawn from real province boundaries.
 *
 * It used to be a 5.8 MB screenshot of Google Maps with the pins floated over
 * it in percentages: cropped by object-fit, so the pins slid off the places
 * they name, and the region a factor covers could only be suggested with a
 * circle. Provinces are shapes now, so "ใกล้ท่าเรือ" can light up the three
 * provinces that actually hold the ports, and a reader can hover one to see
 * which it is.
 *
 * The raised look is two passes of the same outline: a darker copy offset
 * downwards for the side wall, then the top face over it.
 */
import * as React from 'react';
import { PROVINCES, type Province } from '@/lib/thaiProvinces';
import { provinceLabel } from '@/i18n/places';
import type { Locale } from '@/i18n/config';

export type Factor = 'air' | 'port' | 'bkk' | 'eec';

/* Which provinces each factor is actually about. The EEC three are the
   statutory corridor; the rest follow the pins on the map. */
export const FACTOR_PROVINCES: Record<Factor, string[]> = {
  // the two the panel names: Don Mueang is in Bangkok, Suvarnabhumi in Samut Prakan
  air: ['bangkok', 'samut_prakan'],
  port: ['samut_sakhon', 'chonburi', 'rayong'],
  bkk: ['bangkok', 'nonthaburi', 'samut_prakan', 'pathum_thani'],
  eec: ['chonburi', 'rayong', 'chachoengsao'],
};

export type MapPin = { name: string; lat: number; lng: number; color: string; icon: React.ReactNode };

/* the drawing box, fitted to the provinces themselves with a little air */
const PAD = 0.12;
const bounds = (() => {
  let w = 180, e = -180, s = 90, n = -90;
  for (const p of PROVINCES) for (const ring of p.rings) for (const [x, y] of ring) {
    if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y;
  }
  const padX = (e - w) * PAD, padY = (n - s) * PAD;
  return { west: w - padX, east: e + padX, south: s - padY, north: n + padY };
})();

const VW = 1000;
const VH = Math.round((VW * (bounds.north - bounds.south)) / (bounds.east - bounds.west));
const px = (lng: number) => ((lng - bounds.west) / (bounds.east - bounds.west)) * VW;
const py = (lat: number) => ((bounds.north - lat) / (bounds.north - bounds.south)) * VH;

const pathOf = (rings: [number, number][][]) =>
  rings.map((r) => r.map(([x, y], i) => `${i ? 'L' : 'M'}${px(x).toFixed(1)} ${py(y).toFixed(1)}`).join('') + 'Z').join('');

const PATHS = PROVINCES.map((p) => ({ ...p, d: pathOf(p.rings) }));

/* The map used to be drawn in blue, purple and gold — none of which appear
   anywhere else on this site, so it read as a stock illustration dropped onto
   a cream and deep-green page. One colour now, the brand's own, and the four
   factors differ by which provinces light up rather than by hue. */
const LIT = '#034956';
const LIT_LIGHT = '#0A6B78';
const LIT_WALL = '#022E38';

type Box = { x: number; y: number; w: number; h: number };
const FULL: Box = { x: 0, y: 0, w: VW, h: VH };

/* The frame that holds a factor's provinces, with room around them. Choosing a
   factor eases the map to this instead of leaving the reader to find the three
   provinces that just changed colour — and it is the system driving, so the
   wheel keeps scrolling the page. */
function frameOf(keys: string[]): Box {
  const pts = PROVINCES.filter((p) => keys.includes(p.key)).flatMap((p) => p.rings.flat());
  if (!pts.length) return FULL;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [lng, lat] of pts) {
    const x = px(lng), y = py(lat);
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const pad = Math.max((x1 - x0), (y1 - y0)) * 0.3;
  let w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2;
  // keep the drawing's shape, or the provinces come out stretched
  const ratio = VW / VH;
  if (w / h > ratio) h = w / ratio; else w = h * ratio;
  // never frame more than the whole map, and never wander off it
  w = Math.min(w, VW); h = Math.min(h, VH);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return {
    x: Math.max(0, Math.min(VW - w, cx - w / 2)),
    y: Math.max(0, Math.min(VH - h, cy - h / 2)),
    w, h,
  };
}

export function RegionMap({ factor, pins, activePin, onPinHover, locale, label, onProvinceClick, provinceHint }: {
  factor: Factor;
  pins: MapPin[];
  activePin: string | null;
  onPinHover: (name: string | null) => void;
  locale: Locale;
  /** the accessible name, from the dictionary — the site has three languages */
  label: string;
  /** clicking a province opens the listing narrowed to it */
  onProvinceClick: (province: Province) => void;
  provinceHint: string;
}) {
  const [hover, setHover] = React.useState<string | null>(null);

  /* the viewBox, eased toward whatever the choice frames */
  const target = React.useMemo(() => frameOf(FACTOR_PROVINCES[factor] ?? []), [factor]);
  const [view, setView] = React.useState<Box>(target);
  const fromRef = React.useRef<Box>(target);
  const rafRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    const from = fromRef.current;
    const t0 = performance.now();
    const dur = 650;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const next = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      };
      setView(next);
      fromRef.current = next;
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  // pins and type keep their size on screen as the frame tightens
  const k = view.w / VW;
  const lit = new Set(FACTOR_PROVINCES[factor] ?? []);

  return (
    <svg
      id="lf-map-plane"
      viewBox={`${view.x.toFixed(1)} ${view.y.toFixed(1)} ${view.w.toFixed(1)} ${view.h.toFixed(1)}`}
      style={{ position: 'absolute', inset: 0, margin: 'auto', width: '100%', height: '100%', display: 'block' }}
      role="img"
      aria-label={label}
    >
      <defs>
        {/* Light falls from the top-left in all of them, so the blocks read as
            one solid thing rather than four separately shaded ones. */}
        <linearGradient id="rm-sea" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#E4EDED" /><stop offset="100%" stopColor="#CEDCDD" />
        </linearGradient>
        <linearGradient id="rm-land" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#F2EDE3" /><stop offset="100%" stopColor="#E3DCCE" />
        </linearGradient>
        <linearGradient id="rm-lit" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={LIT_LIGHT} /><stop offset="100%" stopColor={LIT} />
        </linearGradient>
        <filter id="rm-lift" x="-25%" y="-25%" width="150%" height="170%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#022310" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* the sea, so the coastline reads as a coastline */}
      <rect x={0} y={0} width={VW} height={VH} fill="url(#rm-sea)" />

      {PATHS.map((p) => {
        const on = lit.has(p.key);
        const hov = hover === p.key;
        // how far the block sits above its own shadow
        const lift = hov ? 10 : on ? 6 : 0;
        return (
          <g
            key={p.key}
            data-province={p.key}
            data-lit={on ? '1' : '0'}
            onMouseEnter={() => setHover(p.key)}
            onMouseLeave={() => setHover((c) => (c === p.key ? null : c))}
            onClick={() => onProvinceClick(p)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProvinceClick(p); } }}
            aria-label={`${provinceLabel(p.th, locale)} — ${provinceHint}`}
            style={{ cursor: 'pointer', transition: 'transform .3s cubic-bezier(.2,.8,.3,1)' }}
          >
            {/* side wall — the same outline, dropped by the lift, in a darker
                shade of its own colour so it reads as a cut edge rather than a
                blur. It carries the shadow, which the top face then sits on. */}
            <path
              d={p.d}
              transform={`translate(0 ${lift})`}
              fill={on ? LIT_WALL : '#D6CEBF'}
              filter={lift ? 'url(#rm-lift)' : undefined}
            />
            {/* top face */}
            <path
              d={p.d}
              fill={on ? 'url(#rm-lit)' : 'url(#rm-land)'}
              stroke={on ? '#F4FBF8' : '#D5CDBE'}
              strokeWidth={on ? 1.6 : 0.9}
              style={{
                transform: `translateY(${-lift}px)`,
                filter: hov ? 'brightness(1.08)' : 'none',
                transition: 'transform .3s cubic-bezier(.2,.8,.3,1), filter .25s',
              }}
            />
            {hov && (() => {
              const cx = px(p.rings[0].reduce((a, [x]) => a + x, 0) / p.rings[0].length);
              const cy = py(p.rings[0].reduce((a, [, y]) => a + y, 0) / p.rings[0].length) - lift;
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <text x={cx} y={cy} textAnchor="middle" style={{ fontSize: 18 * k, fontWeight: 800, fill: on ? '#F4FBF8' : '#3B4740', paintOrder: 'stroke', stroke: on ? LIT_WALL : '#F6F2E9', strokeWidth: 5 * k, strokeLinejoin: 'round' }}>
                    {provinceLabel(p.th, locale)}
                  </text>
                  <text x={cx} y={cy + 16 * k} textAnchor="middle" style={{ fontSize: 11 * k, fontWeight: 700, fill: on ? '#DCF3EC' : '#6E7A70', paintOrder: 'stroke', stroke: on ? LIT_WALL : '#F6F2E9', strokeWidth: 3.5 * k, strokeLinejoin: 'round' }}>
                    {provinceHint}
                  </text>
                </g>
              );
            })()}
          </g>
        );
      })}

      {pins.map((pin) => {
        const on = FACTOR_PROVINCES[factor].length > 0 && pinIsLit(pin, factor);
        const hov = activePin === pin.name;
        const x = px(pin.lng), y = py(pin.lat);
        return (
          <g
            key={pin.name}
            data-pin={pin.name}
            transform={`translate(${x} ${y}) scale(${(hov ? 1.18 : 1) * k})`}
            onMouseEnter={() => onPinHover(pin.name)}
            onMouseLeave={() => onPinHover(null)}
            style={{ opacity: on ? 1 : 0.66, transition: 'opacity .35s', pointerEvents: 'none' }}
          >
            {/* an SVG element scales about the viewport origin unless the box
                is named — without this the ring flew off across the map */}
            {on && <circle r={26} fill="none" stroke={pin.color} strokeWidth={2} opacity={0.5} style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'pinPulse 1.8s ease-out infinite' }} />}
            {/* a white collar under the dot: the pin sits on a province filled
                in its own colour, and a coloured dot on a coloured field is a
                dot nobody can find */}
            <circle r={17} fill="#fff" opacity={0.94} />
            <circle r={13} fill={on ? pin.color : '#7C867E'} />
            {/* the icon is authored 12 units wide; at 0.67 it was a speck
                inside a 30-unit dot */}
            <g transform="translate(-9 -9) scale(1.5)">{pin.icon}</g>
            {/* The label used to sit on a rounded box whose width was guessed
                from the number of characters — a rule from a Latin alphabet,
                so "CBD กรุงเทพฯ" ran straight out of its own box. A halo drawn
                by the text itself fits whatever the word turns out to be. */}
            <text
              textAnchor="middle"
              y={34}
              style={{
                fontSize: 15, fontWeight: 800, fill: on ? '#12241D' : '#5C665E',
                paintOrder: 'stroke', stroke: '#FFFFFF', strokeWidth: 6,
                strokeLinejoin: 'round',
              }}
            >
              {pin.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* a pin belongs to the factor when it stands in one of its provinces */
function pinIsLit(pin: MapPin, factor: Factor) {
  return PIN_FACTORS[pin.name]?.includes(factor) ?? false;
}

export const PIN_FACTORS: Record<string, Factor[]> = {
  'ดอนเมือง': ['air'],
  'สุวรรณภูมิ': ['air'],
  'CBD กรุงเทพฯ': ['bkk'],
  'ท่าเรือมหาชัย': ['port'],
  'ท่าเรือแหลมฉบัง': ['port', 'eec'],
  'ท่าเรือมาบตาพุด': ['port', 'eec'],
};
