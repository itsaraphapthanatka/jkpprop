'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiFetch, apiGet, apiPost, apiPatch, apiDelete, ApiClientError } from '@/lib/apiClient';

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
  confirmClose: (outcome: string, note: string, leaseEndDate?: string) => void;
  openUnlock: () => void;
  /** the record being edited (null while loading or when none exists yet) */
  dealId: string | null;
  /** the record itself — the property card and the figures came from constants */
  deal: ApiDeal | null;
  offers: ApiOffer[];
  /* attaching a file had no route and no table — the panel listed three
     invented PDFs beside an upload button with no handler */
  docs: ApiDoc[];
  uploadDoc: (file: File) => Promise<string>;
  setDocStatus: (docId: string, status: string) => void;
  removeDoc: (docId: string) => void;
  uploading: boolean;
  addOffer: (o: { side: string; amount: string; terms: string }) => Promise<boolean>;
}

export type ApiOffer = { id: string; side: string; amount: string; terms: string; createdAt: number };
type ApiDoc = { id: string; filename: string; mime: string; size: number; status: string; createdAt: number; url: string };

type ApiDeal = {
  id: string; title: string; amount: number; status: string; locked: boolean; note: string | null;
  propertyCode: string; propertyTitle: string; customer: string;
};

const DealContext = createContext<DealCtx | null>(null);

function useDeal(): DealCtx {
  const ctx = useContext(DealContext);
  if (!ctx) throw new Error('DealContext is missing a provider');
  return ctx;
}

export function DealProvider({ children, dealId: fixedId }: { children: React.ReactNode; dealId?: string }) {
  const [closed, setClosed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);
  const [deal, setDeal] = useState<ApiDeal | null>(null);
  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [docs, setDocs] = useState<ApiDoc[]>([]);

  /* /admin/deals/<id> pins a record; /admin/deals falls back to the newest */
  useEffect(() => {
    let alive = true;
    apiGet<{ items: ApiDeal[] }>('/api/deals')
      .then(async (r) => {
        const d = fixedId ? r.items?.find((x) => x.id === fixedId) : r.items?.[0];
        if (!alive || !d) return;
        setDealId(d.id);
        setDeal(d);
        setClosed(d.locked || d.status !== 'negotiating');
        const o = await apiGet<{ items: ApiOffer[] }>(`/api/deals/${d.id}/offers`).catch(() => null);
        if (alive && o) setOffers(o.items ?? []);
        const dc = await apiGet<{ items: ApiDoc[] }>(`/api/deals/${d.id}/docs`).catch(() => null);
        if (alive && dc) setDocs(dc.items ?? []);
      })
      .catch(() => { /* no deals yet — the screen says so */ });
    return () => { alive = false; };
  }, [fixedId]);

  const value: DealCtx = {
    closed,
    closeDialogOpen,
    dealId,
    deal,
    offers,
    docs,
    uploading,
    uploadDoc: async (file: File) => {
      if (!dealId) return 'ยังไม่มีดีล';
      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', file);
        // apiPost JSON-stringifies its body; a multipart upload goes through
        // apiFetch, which leaves the browser's boundary alone
        const made = await apiFetch<ApiDoc>(`/api/deals/${dealId}/docs`, { method: 'POST', body: form });
        setDocs((prev) => [made, ...prev]);
        return '';
      } catch (e) {
        return e instanceof ApiClientError ? e.message : 'อัปโหลดไม่สำเร็จ';
      } finally {
        setUploading(false);
      }
    },
    setDocStatus: (docId: string, status: string) => {
      if (!dealId) return;
      setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status } : d)));
      apiPatch(`/api/deals/${dealId}/docs/${docId}`, { status })
        .catch((e) => window.alert(e instanceof ApiClientError ? e.message : 'เปลี่ยนสถานะไม่สำเร็จ'));
    },
    removeDoc: (docId: string) => {
      if (!dealId) return;
      const before = docs;
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      apiDelete(`/api/deals/${dealId}/docs/${docId}`)
        .catch((e) => { setDocs(before); window.alert(e instanceof ApiClientError ? e.message : 'ลบไม่สำเร็จ'); });
    },
    openClose: () => setCloseDialogOpen(true),
    closeDialog: () => setCloseDialogOpen(false),
    confirmClose: (outcome, note, leaseEndDate) => {
      setCloseDialogOpen(false);
      if (!dealId) return; // ไม่มีดีล = ไม่มีอะไรให้ปิด (เดิมขึ้นว่าปิดแล้ว)
      setClosed(true); // optimistic; the server locks the financials
      /* a won rental with an end date opens the lease, so the expiry bell has
         something true to count down to without anyone typing it again */
      apiPatch(`/api/deals/${dealId}`, { status: outcome === 'ไม่สำเร็จ' ? 'lost' : 'won', note, leaseEndDate })
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
/* ป้ายสถานะเคยเป็น closed ? 'closed · won' : 'contract_review' — ไม่เคยอ่าน
   deal.status เลยสักครั้ง ดีลที่แพ้ (lost) ก็ยังขึ้นว่ากำลังตรวจสัญญา และตอนที่
   ระบบไม่มีดีลสักใบ หัวเรื่องก็ยังประกาศสถานะของดีลที่ไม่มีอยู่ */
const DEAL_STATUS: Record<string, string> = { negotiating: 'กำลังเจรจา', won: 'ปิดได้ (won)', lost: 'ไม่สำเร็จ (lost)' };

export function DealTitle() {
  const { closed, dealId, deal } = useDeal();
  const statusLabel = deal ? (DEAL_STATUS[deal.status] ?? deal.status) : 'ยังไม่มีดีล';
  const statusBadge: React.CSSProperties = closed || deal?.status === 'won'
    ? { fontSize: 12, fontWeight: 700, color: '#fff', background: '#0D6C3B', padding: '2px 8px', borderRadius: 6 }
    : { fontSize: 12, fontWeight: 700, color: '#034956', background: '#EEF4F3', padding: '2px 8px', borderRadius: 6 };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {dealId ? `DEAL-${dealId.slice(-6).toUpperCase()}` : 'ดีล'} <code style={statusBadge}>{statusLabel}</code>
    </span>
  );
}

/* ---- Topbar right cluster: Close deal (open) / Unlock (closed) ---- */
export function DealActions() {
  const { closed, openClose, openUnlock, dealId } = useDeal();
  // เดิมกดได้เสมอ และ confirmClose ก็ตั้ง closed = true ก่อนดูว่ามีดีลไหม
  if (!dealId) return <div id="deal-actions" />;
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
const oi = (p: string, c: string) => '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2">' + p + '</svg>';
const sideC = (bg: string, fg: string): React.CSSProperties => ({ height: 22, padding: '0 11px', borderRadius: 9999, background: bg, color: fg, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' });

export default function DealBody() {
  const { closed, closeDialogOpen, closeDialog, confirmClose, dealId, deal, offers: apiOffers, addOffer, docs, uploadDoc, setDocStatus, removeDoc, uploading } = useDeal();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [docErr, setDocErr] = useState('');
  const [addOfferOpen, setAddOfferOpen] = useState(false);
  const [offerSide, setOfferSide] = useState('ฝั่งลูกค้า');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerTerms, setOfferTerms] = useState('');
  const [extraOffers, setExtraOffers] = useState<ExtraOffer[]>([]);
  const [closeOutcome, setCloseOutcome] = useState('สำเร็จ');
  const [closeNote, setCloseNote] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');

  /* แถบขั้นตอนเคยตายตัว: Open / Offer / Counter ติ๊กเสร็จเสมอ และ Documentation
     เป็นขั้นปัจจุบันเสมอ ไม่ว่าดีลใบนั้นจะอยู่ตรงไหน — ดีลที่เพิ่งเปิดเมื่อกี้ก็
     ดูเหมือนเดินมาครึ่งทางแล้ว และตอนที่ยังไม่มีดีลสักใบก็ยังวาดให้ดู
     ตอนนี้ขั้นที่เสร็จนับจากของจริง: มีข้อเสนอกี่ครั้ง แนบเอกสารหรือยัง ปิดหรือยัง */
  const stageIndex = !deal ? -1
    : deal.status === 'won' || deal.status === 'lost' ? 5
      : docs.length ? 3
        : apiOffers.length > 1 ? 2
          : apiOffers.length ? 1
            : 0;
  const STAGE_LABELS: [string, string][] = [['Open', '1'], ['Offer', '2'], ['Counter', '3'], ['Documentation', '4'], ['Contract', '5'], [closed || deal?.status === 'won' ? 'Closed won' : 'Closed', '6']];
  const stages: Stage[] = STAGE_LABELS.map(([label, num], i) =>
    i < stageIndex ? doneStage(label, num)
      : i === stageIndex ? (i === 5 ? doneStage(label, num) : currStage(label, num))
        : pendStage(label, num, i === 5));

  /* The four rounds that used to sit here were invented, and real offers were
     appended after them — one timeline mixing a fiction with the record. */
  const extra: Offer[] = apiOffers.map((o) => ({ side: o.side, amount: o.amount, terms: o.terms || '—' })).map((o) => {
    const own = o.side === 'ฝั่งเจ้าของ';
    return { side: o.side, sideStyle: sideC(own ? '#FBF3E1' : '#EEF4F3', own ? '#9A741C' : '#034956'), amount: o.amount, terms: o.terms, time: 'เมื่อสักครู่', dotBg: own ? '#FBF3E1' : '#EEF4F3', icon: oi(PLUS, own ? '#9A741C' : '#034956'), line: false };
  });
  const offers: Offer[] = extra.map((e, i) => ({ ...e, line: i < extra.length - 1 }));

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

  /* ฿385,000 and a ฿13.86M contract value were written into the file — they
     showed above every deal, including one worth nothing. */
  const baht = (n: number) => '฿' + n.toLocaleString('en-US');
  const dealSummary = [
    { k: 'ดีล', v: deal?.title || '—' },
    { k: 'ลูกค้า', v: deal?.customer || '—' },
    { k: 'มูลค่า', v: deal?.amount ? baht(deal.amount) : 'ยังไม่ระบุ' },
    { k: 'สถานะ', v: deal ? (deal.status === 'won' ? 'ปิดดีลแล้ว (won)' : deal.status === 'lost' ? 'ไม่สำเร็จ (lost)' : 'กำลังเจรจา') : '—' },
    { k: 'การเงิน', v: deal?.locked ? 'ล็อกแล้ว' : 'ยังแก้ได้' },
  ];

  const propCode = deal?.propertyCode || '';

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
            <div key={i} data-stage={s.label} {...(s.done ? { 'data-stage-done': '' } : {})} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
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
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text)' }}>{deal?.propertyTitle || deal?.title || 'ยังไม่ได้ผูกกับทรัพย์'}</div>
              {propCode
                ? <><code style={{ fontSize: 12, color: '#0D6C3B', fontWeight: 700 }}>{propCode}</code> <span style={{ fontSize: 12, color: 'var(--muted)' }}>· {deal?.customer || '—'}</span></>
                : <span style={{ fontSize: 12, color: 'var(--muted)' }}>{deal?.customer || '—'}</span>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>มูลค่า</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: '#034956' }}>{deal?.amount ? baht(deal.amount) : '—'}</div>
            </div>
            {propCode && (
              <Link href={`/admin/properties?q=${encodeURIComponent(propCode)}`} style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>เปิดทรัพย์ →</Link>
            )}
          </div>

          {/* The negotiation history and the documents used to sit behind the
              property card's accordion, collapsed by default — so opening a
              deal showed a one-line card and nothing else. They are the page. */}
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
              {offers.length === 0 && (
                <div style={{ padding: '22px 10px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted3)', lineHeight: 1.7 }}>
                  {dealId ? 'ยังไม่มีการเสนอราคา — กด "เพิ่มข้อเสนอ" เพื่อบันทึกรอบแรก' : 'ยังไม่มีดีล'}
                </div>
              )}
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

          {/* Documents. Three PDFs with sizes and upload dates used to be
              listed here beside an upload button with no handler, and there
              was nowhere for a file to go. */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>เอกสาร Deal</div>
              <div
                id="deal-doc-upload"
                onClick={() => { if (!uploading && dealId) fileRef.current?.click(); }}
                style={{ height: 34, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: uploading || !dealId ? 'default' : 'pointer', opacity: uploading || !dealId ? .6 : 1 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>
                {uploading ? 'กำลังอัปโหลด…' : 'อัปโหลด'}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  setDocErr(await uploadDoc(f));
                }}
              />
            </div>

            {docErr && <div id="deal-doc-error" style={{ marginBottom: 10, padding: '9px 12px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12.5px', fontWeight: 600 }}>{docErr}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docs.length === 0 && (
                <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted3)', lineHeight: 1.7 }}>
                  ยังไม่มีเอกสาร — แนบสัญญา หนังสือรับรอง หรือแผนผังพื้นที่ได้ที่นี่<br />
                  รองรับ PDF และรูปภาพ สูงสุด 10MB ต่อไฟล์
                </div>
              )}
              {docs.map((doc) => (
                <div key={doc.id} data-doc={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: doc.status === 'ครบ' ? '#E8F3EC' : '#FBF3E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: doc.status === 'ครบ' ? '#0D6C3B' : '#9A741C' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflowWrap: 'anywhere' }}>{doc.filename}</a>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted3)' }}>
                      {doc.mime === 'application/pdf' ? 'PDF' : 'รูปภาพ'} · {(doc.size / 1024 / 1024).toFixed(1)} MB · {new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(new Date(doc.createdAt))}
                    </div>
                  </div>
                  <span
                    data-doc-status={doc.id}
                    onClick={() => setDocStatus(doc.id, doc.status === 'ครบ' ? 'รอเซ็น' : 'ครบ')}
                    title="กดเพื่อสลับสถานะ"
                    style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: doc.status === 'ครบ' ? '#E8F3EC' : '#FBF3E1', color: doc.status === 'ครบ' ? '#0D6C3B' : '#9A741C', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >{doc.status}</span>
                  <span data-doc-remove={doc.id} onClick={() => removeDoc(doc.id)} title="ลบเอกสาร" style={{ color: 'var(--muted2)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                  </span>
                </div>
              ))}
            </div>
          </div>
          </>
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
            {/* เคยแสดง "อารยา (agent) · 3% ของค่าเช่าปีแรก · ฿138,600 · รอจ่าย"
                เหมือนกันทุกดีล ทั้งชื่อ อัตรา ยอดเงิน และสถานะการจ่ายพิมพ์ไว้ในไฟล์
                ไม่ได้คำนวณจากดีลตรงหน้า และระบบยังไม่มีที่เก็บข้อมูลคอมมิชชันสักช่อง
                — ตัวเลขเงินที่ไม่มีที่มา อันตรายกว่าการไม่มีตัวเลข */}
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>ค่าคอมมิชชัน</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted3)', lineHeight: 1.7 }}>
              ระบบยังไม่ได้เก็บข้อมูลค่าคอมมิชชัน — ยังไม่มีทั้งอัตรา ผู้รับ และสถานะการจ่าย
              ถ้าต้องการให้คิดและติดตามในระบบ แจ้งเงื่อนไขการแบ่งมาได้
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
              {closeOutcome !== 'ไม่สำเร็จ' && (
                <>
                  <label htmlFor="deal-lease-end" style={{ display: 'block', margin: '14px 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>วันสิ้นสุดสัญญาเช่า</label>
                  <input id="deal-lease-end" type="date" value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)} style={{ width: '100%', height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13.5px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }} />
                  <div style={{ marginTop: 5, fontSize: 11, color: 'var(--muted3)', lineHeight: 1.5 }}>
                    ใส่แล้วระบบจะบันทึกเป็นสัญญาเช่าให้ และเตือนล่วงหน้าก่อนหมดตามที่ตั้งไว้ · เว้นว่างได้ถ้าเป็นดีลขาย
                  </div>
                </>
              )}
              <label style={{ display: 'block', margin: '14px 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>หมายเหตุ</label>
              <textarea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} placeholder="หมายเหตุ (ถ้ามี)…" style={{ width: '100%', height: 76, padding: '10px 12px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, background: 'var(--surface)', color: 'var(--text)', outline: 'none', resize: 'none' }} />
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
              <div onClick={closeDialog} style={{ flex: 1, height: 46, borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div id="deal-close-confirm" onClick={() => confirmClose(closeOutcome, closeNote, leaseEnd)} style={{ flex: 1, height: 46, borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>ยืนยันปิดดีล</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
