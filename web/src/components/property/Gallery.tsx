'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoneDot } from '@/components/common/ZoneDot';
import { PhotoPlaceholder } from '@/components/common/PhotoPlaceholder';
import { useDict } from '@/i18n/useDict';

/* The property's own photos.
 *
 * This gallery used to be four fixed Unsplash images with a "12 รูป" badge —
 * the same four buildings shown for every property in the catalogue, none of
 * them the building on sale. Stock photography on a listing page is not
 * decoration; it is a picture of the thing being sold. */

const fillImg: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

/* Mobile: the fixed 300px thumb column has no room to shrink into on a
   320-390px phone, so collapse to a single column (main image on top,
   thumbs as a horizontal scroll strip below) instead of squeezing both. */
const galleryCss = `
@media (max-width:900px){
  #pd-gallery-grid{grid-template-columns:1fr !important;height:auto !important;}
  #pd-gallery-main{height:280px !important;}
  #pd-gallery-thumbs{grid-template-rows:none !important;grid-auto-flow:column !important;grid-auto-columns:104px !important;overflow-x:auto !important;height:104px !important;}
}
@media (max-width:480px){
  #pd-gallery-main{height:220px !important;}
  #pd-gallery-thumbs{grid-auto-columns:88px !important;height:88px !important;}
}
`;

const MAX_THUMBS = 3;

const lbBtn: React.CSSProperties = {
  position: 'absolute', borderRadius: 9999, border: '1px solid rgba(255,255,255,.35)',
  background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
};

export function Gallery({
  photos = [],
  dealLabel,
  typeLabel,
  zoningLabel,
  zoningKey,
  zoneLabels,
}: {
  photos?: string[];
  dealLabel?: string;
  typeLabel?: string;
  /* สไลด์ 10 · "ให้แสดง โซน และพื้นที่สี" ตรงแถบป้ายบนรูปใหญ่ — สองอย่างนี้
     เป็นสิ่งที่คนหาโรงงาน/โกดังดูก่อนอย่างอื่น แต่เดิมต้องเลื่อนลงไปหาในตาราง */
  zoningLabel?: string;
  /** ค่าดิบของพื้นที่สี ใช้เทียบสีจุด — ป้ายที่แปลแล้วใช้เป็นคีย์ไม่ได้ */
  zoningKey?: string;
  zoneLabels?: string[];
}) {
  const d = useDict();
  const [mainSrc, setMainSrc] = useState<string | null>(photos[0] ?? null);
  /* เปลี่ยนทรัพย์ หรือลายน้ำถูกตั้งค่าใหม่ (URL มี ?v= ใหม่) ต้องรีเซ็ตรูปหลัก
     ไม่งั้นค้างอยู่ที่รูปของทรัพย์ก่อนหน้า */
  useEffect(() => { setMainSrc(photos[0] ?? null); }, [photos]);

  const thumbs = photos.slice(1, 1 + MAX_THUMBS);
  const overflow = Math.max(0, photos.length - 1 - MAX_THUMBS);

  /* ลูกค้าแจ้งว่า "คลิกดูรูปภาพไม่ได้ (ขยาย) · ดูรูปภาพและเลื่อนดูภาพทั้งหมด
     ไม่ได้" — เดิมคลิกรูปย่อยได้แค่สลับรูปหลัก และรูปที่เกินช่องย่อย (+N)
     ไม่มีทางเปิดดูเลย กล่องนี้เปิดเต็มจอ เลื่อนได้ทุกใบ ทั้งปุ่ม ลูกศร และปัดนิ้ว */
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const touchX = useRef(0);
  const open = (src: string) => setZoomAt(Math.max(0, photos.indexOf(src)));
  const close = useCallback(() => setZoomAt(null), []);
  const step = useCallback((by: number) => {
    setZoomAt((i) => (i === null ? i : (i + by + photos.length) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (zoomAt === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    // กันหน้าเลื่อนอยู่ข้างหลังกล่อง
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [zoomAt, close, step]);

  return (
    <section style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0' }}>
      <style dangerouslySetInnerHTML={{ __html: galleryCss }} />
      <div
        id="pd-gallery-grid"
        style={{ display: 'grid', gridTemplateColumns: thumbs.length ? '1fr 300px' : '1fr', gap: 12, height: 440 }}
      >
        {/* MAIN */}
        <div id="pd-gallery-main" style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: 'var(--tint)' }}>
          {mainSrc
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={mainSrc} alt={d.property.code} data-zoom-open
                onClick={() => open(mainSrc)}
                style={{ ...fillImg, cursor: 'zoom-in' }}
              />
            : <PhotoPlaceholder label={d.property.noPhotos} />}
          <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {dealLabel && (
              <span style={{ height: 30, padding: '0 14px', borderRadius: 9999, background: 'rgba(255,255,255,.95)', color: 'var(--deep)', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--deep)' }} />{dealLabel}
              </span>
            )}
            {typeLabel && (
              <span style={{ height: 30, padding: '0 14px', borderRadius: 9999, background: 'rgba(var(--ink2-rgb),.72)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>{typeLabel}</span>
            )}
            {zoningLabel && (
              <span data-hero-zoning style={{ height: 30, padding: '0 13px', borderRadius: 9999, background: 'rgba(255,255,255,.95)', color: 'var(--text)', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
                <ZoneDot value={zoningKey ?? ''} size={13} />
                {zoningLabel}
              </span>
            )}
            {(zoneLabels ?? []).map((z) => (
              <span key={z} data-hero-zone style={{ height: 30, padding: '0 13px', borderRadius: 9999, background: 'rgba(var(--ink2-rgb),.72)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>{z}</span>
            ))}
          </div>
          {photos.length > 0 && (
            <div style={{ position: 'absolute', bottom: 16, right: 16, height: 32, padding: '0 13px', borderRadius: 9999, background: 'rgba(var(--ink2-rgb),.72)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              {photos.length} {d.property.photos}
            </div>
          )}
        </div>

        {/* THUMBS */}
        {thumbs.length > 0 && (
          <div id="pd-gallery-thumbs" style={{ display: 'grid', gridTemplateRows: `repeat(${thumbs.length},minmax(0,1fr))`, gap: 12, minHeight: 0 }}>
            {thumbs.map((src, i) => (
              <div
                key={src}
                onClick={() => (i === thumbs.length - 1 && overflow > 0 ? open(src) : setMainSrc(src))}
                style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: 'var(--tint)', minHeight: 0, cursor: 'pointer' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={d.property.code} style={fillImg} />
                {i === thumbs.length - 1 && overflow > 0 && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(var(--ink2-rgb),.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800 }}>+{overflow}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ดูรูปเต็มจอ — เลื่อนได้ทุกใบ ปิดด้วย Esc หรือคลิกพื้นหลัง */}
      {zoomAt !== null && photos[zoomAt] && (
        <div
          id="pd-lightbox"
          onClick={close}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(2,14,8,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[zoomAt]} alt={d.property.code}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }}
          />
          <button type="button" aria-label={d.listing.zoomClose} onClick={close}
            style={{ ...lbBtn, top: 20, right: 20, width: 44, height: 44 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" aria-label={d.listing.zoomPrev} data-zoom-prev onClick={(e) => { e.stopPropagation(); step(-1); }}
                style={{ ...lbBtn, left: 20, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button type="button" aria-label={d.listing.zoomNext} data-zoom-next onClick={(e) => { e.stopPropagation(); step(1); }}
                style={{ ...lbBtn, right: 20, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M9 6l6 6-6 6" /></svg>
              </button>
              <div data-zoom-count style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', height: 32, padding: '0 14px', borderRadius: 9999, background: 'rgba(255,255,255,.14)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                {zoomAt + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
