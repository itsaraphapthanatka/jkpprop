'use client';

import { useState } from 'react';
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

export function Gallery({
  photos = [],
  dealLabel,
  typeLabel,
}: {
  photos?: string[];
  dealLabel?: string;
  typeLabel?: string;
}) {
  const d = useDict();
  const [mainSrc, setMainSrc] = useState<string | null>(photos[0] ?? null);

  const thumbs = photos.slice(1, 1 + MAX_THUMBS);
  const overflow = Math.max(0, photos.length - 1 - MAX_THUMBS);

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
              <img src={mainSrc} alt={d.property.code} style={fillImg} />
            : <PhotoPlaceholder label={d.property.noPhotos} />}
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
            {dealLabel && (
              <span style={{ height: 30, padding: '0 14px', borderRadius: 9999, background: 'rgba(255,255,255,.95)', color: 'var(--deep)', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--deep)' }} />{dealLabel}
              </span>
            )}
            {typeLabel && (
              <span style={{ height: 30, padding: '0 14px', borderRadius: 9999, background: 'rgba(var(--ink2-rgb),.72)', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>{typeLabel}</span>
            )}
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
                onClick={() => setMainSrc(src)}
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
    </section>
  );
}
