'use client';

import { useState } from 'react';

type Lang = 'th' | 'en' | 'zh';

const FLAGS: Record<Lang, React.ReactNode> = {
  th: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="24" fill="#F4F5F8" />
      <rect width="24" height="4" fill="#A51931" />
      <rect y="4" width="24" height="4" fill="#F4F5F8" />
      <rect y="8" width="24" height="8" fill="#2D2A4A" />
      <rect y="16" width="24" height="4" fill="#F4F5F8" />
      <rect y="20" width="24" height="4" fill="#A51931" />
    </svg>
  ),
  en: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="24" fill="#012169" />
      <path d="M0 0L24 24M24 0L0 24" stroke="#fff" strokeWidth="3" />
      <path d="M12 0V24M0 12H24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0V24M0 12H24" stroke="#C8102E" strokeWidth="2.4" />
    </svg>
  ),
  zh: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="24" height="24" fill="#EE1C25" />
      <path d="M6 5l1 3 3-1-2 2.4 2 2.4-3-1-1 3-1-3-3 1 2-2.4-2-2.4 3 1z" fill="#FFDE00" />
    </svg>
  ),
};

const LANG_LABEL: Record<Lang, string> = { th: 'ไทย', en: 'ENGLISH', zh: '中文' };
const LANG_DEFS: { key: Lang; name: string; code: string }[] = [
  { key: 'th', name: 'ไทย', code: 'TH' },
  { key: 'en', name: 'ENGLISH', code: 'EN' },
  { key: 'zh', name: '中文', code: 'ZH' },
];

const chev = (rot: boolean, w = 11, stroke = 'currentColor', sw = '2.4') => (
  <svg
    width={w}
    height={w}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={sw}
    style={{ transform: rot ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const navText: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: 'var(--muted)' };
const ddPanel: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 14,
  boxShadow: '0 20px 44px rgba(0,0,0,.18)',
  padding: 8,
};
const ddItem: React.CSSProperties = {
  display: 'block',
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: '13.5px',
  fontWeight: 600,
  color: 'var(--text)',
};

export function PropertyHeader() {
  const [navFactory, setNavFactory] = useState(false);
  const [navWarehouse, setNavWarehouse] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('th');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 200,
          background: 'rgba(249,248,245,.92)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
          backdropFilter: 'blur(16px) saturate(1.5)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: '1320px',
            margin: '0 auto',
            padding: '0 24px',
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/jkp-logo-green.png" alt="JKP Property" style={{ height: 42, width: 'auto', display: 'block' }} />
          </a>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            {/* โรงงาน */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setNavFactory(true)} onMouseLeave={() => setNavFactory(false)}>
              <div className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 0', ...navText }}>
                โรงงาน {chev(navFactory)}
              </div>
              {navFactory && (
                <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 10, width: 150 }}>
                  <div style={ddPanel}>
                    <a className="dd-item" href="/factory-rent" style={ddItem}>โรงงานให้เช่า</a>
                    <a className="dd-item" href="/factory-sale" style={ddItem}>โรงงานสำหรับขาย</a>
                  </div>
                </div>
              )}
            </div>

            {/* โกดัง */}
            <div style={{ position: 'relative' }} onMouseEnter={() => setNavWarehouse(true)} onMouseLeave={() => setNavWarehouse(false)}>
              <div className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 0', ...navText }}>
                โกดัง {chev(navWarehouse)}
              </div>
              {navWarehouse && (
                <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 10, width: 150 }}>
                  <div style={ddPanel}>
                    <a className="dd-item" href="/warehouse-rent" style={ddItem}>โกดังให้เช่า</a>
                    <a className="dd-item" href="/warehouse-sale" style={ddItem}>โกดังสำหรับขาย</a>
                  </div>
                </div>
              )}
            </div>

            <a className="nav-link" href="/faq" style={navText}>คำถามพบบ่อย</a>
            <a className="nav-link" href="/about" style={navText}>เกี่ยวกับเรา</a>

            {/* language */}
            <div style={{ position: 'relative' }}>
              <div
                className="lang-trigger"
                onClick={() => setLangOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 11px',
                  border: '1px solid var(--border)',
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                {FLAGS[lang]}
                {LANG_LABEL[lang]}
                {chev(langOpen, 12, '#7A7974', '2.5')}
              </div>
              {langOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: 200,
                    background: 'var(--surface)',
                    borderRadius: 16,
                    boxShadow: '0 20px 50px rgba(0,0,0,.22)',
                    padding: 8,
                    zIndex: 50,
                  }}
                >
                  {LANG_DEFS.map((l) => (
                    <div
                      key={l.key}
                      className="lang-opt"
                      onClick={() => {
                        setLang(l.key);
                        setLangOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        padding: '10px 10px',
                        borderRadius: 11,
                        cursor: 'pointer',
                        background: lang === l.key ? 'rgba(3,73,86,.06)' : 'transparent',
                      }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: 6, overflow: 'hidden', flexShrink: 0, display: 'flex' }}>{FLAGS[l.key]}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{l.name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>{l.code}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* contact */}
            <a
              className="contact-btn"
              href="#"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                height: 40,
                padding: '0 20px',
                borderRadius: 9999,
                background: '#2DFB91',
                color: '#022310',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              ติดต่อทีมงาน
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.4">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>

            {/* mobile menu button */}
            <div
              id="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              style={{ width: 40, height: 40, borderRadius: 9999, display: 'none', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--tint)', flexShrink: 0 }}
            >
              <div style={{ position: 'relative', width: 18, height: 13 }}>
                <span style={{ position: 'absolute', left: 0, top: mobileOpen ? '5.5px' : 0, width: 18, height: 2, borderRadius: 2, background: 'var(--text)', transition: 'all .3s cubic-bezier(.4,0,.2,1)', transform: mobileOpen ? 'rotate(45deg)' : 'none' }} />
                <span style={{ position: 'absolute', left: 0, top: '5.5px', width: 18, height: 2, borderRadius: 2, background: 'var(--text)', transition: 'opacity .2s', opacity: mobileOpen ? 0 : 1 }} />
                <span style={{ position: 'absolute', left: 0, top: mobileOpen ? '5.5px' : '11px', width: 18, height: 2, borderRadius: 2, background: 'var(--text)', transition: 'all .3s cubic-bezier(.4,0,.2,1)', transform: mobileOpen ? 'rotate(-45deg)' : 'none' }} />
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* mobile overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 299,
          background: 'rgba(2,14,8,.55)',
          backdropFilter: 'blur(3px)',
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? 'auto' : 'none',
          transition: 'opacity .3s',
        }}
      />
      {/* mobile drawer */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '84%',
          maxWidth: 340,
          zIndex: 300,
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 50px rgba(0,0,0,.25)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .35s cubic-bezier(.2,.8,.3,1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jkp-logo-green.png" alt="JKP" style={{ height: 32, width: 'auto', display: 'block' }} />
          <div onClick={() => setMobileOpen(false)} style={{ width: 34, height: 34, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 20px' }}>
          <a href="/factory-rent" style={{ display: 'block', padding: '15px 10px', borderRadius: 12, fontSize: '15.5px', fontWeight: 700, color: 'var(--text)' }}>โรงงานให้เช่า</a>
          <a href="/warehouse-rent" style={{ display: 'block', padding: '15px 10px', borderRadius: 12, fontSize: '15.5px', fontWeight: 700, color: 'var(--text)' }}>โกดังให้เช่า</a>
          <a href="/faq" style={{ display: 'block', padding: '15px 10px', borderRadius: 12, fontSize: '15.5px', fontWeight: 700, color: 'var(--text)' }}>คำถามพบบ่อย</a>
          <a href="/about" style={{ display: 'block', padding: '15px 10px', borderRadius: 12, fontSize: '15.5px', fontWeight: 700, color: 'var(--text)' }}>เกี่ยวกับเรา</a>
          <a href="#" style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: '14.5px', fontWeight: 800 }}>ติดต่อทีมงาน</a>
        </div>
      </div>
    </>
  );
}
