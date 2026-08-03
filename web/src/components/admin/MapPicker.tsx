'use client';

import * as React from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

/* Interactive location picker (Leaflet + OpenStreetMap) matching the ops
   import form: draggable pin, click-to-move, "ตำแหน่งฉัน" geolocation, and
   synced ละติจูด / ลองจิจูด / Google-Map-link inputs. Leaflet is imported
   dynamically inside the effect so it never runs during SSR. */

const DEFAULT_LAT = 13.7854444;
const DEFAULT_LNG = 100.6223333;

const inputStyle: React.CSSProperties = { width: '100%', height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13.5px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' };

// violet teardrop pin (matches the design)
const PIN_HTML = '<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="#7A3FB0"/><circle cx="15" cy="15" r="6" fill="#fff"/></svg>';

const fmt = (n: number) => n.toFixed(7);

export function MapPicker({ label }: { label?: string }) {
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const markerRef = React.useRef<LeafletMarker | null>(null);
  const [lat, setLat] = React.useState(String(DEFAULT_LAT));
  const [lng, setLng] = React.useState(String(DEFAULT_LNG));
  const [link, setLink] = React.useState('');
  const [status, setStatus] = React.useState('');

  // keep latest setters available to leaflet handlers without re-init
  const sync = React.useRef((la: number, ln: number) => { setLat(fmt(la)); setLng(fmt(ln)); });
  sync.current = (la, ln) => { setLat(fmt(la)); setLng(fmt(ln)); setLink(`https://www.google.com/maps?q=${fmt(la)},${fmt(ln)}`); };

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !boxRef.current || mapRef.current) return;
      const map = L.map(boxRef.current, { center: [DEFAULT_LAT, DEFAULT_LNG], zoom: 14, scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      const icon = L.divIcon({ html: PIN_HTML, className: 'jkp-pin', iconSize: [30, 40], iconAnchor: [15, 40] });
      const marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;
      marker.on('dragend', () => { const p = marker.getLatLng(); sync.current(p.lat, p.lng); });
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => { marker.setLatLng(e.latlng); sync.current(e.latlng.lat, e.latlng.lng); });
      // leaflet needs a size recalculation once laid out — guarded so it never
      // fires on a removed map (unmount within the 200ms window)
      timer = setTimeout(() => { if (!cancelled && mapRef.current) mapRef.current.invalidateSize(); }, 200);
    })();
    return () => { cancelled = true; if (timer) clearTimeout(timer); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; } };
  }, []);

  const gmapLink = (la: number, ln: number) => `https://www.google.com/maps?q=${fmt(la)},${fmt(ln)}`;
  // move the pin when lat/lng typed manually — do NOT recenter on every keystroke
  const applyCoords = (la: number, ln: number, recenter = false) => {
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return;
    if (markerRef.current) markerRef.current.setLatLng([la, ln]);
    if (recenter && mapRef.current) mapRef.current.setView([la, ln]);
  };
  const onLat = (v: string) => { setLat(v); const la = parseFloat(v), ln = parseFloat(lng); applyCoords(la, ln); if (Number.isFinite(la) && Number.isFinite(ln)) setLink(gmapLink(la, ln)); };
  const onLng = (v: string) => { setLng(v); const la = parseFloat(lat), ln = parseFloat(v); applyCoords(la, ln); if (Number.isFinite(la) && Number.isFinite(ln)) setLink(gmapLink(la, ln)); };
  // try to pull coords out of a pasted Google-Map link
  const onLink = (v: string) => {
    setLink(v);
    const m = v.match(/(-?\d{1,2}\.\d{3,})[,@ ]+(-?\d{1,3}\.\d{3,})/);
    if (m) { const la = parseFloat(m[1]), ln = parseFloat(m[2]); setLat(fmt(la)); setLng(fmt(ln)); applyCoords(la, ln, true); }
  };

  const locateMe = () => {
    if (!navigator.geolocation) { setStatus('อุปกรณ์ไม่รองรับการระบุตำแหน่ง'); return; }
    setStatus('กำลังค้นหาตำแหน่ง…');
    navigator.geolocation.getCurrentPosition(
      (pos) => { const { latitude, longitude } = pos.coords; sync.current(latitude, longitude); applyCoords(latitude, longitude); if (mapRef.current) mapRef.current.setView([latitude, longitude], 16); setStatus(''); },
      () => setStatus('ไม่สามารถเข้าถึงตำแหน่งได้ (ตรวจสอบสิทธิ์)'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>{label || 'ตำแหน่งบนแผนที่'}</label>
        <div onClick={locateMe} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontWeight: 700, color: 'var(--text)', cursor: 'pointer', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /></svg>
          ตำแหน่งฉัน
        </div>
      </div>
      <div ref={boxRef} style={{ width: '100%', height: 260, borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', zIndex: 0, background: 'var(--bg)' }} />
      <div style={{ marginTop: 5, fontSize: 11, color: 'var(--muted3)' }}>คลิกบนแผนที่หรือลากหมุดเพื่อปักตำแหน่ง{status ? ` · ${status}` : ''}</div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        <div style={{ minWidth: 0 }}><label style={labelStyle}>ละติจูด</label><input value={lat} onChange={(e) => onLat(e.target.value)} inputMode="decimal" style={inputStyle} /></div>
        <div style={{ minWidth: 0 }}><label style={labelStyle}>ลองจิจูด</label><input value={lng} onChange={(e) => onLng(e.target.value)} inputMode="decimal" style={inputStyle} /></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>ลิงก์แผนที่ (Google Map)</label>
        <input value={link} onChange={(e) => onLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." style={inputStyle} />
      </div>
    </div>
  );
}
