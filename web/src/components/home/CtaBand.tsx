'use client';
import { useDict } from '@/i18n/useDict';
import type { SectionCopy } from '@/lib/server/sectionCopy';

export function CtaBand({ copy }: { copy: SectionCopy }) {
  const d = useDict();
  const pick = (v: string, fallback: string) => v || fallback;
  const primaryEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = '0 12px 34px rgba(45,251,145,.5)';
  };
  const primaryLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };
  const ghostEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,.16)';
  };
  const ghostLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,.08)';
  };

  return (
    <section data-anim="1" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 16px' }}>
      <div
        id="cta-band-grid"
        style={{
          position: 'relative',
          overflow: 'visible',
          borderRadius: '34px',
          background: '#0A0E0C',
          boxShadow: '0 30px 70px rgba(0,0,0,.34)',
          display: 'grid',
          gridTemplateColumns: '1.12fr .88fr',
          gap: 0,
          minHeight: '340px',
        }}
      >
        {/* green glow bloom from left */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '34px', overflow: 'hidden', pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: '-40%',
              left: '-14%',
              width: '70%',
              height: '180%',
              background: 'radial-gradient(ellipse at center,rgba(45,251,145,.55) 0%,rgba(45,251,145,.16) 38%,rgba(45,251,145,0) 66%)',
              animation: 'mesh1 10s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-50%',
              right: '-6%',
              width: '52%',
              height: '150%',
              background: 'radial-gradient(ellipse at center,rgba(3,73,86,.5) 0%,rgba(3,73,86,0) 62%)',
              animation: 'mesh2 12s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '34%',
              background: 'linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.07),rgba(255,255,255,0))',
              animation: 'ctaShine 6.5s ease-in-out infinite',
            }}
          />
        </div>

        {/* LEFT content */}
        <div
          id="cta-band-left"
          style={{ position: 'relative', zIndex: 2, padding: '54px 40px 54px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              alignItems: 'center',
              gap: 7,
              height: 30,
              padding: '0 14px',
              borderRadius: 9999,
              background: 'rgba(45,251,145,.12)',
              border: '1px solid rgba(45,251,145,.34)',
              color: '#2DFB91',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '.02em',
            }}
          >
            <span style={{ position: 'relative', display: 'flex', width: 7, height: 7 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: 9999, background: '#2DFB91', animation: 'pinPulse 1.8s ease-out infinite' }} />
              <span style={{ position: 'relative', width: 7, height: 7, borderRadius: 9999, background: '#2DFB91' }} />
            </span>
            {pick(copy.eyebrow, d.cta.eyebrow)}
          </div>
          <h2 style={{ margin: '18px 0 0', fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '-.01em', lineHeight: 1.22 }}>
            {d.cta.headline}<span style={{ color: '#2DFB91' }}>{d.cta.headlineAccent}</span>
          </h2>
          <p style={{ margin: '14px 0 0', fontSize: 15, color: '#B9C2BD', maxWidth: 440, lineHeight: 1.65 }}>
            {pick(copy.sub, d.cta.sub)}
          </p>
          <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="Contact.dc.html"
              onMouseEnter={primaryEnter}
              onMouseLeave={primaryLeave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 52,
                padding: '0 30px',
                borderRadius: 9999,
                background: '#2DFB91',
                color: '#04140C',
                fontSize: 15,
                fontWeight: 800,
                transition: 'transform .25s cubic-bezier(.2,.7,.3,1),box-shadow .2s',
              }}
            >
              {pick(copy.cta, d.cta.primary)}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#04140C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </a>
            <a
              href="#"
              onMouseEnter={ghostEnter}
              onMouseLeave={ghostLeave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 52,
                padding: '0 26px',
                borderRadius: 9999,
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.24)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                transition: 'transform .25s cubic-bezier(.2,.7,.3,1),background .2s',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" />
              </svg>
              {d.cta.call}
            </a>
          </div>
        </div>

        {/* RIGHT team photo */}
        <div id="cta-band-right" style={{ position: 'relative', zIndex: 2, minHeight: '340px' }}>
          <div
            id="cta-photo-box"
            style={{
              position: 'absolute',
              inset: '22px 22px 22px 0',
              borderRadius: '26px',
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(45,251,145,.22), 0 20px 44px rgba(0,0,0,.45)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1000&q=80"
              alt={d.cta.photoAlt}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(.9) brightness(.95)' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(160deg,rgba(10,14,12,0) 34%,rgba(10,14,12,.78) 100%)',
                pointerEvents: 'none',
              }}
            />
          </div>
          {/* serrated starburst badge */}
          <div
            id="cta-starburst"
            style={{
              position: 'absolute',
              top: '-16px',
              left: '-14px',
              zIndex: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              height: 38,
              padding: '0 16px 0 12px',
              borderRadius: 9999,
              background: '#2DFB91',
              boxShadow: '0 12px 28px rgba(45,251,145,.4)',
              animation: 'floatY 4s ease-in-out infinite',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#04140C" strokeWidth="2.2">
              <path d="M13 2L3 14h7l-1 8 11-14h-7z" />
            </svg>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#04140C', whiteSpace: 'nowrap' }}>{d.cta.freeShort}</div>
          </div>
          <div style={{ display: 'none' }}>
            <div style={{ position: 'relative', textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#0A0E0C', lineHeight: 1.15 }}>
              {d.cta.freeShort}
            </div>
          </div>
          {/* floating team badge */}
          <div
            id="cta-team-badge"
            style={{
              position: 'absolute',
              left: 6,
              bottom: 38,
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '12px 16px 12px 12px',
              borderRadius: 14,
              background: 'rgba(255,255,255,.96)',
              boxShadow: '0 14px 34px rgba(0,0,0,.4)',
              animation: 'floatY 4s ease-in-out infinite',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: '#0A0E0C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0A0E0C' }}>{d.cta.teamCount}</div>
              <div style={{ fontSize: 12, color: '#5F5A52' }}>{d.cta.teamNote}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
