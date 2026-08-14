'use client';

/* The topbar search.
 *
 * It shipped as an input with a ⌘K hint and nothing behind either: no state,
 * no request, no key listener. Typing a property code did nothing at all.
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/apiClient';

type Hit = { kind: 'property' | 'lead' | 'requirement' | 'deal'; id: string; title: string; sub: string; code: string; href: string };

const KIND: Record<Hit['kind'], { label: string; bg: string; fg: string }> = {
  property: { label: 'ทรัพย์', bg: 'rgba(13,108,59,.08)', fg: '#0D6C3B' },
  lead: { label: 'Lead', bg: '#EEF4F3', fg: '#034956' },
  requirement: { label: 'Requirement', bg: '#FBF3E1', fg: '#9A741C' },
  deal: { label: 'Deal', bg: '#F0ECF9', fg: '#7A3FB0' },
};

export function GlobalSearch() {
  const router = useRouter();
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [q, setQ] = React.useState('');
  const [hits, setHits] = React.useState<Hit[] | null>(null);
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  /* ⌘K / Ctrl-K — the hint printed in the box, now listened for */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  // debounced: a code is typed a character at a time and each one is a query
  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setHits(null); setBusy(false); return; }
    setBusy(true);
    const t = window.setTimeout(() => {
      apiGet<{ items: Hit[] }>(`/api/search?q=${encodeURIComponent(term)}`)
        .then((r) => { setHits(r.items ?? []); setCursor(0); })
        .catch(() => setHits([]))
        .finally(() => setBusy(false));
    }, 220);
    return () => window.clearTimeout(t);
  }, [q]);

  const go = (h: Hit) => { setOpen(false); setQ(''); setHits(null); router.push(h.href); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hits?.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (c + 1) % hits.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (c - 1 + hits.length) % hits.length); }
    if (e.key === 'Enter') { e.preventDefault(); const h = hits[cursor]; if (h) go(h); }
  };

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid ' + (open ? '#0D6C3B' : 'var(--border)'), minWidth: 240, transition: 'border-color .15s' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          id="admin-search"
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="ค้นหาทรัพย์, lead, รหัส…"
          style={{ border: 0, outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }}
        />
        {q ? (
          <span onClick={() => { setQ(''); setHits(null); inputRef.current?.focus(); }} title="ล้าง" style={{ display: 'flex', cursor: 'pointer', color: 'var(--muted3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </span>
        ) : (
          <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10.5px', color: 'var(--muted3)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 5px' }}>⌘K</code>
        )}
      </div>

      {open && q.trim().length >= 2 && (
        <div id="admin-search-results" style={{ position: 'absolute', top: 46, right: 0, width: 380, maxHeight: 420, overflowY: 'auto', zIndex: 500, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 20px 44px rgba(0,0,0,.16)', padding: 6 }} className="a-scroll">
          {hits === null || busy ? (
            <div style={{ padding: '14px 12px', fontSize: '12.5px', color: 'var(--muted2)' }}>กำลังค้นหา…</div>
          ) : hits.length === 0 ? (
            <div style={{ padding: '14px 12px', fontSize: '12.5px', color: 'var(--muted2)' }}>ไม่พบ &ldquo;{q.trim()}&rdquo; ในทรัพย์ · lead · requirement · deal</div>
          ) : (
            hits.map((h, i) => {
              const k = KIND[h.kind];
              return (
                <div
                  key={`${h.kind}-${h.id}`}
                  data-hit={h.kind}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(h)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', background: i === cursor ? 'var(--bg)' : 'transparent' }}
                >
                  <span style={{ height: 20, padding: '0 8px', borderRadius: 9999, background: k.bg, color: k.fg, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{k.label}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {h.code && <code style={{ color: '#0D6C3B', fontWeight: 700 }}>{h.code}</code>}{h.code && h.sub ? ' · ' : ''}{h.sub}
                    </span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
