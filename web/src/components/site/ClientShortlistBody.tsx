'use client';

import { useEffect, useState } from 'react';
import { getDictionary } from '@/i18n/dictionaries';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config';
import Link from 'next/link';
import Image from 'next/image';

/* ============================================================
   Ported verbatim from ClientShortlist.dc.html — a standalone
   shareable "curated shortlist" page (own dark broker top bar,
   no site header/footer). Cards ⇄ compare-table view toggle;
   per-item feedback (สนใจ / ยังไม่ตัดสินใจ / ไม่สนใจ). In the
   table the feedback chip cycles through the three states.
   ============================================================ */

type FbKey = 'interested' | 'undecided' | 'not';
interface FbDef { key: FbKey; label: string; on: string; onBg: string; paths: React.ReactNode }

const FB_DEFS: FbDef[] = [
  { key: 'interested', label: '', on: 'var(--deep)', onBg: '#E8F3EC', paths: (<><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.3a2 2 0 002-1.7l1.4-9a2 2 0 00-2-2.3z" /><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" /></>) },
  { key: 'undecided', label: '', on: '#9A741C', onBg: '#FBF3E1', paths: (<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01" /></>) },
  { key: 'not', label: '', on: '#C0392B', onBg: '#F9E4E1', paths: (<><path d="M10 15V19a3 3 0 003 3l4-9V2H5.7a2 2 0 00-2 1.7l-1.4 9a2 2 0 002 2.3z" /><path d="M17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3" /></>) },
];
const DEFAULT_PATHS = (<><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></>);

interface Cmp {
  rank: string; shortTitle: string; img: string;
  area: string; land: string; floor: string; height: string; power: string;
  rent: string; rentSqm: string; sale: string; deposit: string; advance: string; term: string;
}

interface RowDef { label: string; field: keyof Cmp; hi?: boolean; accent?: boolean }
const ROWS: RowDef[] = [
  { label: 'พื้นที่ทรัพย์', field: 'area' },
  { label: 'ขนาดที่ดิน', field: 'land' },
  { label: 'รับน้ำหนักพื้น', field: 'floor' },
  { label: 'ความสูง', field: 'height' },
  { label: 'ระบบไฟฟ้า', field: 'power' },
  { label: 'ค่าเช่า/เดือน', field: 'rent', hi: true },
  { label: 'ค่าเช่า/ตร.ม.', field: 'rentSqm' },
  { label: 'ราคาขาย', field: 'sale' },
  { label: 'เงินประกัน', field: 'deposit', accent: true },
  { label: 'ชำระล่วงหน้า', field: 'advance', accent: true },
  { label: 'สัญญาเช่า', field: 'term', accent: true },
];

const REQ_CHIPS = ['เช่าโกดัง', '2,000–3,500 ตร.ม.', '฿150K–250K/ด.', 'ต้องการ ร.ง.4', 'สมุทรปราการ/ชลบุรี'];

interface Item {
  rank: string; img: string; title: string; code: string; loc: string; price: string; unit: string; specs: string[];
}

const fbIcon = (paths: React.ReactNode, color: string, size = 15) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9">{paths}</svg>
);

/* GET /api/public/shortlists/:token item shape */
type ApiItem = {
  code: string; title: string; typeLabel: string; location: string;
  area: number | null; priceRent: number | null; priceSale: number | null;
  dealType: string; photo: string | null;
  itemId: string; feedback: string | null; feedbackNote: string | null;
};

/* the customer's answer, as the API stores it */
/* The buttons are keyed 'interested' | 'undecided' | 'not'; the column stores
   'interested' | 'maybe' | 'not_interested'. Getting this pair wrong meant two
   of the three answers were rejected by the server and only the happy one
   saved — which is exactly the answer you least need to be told. */
const FB_TO_API: Record<FbKey, string> = { interested: 'interested', undecided: 'maybe', not: 'not_interested' };
const API_TO_FB: Record<string, FbKey> = { interested: 'interested', maybe: 'undecided', not_interested: 'not' };

const money = (n: number) => `฿${n.toLocaleString('th-TH')}`;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=700&q=80';

type Contact = { name: string; phone: string; tel: string; email: string };

/* The page has no [locale] segment — the team appends ?lang=en to the link for
   a customer who does not read Thai, and the switcher lets the customer change
   it themselves. */
const LANGS: { key: Locale; label: string }[] = [
  { key: 'th', label: 'ไทย' },
  { key: 'en', label: 'EN' },
  { key: 'zh', label: '中文' },
];

export function ClientShortlistBody({ contact }: { contact?: Contact }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (isLocale(q ?? '')) setLocale(q as Locale);
  }, []);
  const d = getDictionary(locale).clientShortlist;
  const fbLabel = (k: FbKey) => (k === 'interested' ? d.interested : k === 'undecided' ? d.undecided : d.notInterested);
  const rowLabel = (field: string) => (d.rows as Record<string, string>)[field] ?? field;

  const [view, setView] = useState<'cards' | 'compare'>('cards');
  const [fb, setFb] = useState<Record<string, FbKey>>({});

  /* token link → real shortlist from the public API; no token → demo data */
  const [apiItems, setApiItems] = useState<Item[] | null>(null);
  const [apiCmp, setApiCmp] = useState<Cmp[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  /* the shortlist's own name and date — the header said
     "บริษัท ไทยโลจิสติกส์ กรุ๊ป จำกัด · ส่งเมื่อ 18 ก.ค. 2026" to everyone */
  const [meta, setMeta] = useState<{ name: string; createdAt: number } | null>(null);
  /* itemId per row, so an answer can be sent back */
  const [rowIds, setRowIds] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState('');
  const [saveErr, setSaveErr] = useState('');
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token');
    /* No token means this page was opened directly. It used to answer with a
       worked example — a fictional company and two invented properties — which
       is the last thing a customer-facing link should do. */
    if (!t) { setNotFound(true); return; }
    setToken(t);
    fetch(`/api/public/shortlists/${encodeURIComponent(t)}`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return; }
        const raw = (await r.json()) as { data?: { items: ApiItem[]; name: string; createdAt: number } } & { items?: ApiItem[]; name?: string; createdAt?: number };
        const d = raw.data ?? (raw as { items: ApiItem[]; name: string; createdAt: number });
        const items = Array.isArray(d.items) ? d.items : [];
        setMeta({ name: d.name ?? '', createdAt: d.createdAt ?? 0 });
        setRowIds(items.map((it) => it.itemId));
        setFb(Object.fromEntries(items.filter((it) => it.feedback && API_TO_FB[it.feedback]).map((it) => [it.itemId, API_TO_FB[it.feedback!]])));
        setApiItems(items.map((it, i) => ({
          rank: String(i + 1),
          img: it.photo || FALLBACK_IMG,
          title: it.title,
          code: it.code,
          loc: it.location || '—',
          price: it.priceRent !== null ? money(it.priceRent) : it.priceSale !== null ? money(it.priceSale) : 'ติดต่อสอบถาม',
          unit: it.priceRent !== null ? '/เดือน' : '',
          specs: [it.typeLabel, it.area !== null ? `${it.area.toLocaleString('th-TH')} ตร.ม.` : '', it.dealType].filter(Boolean),
        })));
        setApiCmp(items.map((it, i) => ({
          rank: String(i + 1),
          shortTitle: it.code,
          img: it.photo || FALLBACK_IMG,
          area: it.area !== null ? `${it.area.toLocaleString('th-TH')} ตร.ม.` : '—',
          land: '—', floor: '—', height: '—', power: '—',
          rent: it.priceRent !== null ? `${money(it.priceRent)}/ด.` : '—',
          rentSqm: it.priceRent !== null && it.area ? `฿${Math.round(it.priceRent / it.area)}/ตร.ม.` : '—',
          sale: it.priceSale !== null ? money(it.priceSale) : it.priceRent !== null ? 'ให้เช่าเท่านั้น' : '—',
          deposit: '—', advance: '—', term: '—',
        })));
      })
      .catch(() => setNotFound(true));
  }, []);

  const itemsData = apiItems ?? [];
  const cmpData = apiCmp ?? [];
  const itemIds = rowIds;

  /* the answer goes back to the team instead of colouring a button locally */
  const sendFeedback = (i: number, key: FbKey) => {
    const itemId = rowIds[i];
    if (!itemId || !token) return;
    setFb((f) => ({ ...f, [itemId]: key }));
    setSaving(itemId);
    setSaveErr('');
    fetch(`/api/public/shortlists/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, feedback: FB_TO_API[key] }),
    })
      .then((r) => { if (!r.ok) throw new Error(); })
      .catch(() => setSaveErr('1'))
      .finally(() => setSaving(''));
  };

  const tab = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 15px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', background: on ? 'var(--pine)' : 'transparent', color: on ? '#fff' : 'var(--muted)' });

  const cellStyle = (hi: boolean): React.CSSProperties => ({ padding: '13px 16px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: '12.5px', fontWeight: hi ? 800 : 600, color: hi ? 'var(--accent)' : 'var(--text)', background: hi ? 'rgba(var(--accent-rgb),.04)' : 'transparent' });

  if (notFound) {
    return (
      <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{d.notFound}</div>
        <div style={{ fontSize: '13.5px', color: 'var(--muted)' }}>{d.notFoundBody}</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      {/* TOP BAR (broker) */}
      <header style={{ background: '#0A0E0C', padding: '14px 24px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Image width={226} height={100} src="/assets/jkp-logo-white.png" alt="JKP Property" style={{ height: 32, width: 'auto', display: 'block' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 9999, background: 'rgba(var(--neon-rgb),.14)', border: '1px solid rgba(var(--neon-rgb),.3)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--neon)' }}>{d.badge}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {LANGS.map((l) => {
                const on = locale === l.key;
                return (
                  <div
                    key={l.key}
                    data-lang={l.key}
                    onClick={() => setLocale(l.key)}
                    style={{ height: 26, padding: '0 10px', borderRadius: 9999, display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: on ? 800 : 600, cursor: 'pointer', background: on ? 'rgba(255,255,255,.16)' : 'transparent', color: on ? '#fff' : '#9FD9BA', border: '1px solid ' + (on ? 'rgba(255,255,255,.3)' : 'transparent') }}
                  >{l.label}</div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* BRAND / CLIENT HEADER */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '28px 24px 0' }}>
        <div style={{ background: 'linear-gradient(135deg,#043F20 0%,var(--ink) 100%)', borderRadius: 22, padding: '30px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: 9999, background: 'rgba(var(--neon-rgb),.1)', pointerEvents: 'none' }} />
          <div id="cs-brandrow" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 72, height: 72, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 8, color: 'var(--muted3)', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{d.clientLogo}</div>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '.06em', color: '#8FE6B6', textTransform: 'uppercase' }}>{d.forCustomer}</div>
                <div style={{ marginTop: 4, fontSize: 22, fontWeight: 800, color: '#fff' }}>{meta?.name || 'ทรัพย์ที่คัดให้คุณ'}</div>
                <div style={{ marginTop: 4, fontSize: '12.5px', color: '#C3FED5', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8FE6B6" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  99/1 ถ.บางนา-ตราด กม.19 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '11.5px', color: '#8FE6B6' }}>Shortlist</div>
              <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: '#fff' }}>SL-208</code>
              <div style={{ marginTop: 6, fontSize: '11.5px', color: '#C3FED5' }}>
                {meta?.createdAt ? `ส่งเมื่อ ${new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(meta.createdAt))}` : ''}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 26, height: 2, background: 'var(--pine)', borderRadius: 2 }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', color: 'var(--pine)', textTransform: 'uppercase' }}>{d.picked}</span>
        </div>
        <h1 style={{ margin: '10px 0 6px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>{d.heading}</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', maxWidth: 640 }}>{d.sub}</p>
      </section>

      {/* REQUIREMENT SUMMARY */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '18px 24px 0' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted2)' }}>{d.criteria}</span>
          {REQ_CHIPS.map((c) => (
            <span key={c} style={{ height: 28, padding: '0 12px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>{c}</span>
          ))}
        </div>
      </section>

      {/* VIEW TOGGLE */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '18px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <div id="cs-view-toggle" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div onClick={() => setView('cards')} style={tab(view === 'cards')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>{d.cards}
          </div>
          <div onClick={() => setView('compare')} style={tab(view === 'compare')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 3v18" /></svg>{d.compare}
          </div>
        </div>
      </section>

      {/* COMPARE TABLE */}
      {view === 'compare' && (
        <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '16px 24px 0' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 12px 30px rgba(var(--ink-rgb),.06)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 18px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em', background: 'var(--bg)', position: 'sticky', left: 0, zIndex: 2 }}>{d.detail}</th>
                  {cmpData.map((c) => (
                    <th key={c.shortTitle} style={{ padding: 0, background: 'linear-gradient(135deg,#043F20,var(--ink))', minWidth: 200 }}>
                      <div style={{ padding: '16px 18px', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--neon)', color: 'var(--ink)', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.rank}</span>
                          <span style={{ fontSize: '13.5px', fontWeight: 800 }}>{c.shortTitle}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '14px 18px', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', background: 'var(--bg)', position: 'sticky', left: 0 }}>{d.photo}</td>
                  {cmpData.map((c) => (
                    <td key={c.shortTitle} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <Link href="/property" style={{ display: 'block', height: 96, borderRadius: 11, overflow: 'hidden', background: 'var(--tint)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.img} alt={c.shortTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </Link>
                      <Link href="/property" style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 30, borderRadius: 8, background: 'var(--tint)', color: 'var(--accent)', fontSize: '11.5px', fontWeight: 700 }}>{d.viewDetail}<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
                    </td>
                  ))}
                </tr>
                {ROWS.map((r) => (
                  <tr key={r.field}>
                    <td style={{ padding: '13px 18px', fontSize: '12.5px', fontWeight: 700, color: r.accent ? '#C0392B' : 'var(--text)', background: r.accent ? '#FBEEEC' : 'var(--bg)', position: 'sticky', left: 0 }}>{rowLabel(r.field)}</td>
                    {cmpData.map((c) => (
                      <td key={c.shortTitle} style={cellStyle(!!r.hi)}>{c[r.field]}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '14px 18px', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', background: 'var(--bg)', position: 'sticky', left: 0 }}>{d.opinion}</td>
                  {cmpData.map((c, i) => {
                    const cur = fb[itemIds[i]];
                    const def = FB_DEFS.find((x) => x.key === cur);
                    const active = !!cur;
                    const cycle = () => {
                      const order: FbKey[] = ['interested', 'undecided', 'not'];
                      const idx = order.indexOf(cur);
                      sendFeedback(i, order[(idx + 1) % 3]);
                    };
                    return (
                      <td key={c.shortTitle} style={{ padding: '12px 14px' }}>
                        <div onClick={cycle} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 13px', borderRadius: 9999, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', border: '1.5px solid ' + (active ? def!.on : 'var(--border)'), background: active ? def!.onBg : 'transparent', color: active ? def!.on : 'var(--text)' }}>
                          {fbIcon(def ? def.paths : DEFAULT_PATHS, active ? def!.on : 'var(--muted2)', 14)}
                          {def ? def.label : 'ให้ความเห็น'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ITEMS (cards) */}
      {view === 'cards' && (
        <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {itemsData.map((it, i) => (
            <div key={it.code} style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              <div id="cs-item" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0 }}>
                <div style={{ position: 'relative', minHeight: 220, background: 'var(--tint)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.img} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }} />
                  <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 7 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 9999, background: 'var(--deep)', color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,.25)' }}>{it.rank}</span>
                    <span style={{ height: 30, padding: '0 12px', borderRadius: 9999, background: 'rgba(255,255,255,.95)', color: 'var(--deep)', fontSize: '11.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 9999, background: 'var(--deep)' }} />{d.available}</span>
                  </div>
                </div>
                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', lineHeight: 1.35 }}>{it.title}</div>
                      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--deep)', fontWeight: 700 }}>{it.code}</code>
                        <span style={{ fontSize: '12.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>{it.loc}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: 'var(--accent)' }}>{it.price}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>{it.unit}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {it.specs.map((sp) => (
                      <span key={sp} style={{ height: 28, padding: '0 12px', borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>{sp}</span>
                    ))}
                    <Link href="/property" style={{ height: 28, padding: '0 12px', borderRadius: 9, background: 'var(--tint)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>{d.viewDetail}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted2)', marginBottom: 8 }}>{d.yourOpinion}</div>
                    {saveErr && <div style={{ marginBottom: 8, fontSize: 11, color: '#A32A2A', fontWeight: 600 }}>{d.saveFailed}</div>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {FB_DEFS.map((fbd) => {
                        const active = fb[itemIds[i]] === fbd.key;
                        return (
                          <div key={fbd.key} data-fb={`${it.code}:${fbd.key}`} onClick={() => sendFeedback(i, fbd.key)} style={{ opacity: saving === rowIds[i] ? .6 : 1, display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', transition: 'all .15s', border: '1.5px solid ' + (active ? fbd.on : 'var(--border)'), background: active ? fbd.onBg : 'transparent', color: active ? fbd.on : 'var(--text)' }}>
                            {fbIcon(fbd.paths, active ? fbd.on : 'var(--muted2)')}
                            {fbLabel(fbd.key)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* CONTACT AGENT */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 24px 60px' }}>
        <div style={{ background: '#0A0E0C', borderRadius: 20, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 9999, background: 'var(--pine)', color: 'var(--neon)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>JKP</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{contact?.name || 'JKP Property'}</div>
              <div style={{ fontSize: '12.5px', color: '#B9C2BD' }}>{d.askMore}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {contact?.tel && (
            <a href={contact.tel} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 46, padding: '0 22px', borderRadius: 9999, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.24)', color: '#fff', fontSize: '13.5px', fontWeight: 700 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" /></svg>{d.call} {contact.phone}</a>
            )}
            {/* was href="#" — it went nowhere. Marking a property as
                "สนใจ" above is what actually reaches the team now. */}
            {contact?.email && (
              <a href={`mailto:${contact.email}?subject=${encodeURIComponent('ขอนัดเข้าชมทรัพย์')}`} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 46, padding: '0 24px', borderRadius: 9999, background: 'var(--neon)', color: 'var(--ink)', fontSize: '13.5px', fontWeight: 800 }}>{d.emailUs}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
            )}
          </div>
        </div>
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: '11.5px', color: 'var(--muted3)' }}>{d.footer}</div>
      </section>
    </div>
  );
}
