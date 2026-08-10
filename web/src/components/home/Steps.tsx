'use client';

import { useEffect, useRef, useState } from 'react';
import { useDict } from '@/i18n/useDict';

const STEP_ICONS = [
  <svg key="0" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  <svg key="1" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
  <svg key="2" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg>,
  <svg key="3" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>,
];

export function Steps() {
  const d = useDict();
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  hoverRef.current = hover;

  useEffect(() => {
    const t = setInterval(() => {
      if (hoverRef.current != null) return;
      setStep((s) => (s + 1) % 4);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const T = '#034956';
  const active = hover != null ? hover : step;

  return (
    <section data-anim="1" style={{ background: 'linear-gradient(180deg,var(--bg2) 0%,var(--bg2) 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 26, height: 2, background: '#034956', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>{d.steps.eyebrow}</span>
            <span style={{ width: 26, height: 2, background: '#034956', borderRadius: 2 }} />
          </div>
        </div>
        <h2 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: 34, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em' }}>{d.steps.heading}</h2>
        <p style={{ margin: '0 auto 44px', textAlign: 'center', maxWidth: '520px', fontSize: 15, color: 'var(--muted2)' }}>{d.steps.sub}</p>

        {/* rail */}
        <div style={{ position: 'relative', height: '52px' }}>
          {d.steps.items.map((item, i) => {
            const on = i === active;
            const done = i < active;
            const reached = i <= active;
            const nodeWrap: React.CSSProperties = { position: 'absolute', top: '50%', left: (12.5 + i * 25) + '%', transform: 'translate(-50%,-50%)', width: '44px', height: '44px', cursor: 'pointer', zIndex: 2 };
            const node: React.CSSProperties = { position: 'absolute', inset: 0, borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, background: reached ? '#273c33' : '#fff', color: reached ? '#fff' : '#9B968D', border: '2.5px solid ' + (reached ? '#273c33' : '#DAD5CC'), boxShadow: on ? '0 6px 16px rgba(3,73,86,.4)' : '0 2px 6px rgba(0,0,0,.08)', transition: 'all .35s' };
            const nodeRing: React.CSSProperties = on ? { position: 'absolute', inset: 0, borderRadius: '9999px', border: '2.5px solid ' + T, animation: 'pinPulse 1.9s ease-out infinite' } : { display: 'none' };
            return (
              <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)} style={nodeWrap}>
                <div style={nodeRing} />
                <div style={node}>
                  {done
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    : String(i + 1)}
                </div>
              </div>
            );
          })}
        </div>

        {/* cards */}
        <div className="rs-cols-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22, marginTop: 16 }}>
          {d.steps.items.map((item, i) => {
            const on = i === active;
            const ghostColor = on ? 'rgba(45,251,145,.14)' : 'rgba(40,37,29,.05)';
            const titleColor = on ? '#fff' : 'var(--text)';
            const descColor = on ? '#B9C2BD' : 'var(--muted)';
            const card: React.CSSProperties = on
              ? { position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#0A0E0C 0%,#0A0E0C 50%,#0E3A22 100%)', border: '1.5px solid rgba(45,251,145,.35)', borderRadius: '18px', padding: '26px 22px 24px', cursor: 'default', transition: 'transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s', transform: 'translateY(-8px)', boxShadow: '0 22px 44px rgba(0,0,0,.35)' }
              : { position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '18px', padding: '26px 22px 24px', cursor: 'default', transition: 'transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s, border-color .3s', transform: 'none', boxShadow: '0 1px 3px rgba(0,0,0,.05)' };
            const cardGlow: React.CSSProperties = on ? { position: 'absolute', bottom: '-55%', right: '-15%', width: '75%', height: '170%', background: 'radial-gradient(ellipse at center,rgba(45,251,145,.38) 0%,rgba(45,251,145,0) 62%)', pointerEvents: 'none' } : { display: 'none' };
            const iconTile: React.CSSProperties = { position: 'relative', zIndex: 1, width: '58px', height: '58px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#2DFB91' : '#273c33', color: on ? '#273c33' : '#2DFB91', transition: 'all .3s', boxShadow: on ? '0 8px 20px rgba(45,251,145,.4)' : 'none' };
            return (
              <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={card}>
                <div style={cardGlow} />
                <div style={{ position: 'absolute', top: 6, right: 16, fontSize: 74, fontWeight: 800, lineHeight: 1, color: ghostColor, pointerEvents: 'none', fontFamily: "'JetBrains Mono',monospace", transition: 'color .3s' }}>{String(i + 1)}</div>
                <div style={iconTile}>{STEP_ICONS[i]}</div>
                <div style={{ marginTop: 20, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', color: 'var(--muted3)', textTransform: 'uppercase' }}>{d.steps.step} {'0' + (i + 1)}</div>
                <div style={{ marginTop: 5, fontSize: 18, fontWeight: 700, color: titleColor }}>{item.title}</div>
                <div style={{ marginTop: 8, fontSize: 14, color: descColor, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
