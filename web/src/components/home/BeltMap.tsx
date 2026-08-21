'use client';

/* The map on the home page, drawn over a real basemap.
 *
 * It has been three things. A 5.8 MB screenshot of Google Maps with the pins
 * floated over it in percentages — cropped by object-fit, so the pins slid off
 * the places they name. Then province outlines drawn by hand in SVG, which put
 * the pins where they belong but gave the reader no roads, no towns and no
 * coastline to recognise: a shape with nothing around it. This draws the same
 * outlines over CARTO's basemap, so "ใกล้ท่าเรือ" lands on a map somebody can
 * actually read.
 *
 * The tiles come from a third party, which is the whole reason the consent
 * category exists — so nothing is requested until the reader has said yes,
 * exactly as with the embedded map on the contact page.
 */
import * as React from 'react';
import type * as LType from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PROVINCES, PROVINCE, type Province } from '@/lib/thaiProvinces';
import { provinceLabel } from '@/i18n/places';
import type { Locale } from '@/i18n/config';
import { useConsent } from '@/lib/consent';
import { useDict } from '@/i18n/useDict';
import { FACTOR_PROVINCES, PIN_FACTORS, type Factor } from '@/lib/mapFactors';

export type MapPin = {
  name: string; lat: number; lng: number; color: string; iconSvg: string;
  /* หมุดที่อยู่ชิดกันให้ป้ายกางคนละทาง ไม่งั้นสองป้ายเกยกันจนอ่านไม่ออก
     (สไลด์ 6 "มันทับกันจนดูไม่ออก" — CBD กับท่าเรือคลองเตยห่างกันราว 3 กม.) */
  labelLeft?: boolean;
  /** ป้ายอยู่ใต้หมุด — ใช้กับหมุดที่ขนาบด้วยหมุดอื่นทั้งซ้ายและขวา */
  labelBelow?: boolean;
  /** the province it stands in — what its card counts and its click opens */
  province: string;
  catLabel: string;
  count: number;
};

/* the belt, with room for the whole of Rayong and Ayutthaya */
const BOUNDS: [[number, number], [number, number]] = [[12.35, 99.4], [14.75, 101.95]];

const FILL_ON = '#0E7C86';
/* สไลด์ 6 · "สี — เปลี่ยนเป็นสีเทา" จังหวัดที่ยังไม่ได้เลือกเคยเป็นสีทราย
   เหลือง ๆ ซึ่งไม่มีอยู่ในชุดสีของแบรนด์ และดูเหมือนถูกเน้นทั้งที่ไม่ได้เลือก
   เทาอมเขียวจาง ๆ ทำให้จังหวัดที่เลือกอยู่เด่นขึ้นด้วย */
const FILL_OFF = '#C7D2CE';
const EDGE_OFF = '#9FB0AA';

/* The same card twice: a quiet one that follows the cursor, and one that stays
   put when something is chosen and carries the link. The hovering one used to
   carry the link too — a line that looked like a link, sat under the cursor,
   and could not be clicked, because a Leaflet tooltip takes no pointer. */
function cardHtml(o: { cat?: string; name: string; province: string; count: number; countLabel: string; go?: string; href?: string }) {
  const esc = escapeHtml;
  return (o.cat ? `<span class="belt-card-cat">${esc(o.cat)}</span>` : '')
    + `<span class="belt-card-name">${esc(o.name)}</span>`
    + (o.province && o.province !== o.name ? `<span class="belt-card-prov">${esc(o.province)}</span>` : '')
    + `<span class="belt-card-count"><b>${o.count}</b> ${esc(o.countLabel)}</span>`
    + (o.go && o.href ? `<a class="belt-card-go" data-go href="${esc(o.href)}">${esc(o.go)} &rarr;</a>` : '');
}

export function BeltMap({ factor, pins, activePin, onPinHover, locale, label, onProvinceClick, provinceHint, countLabel, provinceCount, hrefFor }: {
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
  /** the word for "listings", for the card on a pin */
  countLabel: string;
  /** how many published properties stand in a province */
  provinceCount: (key: string) => number;
  /** where the link in a chosen card goes */
  hrefFor: (province: Province) => string;
}) {
  const d = useDict();
  const consent = useConsent();
  const allowed = consent.allows('embeds');

  const host = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<LType.Map | null>(null);
  const layers = React.useRef<Record<string, LType.Polygon>>({});
  const markers = React.useRef<Record<string, LType.Marker>>({});
  const [built, setBuilt] = React.useState(0);
  const factorRef = React.useRef(factor);
  factorRef.current = factor;

  /* the handlers change every render; the layers are built once, so they read
     the current ones through a ref rather than being rebuilt to capture them */
  const cb = React.useRef({ onProvinceClick, onPinHover });
  cb.current = { onProvinceClick, onPinHover };

  /* One place decides how a province looks, because four things now have an
     opinion about it: what the reader picked, what the cursor is on, what the
     factor covers, and everything else. */
  const hoverRef = React.useRef<string | null>(null);
  const selectedRef = React.useRef<string | null>(null);

  const styleFor = React.useCallback((key: string) => {
    if (selectedRef.current === key) return { fillColor: FILL_ON, fillOpacity: 0.72, color: '#022E38', weight: 3.4 };
    if (hoverRef.current === key) return { fillColor: FILL_ON, fillOpacity: 0.6, color: '#0B5F68', weight: 3 };
    if ((FACTOR_PROVINCES[factorRef.current] ?? []).includes(key)) return { fillColor: FILL_ON, fillOpacity: 0.5, color: '#0B5F68', weight: 2.2 };
    return { fillColor: FILL_OFF, fillOpacity: 0.34, color: EDGE_OFF, weight: 1.2 };
  }, []);

  const repaint = React.useCallback(() => {
    for (const [key, poly] of Object.entries(layers.current)) {
      poly.setStyle(styleFor(key));
      poly.getElement()?.setAttribute('data-lit', (FACTOR_PROVINCES[factorRef.current] ?? []).includes(key) ? '1' : '0');
      poly.getElement()?.setAttribute('data-selected', selectedRef.current === key ? '1' : '0');
      if (selectedRef.current === key || hoverRef.current === key) poly.bringToFront();
    }
  }, [styleFor]);

  /* สไลด์ 6 · "มันทับกันจนดูไม่ออก" — หมุดในกรุงเทพฯ อยู่ชิดกันจนป้ายชื่อเกยกัน
     การไล่ขยับทีละหมุดจะพังอีกทันทีที่ซูมหรือขนาดจอเปลี่ยน จึงวัดกรอบของป้ายจริง
     หลังวาดเสร็จ แล้วซ่อนป้ายที่ทับของที่แสดงไปแล้ว จุดหมุดยังอยู่ครบ และป้ายที่
     ซ่อนจะโผล่เมื่อเอาเมาส์ไปชี้

     ป้ายของหมวดที่เลือกอยู่ได้จองที่ก่อนเสมอ (data-on="1") — เดิมไล่ตามลำดับที่
     Leaflet วาด ป้าย "ท่าเรือคลองเตย" จึงแพ้ "CBD กรุงเทพฯ" ที่วาดก่อนและถูกซ่อน
     ทั้งที่คนกดเลือก "ใกล้ท่าเรือ" อยู่ ท่าเรืออีกสามแห่งมีชื่อครบแต่คลองเตยไม่มี
     ซึ่งเป็นท่าเรือที่ลูกค้าขอให้เพิ่มมาพอดี (สไลด์ 7) */
  const declutter = React.useCallback(() => {
    const pins = Array.from(host.current?.querySelectorAll<HTMLElement>('.belt-pin') ?? []);
    for (const el of pins) el.classList.remove('belt-pin-quiet');
    const order = [...pins].sort((a, b) =>
      Number(b.getAttribute('data-on') === '1') - Number(a.getAttribute('data-on') === '1'));
    const kept: DOMRect[] = [];
    for (const el of order) {
      const lb = el.querySelector<HTMLElement>('.belt-pin-label');
      if (!lb) continue;
      const r = lb.getBoundingClientRect();
      const hits = kept.some((k) => r.left < k.right && r.right > k.left && r.top < k.bottom && r.bottom > k.top);
      if (hits) el.classList.add('belt-pin-quiet');
      else kept.push(r);
    }
  }, []);

  const setHovered = React.useCallback((key: string | null) => { hoverRef.current = key; repaint(); }, [repaint]);
  const select = React.useCallback((key: string | null) => { selectedRef.current = key; repaint(); }, [repaint]);

  React.useEffect(() => {
    if (!allowed || !host.current || map.current) return;
    let dead = false;

    const cleanups: (() => void)[] = [];
    void (async () => {
      const L = (await import('leaflet')).default;
      if (dead || !host.current) return;

      /* สไลด์ 6 · "ล็อคไม่ให้แผนที่เลื่อนได้" — แผนที่นี้เป็นตัวเลือกจังหวัด
         ไม่ใช่แผนที่ให้สำรวจ พอลากหรือซูมได้ คนก็เลื่อนหลุดกรอบแล้วหาทางกลับ
         ไม่เจอ ปิดทุกทางที่ทำให้มุมมองขยับ เหลือแค่ชี้แล้วคลิก */
      const m = L.map(host.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,   // the page has to stay scrollable through it
        dragging: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        /* สไลด์ 6 · "ขยายแผนที่" — กล่องแผนที่ใหญ่อยู่แล้ว แต่ตัวแผนที่ข้างในเล็ก
           เพราะ Leaflet ปัดระดับซูมเป็นจำนวนเต็ม fitBounds จึงเลือกระดับที่ "พอ
           ใส่ได้" ระดับถัดไปล้นกรอบก็ถอยลงมาหนึ่งขั้น ซึ่งเล็กลงครึ่งหนึ่ง
           จังหวัดเลยกินพื้นที่แค่ 48% ของกรอบ ที่เหลือเป็นที่ว่าง
           zoomSnap:0 ให้ซูมเป็นทศนิยมได้ ภาพจึงเต็มกรอบพอดีจริง ๆ (85%) */
        zoomSnap: 0,
      });
      m.fitBounds(BOUNDS, { padding: [8, 8] });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 12,
        minZoom: 6,
      }).addTo(m);

      for (const p of PROVINCES) {
        // leaflet takes [lat, lng]; the file is [lng, lat], as GeoJSON is
        const latlngs = p.rings.map((r) => r.map(([lng, lat]) => [lat, lng] as [number, number]));
        const poly = L.polygon(latlngs, {
          weight: 1.4,
          color: EDGE_OFF,
          fillColor: FILL_OFF,
          fillOpacity: 0.42,
          className: `belt-prov belt-${p.key}`,
        }).addTo(m);
        poly.bindTooltip(
          cardHtml({ name: provinceLabel(p.th, locale), province: '', count: provinceCount(p.key), countLabel }),
          { className: 'belt-card', sticky: true, direction: 'top', opacity: 1 },
        );
        poly.bindPopup(
          cardHtml({ name: provinceLabel(p.th, locale), province: '', count: provinceCount(p.key), countLabel, go: provinceHint, href: hrefFor(p) }),
          { className: 'belt-card-pop', closeButton: true, autoPan: false },
        );
        /* Clicking used to leave the page at once. It picks the area out
           instead, and the card it opens is where the reader decides to go. */
        poly.on('click', () => select(p.key));
        poly.on('mouseover', () => { closeCards(poly); setHovered(p.key); });
        poly.on('mouseout', () => setHovered(null));
        poly.getElement()?.setAttribute('data-province', p.key);
        layers.current[p.key] = poly;
      }

      /* ลูกค้าเรียกอาการนี้ว่า "แผนที่เละ" — การ์ดของแต่ละจังหวัดค้างเปิดพร้อมกัน
         เต็มจอ เพราะ Leaflet ปิด tooltip เมื่อได้ mouseout เท่านั้น พอเลื่อนเมาส์
         เร็ว ๆ ข้ามหลายจังหวัด (หรือรูปหลายเหลี่ยมถูกวาดใหม่ตอนเปลี่ยนสี)
         mouseout บางตัวไม่มาถึง การ์ดนั้นก็ค้างอยู่ตลอด ยิ่งแผนที่ใหญ่ยิ่งค้างเยอะ
         ทุกครั้งที่เปิดการ์ดใหม่ จึงไล่ปิดของเดิมทั้งหมดก่อน */
      const closeCards = (keep?: L.Layer) => {
        m.eachLayer((l) => {
          if (l !== keep && 'closeTooltip' in l) (l as L.Polygon).closeTooltip();
        });
      };
      m.on('mouseout', () => closeCards());

      for (const pin of pins) {
        const mk = L.marker([pin.lat, pin.lng], {
          icon: L.divIcon({
            className: `belt-pin${pin.labelLeft ? ' belt-pin-left' : ''}${pin.labelBelow ? ' belt-pin-below' : ''}`,
            html: pin.labelLeft
              ? `<span class="belt-pin-label">${escapeHtml(pin.name)}</span><span class="belt-pin-dot" style="background:${pin.color}">${pin.iconSvg}</span>`
              : `<span class="belt-pin-dot" style="background:${pin.color}">${pin.iconSvg}</span><span class="belt-pin-label">${escapeHtml(pin.name)}</span>`,
            /* no iconSize: Leaflet would write it onto the element, and a
               0x0 marker is a marker nothing can point at — the dot and the
               label sized the box themselves */
            iconAnchor: [15, 15],
          }),
          keyboard: false,
          interactive: true,
        }).addTo(m);
        /* Hovering a pin used to scale it by a tenth and nothing else — the
           state it set was read by no one. It now says what the place is, how
           many published properties stand in its province, and lights that
           province; clicking opens them. */
        const prov = PROVINCE[pin.province];
        const base = { cat: pin.catLabel, name: pin.name, province: provinceLabel(prov?.th ?? '', locale), count: pin.count, countLabel };
        mk.bindTooltip(cardHtml(base), { className: 'belt-card', direction: 'top', offset: [0, -20], opacity: 1 });
        mk.bindPopup(cardHtml({ ...base, go: provinceHint, href: prov ? hrefFor(prov) : undefined }),
          { className: 'belt-card-pop', closeButton: true, autoPan: false, offset: [0, -20] });
        mk.on('mouseover', () => { closeCards(mk); cb.current.onPinHover(pin.name); setHovered(pin.province); });
        mk.on('mouseout', () => { cb.current.onPinHover(null); setHovered(null); });
        mk.on('click', () => select(pin.province));
        mk.getElement()?.setAttribute('data-pin', pin.name);
        markers.current[pin.name] = mk;
      }

      /* the link is markup Leaflet built, so it is wired up when the card
         opens — and it stays a real href, so it works without any of this */
      m.on('popupopen', (e) => {
        const el = (e.popup as LType.Popup).getElement();
        el?.querySelector<HTMLAnchorElement>('[data-go]')?.addEventListener('click', (ev) => {
          const target = PROVINCES.find((p) => hrefFor(p) === (ev.currentTarget as HTMLAnchorElement).getAttribute('href'));
          if (!target) return;
          ev.preventDefault();
          cb.current.onProvinceClick(target);
        });
      });
      // choosing nothing is also a choice
      m.on('popupclose', () => select(null));
      m.on('click', () => select(null));

      map.current = m;
      setBuilt((n) => n + 1);   // now there is something to paint
      m.on('zoomend', () => setTimeout(declutter, 60));
      cleanups.push(() => m.off('zoomend'));

      /* the panel animates in; leaflet needs telling once the box has settled
         พอล็อกไม่ให้ลากแล้ว ต้องจัดกรอบใหม่ทุกครั้งที่ขนาดกล่องเปลี่ยน ไม่งั้น
         ภาพจะค้างอยู่คนละที่โดยที่คนดูขยับกลับเองไม่ได้ */
      const refit = () => { m.invalidateSize(); m.fitBounds(BOUNDS, { padding: [8, 8] }); setTimeout(declutter, 80); };
      setTimeout(refit, 250);
      window.addEventListener('resize', refit);
      cleanups.push(() => window.removeEventListener('resize', refit));
    })();

    return () => { dead = true; for (const c of cleanups) c(); };
  }, [allowed, locale, pins, provinceHint]);

  React.useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  /* the choice only repaints — the view stays put, so the reader keeps the
     place they were looking at */
  React.useEffect(() => {
    repaint();
    for (const [name, mk] of Object.entries(markers.current)) {
      const on = (PIN_FACTORS[name] ?? []).includes(factor);
      const el = mk.getElement();
      if (el) {
        el.style.opacity = on ? '1' : '0.32';
        el.style.zIndex = on ? '600' : '400';
        el.setAttribute('data-on', on ? '1' : '0');
      }
    }
    /* เลือกหมวดใหม่แล้วต้องจัดป้ายใหม่ด้วย ไม่งั้นผู้ชนะยังเป็นชุดเดิมจากตอนวาด
       ครั้งแรก — กด "ใกล้ท่าเรือ" กี่ครั้งป้ายคลองเตยก็ไม่โผล่ */
    declutter();
  }, [factor, allowed, built, repaint, declutter]);

  React.useEffect(() => {
    for (const [name, mk] of Object.entries(markers.current)) {
      mk.getElement()?.classList.toggle('belt-pin-active', activePin === name);
    }
  }, [activePin, built]);

  if (!allowed) {
    return (
      <div
        id="lf-map-plane"
        role="img"
        aria-label={label}
        style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 24 }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="1.8">
          <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{d.consent.mapBlocked}</div>
        <p style={{ margin: 0, maxWidth: 360, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{d.consent.mapBlockedBody}</p>
        <button
          id="belt-map-allow"
          onClick={() => consent.save(true)}
          style={{ height: 42, padding: '0 20px', border: 0, borderRadius: 10, background: 'var(--accent)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          {d.consent.mapAllow}
        </button>
      </div>
    );
  }

  return <div id="lf-map-plane" ref={host} role="img" aria-label={label} style={{ position: 'absolute', inset: 0 }} />;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
