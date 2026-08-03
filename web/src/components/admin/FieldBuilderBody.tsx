'use client';

import * as React from 'react';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';
import { PROPERTY_TYPES, loadOverride, saveOverride, resolveFields, type FieldDef, type FieldKind, type SchemaOverride } from '@/lib/propertySchema';

/* Schema-driven Field Builder — edits the per-property-type field schema
   (enable/disable, reorder, add). Saves to localStorage; the create-property
   modal and the property-edit form read the same schema. */

const KIND_LABEL: Record<FieldKind, string> = {
  dealtype: 'ประเภทประกาศ', text: 'ข้อความ', textarea: 'ข้อความยาว', number: 'ตัวเลข', price: 'ราคา', date: 'วันที่',
  select: 'ตัวเลือก (dropdown)', multiselect: 'เลือกหลายค่า', boolean: 'ใช่/ไม่',
  media: 'ไฟล์ / สื่อ', location: 'ที่อยู่ / พิกัด', map: 'แผนที่', group: 'กลุ่มย่อย',
};
const kindPath = (k: FieldKind) => {
  const m: Record<FieldKind, string> = {
    dealtype: '<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"></path>',
    textarea: '<path d="M4 6h16M4 10h16M4 14h12M4 18h8"></path>',
    number: '<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"></path>',
    price: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>',
    date: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
    select: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>',
    multiselect: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><path d="M3 16l2 2 4-4M14 17h7"></path>',
    boolean: '<rect x="1" y="5" width="22" height="14" rx="7"></rect><circle cx="16" cy="12" r="4"></circle>',
    media: '<rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path>',
    location: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"></path><circle cx="12" cy="10" r="3"></circle>',
    map: '<path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"></path><path d="M9 3v15M15 6v15"></path>',
    group: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect>',
  };
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A3FB0" stroke-width="1.8">' + m[k] + '</svg>';
};

const PALETTE: FieldKind[] = ['text', 'textarea', 'number', 'price', 'date', 'select', 'multiselect', 'boolean', 'media'];

const fbCss = `
#fb-split > div{ min-width:0; }
@media (max-width:1100px){ #fb-split{grid-template-columns:1fr !important;} #fb-preview{position:static !important;} }
@media (max-width:640px){
  #admin-main > main{ padding:16px 14px 44px !important; }
  #fb-actions{flex-wrap:wrap !important;width:100% !important;row-gap:8px !important;}
  #fb-split code{ overflow-wrap:anywhere; }
}
@media (max-width:480px){ #fb-save{flex:1 1 100% !important;justify-content:center;} }
.fb-save:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(13,108,59,.35);}
.fb-type:hover{border-color:#7A3FB0;transform:translateY(-2px);}
`;

const dd = (active: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: active ? 700 : 600, cursor: 'pointer', color: active ? '#0D6C3B' : 'var(--text)', background: active ? 'rgba(13,108,59,.06)' : 'transparent' });
const switchStyle = (on: boolean): React.CSSProperties => ({ width: 36, height: 21, borderRadius: 9999, cursor: on === undefined ? 'default' : 'pointer', position: 'relative', transition: 'background .2s', background: on ? '#0D6C3B' : 'var(--border)', flexShrink: 0 });
const knob = (on: boolean): React.CSSProperties => ({ position: 'absolute', top: '2.5px', left: on ? '17px' : '2.5px', width: 16, height: 16, borderRadius: 9999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' });

export function FieldBuilderBody() {
  const [scope, setScope] = React.useState('house');
  const [override, setOverride] = React.useState<SchemaOverride>({ disabled: [], order: [], extra: [] });
  const [dirty, setDirty] = React.useState(false);
  const [scopeOpen, setScopeOpen] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drag, setDrag] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<string | null>(null);
  const seq = React.useRef(1);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => { setOverride(loadOverride(scope)); setDirty(false); }, [scope]);

  const type = PROPERTY_TYPES.find((t) => t.key === scope) || PROPERTY_TYPES[0];
  const fields = resolveFields(scope, override);
  const enabledCount = fields.filter((f) => f.enabled).length;
  const scopeLabel = type.label;

  const flash = (msg: string) => { setToast(msg); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2400); };

  const toggle = (f: FieldDef & { enabled: boolean }) => {
    if (f.required) return;
    setOverride((o) => {
      const dis = new Set(o.disabled);
      if (dis.has(f.key)) dis.delete(f.key); else dis.add(f.key);
      return { ...o, disabled: [...dis] };
    });
    setDirty(true);
  };

  const addField = (kind: FieldKind) => {
    const nf: FieldDef = { key: `custom_${scope}_${kind}_${seq.current++}`, label: `ฟิลด์ใหม่ (${KIND_LABEL[kind]})`, kind, options: kind === 'select' || kind === 'multiselect' ? ['ตัวเลือก 1', 'ตัวเลือก 2'] : undefined };
    setOverride((o) => ({ ...o, extra: [...o.extra, nf], order: [...(o.order.length ? o.order : fields.map((f) => f.key)), nf.key] }));
    setDirty(true);
  };
  const removeField = (key: string) => {
    setOverride((o) => ({ disabled: o.disabled.filter((k) => k !== key), order: o.order.filter((k) => k !== key), extra: o.extra.filter((f) => f.key !== key) }));
    setDirty(true);
  };
  const reorder = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    const keys = fields.map((f) => f.key);
    const fi = keys.indexOf(fromKey), ti = keys.indexOf(toKey);
    if (fi < 0 || ti < 0) return;
    const [m] = keys.splice(fi, 1);
    keys.splice(keys.indexOf(toKey) + (fi < ti ? 1 : 0), 0, m);
    setOverride((o) => ({ ...o, order: keys }));
    setDirty(true);
  };
  const save = () => { saveOverride(scope, override); setDirty(false); flash(`บันทึกฟิลด์ของ "${scopeLabel}" แล้ว · เปิดใช้ ${enabledCount} ฟิลด์`); };

  const isCustom = (key: string) => override.extra.some((f) => f.key === key);

  const fbTitle = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>Field Builder
      <span style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: '#F0ECF9', color: '#7A3FB0', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center' }}>No-code · schema</span>
    </span>
  );

  const actions = (
    <div id="fb-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative' }}>
        <div onClick={() => setScopeOpen((o) => !o)} style={{ height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ฟิลด์ของ: {scopeLabel}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4" style={scopeOpen ? { transform: 'rotate(180deg)', transition: 'transform .2s' } : { transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
        </div>
        {scopeOpen && (
          <>
            <div onClick={() => setScopeOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: 46, left: 0, zIndex: 50, minWidth: 210, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 13, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 }}>
              {PROPERTY_TYPES.map((t) => {
                const active = t.key === scope;
                return (
                  <div key={t.key} onClick={() => { setScope(t.key); setScopeOpen(false); }} style={dd(active)}>
                    <span>ฟิลด์ของ {t.label}</span>
                    {active && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div id="fb-save" className="fb-save" onClick={save} style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: dirty ? '#0D6C3B' : '#273c33', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>{dirty ? 'บันทึก *' : 'บันทึก'}
      </div>
    </div>
  );

  return (
    <AdminShell active="cms" eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Field Builder' }]} />} title={fbTitle} actions={actions} css={fbCss}>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        แต่ละประเภททรัพย์เก็บรายละเอียดคนละชุด — เปิด/ปิดฟิลด์ แล้วกด <b>บันทึก</b> จะมีผลกับฟอร์ม <b>+เพิ่มทรัพย์</b> และ <b>แก้ไขทรัพย์</b> ของประเภทนั้นทันที
      </p>

      <div id="fb-split" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* FIELD LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fields.map((f) => {
            const custom = isCustom(f.key);
            const isOver = over === f.key && drag !== f.key;
            const isSrc = drag === f.key;
            return (
              <div
                key={f.key}
                ref={(el) => { cardRefs.current[f.key] = el; }}
                onDragOver={(e) => { e.preventDefault(); setOver(f.key); }}
                onDragLeave={() => setOver((c) => (c === f.key ? null : c))}
                onDrop={(e) => { e.preventDefault(); const from = e.dataTransfer.getData('text/plain'); setDrag(null); setOver(null); if (from) reorder(from, f.key); }}
                style={{ background: isOver ? 'rgba(13,108,59,.05)' : 'var(--surface)', border: '1px solid ' + (isOver ? '#0D6C3B' : 'var(--border)'), borderRadius: 14, padding: '13px 14px', opacity: (isSrc ? 0.4 : 1) * (f.enabled ? 1 : 0.6), transition: 'border-color .15s,background .15s,opacity .15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', f.key); e.dataTransfer.effectAllowed = 'move'; const el = cardRefs.current[f.key]; if (el) e.dataTransfer.setDragImage(el, 20, 20); setDrag(f.key); }} onDragEnd={() => { setDrag(null); setOver(null); }} title="ลากเพื่อจัดลำดับ" style={{ color: 'var(--muted3)', cursor: 'grab', flexShrink: 0, display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></svg>
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F0ECF9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: kindPath(f.kind) }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{f.label}</span>
                      {f.required && <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#F9E4E1', color: '#C0392B', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>บังคับ</span>}
                      {f.system && <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: 'var(--bg)', color: 'var(--muted3)', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>ระบบ</span>}
                      {custom && <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#EEF4F3', color: '#034956', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>เพิ่มเอง</span>}
                      {f.section && <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>{f.section}</span>}
                    </div>
                    <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <code style={{ fontSize: 11, color: 'var(--muted2)' }}>{f.key}</code>
                      <span style={{ fontSize: 11, color: 'var(--muted3)' }}>· {KIND_LABEL[f.kind]}{f.unit ? ` · ${f.unit}` : ''}{f.options ? ` (${f.options.length} ตัวเลือก)` : ''}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div onClick={() => toggle(f)} title={f.required ? 'ฟิลด์บังคับ — ปิดไม่ได้' : 'เปิด/ปิดฟิลด์'} style={{ ...switchStyle(f.enabled), cursor: f.required ? 'not-allowed' : 'pointer', opacity: f.required ? 0.7 : 1 }}>
                        <div style={knob(f.enabled)} />
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--muted3)' }}>{f.enabled ? 'เปิดใช้' : 'ปิดอยู่'}</span>
                    </div>
                    {custom && (
                      <div onClick={() => removeField(f.key)} title="ลบฟิลด์ที่เพิ่มเอง" style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0392B', cursor: 'pointer' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* PALETTE */}
        <div id="fb-preview" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>เพิ่มชนิดฟิลด์</div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted2)', marginBottom: 14 }}>กดเพื่อเพิ่มฟิลด์ใหม่เข้าประเภทนี้</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PALETTE.map((k) => (
                <div key={k} className="fb-type" onClick={() => addField(k)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', transition: 'border-color .15s,transform .15s' }}>
                  <div dangerouslySetInnerHTML={{ __html: kindPath(k) }} />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text)', textAlign: 'center' }}>{KIND_LABEL[k]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#F0ECF9', border: '1px solid #DCCFEC', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A3FB0" strokeWidth="1.9" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2l2 5 5 .5-4 3.5 1 5-4-2.5-4 2.5 1-5-4-3.5 5-.5z" /></svg>
            <span style={{ fontSize: 12, color: '#7A3FB0', lineHeight: 1.55 }}>ฟิลด์ที่เปิดไว้ ({enabledCount}/{fields.length}) จะปรากฏในฟอร์ม +เพิ่มทรัพย์ และ แก้ไขทรัพย์ ของประเภท <b>{scopeLabel}</b> · ฟิลด์ <b>บังคับ</b> ปิดไม่ได้</span>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 900, background: '#0A0E0C', color: '#fff', padding: '12px 20px', borderRadius: 9999, fontSize: 13, fontWeight: 700, boxShadow: '0 12px 30px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', gap: 9, maxWidth: 'calc(100vw - 32px)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2.6" style={{ flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
          {toast}
        </div>
      )}
    </AdminShell>
  );
}
