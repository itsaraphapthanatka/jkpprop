'use client';

import { useState } from 'react';
import Link from '@/i18n/LocaleLink';
import type { Locale } from '@/i18n/config';
import { getFaq, getFaqUi } from '@/i18n/faq';

/* ============================================================
   Ported from FAQ.dc.html — hero, sticky category sidebar +
   search, accordion categories, "still stuck" CTA.

   Content and page chrome both come from @/i18n/faq keyed by the
   locale segment, so /th /en /zh each render their own copy. The
   category keys are shared across locales, which is why openMap
   (`${catKey}-${i}`) and the #anchor links survive a language switch.

   The disclosure headers and the search trigger are real <button>s:
   they are controls, and the accordion needs aria-expanded for
   screen readers.
   ============================================================ */

export function FaqBody({ locale }: { locale: Locale }) {
  const cats = getFaq(locale);
  const ui = getFaqUi(locale);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggle = (k: string) => setOpenMap((m) => ({ ...m, [k]: !m[k] }));

  const doSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    for (const cat of cats) {
      /* match the answer too — readers search for a term like "ร.ง.4"
         or "floor loading" that often sits in the body, not the title */
      const idx = cat.qs.findIndex(
        ({ q: question, a }) => question.toLowerCase().includes(q) || a.toLowerCase().includes(q),
      );
      if (idx > -1) {
        const k = cat.key + '-' + idx;
        setNoMatch(false);
        setOpenMap((m) => ({ ...m, [k]: true }));
        setTimeout(() => {
          const el = document.getElementById(cat.key);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
        return;
      }
    }
    setNoMatch(true);
  };

  const copy = (k: string, text: string) => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setCopiedKey(k);
        setTimeout(() => setCopiedKey((c) => (c === k ? null : c)), 1600);
      }
    } catch {
      /* clipboard blocked (insecure origin / denied permission) — stay silent */
    }
  };

  const searchBtn = (size: number) => (
    <button
      type="button"
      onClick={doSearch}
      aria-label={ui.searchAria}
      style={{ width: size, height: size, borderRadius: 9999, background: '#034956', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
    >
      <svg width={size === 42 ? 16 : 17} height={size === 42 ? 16 : 17} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
    </button>
  );

  return (
    <>
      {/* HERO */}
      <section style={{ position: 'relative', height: '220px' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderBottomRightRadius: '72px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&q=80" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(2,29,14,.82) 0%,rgba(2,29,14,.5) 55%,rgba(2,29,14,.28) 100%)', pointerEvents: 'none', borderBottomRightRadius: '72px' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1320px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{ui.heroTitle}</h1>
          <p style={{ margin: '10px 0 0', fontSize: '14.5px', color: '#E8FFF0', maxWidth: '520px' }}>{ui.heroLead}</p>
        </div>
      </section>

      {/* BREADCRUMB */}
      <nav aria-label={ui.breadcrumb} style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted2)' }}>
        <Link href="/" style={{ color: 'var(--muted2)' }}>{ui.home}</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{ui.breadcrumb}</span>
      </nav>

      {/* LAYOUT */}
      <div id="faq-layout" style={{ maxWidth: '1320px', margin: '0 auto', padding: '20px 24px 80px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28, alignItems: 'start' }}>
        {/* SIDEBAR */}
        <aside id="faq-sidebar" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, position: 'sticky', top: 96 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{ui.categories}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setNoMatch(false); }}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder={ui.searchPlaceholder}
              aria-label={ui.searchAria}
              style={{ flex: 1, height: 42, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', outline: 'none', minWidth: 0 }}
            />
            {searchBtn(42)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cats.map((c) => (
              <a key={c.key} className="dd-item" href={'#' + c.key} style={{ display: 'block', padding: '9px 10px', borderRadius: 9, fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{c.title}</a>
            ))}
          </div>
        </aside>

        {/* CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34, minWidth: 0 }}>
          {/* MOBILE search + category quick-jump (shown ≤980 when the sidebar is hidden) */}
          <div id="faq-mobilebar" style={{ display: 'none', flexDirection: 'column', gap: 12, marginBottom: -12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setNoMatch(false); }}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder={ui.searchPlaceholder}
                aria-label={ui.searchAria}
                style={{ flex: 1, height: 46, padding: '0 16px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--text)', outline: 'none', minWidth: 0 }}
              />
              {searchBtn(46)}
            </div>
            <div className="no-sb" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, minWidth: 0 }}>
              {cats.map((c) => (
                <a key={c.key} href={'#' + c.key} style={{ flexShrink: 0, height: 34, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{c.title}</a>
              ))}
            </div>
          </div>

          {noMatch && (
            <div role="status" style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--tint)', color: 'var(--accent)', fontSize: '13.5px', fontWeight: 600, marginBottom: -18 }}>
              {ui.noMatch}
            </div>
          )}

          {cats.map((cat) => (
            <section key={cat.key} id={cat.key} aria-labelledby={cat.key + '-h'}>
              <h2 id={cat.key + '-h'} style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{cat.title}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cat.qs.map(({ q: question, a: answer }, i) => {
                  const k = cat.key + '-' + i;
                  const open = !!openMap[k];
                  return (
                    <div key={k} style={{ borderRadius: 14, overflow: 'hidden', background: open ? '#273c33' : 'var(--surface)', border: '1px solid ' + (open ? '#273c33' : 'var(--border)') }}>
                      <button
                        type="button"
                        onClick={() => toggle(k)}
                        aria-expanded={open}
                        aria-controls={k + '-panel'}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '16px 18px', cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'start', font: 'inherit' }}
                      >
                        <span style={{ fontSize: '14.5px', fontWeight: 600, color: open ? '#fff' : 'var(--text)' }}>{question}</span>
                        <span style={{ width: 26, height: 26, borderRadius: 9999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? '#2DFB91' : 'var(--tint)', transition: 'all .2s' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.6" aria-hidden="true">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" style={{ transition: 'transform .2s', transform: open ? 'scaleY(0)' : 'scaleY(1)', transformOrigin: 'center' }} />
                          </svg>
                        </span>
                      </button>
                      {open && (
                        <div id={k + '-panel'} style={{ padding: '0 18px 20px', fontSize: '13.5px', color: '#D8DED9', lineHeight: 1.85 }}>
                          {answer}
                          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => copy(k, question)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#8FE6B6', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, font: 'inherit' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" /></svg>
                              {copiedKey === k ? ui.copied : ui.share}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* CTA */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, background: 'linear-gradient(120deg,#043F20 0%,#022310 100%)', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{ui.ctaTitle}</div>
              <div style={{ marginTop: 4, fontSize: '13.5px', color: '#C3FED5' }}>{ui.ctaLead}</div>
            </div>
            <Link href="/contact" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: '14.5px', fontWeight: 800, flexShrink: 0 }}>
              {ui.ctaButton}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.6" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
