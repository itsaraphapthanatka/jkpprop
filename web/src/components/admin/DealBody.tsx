'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, ApiClientError } from '@/lib/apiClient';

/* ============================================================
   Ported from AdminDeal.dc.html — Flow D "Negotiation → Deal".
   Interactive: the close-deal dialog flips the deal to won and
   locks the financial fields; an add-offer form with a customer
   /owner side toggle appends to the offers timeline.

   The `closed` + `closeDialogOpen` state is shared with the
   AdminShell topbar (dynamic status badge in the title, and the
   Close deal / Unlock buttons in the right cluster), so it lives
   in DealContext whose provider wraps <AdminShell> in page.tsx.
   ============================================================ */

interface DealCtx {
  closed: boolean;
  closeDialogOpen: boolean;
  openClose: () => void;
  closeDialog: () => void;
  /** outcome + note are sent to the server, which locks the financials */
  confirmClose: (outcome: string, note: string) => void;
  openUnlock: () => void;
  /** the record being edited (null while loading or when none exists yet) */
  dealId: string | null;
  offers: ApiOffer[];
  addOffer: (o: { side: string; amount: string; terms: string }) => Promise<boolean>;
}

export type ApiOffer = { id: string; side: string; amount: string; terms: string; createdAt: number };
type ApiDeal = { id: string; title: string; amount: number; status: string; locked: boolean; note: string | null };

const DealContext = createContext<DealCtx | null>(null);

function useDeal(): DealCtx {
  const ctx = useContext(DealContext);
  if (!ctx) throw new Error('DealContext is missing a provider');
  return ctx;
}

export function DealProvider({ children }: { children: React.ReactNode }) {
  const [closed, setClosed] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);
  const [offers, setOffers] = useState<ApiOffer[]>([]);

  /* the route has no :id segment yet — work the most recently updated deal */
  useEffect(() => {
    let alive = true;
    apiGet<{ items: ApiDeal[] }>('/api/deals')
      .then(async (r) => {
        const d = r.items?.[0];
        if (!alive || !d) return;
        setDealId(d.id);
        setClosed(d.locked || d.status !== 'negotiating');
        const o = await apiGet<{ items: ApiOffer[] }>(`/api/deals/${d.id}/offers`).catch(() => null);
        if (alive && o) setOffers(o.items ?? []);
      })
      .catch(() => { /* no deals yet — the page stays on its demo content */ });
    return () => { alive = false; };
  }, []);

  const value: DealCtx = {
    closed,
    closeDialogOpen,
    dealId,
    offers,
    openClose: () => setCloseDialogOpen(true),
    closeDialog: () => setCloseDialogOpen(false),
    confirmClose: (outcome, note) => {
      setCloseDialogOpen(false);
      setClosed(true); // optimistic; the server locks the financials
      if (!dealId) return;
      apiPatch(`/api/deals/${dealId}`, { status: outcome === 'ไม่สำเร็จ' ? 'lost' : 'won', note })
        .catch((e) => {
          setClosed(false);
          window.alert(e instanceof ApiClientError ? e.message : 'ปิดดีลไม่สำเร็จ');
        });
    },
    openUnlock: () => {
      if (!dealId) return;
      // deal_unlock is audited with a reason — the server rejects an empty one
      const reason = window.prompt('ระบุเหตุผลในการปลดล็อกดีล (บันทึกลง Audit log)');
      if (!reason || !reason.trim()) return;
      apiPatch(`/api/deals/${dealId}`, { unlock: true, reason })
        .then(() => setClosed(false))
        .catch((e) => window.alert(e instanceof ApiClientError ? e.message : 'ปลดล็อกไม่สำเร็จ'));
    },
    addOffer: async (o) => {
      if (!dealId) return true; // demo mode — let the local timeline handle it
      try {
        const created = await apiPost<ApiOffer>(`/api/deals/${dealId}/offers`, o);
        setOffers((prev) => [...prev, created]);
        return true;
      } catch (e) {
        window.alert(e instanceof ApiClientError ? e.message : 'บันทึกข้อเสนอไม่สำเร็จ');
        return false;
      }
    },
  };
  return <DealContext.Provider value={value}>{children}</DealContext.Provider>;
}

/* ---- Topbar title (h1 content): DEAL-089 + dynamic status badge ---- */
export function DealTitle() {
  const { closed } = useDeal();
  const statusLabel = closed ? 'closed · won' : 'contract_review';
  const statusBadge: React.CSSProperties = closed
    ? { fontSize: 12, fontWeight: 700, color: '#fff', background: '#0D6C3B', padding: '2px 8px', borderRadius: 6 }
    : { fontSize: 12, fontWeight: 700, color: '#034956', background: '#EEF4F3', padding: '2px 8px', borderRadius: 6 };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      DEAL-089 <code style={statusBadge}>{statusLabel}</code>
    </span>
  );
}

/* ---- Topbar right cluster: Close deal (open) / Unlock (closed) ---- */
export function DealActions() {
  const { closed, openClose, openUnlock } = useDeal();
  return (
    <div id="deal-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {!closed && (
        <div id="deal-close-btn" onClick={openClose} className="admin-primary-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>Close deal
        </div>
      )}
      {closed && (
        <div id="deal-unlock-btn" onClick={openUnlock} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.9"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" /></svg>Unlock (super admin)
        </div>
      )}
    </div>
  );
}

/* ---- Stage rail data ---- */
interface Stage {
  label: string;
  num: string;
  done: boolean;
  current: boolean;
  pending: boolean;
  line: boolean;
  circle: React.CSSProperties;
  labelColor: string;
  lineColor: string;
}

const circleBase: React.CSSProperties = { width: 32, height: 32, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const doneStage = (label: string, num: string): Stage => ({ label, num, done: true, current: false, pending: false, line: true, circle: { ...circleBase, background: '#0D6C3B' }, labelColor: '#0D6C3B', lineColor: '#0D6C3B' });
const currStage = (label: string, num: string): Stage => ({ label, num, done: false, current: true, pending: false, line: true, circle: { ...circleBase, background: '#273c33', boxShadow: '0 0 0 4px rgba(39,60,51,.15)' }, labelColor: '#273c33', lineColor: 'var(--border)' });
const pendStage = (label: string, num: string, last?: boolean): Stage => ({ label, num, done: false, current: false, pending: true, line: !last, circle: { ...circleBase, background: 'var(--bg)', border: '1.5px solid var(--border)' }, labelColor: 'var(--muted3)', lineColor: 'var(--border)' });

/* ---- Offers timeline data ---- */
interface Offer {
  side: string;
  sideStyle: React.CSSProperties;
  amount: string;
  terms: string;
  time: string;
  dotBg: string;
  icon: string;
  line: boolean;
}
interface ExtraOffer {
  side: string;
  amount: string;
  terms: string;
}

const PLUS = '<path d="M12 5v14M5 12h14"></path>';
const CHECK = '<path d="M20 6L9 17l-5-5"></path>';
const oi = (p: string, c: string) => '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2">' + p + '</svg>';
const sideC = (bg: string, fg: string): React.CSSProperties => ({ height: 22, padding: '0 11px', borderRadius: 9999, background: bg, color: fg, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' });
const dstat = (bg: string, fg: string): React.CSSProperties => ({ height: 22, padding: '0 10px', borderRadius: 9999, background: bg, color: fg, fontSize: '10.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexShrink: 0 });

const DOCS = [
  { name: 'สัญญาเช่า (ฉบับร่าง).pdf', meta: 'PDF · 2.4 MB · อัปโหลด 17 ก.ค.', iconBg: '#EEF4F3', iconColor: '#034956', status: 'รอเซ็น', statusStyle: dstat('#FBF3E1', '#9A741C') },
  { name: 'หนังสือรับรองบริษัท.pdf', meta: 'PDF · 1.1 MB · อัปโหลด 16 ก.ค.', iconBg: '#E8F3EC', iconColor: '#0D6C3B', status: 'ครบ', statusStyle: dstat('#E8F3EC', '#0D6C3B') },
  { name: 'แผนผังพื้นที่เช่า.pdf', meta: 'PDF · 3.8 MB · อัปโหลด 15 ก.ค.', iconBg: '#E8F3EC', iconColor: '#0D6C3B', status: 'ครบ', statusStyle: dstat('#E8F3EC', '#0D6C3B') },
];

export default function DealBody() {
  const { closed, closeDialogOpen, closeDialog, confirmClose, dealId, offers: apiOffers, addOffer } = useDeal();
  const [addOfferOpen, setAddOfferOpen] = useState(false);
  const [offerSide, setOfferSide] = useState('ฝั่งลูกค้า');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerTerms, setOfferTerms] = useState('');
  const [extraOffers, setExtraOffers] = useState<ExtraOffer[]>([]);
  const [openProp, setOpenProp] = useState<Record<string, boolean>>({});
  const [closeOutcome, setCloseOutcome] = useState('สำเร็จ');
  const [closeNote, setCloseNote] = useState('');

  const stages: Stage[] = closed
    ? [doneStage('Open', '1'), doneStage('Offer', '2'), doneStage('Counter', '3'), doneStage('Documentation', '4'), doneStage('Contract', '5'), doneStage('Closed won', '6')]
    : [doneStage('Open', '1'), doneStage('Offer', '2'), doneStage('Counter', '3'), currStage('Documentation', '4'), pendStage('Contract', '5'), pendStage('Closed', '6', true)];

  const base: Offer[] = [
    { side: 'ฝั่งลูกค้า', sideStyle: sideC('#EEF4F3', '#034956'), amount: '฿350,000/ด.', terms: 'เสนอเช่า 3 ปี ขอ fit-out ฟรี 2 เดือน', time: '15 ก.ค. 10:20', dotBg: '#EEF4F3', icon: oi(PLUS, '#034956'), line: true },
    { side: 'ฝั่งเจ้าของ', sideStyle: sideC('#FBF3E1', '#9A741C'), amount: '฿405,000/ด.', terms: 'ยืนราคาตั้ง ให้ fit-out ฟรี 1 เดือน', time: '16 ก.ค. 14:05', dotBg: '#FBF3E1', icon: oi(PLUS, '#9A741C'), line: true },
    { side: 'ฝั่งลูกค้า', sideStyle: sideC('#EEF4F3', '#034956'), amount: '฿375,000/ด.', terms: 'ขอกลางทาง + ประกัน 2 เดือน', time: '17 ก.ค. 09:30', dotBg: '#EEF4F3', icon: oi(PLUS, '#034956'), line: true },
    { side: 'ตกลง', sideStyle: sideC('#E8F3EC', '#0D6C3B'), amount: '฿385,000/ด.', terms: 'ตกลงราคาสุดท้าย fit-out 1.5 เดือน ประกัน 2 เดือน', time: '17 ก.ค. 16:40', dotBg: '#E8F3EC', icon: oi(CHECK, '#0D6C3B'), line: false },
  ];
  // once a real deal is loaded its offers ARE the timeline; the ported rows
  // only stand in for the empty demo state
  const extra: Offer[] = (dealId
    ? apiOffers.map((o) => ({ side: o.side, amount: o.amount, terms: o.terms || '—' }))
    : extraOffers
  ).map((o) => {
    const own = o.side === 'ฝั่งเจ้าของ';
    return { side: o.side, sideStyle: sideC(own ? '#FBF3E1' : '#EEF4F3', own ? '#9A741C' : '#034956'), amount: o.amount, terms: o.terms, time: 'เมื่อสักครู่', dotBg: own ? '#FBF3E1' : '#EEF4F3', icon: oi(PLUS, own ? '#9A741C' : '#034956'), line: false };
  });
  if (extra.length) base[base.length - 1] = { ...base[base.length - 1], line: true };
  const offers: Offer[] = (dealId ? [] : base).concat(extra.map((e, i) => ({ ...e, line: i < extra.length - 1 })));

  const sideOpts = (['ฝั่งลูกค้า', 'ฝั่งเจ้าของ'] as const).map((label) => {
    const sel = offerSide === label;
    return {
      label,
      select: () => setOfferSide(label),
      style: { flex: 1, height: 36, borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (sel ? '#0D6C3B' : 'var(--border)'), background: sel ? '#0D6C3B' : 'transparent', color: sel ? '#fff' : 'var(--text)' } as React.CSSProperties,
    };
  });

  const saveOffer = async () => {
    const a = offerAmount.trim();
    if (!a) return;
    const okSaved = await addOffer({ side: offerSide, amount: a, terms: offerTerms.trim() || '—' });
    if (!okSaved) return; // server rejected (e.g. the deal is locked)
    if (!dealId) setExtraOffers([...extraOffers, { side: offerSide, amount: a, terms: offerTerms.trim() || '—' }]);
    setOfferAmount('');
    setOfferTerms('');
    setAddOfferOpen(false);
  };

  const summaryCardStyle: React.CSSProperties = closed
    ? { background: 'linear-gradient(135deg,#043F20 0%,#022310 100%)', borderRadius: 16, padding: 22 }
    : { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 };
  const summaryTitleColor = closed ? '#fff' : 'var(--text)';
  const summaryMuted = closed ? '#B9C2BD' : 'var(--muted)';
  const summaryVal = closed ? '#fff' : 'var(--text)';

  const dealSummary = [
    { k: 'ประเภท', v: 'เช่า' },
    { k: 'ราคาที่ตกลง', v: '฿385,000 / เดือน' },
    { k: 'มูลค่าสัญญา 3 ปี', v: '฿13.86M' },
    { k: 'วันเซ็นสัญญา', v: closed ? '18 ก.ค. 2026' : 'รอเซ็น' },
    { k: 'สถานะ', v: closed ? 'ปิดดีลแล้ว (won)' : 'contract review' },
  ];

  const propCode = 'JKP-SPK0042';
  const propOpen = !!openProp[propCode];

  return (
    <>
      {/* STAGE RAIL */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 26px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Flow D — Negotiation → Deal</div>
          <span style={{ fontSize: 12, color: 'var(--muted2)' }}>lead อัปเดตอัตโนมัติเป็น <b style={{ color: 'var(--accent)' }}>won</b> เมื่อปิดดีล</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
          {stages.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={s.circle}>
                  {s.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                  {s.current && <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#fff' }} />}
                  {s.pending && <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted3)' }}>{s.num}</span>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: s.labelColor, whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {s.line && <div style={{ flex: 1, height: 2, background: s.lineColor, margin: '0 6px', marginBottom: 26 }} />}
            </div>
          ))}
        </div>
      </div>

      <div id="deal-split" style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT: offers + docs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* context (accordion header — คลิกเพื่อกาง/ซ่อนรายละเอียดด้านใน) */}
          <div onClick={() => setOpenProp((p) => ({ ...p, [propCode]: !p[propCode] }))} style={{ background: 'var(--surface)', border: '1px solid ' + (propOpen ? '#0D6C3B' : 'var(--border)'), borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', cursor: 'pointer', transition: 'border-color .15s' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text)' }}>โกดังพร้อมสำนักงาน 2,700 ตร.ม.</div>
              <code style={{ fontSize: 12, color: '#0D6C3B', fontWeight: 700 }}>JKP-SPK0042</code> <span style={{ fontSize: 12, color: 'var(--muted)' }}>· บ. ไทยโลจิสติกส์</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>ตกลงที่</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: '#034956' }}>฿385,000<span style={{ fontSize: 12, color: 'var(--muted)' }}>/ด.</span></div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4" style={{ flexShrink: 0, transform: propOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
          </div>

          {propOpen && (
          <>
          {/* offers timeline */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', minWidth: 0 }}>ประวัติการเจรจา (Offers)</div>
              <div onClick={() => setAddOfferOpen((v) => !v)} style={{ height: 34, padding: '0 14px', borderRadius: 9999, background: '#273c33', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>เพิ่ม offer
              </div>
            </div>
            {addOfferOpen && (
              <div style={{ border: '1px solid #273c33', borderRadius: 13, padding: 14, marginBottom: 16, background: 'var(--bg)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {sideOpts.map((s) => (
                    <div key={s.label} onClick={s.select} style={s.style}>{s.label}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder="ราคา เช่น ฿380,000/ด." style={{ flex: 1, minWidth: 0, height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '12.5px', background: 'var(--surface)', outline: 'none' }} />
                  <div onClick={saveOffer} style={{ height: 40, padding: '0 16px', borderRadius: 10, background: '#0D6C3B', color: '#fff', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>เพิ่ม</div>
                </div>
                <input value={offerTerms} onChange={(e) => setOfferTerms(e.target.value)} placeholder="เงื่อนไข (เช่น ขอ fit-out ฟรี 1 เดือน)" style={{ marginTop: 8, width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: '12.5px', background: 'var(--surface)', outline: 'none' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {offers.map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9999, background: o.dotBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: o.icon }} />
                    {o.line && <div style={{ flex: 1, width: 2, background: 'var(--border)', marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <span style={o.sideStyle}>{o.side}</span>
                      <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{o.amount}</span>
                    </div>
                    <div style={{ marginTop: 5, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.55 }}>{o.terms}</div>
                    <div style={{ marginTop: 3, fontSize: 11, color: 'var(--muted3)' }}>{o.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* documents */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>เอกสาร Deal</div>
              <div style={{ height: 34, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>อัปโหลด
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DOCS.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: d.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: d.iconColor }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>{d.meta}</div>
                  </div>
                  <span style={d.statusStyle}>{d.status}</span>
                </div>
              ))}
            </div>
          </div>
          </>
          )}
        </div>

        {/* RIGHT: deal summary + commission */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={summaryCardStyle}>
            <div style={{ fontSize: 14, fontWeight: 800, color: summaryTitleColor, marginBottom: 16 }}>สรุปดีล</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dealSummary.map((q) => (
                <div key={q.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: '12.5px', color: summaryMuted }}>{q.k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: summaryVal }}>{q.v}</span>
                </div>
              ))}
            </div>
            {closed && (
              <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 11, background: 'rgba(45,251,145,.12)', border: '1px solid rgba(45,251,145,.3)', display: 'flex', alignItems: 'center', gap: 9 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                <span style={{ fontSize: '11.5px', color: '#8FE6B6', fontWeight: 600 }}>ฟิลด์การเงินถูกล็อก — ปลดล็อกได้เฉพาะ super admin (ลง audit)</span>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>ค่าคอมมิชชัน</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: 'var(--bg)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 9999, background: '#273c33', color: '#2DFB91', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>อ</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>อารยา (agent)</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>3% ของค่าเช่าปีแรก</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: '#034956' }}>฿138,600</div>
                <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#FBF3E1', color: '#9A741C', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>รอจ่าย</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLOSE DIALOG */}
      {closeDialogOpen && (
        <div onClick={closeDialog} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="a-scroll" style={{ width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: 28, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 9999, background: '#E8F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h3 style={{ margin: '16px 0 0', fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>ปิดดีลนี้?</h3>
            <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6 }}>lead จะเปลี่ยนเป็น <b>won</b> · บันทึก commission · ฟิลด์การเงินจะถูกล็อก (แก้ได้เฉพาะ super admin)</p>
            <div style={{ marginTop: 18, textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ผลการปิดดีล</label>
              <select value={closeOutcome} onChange={(e) => setCloseOutcome(e.target.value)} style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13.5px', background: 'var(--surface)', color: 'var(--text)', outline: 'none', cursor: 'pointer' }}>
                <option value="สำเร็จ">สำเร็จ</option>
                <option value="ไม่สำเร็จ">ไม่สำเร็จ</option>
              </select>
              <label style={{ display: 'block', margin: '14px 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>หมายเหตุ</label>
              <textarea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} placeholder="หมายเหตุ (ถ้ามี)…" style={{ width: '100%', height: 76, padding: '10px 12px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', resize: 'none' }} />
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
              <div onClick={closeDialog} style={{ flex: 1, height: 46, borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div onClick={() => confirmClose(closeOutcome, closeNote)} style={{ flex: 1, height: 46, borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>ยืนยันปิดดีล</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
