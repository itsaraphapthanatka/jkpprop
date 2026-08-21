'use client';

import { useEffect, useState } from 'react';
import { useDict } from '@/i18n/useDict';
import { ContactBar } from '@/components/site/ContactBar';

/* แถบติดต่อขอบล่างอยู่ที่นี่ เพราะมันแย่งพื้นที่มุมล่างขวากับปุ่ม "กลับขึ้นด้านบน"
   ตัวเดียวกัน ให้คอมโพเนนต์เดียวคุมทั้งสองอย่างจะได้ไม่ทับกัน (สไลด์ 18) */
export function Floating({ contact }: {
  contact?: { socials?: { key: string; url: string }[]; wechatId?: string; phone?: string };
} = {}) {
  const d = useDict();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      const t = window.scrollY > 600;
      setShowTop((prev) => (prev !== t ? t : prev));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const baseTransform = showTop ? 'translateY(0)' : 'translateY(20px)';

  return (
    <>
      {/* BACK TO TOP (floating, fixed) */}
      <div
        id="back-to-top-btn"
        onClick={scrollTop}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = baseTransform;
        }}
        title={d.floating.backToTop}
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
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{d.floating.backToTop}</span>
        <div style={{ width: 38, height: 38, borderRadius: 9999, background: 'var(--neon)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </div>
      </div>

      {contact && <ContactBar socials={contact.socials} wechatId={contact.wechatId} phone={contact.phone} />}
    </>
  );
}
