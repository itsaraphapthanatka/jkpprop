'use client';

import * as React from 'react';

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

type CandDef = { id: string; title: string; code: string; size: string; price: string; owner: string; phone: string; blocked: boolean };

const CAND_DEFS: CandDef[] = [
  { id: 'c1', title: 'โรงงานผลิตอาหาร นวนคร 4,200 ตร.ม.', code: 'JKP-PTE0033', size: '4,200 ตร.ม.', price: '฿245,000/ด.', owner: 'คุณอนันต์ (เจ้าของ)', phone: '+66 82-345-6789', blocked: false },
  { id: 'c2', title: 'คลังสินค้าแหลมฉบัง 5,000 ตร.ม.', code: 'JKP-CBI0007', size: '5,000 ตร.ม.', price: '฿310,000/ด.', owner: 'คุณเมธี (เจ้าของ)', phone: '+66 84-567-8901', blocked: true },
];

type BaseItem = { title: string; code: string; size: string; price: string; note: string; owner: string; phone: string };
const INITIAL_ITEMS: BaseItem[] = [
  { title: 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', code: 'JKP-SPK0042', size: '2,700 ตร.ม.', price: '฿176,000/ด.', note: 'ตรงงบ + มี ร.ง.4 พร้อม', owner: 'คุณสมชาย (เจ้าของ)', phone: '+66 81-234-5678' },
  { title: 'โกดังให้เช่า มหาชัย 1,800 ตร.ม.', code: 'JKP-SKN0015', size: '1,800 ตร.ม.', price: '฿88,000/ด.', note: 'เล็กกว่าเกณฑ์เล็กน้อย แต่ทำเลดี', owner: 'คุณวิภา (เจ้าของ)', phone: '+66 89-876-5432' },
];

const REQ_SUMMARY = [
  { k: 'ต้องการ', v: 'เช่าโกดัง' }, { k: 'ขนาด', v: '2,000–3,500 ตร.ม.' },
  { k: 'งบเช่า', v: '฿150K–250K/ด.' }, { k: 'ร.ง.4', v: 'ต้องได้' }, { k: 'ย้ายเข้า', v: '1 ก.ย. 2026' },
];

const LOCATIONS = [
  { rank: '1', name: 'สมุทรปราการ' }, { rank: '2', name: 'ชลบุรี (ศรีราชา)' }, { rank: '3', name: 'ฉะเชิงเทรา' },
];

/* one lookup for every possible row (base items + candidates) */
type Row = { key: string; cid?: string; title: string; code: string; size: string; price: string; note: string; owner: string; phone: string };
const DATA_BY_KEY: Record<string, Row> = {};
INITIAL_ITEMS.forEach((it, i) => { DATA_BY_KEY['base' + i] = { key: 'base' + i, title: it.title, code: it.code, size: it.size, price: it.price, note: it.note, owner: it.owner, phone: it.phone }; });
CAND_DEFS.forEach((c) => { DATA_BY_KEY['add' + c.id] = { key: 'add' + c.id, cid: c.id, title: c.title, code: c.code, size: c.size, price: c.price, note: '', owner: c.owner, phone: c.phone }; });

type Avail = 'available' | 'unavailable';

type CandidateVal = CandDef & { canAdd: boolean; isAdded: boolean; dim: boolean; add: () => void };
type ItemVal = Row & { rank: string; avail: Avail; rechecked: boolean; remove: () => void };

interface ShortlistState {
  sendOpen: boolean;
  openSend: () => void;
  closeSend: () => void;
  candidates: CandidateVal[];
  items: ItemVal[];
  itemCount: number;
  reorder: (fromKey: string, toKey: string) => void;
  setAvailability: (key: string, status: Avail) => void;
}

const ShortlistCtx = React.createContext<ShortlistState | null>(null);

function useShortlist(): ShortlistState {
  const ctx = React.useContext(ShortlistCtx);
  if (!ctx) throw new Error('useShortlist must be used within ShortlistProvider');
  return ctx;
}

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const [sendOpen, setSendOpen] = React.useState(false);
  const [added, setAdded] = React.useState<Record<string, boolean>>({});
  const [removed, setRemoved] = React.useState<Record<string, boolean>>({});
  const [order, setOrder] = React.useState<string[]>(INITIAL_ITEMS.map((_, i) => 'base' + i));
  const [avail, setAvail] = React.useState<Record<string, Avail>>({});
  const [rechecked, setRechecked] = React.useState<Record<string, boolean>>({});

  const candidates: CandidateVal[] = CAND_DEFS.map((c) => {
    const isAdded = !!added[c.id];
    return {
      ...c,
      canAdd: !c.blocked && !isAdded,
      isAdded,
      dim: c.blocked || isAdded,
      add: () => {
        setAdded((prev) => ({ ...prev, [c.id]: true }));
        setOrder((prev) => (prev.includes('add' + c.id) ? prev : [...prev, 'add' + c.id]));
      },
    };
  });

  // current members (base not removed + added candidates), sequenced by `order`
  const memberKeys = new Set<string>();
  INITIAL_ITEMS.forEach((_, i) => { const k = 'base' + i; if (!removed[k]) memberKeys.add(k); });
  CAND_DEFS.forEach((c) => { if (added[c.id]) memberKeys.add('add' + c.id); });
  const seq = order.filter((k) => memberKeys.has(k));
  memberKeys.forEach((k) => { if (!seq.includes(k)) seq.push(k); });

  const removeKey = (key: string, cid?: string) => {
    if (cid) setAdded((prev) => { const a = { ...prev }; delete a[cid]; return a; });
    else setRemoved((prev) => ({ ...prev, [key]: true }));
    setOrder((prev) => prev.filter((k) => k !== key));
  };

  const items: ItemVal[] = seq.map((key, i) => {
    const d = DATA_BY_KEY[key];
    return {
      ...d,
      rank: String(i + 1),
      avail: avail[key] ?? 'available',
      rechecked: !!rechecked[key],
      remove: () => removeKey(key, d.cid),
    };
  });

  const reorder = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    setOrder((prev) => {
      const cur = prev.filter((k) => memberKeys.has(k));
      // include any member missing from order (safety)
      memberKeys.forEach((k) => { if (!cur.includes(k)) cur.push(k); });
      const fi = cur.indexOf(fromKey);
      const ti = cur.indexOf(toKey);
      if (fi < 0 || ti < 0) return prev;
      const [moved] = cur.splice(fi, 1);
      const dest = cur.indexOf(toKey);
      cur.splice(fi < ti ? dest + 1 : dest, 0, moved);
      return cur;
    });
  };

  const setAvailability = (key: string, status: Avail) => {
    setAvail((prev) => ({ ...prev, [key]: status }));
    setRechecked((prev) => ({ ...prev, [key]: true }));
  };

  const value: ShortlistState = {
    sendOpen,
    openSend: () => setSendOpen(true),
    closeSend: () => setSendOpen(false),
    candidates,
    items,
    itemCount: items.length,
    reorder,
    setAvailability,
  };

  return <ShortlistCtx.Provider value={value}>{children}</ShortlistCtx.Provider>;
}

/* Topbar right cluster: item count + "ส่งให้ลูกค้า" trigger. */
export function ShortlistActions() {
  const { itemCount, openSend } = useShortlist();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{itemCount} รายการ</span>
      <div onClick={openSend} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>ส่งให้ลูกค้า
      </div>
    </div>
  );
}

/* A single ranked shortlist row (drag handle + call re-check + trash). */
function ShortlistItem({ it }: { it: ItemVal }) {
  const { reorder, setAvailability } = useShortlist();
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
            {unavailable ? (
              <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#F9E4E1', color: '#C0392B', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2.6"><circle cx="12" cy="12" r="10" /><path d="M4.9 4.9l14.2 14.2" /></svg>ไม่ว่าง
              </span>
            ) : (
              <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {it.rechecked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                {it.rechecked ? 'ว่าง · เช็คแล้ว' : 'ว่าง'}
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
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>ผลการเช็ค:</span>
            <div
              onClick={() => setAvailability(it.key, 'available')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 13px', borderRadius: 9999, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: '1.5px solid #0D6C3B', color: it.rechecked && !unavailable ? '#fff' : '#0D6C3B', background: it.rechecked && !unavailable ? '#0D6C3B' : 'transparent' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>ยังว่าง
            </div>
            <div
              onClick={() => setAvailability(it.key, 'unavailable')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 13px', borderRadius: 9999, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: '1.5px solid #C0392B', color: unavailable ? '#fff' : '#C0392B', background: unavailable ? '#C0392B' : 'transparent' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M18 6L6 18M6 6l12 12" /></svg>ไม่ว่างแล้ว
            </div>
          </div>
        </div>
      )}

      {/* internal note */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', borderRadius: 10, padding: '9px 12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.8" style={{ flexShrink: 0 }}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
        <input defaultValue={it.note} placeholder="โน้ตภายใน (ลูกค้าไม่เห็น)" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: '12.5px', color: 'var(--text)', flex: 1, minWidth: 0 }} />
      </div>
    </div>
  );
}

/* Ported <main> content. */
export function ShortlistMain() {
  const { candidates, items, sendOpen, closeSend } = useShortlist();

  return (
    <>
      <div id="sl-split" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT: requirement summary (sticky) */}
        <div id="sl-side" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'linear-gradient(135deg,#043F20 0%,#022310 100%)', borderRadius: 16, padding: 22, color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: '#8FE6B6', textTransform: 'uppercase' }}>ตรึงไว้เทียบ</div>
            <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800 }}>บ. ไทยโลจิสติกส์</div>
            <div style={{ fontSize: '12.5px', color: '#C3FED5' }}>REQ-1042 · เช่าโกดัง</div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REQ_SUMMARY.map((q) => (
                <div key={q.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                  <span style={{ fontSize: 12, color: '#B9C2BD' }}>{q.k}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff', textAlign: 'right' }}>{q.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>พื้นที่ที่ต้องการ</div>
            {LOCATIONS.map((l) => (
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
      {sendOpen && (
        <div onClick={closeSend} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="a-scroll" style={{ width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: 28, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 9999, background: '#E8F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
            </div>
            <h3 style={{ margin: '16px 0 0', fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>ส่ง Shortlist ให้ลูกค้า</h3>
            <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.6 }}>ระบบจะสร้างลิงก์แบบ token (ลูกค้าเปิดได้โดยไม่ต้อง login) และเปลี่ยนสถานะเป็น <b>sent</b></p>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 11, padding: '11px 14px' }}>
              <code style={{ fontFamily: MONO, flex: 1, fontSize: 12, color: 'var(--accent)', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>jkp.co/s/SL-208-x9f2a1</code>
              <div style={{ height: 30, padding: '0 12px', borderRadius: 8, background: 'var(--tint)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>คัดลอก</div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              <div onClick={closeSend} style={{ flex: 1, height: 46, borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div style={{ flex: 1, height: 46, borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer' }}>ยืนยันส่ง</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
