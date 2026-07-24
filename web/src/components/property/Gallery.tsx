'use client';

import { useState } from 'react';

type Thumb = { id: string; src: string; more: boolean };

const MAIN_SRC = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1400&q=80';

const THUMBS: Thumb[] = [
  { id: 'pd-t1', src: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=500&q=80', more: false },
  { id: 'pd-t2', src: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=500&q=80', more: false },
  { id: 'pd-t3', src: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&q=80', more: true },
];

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

export function Gallery() {
  const [mainSrc, setMainSrc] = useState(MAIN_SRC);

  return (
    <section style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0' }}>
      <style dangerouslySetInnerHTML={{ __html: galleryCss }} />
      <div id="pd-gallery-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, height: 440 }}>
        {/* MAIN */}
        <div id="pd-gallery-main" style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: 'var(--tint)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mainSrc} alt="รูปทรัพย์หลัก" style={fillImg} />
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
            <span style={{ height: 30, padding: '0 14px', borderRadius: 9999, background: 'rgba(255,255,255,.95)', color: '#0D6C3B', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: '#0D6C3B' }} />ให้เช่า
            </span>
            <span style={{ height: 30, padding: '0 14px', borderRadius: 9999, background: 'rgba(2,29,14,.72)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>โรงงาน</span>
          </div>
          <div style={{ position: 'absolute', bottom: 16, right: 16, height: 32, padding: '0 13px', borderRadius: 9999, background: 'rgba(2,29,14,.72)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            12 รูป
          </div>
        </div>

        {/* THUMBS */}
        <div id="pd-gallery-thumbs" style={{ display: 'grid', gridTemplateRows: 'repeat(3,minmax(0,1fr))', gap: 12, minHeight: 0 }}>
          {THUMBS.map((t) => (
            <div
              key={t.id}
              onClick={() => setMainSrc(t.src)}
              style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: 'var(--tint)', minHeight: 0, cursor: 'pointer' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.src} alt="รูป" style={fillImg} />
              {t.more && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,29,14,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 800 }}>+9</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
