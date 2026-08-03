'use client';

import * as React from 'react';
import { resolveFields, type FieldDef } from '@/lib/propertySchema';
import { MapPicker } from './MapPicker';

/* Renders the enabled fields for a property type (from the Field Builder
   schema in localStorage). Used by both the create-property modal and the
   property-edit form so they stay in sync with Field Builder. Mock inputs. */

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' };
const inputStyle: React.CSSProperties = { width: '100%', height: 44, padding: '0 12px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13.5px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const req = <span style={{ color: '#C0392B' }}> *</span>;

const isFull = (f: FieldDef) => ['dealtype', 'location', 'group', 'media', 'multiselect', 'textarea', 'map'].includes(f.kind);

export function DynamicFieldForm({ typeKey }: { typeKey: string }) {
  const [fields, setFields] = React.useState<(FieldDef & { enabled: boolean })[]>([]);
  React.useEffect(() => { setFields(resolveFields(typeKey).filter((f) => f.enabled)); }, [typeKey]);
  const [vals, setVals] = React.useState<Record<string, unknown>>({});
  const setV = (k: string, v: unknown) => setVals((p) => ({ ...p, [k]: v }));
  const toggleMulti = (k: string, opt: string) => setVals((p) => { const cur = new Set((p[k] as string[]) || []); if (cur.has(opt)) cur.delete(opt); else cur.add(opt); return { ...p, [k]: [...cur] }; });

  const lbl = (f: FieldDef) => (<label style={labelStyle}>{f.label}{f.unit ? ` (${f.unit})` : ''}{f.required ? req : null}</label>);

  const field = (f: FieldDef) => {
    switch (f.kind) {
      case 'dealtype':
        return (
          <div>
            {lbl(f)}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(f.options || []).map((opt) => {
                const on = vals[f.key] === opt || (vals[f.key] === undefined && opt === (f.options || [])[0]);
                return <div key={opt} onClick={() => setV(f.key, opt)} style={{ flex: '1 1 auto', minWidth: 96, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)' }}>{opt}</div>;
              })}
            </div>
          </div>
        );
      case 'select':
        return (<div>{lbl(f)}<select value={(vals[f.key] as string) ?? ''} onChange={(e) => setV(f.key, e.target.value)} style={selectStyle}><option value="">เลือก…</option>{(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select></div>);
      case 'multiselect':
        return (
          <div>
            {lbl(f)}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(f.options || []).map((opt) => {
                const on = ((vals[f.key] as string[]) || []).includes(opt);
                return <div key={opt} onClick={() => toggleMulti(f.key, opt)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)' }}>{on && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}{opt}</div>;
              })}
            </div>
            {f.note && <div style={{ marginTop: 5, fontSize: 11, color: 'var(--muted3)' }}>{f.note}</div>}
          </div>
        );
      case 'boolean':
        return (
          <div>
            {lbl(f)}
            <div onClick={() => setV(f.key, !vals[f.key])} style={{ height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{vals[f.key] ? 'มี' : 'ไม่มี / ไม่ระบุ'}</span>
              <div style={{ width: 40, height: 23, borderRadius: 9999, background: vals[f.key] ? '#0D6C3B' : 'var(--border)', position: 'relative', transition: 'background .2s' }}><div style={{ position: 'absolute', top: '2.5px', left: vals[f.key] ? '19px' : '2.5px', width: 18, height: 18, borderRadius: 9999, background: '#fff', transition: 'left .2s' }} /></div>
            </div>
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
              <div style={{ height: 34, padding: '0 14px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>อัปโหลด</div>
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
                  <input placeholder={s.key === 'map' ? 'เช่น 13.6900, 100.6100 หรือลิงก์ Google Map' : ''} style={{ ...inputStyle, height: 40 }} />
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
                <div key={s.key}>
                  <label style={{ ...labelStyle, fontSize: 11, marginBottom: 4 }}>{s.label}{s.unit ? ` (${s.unit})` : ''}</label>
                  <input placeholder={s.kind === 'number' ? '0' : ''} style={{ ...inputStyle, height: 40 }} />
                </div>
              ))}
            </div>
          </div>
        );
      case 'map':
        return <MapPicker label={f.label} />;
      case 'date':
        return (<div>{lbl(f)}<input type="date" style={inputStyle} /></div>);
      case 'textarea':
        return (
          <div>
            {lbl(f)}
            <textarea placeholder={f.placeholder || ''} style={{ ...inputStyle, height: 90, padding: '10px 12px', resize: 'vertical', lineHeight: 1.5 }} />
            {f.ai && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 13px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 1v11m0 0a3 3 0 003-3V4a3 3 0 00-6 0v5a3 3 0 003 3zM19 10v1a7 7 0 01-14 0v-1M12 19v4" /></svg>พูด
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 13px', borderRadius: 9999, background: '#7A3FB0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><path d="M12 3l1.9 4.8L18 9.5l-4.1 1.7L12 16l-1.9-4.8L6 9.5l4.1-1.7z" /></svg>ให้ AI ช่วยเขียน
                </div>
              </div>
            )}
            {f.note && <div style={{ marginTop: 5, fontSize: 11, color: 'var(--muted3)' }}>{f.note}</div>}
          </div>
        );
      case 'price':
        return (<div>{lbl(f)}<input inputMode="numeric" placeholder="0" style={inputStyle} /></div>);
      case 'number':
        return (<div>{lbl(f)}<input inputMode="numeric" placeholder="0" style={inputStyle} /></div>);
      default: // text
        return (<div>{lbl(f)}<input placeholder={f.placeholder || ''} style={inputStyle} /></div>);
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
    fields.forEach((f) => {
      const sec = f.section || 'อื่นๆ';
      if (!idx.has(sec)) { idx.set(sec, groups.length); groups.push({ section: sec, items: [] }); }
      groups[idx.get(sec)!].items.push(f);
    });
    return (
      <>
        {styleTag}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map((g, i) => (
            <section key={g.section + i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ width: 4, height: 15, borderRadius: 3, background: '#0D6C3B', flexShrink: 0 }} />
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>{g.section}</h4>
              </div>
              {grid(g.items)}
            </section>
          ))}
        </div>
      </>
    );
  }

  return (<>{styleTag}{grid(fields)}</>);
}
