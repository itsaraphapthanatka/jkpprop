'use client';

import * as React from 'react';
import { RAW_DATA } from './ListingsAdminBody';
import { buildSummary } from '@/lib/summaryTemplate';
import {
  loadSocial, saveSocial, recordOf, postOf, doneCount, channelKey, todayISO,
  type SocialStore, type SocialRecord,
} from '@/lib/socialStore';
import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/apiClient';

/* Social Status — one row per listing showing which channels it has already
   been posted to. Open a row to read/edit the post text, copy it, and tick
   each channel with the date and the post URL. Channels are editable. */

const th: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };
const label: React.CSSProperties = { display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 700, color: 'var(--muted)' };

/* the mock listing rows carry only a few of the template's fields */
const valuesFor = (r: typeof RAW_DATA[number]) => ({
  deal_type: r.deal,
  province: r.location,
  price_rent: r.dealK !== 'sale' ? r.price.replace(/^฿/, '').replace(/\/ด\.$/, '') : '',
  price_sale: r.dealK !== 'rent' ? r.price.replace(/^฿/, '') : '',
});

const tick = (on: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 9999,
  fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
  background: on ? 'rgba(13,108,59,.07)' : 'var(--surface)',
  color: on ? '#0D6C3B' : 'var(--muted2)',
});

export function SocialStatusBody() {
  const [store, setStore] = React.useState<SocialStore>({ channels: [], records: {} });
  const [ready, setReady] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [only, setOnly] = React.useState<'all' | 'todo' | 'done'>('all');
  const [openCode, setOpenCode] = React.useState<string | null>(null);
  const [chOpen, setChOpen] = React.useState(false);
  const [newCh, setNewCh] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [draft, setDraft] = React.useState<SocialRecord>({ channels: {} });
  const [draftText, setDraftText] = React.useState('');
  // true = still following the generated text; false = this listing has its own copy.
  // Tracked explicitly rather than inferred by comparing strings, so typing the
  // text back to something identical doesn't silently re-link it.
  const [useAuto, setUseAuto] = React.useState(true);

  // client-only read (keeps SSR and first client render identical), then the
  // server copy — localStorage stays as an offline cache
  React.useEffect(() => {
    setStore(loadSocial());
    setReady(true);
    apiGet<SocialStore>('/api/social')
      .then((s) => { if (s && Array.isArray(s.channels)) { setStore(s); saveSocial(s); } })
      .catch(() => { /* keep cache (§2.2) */ });
  }, []);

  // optimistic local write + PUT for the touched listing (§2.3)
  const persist = (next: SocialStore, code?: string) => {
    setStore(next);
    saveSocial(next);
    if (code) {
      const rec = next.records[code] || { channels: {} };
      void apiPut(`/api/social/${encodeURIComponent(code)}`, { text: rec.text ?? null, channels: rec.channels })
        .catch(() => { /* stays in the local cache */ });
    }
  };
  const channels = store.channels;

  const generated = (code: string) => {
    const row = RAW_DATA.find((r) => r.code === code);
    if (!row) return '';
    return buildSummary({ typeLabel: row.title, code: row.code, values: valuesFor(row) }).text;
  };

  const rows = RAW_DATA.filter((r) => {
    const hit = !q.trim() || (r.title + r.code + r.location).toLowerCase().includes(q.trim().toLowerCase());
    if (!hit) return false;
    if (only === 'all' || !ready) return true;
    const n = doneCount(recordOf(store, r.code), channels);
    return only === 'done' ? n === channels.length && n > 0 : n < channels.length;
  });

  /* ---- quick tick straight from the table ---- */
  const quickToggle = (code: string, key: string) => {
    const rec = recordOf(store, code);
    const cur = postOf(rec, key);
    const nextPost = cur.done ? { done: false } : { done: true, date: cur.date || todayISO(), url: cur.url };
    persist({ ...store, records: { ...store.records, [code]: { ...rec, channels: { ...rec.channels, [key]: nextPost } } } }, code);
  };

  /* ---- row dialog ---- */
  const openRow = (code: string) => {
    const rec = recordOf(store, code);
    setDraft({ text: rec.text, channels: { ...rec.channels } });
    setDraftText(rec.text ?? generated(code));
    setUseAuto(rec.text === undefined);
    setOpenCode(code);
    setCopied(false);
  };
  /* Writes to the social store ONLY. The property form keeps its own copy of
     the text and is never touched from here — editing a post caption must not
     rewrite the property record. */
  const saveRow = () => {
    if (!openCode) return;
    const text = useAuto ? undefined : draftText;
    persist({ ...store, records: { ...store.records, [openCode]: { text, channels: draft.channels } } }, openCode);
    setOpenCode(null);
  };
  const setDraftPost = (key: string, patch: Partial<{ done: boolean; date: string; url: string }>) => {
    setDraft((d) => {
      const cur = d.channels[key] || { done: false };
      const merged = { ...cur, ...patch };
      if (patch.done && !merged.date) merged.date = todayISO();
      return { ...d, channels: { ...d.channels, [key]: merged } };
    });
  };
  const copyText = async () => {
    try { await navigator.clipboard.writeText(draftText); } catch {
      const ta = document.createElement('textarea'); ta.value = draftText; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { /* ignore */ } document.body.removeChild(ta);
    }
    setCopied(true); window.setTimeout(() => setCopied(false), 1600);
  };

  /* ---- channel management ---- */
  const addChannel = () => {
    const l = newCh.trim();
    if (!l) return;
    const key = channelKey(l, channels.map((c) => c.key));
    persist({ ...store, channels: [...channels, { key, label: l }] });
    setNewCh('');
    void apiPost('/api/social/channels', { key, label: l }).catch(() => { /* cached locally */ });
  };
  const removeChannel = (key: string) => {
    const records: SocialStore['records'] = {};
    Object.entries(store.records).forEach(([code, rec]) => {
      const rest = Object.fromEntries(Object.entries(rec.channels).filter(([k]) => k !== key));
      records[code] = { ...rec, channels: rest };
    });
    persist({ channels: channels.filter((c) => c.key !== key), records });
    // server cascades the per-listing posts for this channel (§6.5 rule #3)
    void apiDelete(`/api/social/channels?key=${encodeURIComponent(key)}`).catch(() => { /* cached locally */ });
  };

  const openRec = openCode ? draft : null;
  const openRow_ = openCode ? RAW_DATA.find((r) => r.code === openCode) : null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      {/* toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', flex: 1, minWidth: 220 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อทรัพย์ / รหัส / จังหวัด" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0, fontFamily: 'inherit' }} />
        </div>
        {([['all', 'ทั้งหมด'], ['todo', 'ยังลงไม่ครบ'], ['done', 'ลงครบแล้ว']] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setOnly(k)} aria-pressed={only === k} style={{ height: 40, padding: '0 15px', borderRadius: 10, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (only === k ? '#273c33' : 'var(--border)'), background: only === k ? '#273c33' : 'var(--surface)', color: only === k ? '#fff' : 'var(--muted)' }}>{l}</button>
        ))}
        <button type="button" id="soc-manage" onClick={() => setChOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
          จัดการช่องทาง
        </button>
      </div>

      {/* table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }} className="a-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th style={th}>Listing</th>
                <th style={th}>ช่องทางที่ลงประกาศแล้ว</th>
                <th style={{ ...th, textAlign: 'center' }}>ความคืบหน้า</th>
                <th style={{ ...th, width: 130 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const rec = recordOf(store, r.code);
                const n = doneCount(rec, channels);
                const all = channels.length > 0 && n === channels.length;
                return (
                  <tr key={r.code} className="soc-row" style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{r.title}</div>
                      <div style={{ marginTop: 2, fontSize: '11.5px', color: 'var(--muted2)' }}>
                        <code style={{ color: '#0D6C3B', fontWeight: 700 }}>{r.code}</code> · {r.location}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {channels.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted3)' }}>ยังไม่มีช่องทาง — กด “จัดการช่องทาง”</span>}
                        {channels.map((c) => {
                          const post = postOf(rec, c.key);
                          return (
                            <button key={c.key} type="button" onClick={() => quickToggle(r.code, c.key)} aria-pressed={post.done} title={post.done && post.date ? `ลงเมื่อ ${post.date}` : 'ยังไม่ได้ลง'} style={tick(post.done)}>
                              {post.done
                                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="3.2"><path d="M20 6L9 17l-5-5" /></svg>
                                : <span style={{ width: 11, height: 11, borderRadius: 3, border: '1.5px solid var(--muted3)' }} />}
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 9999, fontSize: '11.5px', fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", background: all ? '#E8F3EC' : 'var(--bg)', color: all ? '#0D6C3B' : 'var(--muted2)' }}>{n}/{channels.length}</span>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <button type="button" onClick={() => openRow(r.code)} className="soc-open" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
                        ดูหมายเหตุ
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted3)' }}>ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', fontSize: '12.5px', color: 'var(--muted)' }}>
          แสดง {rows.length} จาก {RAW_DATA.length} ประกาศ · ติ๊กในตารางได้เลย หรือกด “ดูหมายเหตุ” เพื่อใส่วันที่และลิงก์
        </div>
      </div>

      {/* ---- row dialog ---- */}
      {openCode && openRec && openRow_ && (
        <div id="soc-overlay" onClick={() => setOpenCode(null)} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div id="soc-modal" onClick={stop} style={{ width: '100%', maxWidth: 620, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{openRow_.title}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}><code style={{ color: '#0D6C3B', fontWeight: 700 }}>{openRow_.code}</code> · {openRow_.location}</div>
              </div>
              <button type="button" onClick={() => setOpenCode(null)} aria-label="ปิด" style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 7 }}>
                  <label style={{ ...label, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                    ข้อความสำหรับโพสต์ (แก้ไขได้)
                    <span id="soc-mode" style={{ display: 'inline-flex', alignItems: 'center', height: 19, padding: '0 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: useAuto ? 'var(--tint)' : '#F0ECF9', color: useAuto ? 'var(--accent)' : '#7A3FB0' }}>
                      {useAuto ? 'ตามข้อความอัตโนมัติ' : 'แก้ไขเองแล้ว'}
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" id="soc-reset" onClick={() => { setDraftText(generated(openCode)); setUseAuto(true); }} disabled={useAuto} style={{ height: 30, padding: '0 11px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: useAuto ? 'var(--muted3)' : 'var(--muted)', fontSize: 11.5, fontWeight: 700, cursor: useAuto ? 'default' : 'pointer', fontFamily: 'inherit', opacity: useAuto ? 0.55 : 1 }}>ใช้ข้อความอัตโนมัติ</button>
                    <button type="button" id="soc-copy" onClick={copyText} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 13px', borderRadius: 9999, border: 0, background: copied ? '#0D6C3B' : '#273c33', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {copied
                        ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8"><path d="M20 6L9 17l-5-5" /></svg>คัดลอกแล้ว</>
                        : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h8" /></svg>คัดลอก</>}
                    </button>
                  </div>
                </div>
                <textarea id="soc-text" value={draftText} onChange={(e) => { setDraftText(e.target.value); setUseAuto(false); }} style={{ width: '100%', height: 240, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.7, outline: 'none', resize: 'vertical' }} />
                <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.55, color: 'var(--muted3)' }}>
                  แก้ไขตรงนี้จะบันทึกเป็น<b> ข้อความโพสต์ของประกาศนี้เท่านั้น</b> — ไม่กระทบข้อความในหน้า <b>แก้ไขทรัพย์ → หมายเหตุ : รายละเอียดทรัพย์ (รวม)</b>
                  {useAuto ? ' · ตอนนี้ยังตามข้อความอัตโนมัติ ถ้าข้อมูลทรัพย์เปลี่ยน ข้อความจะอัปเดตตาม' : ' · ตอนนี้ใช้ข้อความที่แก้เอง จะไม่เปลี่ยนตามข้อมูลทรัพย์แล้ว'}
                </div>
              </div>

              <div>
                <label style={label}>ช่องทางที่ลงประกาศแล้ว</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {channels.map((c) => {
                    const post = openRec.channels[c.key] || { done: false };
                    return (
                      <div key={c.key} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, background: post.done ? 'rgba(13,108,59,.04)' : 'var(--bg)' }}>
                        <button type="button" role="checkbox" aria-checked={!!post.done} onClick={() => setDraftPost(c.key, { done: !post.done })} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                          <span style={{ width: 19, height: 19, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (post.done ? '#0D6C3B' : 'var(--border)'), background: post.done ? '#0D6C3B' : 'transparent' }}>
                            {post.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{c.label}</span>
                        </button>
                        {post.done && (
                          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <label style={label}>วันที่ลง</label>
                              <input type="date" value={post.date || ''} onChange={(e) => setDraftPost(c.key, { date: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <label style={label}>ลิงก์โพสต์</label>
                              <input value={post.url || ''} onChange={(e) => setDraftPost(c.key, { url: e.target.value })} placeholder="https://…" style={inputStyle} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setOpenCode(null)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>ยกเลิก</button>
              <button type="button" id="soc-save" onClick={saveRow} style={{ height: 42, padding: '0 24px', borderRadius: 9999, border: 0, background: '#0D6C3B', color: '#fff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- channel manager ---- */}
      {chOpen && (
        <div onClick={() => setChOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 810, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stop} style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>จัดการช่องทาง</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>ช่องทางที่ใช้ลงประกาศ — ใช้กับทุกรายการ</div>
            </div>
            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {channels.map((c) => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, border: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{c.label}</span>
                  <button type="button" onClick={() => removeChannel(c.key)} aria-label={`ลบ ${c.label}`} style={{ width: 30, height: 30, borderRadius: 8, border: 0, background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0392B', cursor: 'pointer' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                  </button>
                </div>
              ))}
              {channels.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--muted3)' }}>ยังไม่มีช่องทาง — เพิ่มด้านล่าง</div>}
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input id="soc-newch" value={newCh} onChange={(e) => setNewCh(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChannel(); } }} placeholder="เช่น LINE OA, TikTok" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <button type="button" id="soc-addch" onClick={addChannel} style={{ height: 40, padding: '0 16px', borderRadius: 10, border: 0, background: '#0D6C3B', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>เพิ่ม</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
