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
import { PROVINCES, type Province } from '@/lib/thaiProvinces';
import { provinceLabel } from '@/i18n/places';
import type { Locale } from '@/i18n/config';
import { useConsent } from '@/lib/consent';
import { useDict } from '@/i18n/useDict';
import { FACTOR_PROVINCES, PIN_FACTORS, type Factor } from '@/lib/mapFactors';

export type MapPin = { name: string; lat: number; lng: number; color: string; iconSvg: string };

/* the belt, with room for the whole of Rayong and Ayutthaya */
const BOUNDS: [[number, number], [number, number]] = [[12.35, 99.4], [14.75, 101.95]];

const FILL_ON = '#0E7C86';
const FILL_OFF = '#E8C98A';

export function BeltMap({ factor, pins, activePin, onPinHover, locale, label, onProvinceClick, provinceHint }: {
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
  const d = useDict();
  const consent = useConsent();
  const allowed = consent.allows('embeds');

  const host = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<LType.Map | null>(null);
  const layers = React.useRef<Record<string, LType.Polygon>>({});
  const markers = React.useRef<Record<string, LType.Marker>>({});
  const [built, setBuilt] = React.useState(0);

  /* the handlers change every render; the layers are built once, so they read
     the current ones through a ref rather than being rebuilt to capture them */
  const cb = React.useRef({ onProvinceClick, onPinHover });
  cb.current = { onProvinceClick, onPinHover };

  React.useEffect(() => {
    if (!allowed || !host.current || map.current) return;
    let dead = false;

    void (async () => {
      const L = (await import('leaflet')).default;
      if (dead || !host.current) return;

      const m = L.map(host.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,   // the page has to stay scrollable through it
        dragging: true,
        doubleClickZoom: true,
      });
      m.fitBounds(BOUNDS, { padding: [8, 8] });
      m.setMaxBounds([[10.5, 97], [17, 104.5]]);

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
          color: '#C08A2E',
          fillColor: FILL_OFF,
          fillOpacity: 0.42,
          className: `belt-prov belt-${p.key}`,
        }).addTo(m);
        poly.bindTooltip(`${provinceLabel(p.th, locale)} · ${provinceHint}`, { sticky: true, direction: 'top' });
        poly.on('click', () => cb.current.onProvinceClick(p));
        poly.getElement()?.setAttribute('data-province', p.key);
        layers.current[p.key] = poly;
      }

      for (const pin of pins) {
        const mk = L.marker([pin.lat, pin.lng], {
          icon: L.divIcon({
            className: 'belt-pin',
            html: `<span class="belt-pin-dot" style="background:${pin.color}">${pin.iconSvg}</span><span class="belt-pin-label">${escapeHtml(pin.name)}</span>`,
            iconSize: [0, 0],
            iconAnchor: [17, 17],
          }),
          keyboard: false,
          interactive: true,
        }).addTo(m);
        mk.on('mouseover', () => cb.current.onPinHover(pin.name));
        mk.on('mouseout', () => cb.current.onPinHover(null));
        mk.getElement()?.setAttribute('data-pin', pin.name);
        markers.current[pin.name] = mk;
      }

      map.current = m;
      setBuilt((n) => n + 1);   // now there is something to paint
      // the panel animates in; leaflet needs telling once the box has settled
      setTimeout(() => m.invalidateSize(), 250);
    })();

    return () => { dead = true; };
  }, [allowed, locale, pins, provinceHint]);

  React.useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  /* the choice only repaints — the view stays put, so the reader keeps the
     place they were looking at */
  React.useEffect(() => {
    const lit = new Set(FACTOR_PROVINCES[factor] ?? []);
    for (const [key, poly] of Object.entries(layers.current)) {
      const on = lit.has(key);
      poly.setStyle({
        fillColor: on ? FILL_ON : FILL_OFF,
        fillOpacity: on ? 0.5 : 0.3,
        color: on ? '#0B5F68' : '#C9A055',
        weight: on ? 2.2 : 1.2,
      });
      poly.getElement()?.setAttribute('data-lit', on ? '1' : '0');
      if (on) poly.bringToFront();
    }
    for (const [name, mk] of Object.entries(markers.current)) {
      const on = (PIN_FACTORS[name] ?? []).includes(factor);
      const el = mk.getElement();
      if (el) {
        el.style.opacity = on ? '1' : '0.32';
        el.style.zIndex = on ? '600' : '400';
        el.setAttribute('data-on', on ? '1' : '0');
      }
    }
  }, [factor, allowed, built]);

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
