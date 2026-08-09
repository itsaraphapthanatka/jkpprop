'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  { key: 'interested', label: 'สนใจ', on: '#0D6C3B', onBg: '#E8F3EC', paths: (<><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.3a2 2 0 002-1.7l1.4-9a2 2 0 00-2-2.3z" /><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" /></>) },
  { key: 'undecided', label: 'ยังไม่ตัดสินใจ', on: '#9A741C', onBg: '#FBF3E1', paths: (<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01" /></>) },
  { key: 'not', label: 'ไม่สนใจ', on: '#C0392B', onBg: '#F9E4E1', paths: (<><path d="M10 15V19a3 3 0 003 3l4-9V2H5.7a2 2 0 00-2 1.7l-1.4 9a2 2 0 002 2.3z" /><path d="M17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3" /></>) },
];
const DEFAULT_PATHS = (<><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></>);

interface Cmp {
  rank: string; shortTitle: string; img: string;
  area: string; land: string; floor: string; height: string; power: string;
  rent: string; rentSqm: string; sale: string; deposit: string; advance: string; term: string;
}
const CMP: Cmp[] = [
  { rank: '1', shortTitle: 'JKP-SPK0042', img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=500&q=80', area: '2,700 ตร.ม.', land: '4 ไร่', floor: '3 ตัน/ตร.ม.', height: '9 เมตร', power: '3 Phase 50/150A', rent: '฿176,000/ด.', rentSqm: '฿150/ตร.ม.', sale: 'ให้เช่าเท่านั้น', deposit: '3 เดือน', advance: '1 เดือน', term: '3 ปี' },
  { rank: '2', shortTitle: 'JKP-SKN0015', img: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=500&q=80', area: '1,800 ตร.ม.', land: '2.5 ไร่', floor: '2 ตัน/ตร.ม.', height: '8 เมตร', power: '3 Phase 50/100A', rent: '฿88,000/ด.', rentSqm: '฿49/ตร.ม.', sale: '฿62M', deposit: '3 เดือน', advance: '1 เดือน', term: '3 ปี' },
];
const ITEM_IDS = ['i1', 'i2'];

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
const ITEMS: Item[] = [
  { rank: '1', img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=700&q=80', title: 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', code: 'JKP-SPK0042', loc: 'บางพลี, สมุทรปราการ', price: '฿176,000', unit: '/เดือน · ฿150/ตร.ม.', specs: ['2,700 ตร.ม.', 'สูง 9 ม.', 'ร.ง.4 ได้', '3 Phase'] },
  { rank: '2', img: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=700&q=80', title: 'โกดังให้เช่า มหาชัย 1,800 ตร.ม.', code: 'JKP-SKN0015', loc: 'เมือง, สมุทรสาคร', price: '฿88,000', unit: '/เดือน · ฿49/ตร.ม.', specs: ['1,800 ตร.ม.', 'สูง 8 ม.', 'บนถนนหลัก', 'ใกล้ท่าเรือ'] },
];

const fbIcon = (paths: React.ReactNode, color: string, size = 15) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9">{paths}</svg>
);

/* GET /api/public/shortlists/:token item shape */
type ApiItem = {
  code: string; title: string; typeLabel: string; location: string;
  area: number | null; priceRent: number | null; priceSale: number | null;
  dealType: string; photo: string | null;
};

const money = (n: number) => `฿${n.toLocaleString('th-TH')}`;
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=700&q=80';

export function ClientShortlistBody() {
  const [view, setView] = useState<'cards' | 'compare'>('cards');
  const [fb, setFb] = useState<Record<string, FbKey>>({});

  /* token link → real shortlist from the public API; no token → demo data */
  const [apiItems, setApiItems] = useState<Item[] | null>(null);
  const [apiCmp, setApiCmp] = useState<Cmp[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return;
    fetch(`/api/public/shortlists/${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return; }
        const d = (await r.json()) as { items: ApiItem[] };
        const items = Array.isArray(d.items) ? d.items : [];
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
      .catch(() => { /* keep demo view (§2.2) */ });
  }, []);

  const itemsData = apiItems ?? ITEMS;
  const cmpData = apiCmp ?? CMP;
  const itemIds = apiItems ? apiItems.map((i) => i.code) : ITEM_IDS;

  const tab = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 15px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', background: on ? '#273c33' : 'transparent', color: on ? '#fff' : 'var(--muted)' });

  const cellStyle = (hi: boolean): React.CSSProperties => ({ padding: '13px 16px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: '12.5px', fontWeight: hi ? 800 : 600, color: hi ? '#034956' : 'var(--text)', background: hi ? 'rgba(3,73,86,.04)' : 'transparent' });

  if (notFound) {
    return (
      <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>ไม่พบรายการนี้ หรือลิงก์หมดอายุแล้ว</div>
        <div style={{ fontSize: '13.5px', color: 'var(--muted)' }}>กรุณาติดต่อทีมงาน JKP Property เพื่อขอลิงก์ใหม่</div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      {/* TOP BAR (broker) */}
      <header style={{ background: '#0A0E0C', padding: '14px 24px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jkp-logo-white.png" alt="JKP Property" style={{ height: 32, width: 'auto', display: 'block' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 9999, background: 'rgba(45,251,145,.14)', border: '1px solid rgba(45,251,145,.3)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#2DFB91' }}>ลิงก์ส่วนตัว · ไม่ต้องเข้าสู่ระบบ</span>
          </div>
        </div>
      </header>

      {/* BRAND / CLIENT HEADER */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '28px 24px 0' }}>
        <div style={{ background: 'linear-gradient(135deg,#043F20 0%,#022310 100%)', borderRadius: 22, padding: '30px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: 9999, background: 'rgba(45,251,145,.1)', pointerEvents: 'none' }} />
          <div id="cs-brandrow" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 72, height: 72, borderRadius: 16, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', padding: 8, color: 'var(--muted3)', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>โลโก้ลูกค้า</div>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '.06em', color: '#8FE6B6', textTransform: 'uppercase' }}>คัดทรัพย์สำหรับ</div>
                <div style={{ marginTop: 4, fontSize: 22, fontWeight: 800, color: '#fff' }}>บริษัท ไทยโลจิสติกส์ กรุ๊ป จำกัด</div>
                <div style={{ marginTop: 4, fontSize: '12.5px', color: '#C3FED5', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8FE6B6" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  99/1 ถ.บางนา-ตราด กม.19 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '11.5px', color: '#8FE6B6' }}>Shortlist</div>
              <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: '#fff' }}>SL-208</code>
              <div style={{ marginTop: 6, fontSize: '11.5px', color: '#C3FED5' }}>ส่งเมื่อ 18 ก.ค. 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.06em', color: '#273c33', textTransform: 'uppercase' }}>รายการที่คัดให้</span>
        </div>
        <h1 style={{ margin: '10px 0 6px', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>ทรัพย์ที่ตรงกับความต้องการของคุณ</h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', maxWidth: 640 }}>ทีมงาน JKP Property คัดเลือก 2 รายการที่ตรงเงื่อนไขและตรวจสอบว่าว่างแล้ว — กรุณาให้ความเห็นแต่ละรายการเพื่อให้เราจัดนัดเข้าชมต่อไป</p>
      </section>

      {/* REQUIREMENT SUMMARY */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '18px 24px 0' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted2)' }}>ความต้องการ:</span>
          {REQ_CHIPS.map((c) => (
            <span key={c} style={{ height: 28, padding: '0 12px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>{c}</span>
          ))}
        </div>
      </section>

      {/* VIEW TOGGLE */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '18px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <div id="cs-view-toggle" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div onClick={() => setView('cards')} style={tab(view === 'cards')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>การ์ด
          </div>
          <div onClick={() => setView('compare')} style={tab(view === 'compare')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 3v18" /></svg>ตารางเปรียบเทียบ
          </div>
        </div>
      </section>

      {/* COMPARE TABLE */}
      {view === 'compare' && (
        <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '16px 24px 0' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 12px 30px rgba(2,35,16,.06)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 18px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em', background: 'var(--bg)', position: 'sticky', left: 0, zIndex: 2 }}>รายละเอียด</th>
                  {cmpData.map((c) => (
                    <th key={c.shortTitle} style={{ padding: 0, background: 'linear-gradient(135deg,#043F20,#022310)', minWidth: 200 }}>
                      <div style={{ padding: '16px 18px', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 26, height: 26, borderRadius: 8, background: '#2DFB91', color: '#022310', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.rank}</span>
                          <span style={{ fontSize: '13.5px', fontWeight: 800 }}>{c.shortTitle}</span>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '14px 18px', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', background: 'var(--bg)', position: 'sticky', left: 0 }}>รูปทรัพย์</td>
                  {cmpData.map((c) => (
                    <td key={c.shortTitle} style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <Link href="/property" style={{ display: 'block', height: 96, borderRadius: 11, overflow: 'hidden', background: 'var(--tint)' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.img} alt={c.shortTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </Link>
                      <Link href="/property" style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, height: 30, borderRadius: 8, background: 'var(--tint)', color: 'var(--accent)', fontSize: '11.5px', fontWeight: 700 }}>ดูรายละเอียด<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
                    </td>
                  ))}
                </tr>
                {ROWS.map((r) => (
                  <tr key={r.field}>
                    <td style={{ padding: '13px 18px', fontSize: '12.5px', fontWeight: 700, color: r.accent ? '#C0392B' : 'var(--text)', background: r.accent ? '#FBEEEC' : 'var(--bg)', position: 'sticky', left: 0 }}>{r.label}</td>
                    {cmpData.map((c) => (
                      <td key={c.shortTitle} style={cellStyle(!!r.hi)}>{c[r.field]}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '14px 18px', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', background: 'var(--bg)', position: 'sticky', left: 0 }}>ความเห็น</td>
                  {cmpData.map((c, i) => {
                    const cur = fb[itemIds[i]];
                    const def = FB_DEFS.find((x) => x.key === cur);
                    const active = !!cur;
                    const cycle = () => {
                      const order: FbKey[] = ['interested', 'undecided', 'not'];
                      const idx = order.indexOf(cur);
                      setFb((f) => ({ ...f, [itemIds[i]]: order[(idx + 1) % 3] }));
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
                    <span style={{ width: 30, height: 30, borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,.25)' }}>{it.rank}</span>
                    <span style={{ height: 30, padding: '0 12px', borderRadius: 9999, background: 'rgba(255,255,255,.95)', color: '#0D6C3B', fontSize: '11.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 9999, background: '#0D6C3B' }} />ว่าง</span>
                  </div>
                </div>
                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', lineHeight: 1.35 }}>{it.title}</div>
                      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: '#0D6C3B', fontWeight: 700 }}>{it.code}</code>
                        <span style={{ fontSize: '12.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.8"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>{it.loc}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: '#034956' }}>{it.price}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>{it.unit}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {it.specs.map((sp) => (
                      <span key={sp} style={{ height: 28, padding: '0 12px', borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>{sp}</span>
                    ))}
                    <Link href="/property" style={{ height: 28, padding: '0 12px', borderRadius: 9, background: 'var(--tint)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>ดูรายละเอียด<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted2)', marginBottom: 8 }}>ความเห็นของคุณ</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {FB_DEFS.map((d) => {
                        const active = fb[itemIds[i]] === d.key;
                        return (
                          <div key={d.key} onClick={() => setFb((f) => ({ ...f, [ITEM_IDS[i]]: d.key }))} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', transition: 'all .15s', border: '1.5px solid ' + (active ? d.on : 'var(--border)'), background: active ? d.onBg : 'transparent', color: active ? d.on : 'var(--text)' }}>
                            {fbIcon(d.paths, active ? d.on : 'var(--muted2)')}
                            {d.label}
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
            <div style={{ width: 52, height: 52, borderRadius: 9999, background: '#273c33', color: '#2DFB91', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>อ</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>อารยา สุขสวัสดิ์ · ที่ปรึกษาของคุณ</div>
              <div style={{ fontSize: '12.5px', color: '#B9C2BD' }}>สอบถามเพิ่มเติมหรือจัดนัดเข้าชมได้เลย</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="tel:+66818000000" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 46, padding: '0 22px', borderRadius: 9999, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.24)', color: '#fff', fontSize: '13.5px', fontWeight: 700 }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" /></svg>โทร</a>
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 46, padding: '0 24px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: '13.5px', fontWeight: 800 }}>จัดนัดเข้าชม<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
          </div>
        </div>
        <div style={{ marginTop: 16, textAlign: 'center', fontSize: '11.5px', color: 'var(--muted3)' }}>ราคาและสถานะว่างอาจเปลี่ยนแปลง — ทีมงานจะยืนยันอีกครั้งก่อนนัดเข้าชม · Powered by JKP Property</div>
      </section>
    </div>
  );
}
