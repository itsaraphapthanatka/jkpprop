'use client';

import * as React from 'react';
import Link from 'next/link';
import { apiGet, apiPatch, apiPost, ApiClientError } from '@/lib/apiClient';

/* ============================================================
   Ported from AdminShortlist.dc.html — interactive shortlist
   builder. Shared state (send dialog + add/remove ranked items)
   lives in ShortlistProvider so the topbar right cluster
   (ShortlistActions) and the main content (ShortlistMain) stay
   in sync. page.tsx wraps <AdminShell> in the provider.

   Enhancements beyond the static design:
   - drag-to-reorder the ranked items via the grip handle (order state)
   - per-item "call owner to re-check availability" panel (phone icon
     next to the trash icon → tel: link + mark ยังว่าง / ไม่ว่างแล้ว)
   ============================================================ */

const MONO = "'JetBrains Mono',monospace";
const telHref = (phone: string) => 'tel:' + phone.replace(/[^+\d]/g, '');

/* Everything on this screen used to be a constant: two invented properties
 * with invented landlord phone numbers, two "candidates", a requirement
 * summary reading REQ-1042, and a title reading SL-208.
 *
 * The send button, though, was real — it PATCHed the newest actual shortlist
 * to `sent`. So you could read two properties off the screen, press send, and
 * the customer would receive two completely different ones. Reordering,
 * removing and adding were local state that vanished on refresh.
 *
 * The API behind all of this already existed and was complete. This now uses
 * it: GET /api/shortlists/:id for the rows, PATCH for order / add / remove /
 * send. Availability is the property's live status, not a local toggle.
 */

type ApiItem = {
  id: string; code: string; title: string; size: string; price: string;
  note: string; owner: string; phone: string; available: boolean; sort: number;
  feedback: string | null; feedbackNote: string | null;
};

const FEEDBACK_LABEL: Record<string, { label: string; bg: string; fg: string }> = {
  interested: { label: 'ลูกค้าสนใจ', bg: '#E8F3EC', fg: '#0D6C3B' },
  maybe: { label: 'ยังไม่ตัดสินใจ', bg: '#FBF3E1', fg: '#9A741C' },
  not_interested: { label: 'ไม่สนใจ', bg: '#F9E4E1', fg: '#C0392B' },
};
type ApiRequirement = {
  id: string; code: string; dealIntent: string; usage: string;
  areaMin: number | null; areaMax: number | null;
  budgetMin: number | null; budgetMax: number | null;
  moveIn: number | null; needsRor4: boolean; locations: { name: string }[];
};
type ApiDetail = {
  id: string; name: string; token: string; status: string; url: string;
  leadId: string | null; requirement: ApiRequirement | null; items: ApiItem[];
};
type ApiProperty = { publicCode: string; title: string; status: string; location?: string; area?: number | null };

type Avail = 'available' | 'unavailable';

type Row = { key: string; title: string; code: string; size: string; price: string; note: string; owner: string; phone: string; feedback: string | null; feedbackNote: string | null };
type CandidateVal = { id: string; title: string; code: string; size: string; price: string; owner: string; phone: string; blocked: boolean; canAdd: boolean; isAdded: boolean; dim: boolean; add: () => void };
type ItemVal = Row & { rank: string; avail: Avail; remove: () => void };

const nf = new Intl.NumberFormat('en-US');
const fmtRange = (a: number | null, b: number | null, unit: string) => {
  if (a === null && b === null) return '—';
  if (a !== null && b !== null) return `${nf.format(a)}–${nf.format(b)} ${unit}`;
  return `${nf.format((a ?? b)!)} ${unit}`;
};

/** the criteria panel, built from the requirement this shortlist answers */
function summaryOf(r: ApiRequirement | null): { k: string; v: string }[] {
  if (!r) return [];
  const out = [{ k: 'ต้องการ', v: [r.dealIntent, r.usage].filter(Boolean).join(' · ') || '—' }];
  if (r.areaMin !== null || r.areaMax !== null) out.push({ k: 'ขนาด', v: fmtRange(r.areaMin, r.areaMax, 'ตร.ม.') });
  if (r.budgetMin !== null || r.budgetMax !== null) {
    out.push({ k: r.dealIntent.includes('ขาย') ? 'งบซื้อ' : 'งบเช่า', v: fmtRange(r.budgetMin, r.budgetMax, r.dealIntent.includes('ขาย') ? '฿' : '฿/ด.') });
  }
  if (r.needsRor4) out.push({ k: 'ร.ง.4', v: 'ต้องได้' });
  if (r.moveIn) out.push({ k: 'ย้ายเข้า', v: new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(r.moveIn)) });
  return out;
}

interface ShortlistState {
  sendOpen: boolean;
  openSend: () => void;
  closeSend: () => void;
  candidates: CandidateVal[];
  items: ItemVal[];
  itemCount: number;
  reorder: (fromKey: string, toKey: string) => void;
  /** per-item internal note — the field used to be write-only */
  saveNote: (itemId: string, text: string) => void;
  /** the tokenized client link, once the shortlist exists server-side */
  shareUrl: string;
  sending: boolean;
  sent: boolean;
  confirmSend: () => void;
  /* what the header and the side panels used to hardcode */
  name: string;
  status: string;
  requirement: ApiRequirement | null;
  reqSummary: { k: string; v: string }[];
  locations: { rank: string; name: string }[];
  loading: boolean;
  empty: boolean;
  error: string;
  /* Flow C — booking the viewing from the list the customer has seen */
  visitOpen: boolean;
  openVisit: () => void;
  closeVisit: () => void;
  visitDate: string;
  setVisitDate: (v: string) => void;
  visitPicked: Record<string, boolean>;
  toggleVisitPick: (code: string) => void;
  visitErr: string;
  booking: boolean;
  bookVisit: () => void;
}

const ShortlistCtx = React.createContext<ShortlistState | null>(null);

function useShortlist(): ShortlistState {
  const ctx = React.useContext(ShortlistCtx);
  if (!ctx) throw new Error('useShortlist must be used within ShortlistProvider');
  return ctx;
}
export { useShortlist };

export function ShortlistProvider({ children, shortlistId }: { children: React.ReactNode; shortlistId?: string }) {
  const [sendOpen, setSendOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<ApiDetail | null>(null);
  const [pool, setPool] = React.useState<ApiProperty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  /* resolve which shortlist this is: the pinned id, else the newest */
  const load = React.useCallback(async () => {
    try {
      let id = shortlistId;
      if (!id) {
        const list = await apiGet<{ items: { id: string }[] }>('/api/shortlists');
        id = list.items?.[0]?.id;
      }
      if (!id) { setDetail(null); setError(''); return; }
      const d = await apiGet<ApiDetail>(`/api/shortlists/${id}`);
      setDetail(d);
      setError('');
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'โหลด shortlist ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [shortlistId]);

  React.useEffect(() => { void load(); }, [load]);

  /* properties that could still be added — published inventory only, minus
     what is already in the list. The old "candidates" were two fixed rows. */
  React.useEffect(() => {
    apiGet<{ items: ApiProperty[] }>('/api/properties')
      .then((r) => setPool((r.items ?? []).filter((p) => p.status === 'active')))
      .catch(() => setPool([]));
  }, []);

  const patch = async (payload: Record<string, unknown>) => {
    if (!detail || busy) return;
    setBusy(true);
    try {
      await apiPatch(`/api/shortlists/${detail.id}`, payload);
      await load();
    } catch (e) {
      window.alert(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const rows = detail?.items ?? [];
  const inList = new Set(rows.map((r) => r.code));

  const items: ItemVal[] = rows.map((it, i) => ({
    key: it.id,
    title: it.title,
    code: it.code,
    size: it.size,
    price: it.price,
    note: it.note,
    owner: it.owner,
    phone: it.phone,
    feedback: it.feedback,
    feedbackNote: it.feedbackNote,
    rank: String(i + 1),
    // live, from the property's own status — not a local toggle
    avail: it.available ? 'available' : 'unavailable',
    remove: () => void patch({ removeIds: [it.id] }),
  }));

  const candidates: CandidateVal[] = pool
    .filter((p) => !inList.has(p.publicCode))
    .slice(0, 8)
    .map((p) => ({
      id: p.publicCode,
      code: p.publicCode,
      title: p.title,
      size: p.area ? `${nf.format(p.area)} ตร.ม.` : '—',
      price: '—',
      owner: '—',
      phone: '',
      blocked: false,
      canAdd: true,
      isAdded: false,
      dim: false,
      add: () => void patch({ addCodes: [p.publicCode] }),
    }));

  const reorder = (fromKey: string, toKey: string) => {
    const ids = rows.map((r) => r.id);
    const fi = ids.indexOf(fromKey);
    const ti = ids.indexOf(toKey);
    if (fi < 0 || ti < 0 || fi === ti) return;
    const next = [...ids];
    const [moved] = next.splice(fi, 1);
    next.splice(ti, 0, moved);
    void patch({ order: next });
  };

  const saveNote = (itemId: string, text: string) => void patch({ notes: { [itemId]: text } });

  /* Flow C starts here. POST /api/visits existed the whole time and nothing
     called it, so a shortlist could be sent and then the trail stopped —
     booking the viewing meant inserting a row by hand. */
  const [visitOpen, setVisitOpen] = React.useState(false);
  const [visitDate, setVisitDate] = React.useState('');
  const [visitPicked, setVisitPicked] = React.useState<Record<string, boolean>>({});
  const [visitErr, setVisitErr] = React.useState('');
  const [booking, setBooking] = React.useState(false);

  const openVisit = () => {
    setVisitErr('');
    setVisitDate('');
    /* default to the properties the customer said yes to, else all of them —
       the point of asking was to narrow the trip */
    const liked = rows.filter((r) => r.feedback === 'interested');
    const pick = (liked.length ? liked : rows).filter((r) => r.available);
    setVisitPicked(Object.fromEntries(pick.map((r) => [r.code, true])));
    setVisitOpen(true);
  };

  const bookVisit = async () => {
    const codes = Object.entries(visitPicked).filter(([, on]) => on).map(([c]) => c);
    if (!visitDate) { setVisitErr('กรุณาเลือกวันนัด'); return; }
    if (!codes.length) { setVisitErr('เลือกทรัพย์อย่างน้อย 1 รายการ'); return; }
    if (booking) return;
    setBooking(true);
    setVisitErr('');
    try {
      const made = await apiPost<{ id: string }>('/api/visits', {
        date: new Date(visitDate).toISOString(),
        codes,
        leadId: detail?.leadId ?? undefined,
      });
      setVisitOpen(false);
      window.location.href = `/admin/visits/${made.id}`;
    } catch (e) {
      setVisitErr(e instanceof ApiClientError ? e.message : 'สร้างนัดชมไม่สำเร็จ');
    } finally {
      setBooking(false);
    }
  };

  const confirmSend = () => {
    if (!detail || sending) return;
    setSending(true);
    // the server re-checks availability (FR-AVL-04) and refuses to send a
    // shortlist containing a listing that is no longer on the market
    apiPatch(`/api/shortlists/${detail.id}`, { status: 'sent' })
      .then(() => { setSendOpen(false); return load(); })
      .catch((e) => window.alert(e instanceof ApiClientError ? e.message : 'ส่ง shortlist ไม่สำเร็จ'))
      .finally(() => setSending(false));
  };

  const value: ShortlistState = {
    sendOpen,
    openSend: () => setSendOpen(true),
    closeSend: () => setSendOpen(false),
    candidates,
    items,
    itemCount: items.length,
    reorder,
    saveNote,
    shareUrl: detail ? `${typeof window === 'undefined' ? '' : window.location.origin}${detail.url}` : '',
    sending,
    sent: detail?.status === 'sent',
    confirmSend,
    name: detail?.name ?? '',
    status: detail?.status ?? '',
    requirement: detail?.requirement ?? null,
    reqSummary: summaryOf(detail?.requirement ?? null),
    locations: (detail?.requirement?.locations ?? []).map((l, i) => ({ rank: String(i + 1), name: l.name })),
    loading,
    empty: !loading && !detail && !error,
    error,
    visitOpen,
    openVisit,
    closeVisit: () => setVisitOpen(false),
    visitDate,
    setVisitDate,
    visitPicked,
    toggleVisitPick: (code: string) => setVisitPicked((p) => ({ ...p, [code]: !p[code] })),
    visitErr,
    booking,
    bookVisit: () => void bookVisit(),
  };

  return <ShortlistCtx.Provider value={value}>{children}</ShortlistCtx.Provider>;
}

/* Topbar right cluster: item count + "ส่งให้ลูกค้า" trigger. */
export function ShortlistActions() {
  const { itemCount, openSend, openVisit, sent } = useShortlist();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{itemCount} รายการ</span>
      {/* Flow C — offered once the customer has actually seen the list */}
      {sent && itemCount > 0 && (
        <div id="sl-book-visit" onClick={openVisit} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1.5px solid #0D6C3B', color: '#0D6C3B', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>นัดชมทรัพย์
        </div>
      )}
      <div onClick={openSend} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>ส่งให้ลูกค้า
      </div>
    </div>
  );
}

/* A single ranked shortlist row (drag handle + call re-check + trash). */
function ShortlistItem({ it }: { it: ItemVal }) {
  const { reorder, saveNote } = useShortlist();
  const [note, setNote] = React.useState(it.note);
  React.useEffect(() => setNote(it.note), [it.note]);
  const [drag, setDrag] = React.useState<null | 'src' | 'over'>(null);
  const [checkOpen, setCheckOpen] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  const unavailable = it.avail === 'unavailable';

  return (
    <div
      ref={cardRef}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDrag((d) => (d === 'src' ? d : 'over')); }}
      onDragLeave={() => setDrag((d) => (d === 'over' ? null : d))}
      onDrop={(e) => {
        e.preventDefault();
        const from = e.dataTransfer.getData('text/plain');
        setDrag(null);
        if (from) reorder(from, it.key);
      }}
      style={{
        border: '1px solid ' + (drag === 'over' ? '#0D6C3B' : 'var(--border)'),
        borderRadius: 14,
        padding: '14px 16px',
        background: drag === 'over' ? 'rgba(13,108,59,.04)' : 'var(--surface)',
        opacity: drag === 'src' ? 0.4 : 1,
        transition: 'border-color .15s,background .15s,opacity .15s',
      }}
    >
      <div className="sl-item-row" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* drag handle */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', it.key);
            e.dataTransfer.effectAllowed = 'move';
            if (cardRef.current) e.dataTransfer.setDragImage(cardRef.current, 24, 24);
            setDrag('src');
          }}
          onDragEnd={() => setDrag(null)}
          title="ลากเพื่อจัดอันดับ"
          style={{ display: 'flex', alignItems: 'center', color: 'var(--muted3)', flexShrink: 0, cursor: 'grab' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></svg>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0D6C3B', color: '#fff', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{it.rank}</div>
        <div className="sl-item-thumb" style={{ width: 52, height: 52, borderRadius: 11, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{it.title}</div>
          <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <code style={{ fontFamily: MONO, fontSize: '11.5px', color: '#0D6C3B', fontWeight: 700 }}>{it.code}</code>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{it.size} · {it.price}</span>
            {it.feedback && FEEDBACK_LABEL[it.feedback] && (
              <span data-feedback={it.code} style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: FEEDBACK_LABEL[it.feedback].bg, color: FEEDBACK_LABEL[it.feedback].fg, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>
                {FEEDBACK_LABEL[it.feedback].label}
              </span>
            )}
            {unavailable ? (
              <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#F9E4E1', color: '#C0392B', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.6"><circle cx="12" cy="12" r="10" /><path d="M4.9 4.9l14.2 14.2" /></svg>ไม่ว่าง
              </span>
            ) : (
              <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                ว่าง
              </span>
            )}
          </div>
        </div>

        {/* call / re-check availability */}
        <div
          onClick={() => setCheckOpen((v) => !v)}
          onMouseEnter={(e) => { if (!checkOpen) { e.currentTarget.style.background = '#E8F3EC'; e.currentTarget.style.color = '#0D6C3B'; } }}
          onMouseLeave={(e) => { if (!checkOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted2)'; } }}
          title="โทรเช็คว่างกับเจ้าของ"
          style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, background: checkOpen ? '#E8F3EC' : 'transparent', color: checkOpen ? '#0D6C3B' : 'var(--muted2)', transition: 'background .15s,color .15s' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" /></svg>
        </div>

        {/* remove */}
        <div
          onClick={it.remove}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#F9E4E1'; e.currentTarget.style.color = '#C0392B'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted2)'; }}
          title="เอาออกจาก shortlist"
          style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)', cursor: 'pointer', flexShrink: 0, transition: 'background .15s,color .15s' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
        </div>
      </div>

      {/* re-check panel */}
      {checkOpen && (
        <div style={{ marginTop: 12, borderRadius: 11, border: '1px dashed var(--border)', background: 'var(--bg)', padding: '13px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--muted2)', textTransform: 'uppercase' }}>เช็คว่างกับเจ้าของก่อนส่ง</div>
              <div style={{ marginTop: 3, fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{it.owner}</div>
            </div>
            <a href={telHref(it.phone)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 16px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: '12.5px', fontWeight: 700, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" /></svg>
              โทร {it.phone}
            </a>
          </div>
          {/* The two buttons that used to sit here ("ยังว่าง" / "ไม่ว่างแล้ว")
              only coloured themselves in — nothing was saved, and the send
              gate never read them. Availability on this screen is the
              property's own status, so it is changed where it lives. */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              สถานะว่างอ่านจากสถานะทรัพย์ — ถ้าปล่อยไปแล้ว ให้เปลี่ยนที่หน้าทรัพย์
            </span>
            <Link href={`/admin/properties?q=${encodeURIComponent(it.code)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 13px', borderRadius: 9999, fontSize: 12, fontWeight: 700, border: '1.5px solid var(--border)', color: 'var(--accent)' }}>
              เปิด {it.code}
            </Link>
          </div>
        </div>
      )}

      {/* internal note */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', borderRadius: 10, padding: '9px 12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.8" style={{ flexShrink: 0 }}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
        {/* the note was a defaultValue with no handler — typed, then lost */}
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => { if (note !== it.note) saveNote(it.key, note); }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="โน้ตภายใน (ลูกค้าไม่เห็น)"
          style={{ border: 0, outline: 'none', background: 'transparent', fontSize: '12.5px', color: 'var(--text)', flex: 1, minWidth: 0 }}
        />
      </div>
    </div>
  );
}

/* Ported <main> content. */
export function ShortlistMain() {
  const { candidates, items, sendOpen, closeSend, shareUrl, sending, sent, confirmSend, name, requirement, reqSummary, locations, loading, empty, error, visitOpen, closeVisit, visitDate, setVisitDate, visitPicked, toggleVisitPick, visitErr, booking, bookVisit } = useShortlist();

  if (loading) return <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--muted3)' }}>กำลังโหลด…</div>;
  if (error) return <div style={{ padding: '20px 22px', borderRadius: 14, background: '#FDECEC', color: '#A32A2A', fontSize: 13, fontWeight: 600 }}>{error}</div>;
  /* An empty state, rather than a demo shortlist that looks like data. */
  if (empty) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '48px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>ยังไม่มี shortlist</div>
        <div style={{ marginTop: 6, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.7 }}>
          สร้างจากหน้า Requirement — เช็คความว่างกับเจ้าของทรัพย์ก่อน แล้วกด &ldquo;สร้าง Shortlist&rdquo;
        </div>
        <Link href="/admin/requirements" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>ไปหน้า Requirements →</Link>
      </div>
    );
  }

  return (
    <>
      <div id="sl-split" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT: requirement summary (sticky) */}
        <div id="sl-side" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'linear-gradient(135deg,#043F20 0%,#022310 100%)', borderRadius: 16, padding: 22, color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: '#8FE6B6', textTransform: 'uppercase' }}>ตรึงไว้เทียบ</div>
            <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800 }}>{name || 'Shortlist'}</div>
            <div style={{ fontSize: '12.5px', color: '#C3FED5' }}>
              {requirement ? `${requirement.code} · ${[requirement.dealIntent, requirement.usage].filter(Boolean).join(' ')}` : 'ไม่ได้ผูกกับ requirement'}
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reqSummary.length === 0 && (
                <div style={{ fontSize: '12.5px', color: '#9FD9BA', lineHeight: 1.7 }}>
                  shortlist นี้สร้างขึ้นเองโดยไม่ได้ผูกกับ requirement จึงไม่มีเกณฑ์ให้เทียบ
                </div>
              )}
              {reqSummary.map((q) => (
                <div key={q.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                  <span style={{ fontSize: 12, color: '#B9C2BD' }}>{q.k}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff', textAlign: 'right' }}>{q.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>พื้นที่ที่ต้องการ</div>
            {locations.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--muted3)' }}>ไม่ได้ระบุไว้</div>
            )}
            {locations.map((l) => (
              <div key={l.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--tint)', color: 'var(--accent)', fontSize: '10.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{l.rank}</span>
                <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>{l.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: items + add */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* add search */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, padding: '0 14px', borderRadius: 11, background: 'var(--bg)', border: '1px solid var(--border)', flex: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                <input placeholder="ค้นหาทรัพย์เพิ่ม (เฉพาะ published + ว่าง)" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {candidates.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 11, background: 'var(--bg)', opacity: c.dim ? 0.55 : undefined }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                    <code style={{ fontFamily: MONO, fontSize: 11, color: '#0D6C3B', fontWeight: 700 }}>{c.code}</code>{' '}<span style={{ fontSize: 11, color: 'var(--muted3)' }}>· {c.size}</span>
                  </div>
                  {c.canAdd && (
                    <div onClick={c.add} style={{ height: 32, padding: '0 14px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>เพิ่ม
                    </div>
                  )}
                  {c.blocked && (
                    <span title="ไม่ว่าง — เพิ่มไม่ได้" style={{ height: 32, padding: '0 12px', borderRadius: 9999, background: '#F9E4E1', color: '#C0392B', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.4"><circle cx="12" cy="12" r="10" /><path d="M4.9 4.9l14.2 14.2" /></svg>ไม่ว่าง
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ranked items */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>รายการใน Shortlist</div>
              <span style={{ fontSize: 12, color: 'var(--muted2)' }}>ลากเพื่อจัดอันดับ</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((it) => (
                <ShortlistItem key={it.key} it={it} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEND DIALOG */}
      {/* BOOK A VIEWING (Flow C) — POST /api/visits existed and nothing called it */}
      {visitOpen && (
        <div onClick={closeVisit} style={{ position: 'fixed', inset: 0, zIndex: 860, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '26px 28px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>นัดชมทรัพย์</div>
            <p style={{ margin: '6px 0 16px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              ทรัพย์ที่ลูกค้ากด &ldquo;สนใจ&rdquo; ถูกเลือกไว้ให้แล้ว — ปรับได้
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>วันที่นัด</label>
            <input
              id="sl-visit-date"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              style={{ marginTop: 6, width: '100%', height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none' }}
            />

            <div style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ทรัพย์ที่จะพาไปดู</div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((it) => {
                const on = !!visitPicked[it.code];
                const gone = it.avail === 'unavailable';
                return (
                  <div
                    key={it.key}
                    data-visit-pick={it.code}
                    onClick={() => toggleVisitPick(it.code)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, cursor: 'pointer', background: on ? 'rgba(13,108,59,.06)' : 'var(--bg)', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)') }}
                  >
                    <span style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? '#0D6C3B' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{it.title}</div>
                      <code style={{ fontFamily: MONO, fontSize: 11, color: '#0D6C3B', fontWeight: 700 }}>{it.code}</code>
                      {gone && <span style={{ marginLeft: 8, fontSize: 10.5, color: '#C0392B', fontWeight: 700 }}>ไม่ว่างแล้ว</span>}
                    </div>
                    {it.feedback && FEEDBACK_LABEL[it.feedback] && (
                      <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: FEEDBACK_LABEL[it.feedback].bg, color: FEEDBACK_LABEL[it.feedback].fg, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                        {FEEDBACK_LABEL[it.feedback].label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {visitErr && <div id="sl-visit-error" style={{ marginTop: 12, padding: '9px 12px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12.5px', fontWeight: 600 }}>{visitErr}</div>}

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <div onClick={closeVisit} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div id="sl-visit-save" onClick={bookVisit} style={{ height: 42, padding: '0 24px', borderRadius: 9999, background: booking ? '#6E8C7C' : '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, cursor: booking ? 'default' : 'pointer' }}>{booking ? 'กำลังสร้าง…' : 'สร้างนัดชม'}</div>
            </div>
          </div>
        </div>
      )}

      {sendOpen && (
        <div onClick={closeSend} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="a-scroll" style={{ width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: 28, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 9999, background: '#E8F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
            </div>
            <h3 style={{ margin: '16px 0 0', fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>ส่ง Shortlist ให้ลูกค้า</h3>
            <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6 }}>ระบบจะสร้างลิงก์แบบ token (ลูกค้าเปิดได้โดยไม่ต้อง login) และเปลี่ยนสถานะเป็น <b>sent</b></p>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 11, padding: '11px 14px' }}>
              <code style={{ fontFamily: MONO, flex: 1, fontSize: 12, color: 'var(--accent)', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shareUrl}</code>
              <div onClick={() => navigator.clipboard?.writeText(shareUrl)} style={{ height: 30, padding: '0 12px', borderRadius: 8, background: 'var(--tint)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>คัดลอก</div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <div onClick={closeSend} style={{ flex: 1, height: 46, borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div onClick={confirmSend} style={{ flex: 1, height: 46, borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.7 : 1 }}>{sending ? 'กำลังส่ง…' : sent ? 'ส่งแล้ว' : 'ยืนยันส่ง'}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
