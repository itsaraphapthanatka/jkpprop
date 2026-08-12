'use client';

import { useEffect, useRef } from 'react';
import Link from '@/i18n/LocaleLink';
import Image from 'next/image';
import { useDict } from '@/i18n/useDict';

export function SiteFooter() {
  const d = useDict();
  const footerRef = useRef<HTMLElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const footer = footerRef.current;
    const spacer = spacerRef.current;
    if (!footer || !spacer) return;

    const sync = () => {
      spacer.style.height = footer.offsetHeight + 'px';
    };
    sync();

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(sync);
      ro.observe(footer);
    }
    window.addEventListener('resize', sync, { passive: true });
    // match source: run a couple of delayed syncs after layout settles
    const t1 = window.setTimeout(sync, 120);
    const t2 = window.setTimeout(sync, 600);

    return () => {
      window.removeEventListener('resize', sync);
      if (ro) ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const socialEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = 'var(--accent)';
    e.currentTarget.style.color = '#fff';
  };
  const socialLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,.07)';
    e.currentTarget.style.color = '#C9C5BD';
  };
  const contactEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = '0 10px 26px rgba(var(--neon-rgb),.45)';
  };
  const contactLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  const socialBase: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: 'rgba(255,255,255,.07)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#C9C5BD',
    transition: 'all .2s',
  };

  return (
    <>
      <div id="foot-spacer" ref={spacerRef} style={{ width: '100%' }} aria-hidden="true" />

      {/* FOOTER */}
      <footer
        ref={footerRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          background: '#000000',
          color: '#C9C5BD',
          borderTopLeftRadius: '34px',
          borderTopRightRadius: '34px',
        }}
      >
        <div
 className="rs-footer-cols"          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '96px 24px 52px',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1.4fr',
            gap: 48,
          }}
        >
          <div>
            <Image width={226} height={100} src="/assets/jkp-logo-white.png" alt="JKP Property" style={{ height: 46, width: 'auto', display: 'block' }} />

            <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.7, color: '#8E8B84', maxWidth: 280 }}>
              {d.footer.tagline}
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <a href="#" onMouseEnter={socialEnter} onMouseLeave={socialLeave} style={socialBase}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M13 22v-8h2.7l.4-3H13V9c0-.9.3-1.5 1.5-1.5H16V4.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H7v3h2.6v8z" />
                </svg>
              </a>
              <a href="#" onMouseEnter={socialEnter} onMouseLeave={socialLeave} style={socialBase}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" onMouseEnter={socialEnter} onMouseLeave={socialLeave} style={socialBase}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.4 8.4 0 01-9 8.4c-1.5 0-2.9-.4-4.1-1L3 20l1.2-4.8A8.3 8.3 0 013 11.5 8.5 8.5 0 0112 3a8.5 8.5 0 019 8.5z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>{d.footer.properties}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
              <Link href="/factory-rent" style={{ color: '#C9C5BD' }}>{d.nav.factoryRent}</Link>
              <Link href="/warehouse-rent" style={{ color: '#C9C5BD' }}>{d.nav.warehouseRent}</Link>
              <a href="#" style={{ color: '#C9C5BD' }}>{d.footer.industrialLand}</a>
              <Link href="/factory-sale" style={{ color: '#C9C5BD' }}>{d.nav.factorySale}</Link>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>{d.footer.company}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
              <Link href="/about" style={{ color: '#C9C5BD' }}>{d.nav.about}</Link>
              <a href="#" style={{ color: '#C9C5BD' }}>{d.footer.services}</a>
              <a href="#" style={{ color: '#C9C5BD' }}>{d.footer.articles}</a>
              <Link href="/contact" style={{ color: '#C9C5BD' }}>{d.nav.contact}</Link>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>{d.footer.contact}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#8E8B84' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <svg style={{ flexShrink: 0, marginTop: 2 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16v16H4z" opacity="0" />
                  <path d="M22 6l-10 7L2 6" />
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                </svg>
                info@thaiindustrialproperty.com
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <svg style={{ flexShrink: 0, marginTop: 2 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" />
                </svg>
                +66 90-000-0000
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <svg style={{ flexShrink: 0, marginTop: 2 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {d.common.address}
              </div>
            </div>
            <Link
              href="/contact"
              onMouseEnter={contactEnter}
              onMouseLeave={contactLeave}
              style={{
                marginTop: 20,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                height: 44,
                padding: '0 22px',
                borderRadius: 9999,
                background: 'var(--neon)',
                color: '#04140C',
                fontSize: 14,
                fontWeight: 800,
                transition: 'box-shadow .2s',
              }}
            >
              {d.nav.contact}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <div
            id="foot-bottom-row"
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '26px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'space-between',
              fontSize: 13,
              color: '#8E8B84',
            }}
          >
            <div>{d.footer.rights}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <a href="#" style={{ color: '#8E8B84' }}>{d.footer.privacy}</a>
              <a href="#" style={{ color: '#8E8B84' }}>{d.footer.terms}</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
