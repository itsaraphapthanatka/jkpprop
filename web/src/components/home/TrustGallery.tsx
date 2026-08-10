'use client';

import { useEffect, useRef, useState } from 'react';
import { useDict } from '@/i18n/useDict';

const TILES = [1, 2, 3, 4, 5, 6, 7, 8];

export function TrustGallery() {
  const d = useDict();
  const galRef = useRef<HTMLDivElement | null>(null);
  const pauseRef = useRef(false);
  const [ghover, setGhover] = useState<number | null>(null);

  useEffect(() => {
    let dir = 1;
    let raf = 0;
    const loop = () => {
      const el = galRef.current;
      if (el && !pauseRef.current) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 4) {
          el.scrollLeft += 0.6 * dir;
          if (el.scrollLeft >= max - 1) dir = -1;
          else if (el.scrollLeft <= 1) dir = 1;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section data-anim="1" style={{ padding: '72px 0 88px', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 26, height: 2, background: '#034956', borderRadius: 2 }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>{d.trust.eyebrow}</span>
          <span style={{ width: 26, height: 2, background: '#034956', borderRadius: 2 }} />
        </div>
        <h2 style={{ margin: '10px 0 0', fontSize: 34, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em' }}>{d.trust.heading}</h2>
        <div style={{ margin: '18px auto 0', display: 'inline-flex', alignItems: 'center', gap: 9, height: 40, padding: '0 18px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: 14, fontWeight: 700 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>{d.trust.happyClients}
        </div>
      </div>

      {/* auto-scroll wall */}
      <div style={{ position: 'relative', marginTop: 40 }}>
        <div
          ref={galRef}
          onMouseEnter={() => { pauseRef.current = true; }}
          onMouseLeave={() => { pauseRef.current = false; }}
          className="no-sb"
          style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '8px 24px' }}
        >
          {TILES.map((i) => {
            const on = ghover === i;
            return (
              <div key={i} onMouseEnter={() => setGhover(i)} onMouseLeave={() => setGhover(null)} style={{ position: 'relative', flex: '0 0 230px', height: 172, borderRadius: 16, overflow: 'hidden', background: 'var(--tint)', boxShadow: '0 4px 14px rgba(0,0,0,.08)' }}>
                <div style={{ position: 'absolute', inset: 0, transition: 'transform .55s cubic-bezier(.2,.7,.3,1)', transform: on ? 'scale(1.09)' : 'none' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://picsum.photos/seed/jkp-trust-${i}/230/172`} alt="รูปส่งมอบทรัพย์" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: on ? 'inset 0 0 0 3px #034956' : 'inset 0 0 0 0 #034956', transition: 'box-shadow .3s', pointerEvents: 'none' }} />
              </div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 80, background: 'linear-gradient(90deg,var(--bg),rgba(249,248,245,0))', pointerEvents: 'none', zIndex: 2 }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 80, background: 'linear-gradient(270deg,var(--bg),rgba(249,248,245,0))', pointerEvents: 'none', zIndex: 2 }} />
      </div>
    </section>
  );
}
