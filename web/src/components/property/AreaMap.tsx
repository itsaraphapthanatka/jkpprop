'use client';

/* แผนที่ระดับพื้นที่บนหน้าทรัพย์
 *
 * หัวข้อบนหน้าเขียนว่า "แสดงระดับพื้นที่เพื่อความเป็นส่วนตัว" แต่ในกล่องไม่มี
 * แผนที่อยู่เลย มีแค่ลิงก์ไป Google Maps บนพื้นสีเทา คนดูจึงไม่เห็นว่าทรัพย์
 * อยู่แถวไหนจนกว่าจะกดออกจากเว็บไป
 *
 * ความเป็นส่วนตัว (AGENT.md §7 · FR-LST-02): พิกัดจริงไม่ออกจากเซิร์ฟเวอร์
 * ฝั่งเซิร์ฟเวอร์ปัดพิกัดให้หยาบก่อนส่งมา แล้วที่นี่วาดเป็นวงกลมคลุมพื้นที่
 * ไม่ใช่หมุดชี้จุด — ตำแหน่งที่แน่นอนยังอยู่กับทีมงานเหมือนเดิม
 */
import * as React from 'react';
import 'leaflet/dist/leaflet.css';
import { useConsent } from '@/lib/consent';
import { useDict } from '@/i18n/useDict';

export type AreaPin = { lat: number; lng: number; radius: number };

export function AreaMap({ pin, label }: { pin: AreaPin; label: string }) {
  const d = useDict();
  const consent = useConsent();
  const allowed = consent.allows('embeds');
  const host = React.useRef<HTMLDivElement | null>(null);
  const map = React.useRef<unknown>(null);

  React.useEffect(() => {
    if (!allowed || !host.current || map.current) return;
    let dead = false;
    void (async () => {
      const L = (await import('leaflet')).default;
      if (dead || !host.current) return;
      const m = L.map(host.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: true,
      });
      /* ต้องตั้งมุมมองก่อนเพิ่มเลเยอร์ ไม่งั้น leaflet ยังไม่มีจุดอ้างอิงให้แปลง
         พิกัด แล้วโยน layerPointToLatLng undefined ทิ้งแผนที่ว่างไว้ */
      m.setView([pin.lat, pin.lng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 15,
        minZoom: 8,
      }).addTo(m);
      const circle = L.circle([pin.lat, pin.lng], {
        radius: pin.radius,
        color: '#0D6C3B',
        weight: 2,
        fillColor: '#0D6C3B',
        fillOpacity: 0.12,
      }).addTo(m);
      m.fitBounds(circle.getBounds(), { padding: [16, 16] });
      map.current = m;
      // กล่องเพิ่งถูกวาด leaflet ต้องวัดขนาดใหม่หลังเลย์เอาต์นิ่ง
      setTimeout(() => { m.invalidateSize(); m.fitBounds(circle.getBounds(), { padding: [16, 16] }); }, 200);
    })();
    return () => { dead = true; };
  }, [allowed, pin.lat, pin.lng, pin.radius]);

  React.useEffect(() => () => {
    const m = map.current as { remove?: () => void } | null;
    m?.remove?.();
    map.current = null;
  }, []);

  if (!allowed) {
    return (
      <div
        data-area-map="blocked"
        style={{ borderRadius: 16, height: 220, background: 'var(--tint)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: 20 }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{d.consent.mapBlocked}</div>
        <button
          type="button"
          onClick={() => consent.save(true)}
          style={{ height: 38, padding: '0 18px', border: 0, borderRadius: 10, background: 'var(--accent)', color: '#fff', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}
        >
          {d.consent.mapAllow}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={host}
      data-area-map="on"
      role="img"
      aria-label={label}
      style={{ borderRadius: 16, height: 220, overflow: 'hidden', background: 'var(--tint)' }}
    />
  );
}
