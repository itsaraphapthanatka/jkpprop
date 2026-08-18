'use client';

import { useEffect, useState } from 'react';
import Link from '@/i18n/LocaleLink';
import { useDict } from '@/i18n/useDict';
import { getFaq } from '@/i18n/faq';
import { useLocale } from '@/i18n/LocaleLink';
import type { SectionCopy } from '@/lib/server/sectionCopy';
import type { FaqCategory } from '@/lib/server/faqCopy';
import { ShareMenu } from '@/components/site/ShareMenu';

/* ============================================================
   Ported verbatim from FAQ.dc.html — hero, sticky category
   sidebar + search, 9 accordion categories, "still stuck" CTA.
   openMap keyed by `${catKey}-${i}`; search opens the first
   matching question and scrolls to its category. style-hover →
   the globals.css .dd-item helper is reused for sidebar links.
   ============================================================ */


/* Built-in set — only for a database with no FAQ rows at all. Once seeded
   (npm run faq:seed) every language reads the same rows from the CMS.

   The old built-in set was Thai only, so an empty database served the English
   and Chinese pages a Thai FAQ. i18n/faq.ts carries all three languages, and
   the same content is what the seeder writes into the CMS. */
const builtIn = (locale: Parameters<typeof getFaq>[0]): FaqCategory[] =>
  getFaq(locale).map((c) => ({ key: c.key, title: c.title, qs: c.qs.map(({ q, a }) => [q, a] as [string, string]) }));


export function FaqBody({ cats, copy }: { cats?: FaqCategory[]; copy: SectionCopy }) {
  const d = useDict();
  const pick = (v: string, fallback: string) => v || fallback;
  const locale = useLocale();
  const CATS = cats && cats.length ? cats : builtIn(locale);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  /* read after mount — the server has no window, and a share link has to carry
     the address the reader is actually on */
  const [origin, setOrigin] = useState('');
  const [pathname, setPathname] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
    setPathname(window.location.pathname);
    /* arriving on a shared link opens the question it names, rather than
       dropping the reader on a page of closed rows */
    // the category key is Thai, so the anchor arrives percent-encoded
    const id = decodeURIComponent(window.location.hash.replace('#', ''));
    if (id.startsWith('q-')) {
      setOpenMap((m) => ({ ...m, [id.slice(2)]: true }));
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'center' }), 100);
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState('');

  const toggle = (k: string) => setOpenMap((m) => ({ ...m, [k]: !m[k] }));

  const doSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    for (const cat of CATS) {
      const idx = cat.qs.findIndex(([question]) => question.toLowerCase().includes(q));
      if (idx > -1) {
        const k = cat.key + '-' + idx;
        setOpenMap((m) => ({ ...m, [k]: true }));
        setTimeout(() => {
          const el = document.getElementById(cat.key);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
        return;
      }
    }
  };

  return (
    <>
      {/* HERO */}
      <section style={{ position: 'relative', height: '220px' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderBottomRightRadius: '72px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={copy.img || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&q=80"} alt={d.faq.heroAlt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(var(--ink2-rgb),.82) 0%,rgba(var(--ink2-rgb),.5) 55%,rgba(var(--ink2-rgb),.28) 100%)', pointerEvents: 'none', borderBottomRightRadius: '72px' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1320px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{pick(copy.headline, d.faq.hero)}</h1>
          <p style={{ margin: '10px 0 0', fontSize: '14.5px', color: '#E8FFF0', maxWidth: '520px' }}>{pick(copy.sub, d.faq.heroSub)}</p>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted2)' }}>
        <Link href="/" style={{ color: 'var(--muted2)' }}>{d.common.home}</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{d.faq.hero}</span>
      </div>

      {/* LAYOUT */}
      <div id="faq-layout" style={{ maxWidth: '1320px', margin: '0 auto', padding: '20px 24px 80px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28, alignItems: 'start' }}>
        {/* SIDEBAR */}
        <aside id="faq-sidebar" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, position: 'sticky', top: 96 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{d.faq.categories}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder={d.faq.searchPlaceholder}
              style={{ flex: 1, height: 42, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', outline: 'none', minWidth: 0 }}
            />
            <div onClick={doSearch} style={{ width: 42, height: 42, borderRadius: 9999, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CATS.map((c) => (
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
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder={d.faq.searchPlaceholder}
                style={{ flex: 1, height: 46, padding: '0 16px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--text)', outline: 'none', minWidth: 0 }}
              />
              <div onClick={doSearch} style={{ width: 46, height: 46, borderRadius: 9999, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              </div>
            </div>
            <div className="no-sb" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, minWidth: 0 }}>
              {CATS.map((c) => (
                <a key={c.key} href={'#' + c.key} style={{ flexShrink: 0, height: 34, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{c.title}</a>
              ))}
            </div>
          </div>

          {CATS.map((cat) => (
            <div key={cat.key} id={cat.key}>
              <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{cat.title}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cat.qs.map(([question, answer], i) => {
                  const k = cat.key + '-' + i;
                  const open = !!openMap[k];
                  // a question has to have an address before anyone can share it
                  const anchor = `q-${k}`;
                  return (
                    <div key={k} id={anchor} style={{ borderRadius: 14, overflow: 'hidden', scrollMarginTop: 90, background: open ? 'var(--pine)' : 'var(--surface)', border: '1px solid ' + (open ? 'var(--pine)' : 'var(--border)') }}>
                      <button
                        type="button"
                        onClick={() => toggle(k)}
                        aria-expanded={open}
                        aria-controls={`faq-a-${k}`}
                        style={{ width: '100%', textAlign: 'start', font: 'inherit', background: 'transparent', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '16px 18px', cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: '14.5px', fontWeight: 600, color: open ? '#fff' : 'var(--text)' }}>{question}</div>
                        <div style={{ width: 26, height: 26, borderRadius: 9999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? 'var(--neon)' : 'var(--tint)', color: open ? 'var(--ink)' : 'var(--accent)', transition: 'all .2s' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.6">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" style={{ transition: 'transform .2s', transform: open ? 'scaleY(0)' : 'scaleY(1)', transformOrigin: 'center' }} />
                          </svg>
                        </div>
                      </button>
                      {/* Always in the HTML, hidden with CSS when collapsed.
                          Rendering it only on click meant the answers never
                          reached the server response, so a crawler — and any
                          AI reading the page — saw the questions and none of
                          the answers, on a page whose whole job is answering. */}
                      <div
                        id={`faq-a-${k}`}
                        hidden={!open}
                        style={{ padding: '0 18px 20px', fontSize: '13.5px', color: '#D8DED9', lineHeight: 1.85 }}
                      >
                          {/* the CMS body is markup; it arrives sanitised from faqCopy,
                              so paragraphs and lists render instead of showing their tags */}
                          <div dangerouslySetInnerHTML={{ __html: answer }} />
                          {/* It said "แชร์" and copied the question's *text* to the
                              clipboard — no link, and no sign that anything had
                              happened. Same menu as the rest of the site, and it
                              hands out a link that opens this question. */}
                          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                            <ShareMenu target={{ url: `${origin}${pathname}#${encodeURIComponent(anchor)}`, title: question }}>
                              <div data-testid={`faq-share-${k}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#8FE6B6', cursor: 'pointer' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" /></svg>
                                {d.faq.share}
                              </div>
                            </ShareMenu>
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CTA */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, background: 'linear-gradient(120deg,#043F20 0%,var(--ink) 100%)', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{d.faq.stillStuck}</div>
              <div style={{ marginTop: 4, fontSize: '13.5px', color: '#C3FED5' }}>{d.faq.stillStuckSub}</div>
            </div>
            <Link href="/contact" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', borderRadius: 9999, background: 'var(--neon)', color: 'var(--ink)', fontSize: '14.5px', fontWeight: 800, flexShrink: 0 }}>
              {d.nav.contactTeam}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.6"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
