'use client';

import * as React from 'react';
import { resolveFields, propertyType, type FieldDef } from '@/lib/propertySchema';
import { buildSummary } from '@/lib/summaryTemplate';
import { MapPicker } from './MapPicker';

/* Renders the enabled fields for a property type (from the Field Builder
   schema in localStorage). Used by both the create-property modal and the
   property-edit form so they stay in sync with Field Builder.

   Beyond plain rendering it handles three things the warehouse form needs:
   - `showWhen`  — tax/fee fields appear only for the matching ประเภทประกาศ
   - collapsible sections so a 40-field form stays readable
   - `summary`   — a read-only post/handout text built from everything typed
                   above it, with a copy button. */

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' };
const inputStyle: React.CSSProperties = { width: '100%', height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13.5px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const req = <span style={{ color: '#C0392B' }}> *</span>;

const isFull = (f: FieldDef) => ['dealtype', 'location', 'group', 'media', 'multiselect', 'textarea', 'map', 'summary'].includes(f.kind);

type Vals = Record<string, unknown>;

export function DynamicFieldForm({ typeKey, code }: { typeKey: string; code?: string }) {
  const [fields, setFields] = React.useState<(FieldDef & { enabled: boolean })[]>([]);
  const [vals, setVals] = React.useState<Vals>({});
  const [closed, setClosed] = React.useState<Record<string, boolean>>({});
  const [copied, setCopied] = React.useState(false);
  const [refreshTick, setRefreshTick] = React.useState(0);
  const [refreshed, setRefreshed] = React.useState(false);

  // Re-resolve the field list AND clear answers on type change — several keys
  // (bathrooms, kitchen, common_area, appliances, furniture…) exist on more than
  // one type with different kinds/options, so keeping values would leak a stale
  // answer into a control that can't represent it (e.g. '5 ห้อง' in a 1–2 select).
  React.useEffect(() => {
    setFields(resolveFields(typeKey).filter((f) => f.enabled));
    setVals({});
    setClosed({});
  }, [typeKey]);

  const setV = (k: string, v: unknown) => setVals((p) => ({ ...p, [k]: v }));
  const setSub = (k: string, sk: string, v: unknown) => setVals((p) => ({ ...p, [k]: { ...((p[k] as Vals) || {}), [sk]: v } }));
  const toggleMulti = (k: string, opt: string) => setVals((p) => { const cur = new Set((p[k] as string[]) || []); if (cur.has(opt)) cur.delete(opt); else cur.add(opt); return { ...p, [k]: [...cur] }; });

  const str = (k: string) => { const v = vals[k]; return v === undefined || v === null ? '' : String(v); };
  const sub = (k: string, sk: string) => { const o = vals[k] as Vals | undefined; const v = o?.[sk]; return v === undefined || v === null ? '' : String(v); };

  /* ---- conditional visibility ---------------------------------------- */
  // A dealtype with nothing chosen yet behaves as its first option (that is what
  // the control paints as selected), so showWhen must resolve it the same way.
  const effective = (key: string): string => {
    const raw = vals[key];
    if (raw !== undefined && raw !== '') return String(raw);
    const def = fields.find((x) => x.key === key);
    if (def?.kind === 'dealtype') return (def.options || [])[0] ?? '';
    return '';
  };
  const visible = (f: FieldDef) => !f.showWhen || f.showWhen.in.includes(effective(f.showWhen.field));

  const lbl = (f: FieldDef) => (
    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
      <span>{f.label}{f.unit ? ` (${f.unit})` : ''}{f.required ? req : null}</span>
      {f.internalOnly && (
        <span title="ข้อมูลนี้ไม่ถูกส่งไปหน้าเว็บสาธารณะ" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 19, padding: '0 8px', borderRadius: 9999, background: '#FBF3E1', color: '#9A741C', fontSize: 10, fontWeight: 700 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
          ไม่แสดงบนเว็บ
        </span>
      )}
    </label>
  );
  const note = (f: FieldDef) => (f.note ? <div style={{ marginTop: 5, fontSize: 11, lineHeight: 1.5, color: f.internalOnly ? '#9A741C' : f.required ? '#C0392B' : 'var(--muted3)' }}>{f.note}</div> : null);

  /* ---- summary text ---------------------------------------------------
     Rebuilds on every keystroke (vals is in the dep list); the refresh button
     only exists to re-pull the schema and give a visible confirmation.
     The wording itself lives in lib/summaryTemplate so the Social Status page
     renders exactly the same block. */
  const summary = React.useMemo(
    () => buildSummary({
      typeLabel: propertyType(typeKey).label,
      code,
      // deal_type defaults to its first option until touched — feed the value
      // the control is actually painting, not the empty slot behind it
      values: { ...vals, deal_type: effective('deal_type') },
    }),
    // refreshTick lets the refresh button force a recompute even though vals already does
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vals, typeKey, code, fields, refreshTick],
  );

  // re-pull the schema (in case Field Builder changed) and recompute the text
  const refreshSummary = () => {
    setFields(resolveFields(typeKey).filter((f) => f.enabled));
    setRefreshTick((n) => n + 1);
    setRefreshed(true);
    window.setTimeout(() => setRefreshed(false), 1400);
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary.text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = summary.text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  /* ---- one field ------------------------------------------------------ */
  const field = (f: FieldDef) => {
    switch (f.kind) {
      case 'dealtype':
        return (
          <div>
            {lbl(f)}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(f.options || []).map((opt) => {
                const on = effective(f.key) === opt;
                return <button type="button" key={opt} onClick={() => setV(f.key, opt)} aria-pressed={on} style={{ flex: '1 1 auto', minWidth: 96, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)' }}>{opt}</button>;
              })}
            </div>
          </div>
        );
      case 'select':
        return (<div>{lbl(f)}<select value={str(f.key)} onChange={(e) => setV(f.key, e.target.value)} style={selectStyle}><option value="">เลือก…</option>{(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>{note(f)}</div>);
      case 'multiselect':
        return (
          <div>
            {lbl(f)}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(f.options || []).map((opt) => {
                const on = ((vals[f.key] as string[]) || []).includes(opt);
                return <button type="button" key={opt} onClick={() => toggleMulti(f.key, opt)} aria-pressed={on} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)' }}>{on && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}{opt}</button>;
              })}
            </div>
            {note(f)}
          </div>
        );
      case 'boolean':
        return (
          <div>
            {lbl(f)}
            <button type="button" role="switch" aria-checked={!!vals[f.key]} aria-label={f.label} onClick={() => setV(f.key, !vals[f.key])} style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{vals[f.key] ? 'มี' : 'ไม่มี / ไม่ระบุ'}</span>
              <span style={{ width: 40, height: 23, borderRadius: 9999, background: vals[f.key] ? '#0D6C3B' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}><span style={{ position: 'absolute', top: '2.5px', left: vals[f.key] ? '19px' : '2.5px', width: 18, height: 18, borderRadius: 9999, background: '#fff', transition: 'left .2s' }} /></span>
            </button>
          </div>
        );
      case 'media':
        return (
          <div>
            {lbl(f)}
            <div style={{ border: '1.5px dashed var(--border)', borderRadius: 12, padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>ลากไฟล์มาวาง หรือเลือกจากคลัง</div>
                {f.note && <div style={{ fontSize: 11, color: f.required ? '#C0392B' : 'var(--muted3)' }}>{f.note}</div>}
              </div>
              <button type="button" style={{ height: 34, padding: '0 14px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0, border: 0, fontFamily: 'inherit' }}>อัปโหลด</button>
            </div>
          </div>
        );
      case 'location':
        return (
          <div>
            {lbl(f)}
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
              {(f.sub || []).map((s) => (
                <div key={s.key} style={s.key === 'map' ? { gridColumn: '1 / -1' } : undefined}>
                  <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>{s.label}</label>
                  <input value={sub(f.key, s.key)} onChange={(e) => setSub(f.key, s.key, e.target.value)} placeholder={s.key === 'map' ? 'เช่น 13.6900, 100.6100 หรือลิงก์ Google Map' : ''} style={{ ...inputStyle, height: 40 }} />
                </div>
              ))}
            </div>
          </div>
        );
      case 'group':
        return (
          <div>
            {lbl(f)}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10 }}>
              {(f.sub || []).map((s) => (
                <div key={s.key} style={{ minWidth: 0 }}>
                  <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>{s.label}{s.unit ? ` (${s.unit})` : ''}</label>
                  {s.kind === 'select' ? (
                    <select value={sub(f.key, s.key)} onChange={(e) => setSub(f.key, s.key, e.target.value)} style={{ ...selectStyle, height: 40 }}>
                      <option value="">เลือก…</option>
                      {(s.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={sub(f.key, s.key)} onChange={(e) => setSub(f.key, s.key, e.target.value)} inputMode={s.kind === 'number' ? 'numeric' : undefined} placeholder={s.placeholder || (s.kind === 'number' ? '0' : '')} style={{ ...inputStyle, height: 40 }} />
                  )}
                </div>
              ))}
            </div>
            {note(f)}
          </div>
        );
      case 'map':
        return <MapPicker label={f.label} />;
      case 'summary':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{f.label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button type="button" id="dyn-summary-refresh" onClick={refreshSummary} title="ดึงข้อมูลล่าสุดจากฟิลด์ด้านบน" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 13px', borderRadius: 9999, border: '1px solid ' + (refreshed ? '#0D6C3B' : 'var(--border)'), background: 'var(--surface)', color: refreshed ? '#0D6C3B' : 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: refreshed ? 'rotate(360deg)' : 'none', transition: 'transform .5s' }}><path d="M21 12a9 9 0 11-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
                  {refreshed ? 'อัปเดตแล้ว' : 'Refresh'}
                </button>
                <button type="button" id="dyn-summary-copy" onClick={copySummary} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 14px', borderRadius: 9999, border: 0, background: copied ? '#0D6C3B' : '#273c33', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {copied
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>คัดลอกแล้ว</>
                    : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h8" /></svg>คัดลอกข้อความ</>}
                </button>
              </div>
            </div>
            <pre id="dyn-summary" style={{ margin: 0, padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.75, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 420, overflowY: 'auto' }}>{summary.text}</pre>
            <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted3)' }}>
              <span id="dyn-summary-count" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 20, padding: '0 8px', borderRadius: 9999, background: summary.filled ? 'var(--tint)' : 'var(--bg2,#F3F0EC)', color: summary.filled ? 'var(--accent)' : 'var(--muted3)', fontWeight: 700 }}>
                ดึงข้อมูลแล้ว {summary.filled}/{summary.total} รายการ
              </span>
              <span>{summary.filled ? 'อัปเดตอัตโนมัติทุกครั้งที่พิมพ์ — กด Refresh ถ้าเพิ่งแก้ฟิลด์ใน Field Builder' : 'ยังไม่ได้กรอกข้อมูล — พิมพ์ในฟิลด์ด้านบน ข้อความจะขึ้นเองทันที'}</span>
            </div>
          </div>
        );
      case 'date':
        return (<div>{lbl(f)}<input type="date" value={str(f.key)} onChange={(e) => setV(f.key, e.target.value)} style={inputStyle} /></div>);
      case 'textarea':
        return (
          <div>
            {lbl(f)}
            <textarea
              value={str(f.key)}
              onChange={(e) => setV(f.key, e.target.value)}
              placeholder={f.placeholder || ''}
              style={{
                ...inputStyle, height: 90, padding: '10px 12px', resize: 'vertical', lineHeight: 1.5,
                // internal notes get an amber ground so they never look like public copy
                ...(f.internalOnly ? { background: '#FBF3E1', borderColor: 'rgba(154,116,28,.35)' } : {}),
              }}
            />
            {f.ai && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 13px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontWeight: 700, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 1v11m0 0a3 3 0 003-3V4a3 3 0 00-6 0v5a3 3 0 003 3zM19 10v1a7 7 0 01-14 0v-1M12 19v4" /></svg>พูด
                </button>
                <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 13px', borderRadius: 9999, border: 0, background: '#7A3FB0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><path d="M12 3l1.9 4.8L18 9.5l-4.1 1.7L12 16l-1.9-4.8L6 9.5l4.1-1.7z" /></svg>ให้ AI ช่วยเขียน
                </button>
              </div>
            )}
            {note(f)}
          </div>
        );
      case 'price':
      case 'number':
        return (<div>{lbl(f)}<input value={str(f.key)} onChange={(e) => setV(f.key, e.target.value)} inputMode="numeric" placeholder="0" style={inputStyle} />{note(f)}</div>);
      default: // text
        return (<div>{lbl(f)}<input value={str(f.key)} onChange={(e) => setV(f.key, e.target.value)} placeholder={f.placeholder || ''} style={inputStyle} />{note(f)}</div>);
    }
  };

  if (!fields.length) return <div style={{ fontSize: 13, color: 'var(--muted3)' }}>ยังไม่มีฟิลด์ที่เปิดใช้สำหรับประเภทนี้</div>;

  const grid = (items: (FieldDef & { enabled: boolean })[]) => (
    <div className="dyn-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {items.map((f) => (
        <div key={f.key} style={{ gridColumn: isFull(f) ? '1 / -1' : undefined, minWidth: 0 }}>{field(f)}</div>
      ))}
    </div>
  );

  const styleTag = <style dangerouslySetInnerHTML={{ __html: '@media(max-width:560px){ .dyn-grid{grid-template-columns:1fr !important;} }' }} />;

  // Section-grouped layout when the schema defines sections. Group by section
  // identity (first-appearance order) — robust to drag-reorder in Field Builder
  // interleaving sections, which would otherwise produce duplicate headers.
  if (fields.some((f) => f.section)) {
    const groups: { section: string; items: (FieldDef & { enabled: boolean })[] }[] = [];
    const idx = new Map<string, number>();
    fields.filter(visible).forEach((f) => {
      const sec = f.section || 'อื่นๆ';
      if (!idx.has(sec)) { idx.set(sec, groups.length); groups.push({ section: sec, items: [] }); }
      groups[idx.get(sec)!].items.push(f);
    });
    return (
      <>
        {styleTag}
        <div key={`sections-${typeKey}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.filter((g) => g.items.length).map((g, i) => {
            const open = !closed[g.section];
            const panelId = `dyn-sec-${i}`;
            return (
              <section key={`${typeKey}-${g.section}-${i}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: open ? '16px 16px 18px' : '4px 16px' }}>
                <button
                  type="button"
                  onClick={() => setClosed((c) => ({ ...c, [g.section]: open }))}
                  aria-expanded={open}
                  aria-controls={panelId}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, marginBottom: open ? 14 : 0, padding: open ? 0 : '12px 0', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                >
                  <span style={{ width: 4, height: 15, borderRadius: 3, background: '#0D6C3B', flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>{g.section}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted3)', flexShrink: 0 }}>{open ? 'ซ่อน' : `${g.items.length} ฟิลด์`}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {open && <div id={panelId}>{grid(g.items)}</div>}
              </section>
            );
          })}
        </div>
      </>
    );
  }

  return (<>{styleTag}<div key={`flat-${typeKey}`}>{grid(fields.filter(visible))}</div></>);
}
