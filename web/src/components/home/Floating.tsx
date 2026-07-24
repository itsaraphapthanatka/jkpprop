'use client';

import { useEffect, useState } from 'react';

export function Floating() {
  const [showTop, setShowTop] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      const t = window.scrollY > 600;
      setShowTop((prev) => (prev !== t ? t : prev));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    try {
      if (!localStorage.getItem('jkp_cookie')) setCookieOpen(true);
    } catch {
      /* localStorage unavailable */
    }
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cookieAccept = () => {
    try {
      localStorage.setItem('jkp_cookie', 'accept');
    } catch {
      /* ignore */
    }
    setCookieOpen(false);
  };
  const cookieClose = () => {
    try {
      localStorage.setItem('jkp_cookie', 'reject');
    } catch {
      /* ignore */
    }
    setCookieOpen(false);
  };

  const baseTransform = showTop ? 'translateY(0)' : 'translateY(20px)';

  return (
    <>
      {/* BACK TO TOP (floating, fixed) */}
      <div
        id="back-to-top-btn"
        className={cookieOpen ? 'fab-raised' : undefined}
        onClick={scrollTop}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = baseTransform;
        }}
        title="กลับขึ้นด้านบน"
        style={{
          position: 'fixed',
          right: 28,
          bottom: 28,
          zIndex: 400,
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          height: 54,
          padding: '0 8px 0 20px',
          borderRadius: 9999,
          background: 'linear-gradient(120deg,#0A0E0C 0%,#0A0E0C 50%,#0E3A22 100%)',
          boxShadow: '0 12px 34px rgba(0,0,0,.32)',
          cursor: 'pointer',
          transition: 'opacity .35s, transform .35s cubic-bezier(.2,.7,.3,1)',
          opacity: showTop ? 1 : 0,
          transform: baseTransform,
          pointerEvents: showTop ? 'auto' : 'none',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>กลับขึ้นด้านบน</span>
        <div style={{ width: 38, height: 38, borderRadius: 9999, background: '#2DFB91', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </div>
      </div>

      {/* COOKIE / PDPA */}
      {cookieOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 22,
            left: 22,
            zIndex: 400,
            width: 360,
            maxWidth: 'calc(100vw - 44px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            boxShadow: '0 20px 50px rgba(2,35,16,.24)',
            padding: 22,
            animation: 'cookieUp .45s cubic-bezier(.2,.7,.3,1) both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 108.5 4.7 3 3 0 01-4-4A10 10 0 0012 2z" />
                  <path d="M8.5 9h0M15 8.5h0M9 15h0M14.5 14.5h0M12 12h0" />
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>การตั้งค่าคุกกี้</div>
            </div>
            <div
              onClick={cookieClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F1EEE8';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--muted3)';
              }}
              style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted3)', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>
            เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งานและวิเคราะห์การเข้าชม เมื่อกดยอมรับ ถือว่าคุณยินยอมให้เราใช้คุกกี้ตาม{' '}
            <a href="#" style={{ color: 'var(--accent)', fontWeight: 600 }}>PDPA ของประเทศไทย</a>
          </p>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={cookieAccept}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#023742';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#034956';
              }}
              style={{ flex: 1, height: 44, border: 0, borderRadius: 10, background: '#034956', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background .2s' }}
            >
              ยอมรับคุกกี้
            </button>
            <button
              onClick={cookieClose}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              style={{ height: 44, padding: '0 18px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
            >
              ปฏิเสธทั้งหมด
            </button>
          </div>
        </div>
      )}
    </>
  );
}
