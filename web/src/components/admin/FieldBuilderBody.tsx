'use client';

import * as React from 'react';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';

/* Ported from AdminFieldBuilder.dc.html — the <main> content of the
   no-code field builder. Interactive beyond the static design:
   - drag a field type from the right palette → drop into the left
     list to add a new field (drop on a row inserts there; drop on the
     "เพิ่มฟิลด์ใหม่" box appends)
   - "เพิ่มฟิลด์ใหม่" button adds a text field
   - drag the grip handle to reorder fields
   - the pencil opens an inline editor (ชื่อ/คีย์/ชนิด/บังคับ/แสดงบนเว็บ + ลบ)
   - per-field "แสดงบนเว็บ" toggle */

const fi = (p: string, c: string) => ({ __html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="1.8">' + p + '</svg>' });
const ti = (p: string) => ({ __html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + p + '</svg>' });

type FieldDef = {
  id: string;
  label: string;
  key: string;
  typeName: string;
  required: boolean;
  system: boolean;
  iconBg: string;
  iconColor: string;
  icon: { __html: string };
};

type FieldType = { name: string; typeName: string; keyBase: string; path: string };

const FIELD_TYPES: FieldType[] = [
  { name: 'ข้อความ', typeName: 'ข้อความ', keyBase: 'text', path: '<path d="M4 7V4h16v3M9 20h6M12 4v16"></path>' },
  { name: 'ตัวเลข', typeName: 'ตัวเลข', keyBase: 'number', path: '<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"></path>' },
  { name: 'ตัวเลือก', typeName: 'ตัวเลือก (dropdown)', keyBase: 'select', path: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>' },
  { name: 'ใช่/ไม่', typeName: 'ใช่/ไม่ (boolean)', keyBase: 'boolean', path: '<rect x="1" y="5" width="22" height="14" rx="7"></rect><circle cx="16" cy="12" r="4"></circle>' },
  { name: 'วันที่', typeName: 'วันที่', keyBase: 'date', path: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>' },
  { name: 'ไฟล์แนบ', typeName: 'ไฟล์แนบ', keyBase: 'file', path: '<path d="M21.4 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.2 9.19a1 1 0 01-1.41-1.41l8.49-8.49"></path>' },
];

const INITIAL_FIELDS: FieldDef[] = [
  { id: 'usable_area_sqm', label: 'พื้นที่ใช้สอย (ตร.ม.)', key: 'usable_area_sqm', typeName: 'ตัวเลข', required: true, system: true, iconBg: '#EEF4F3', iconColor: '#034956', icon: fi('<path d="M3 3h18v18H3z"></path><path d="M3 9h18M9 3v18"></path>', '#034956') },
  { id: 'clear_height_m', label: 'ความสูงใต้อาคาร (ม.)', key: 'clear_height_m', typeName: 'ตัวเลข', required: true, system: true, iconBg: '#EEF4F3', iconColor: '#034956', icon: fi('<path d="M12 3v18M5 8l7-5 7 5"></path>', '#034956') },
  { id: 'floor_loading', label: 'รับน้ำหนักพื้น (ตัน/ตร.ม.)', key: 'floor_loading', typeName: 'ตัวเลขทศนิยม', required: false, system: true, iconBg: '#EEF4F3', iconColor: '#034956', icon: fi('<path d="M12 2v20M5 8h14"></path>', '#034956') },
  { id: 'power_system', label: 'ระบบไฟฟ้า', key: 'power_system', typeName: 'ตัวเลือก (dropdown)', required: true, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi('<path d="M13 2L3 14h7l-1 8 11-14h-7z"></path>', '#7A3FB0') },
  { id: 'truck_parking', label: 'จำนวนที่จอดรถบรรทุก', key: 'truck_parking', typeName: 'ตัวเลข', required: false, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi('<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7"></path><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>', '#7A3FB0') },
  { id: 'factory_license', label: 'ขอใบ ร.ง.4 ได้', key: 'factory_license', typeName: 'ใช่/ไม่ (boolean)', required: false, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi('<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>', '#7A3FB0') },
  { id: 'overhead_crane', label: 'มีเครนเหนือศีรษะ', key: 'overhead_crane', typeName: 'ใช่/ไม่ (boolean)', required: false, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi('<path d="M3 21h18M5 21V7l10-3v17M5 7h10"></path>', '#7A3FB0') },
];

/* Field sets differ per property type — the "ฟิลด์ของ: …" scope dropdown swaps these. */
const WAREHOUSE_FIELDS: FieldDef[] = [
  { id: 'usable_area_sqm', label: 'พื้นที่ใช้สอย (ตร.ม.)', key: 'usable_area_sqm', typeName: 'ตัวเลข', required: true, system: true, iconBg: '#EEF4F3', iconColor: '#034956', icon: fi('<path d="M3 3h18v18H3z"></path><path d="M3 9h18M9 3v18"></path>', '#034956') },
  { id: 'clear_height_m', label: 'ความสูงใต้อาคาร (ม.)', key: 'clear_height_m', typeName: 'ตัวเลข', required: true, system: true, iconBg: '#EEF4F3', iconColor: '#034956', icon: fi('<path d="M12 3v18M5 8l7-5 7 5"></path>', '#034956') },
  { id: 'floor_loading', label: 'รับน้ำหนักพื้น (ตัน/ตร.ม.)', key: 'floor_loading', typeName: 'ตัวเลขทศนิยม', required: false, system: true, iconBg: '#EEF4F3', iconColor: '#034956', icon: fi('<path d="M12 2v20M5 8h14"></path>', '#034956') },
  { id: 'dock_doors', label: 'จำนวนประตู Loading Dock', key: 'dock_doors', typeName: 'ตัวเลข', required: false, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi('<rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path>', '#7A3FB0') },
  { id: 'cold_storage', label: 'ห้องเย็น/ควบคุมอุณหภูมิ', key: 'cold_storage', typeName: 'ใช่/ไม่ (boolean)', required: false, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi('<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"></path>', '#7A3FB0') },
  { id: 'power_system', label: 'ระบบไฟฟ้า', key: 'power_system', typeName: 'ตัวเลือก (dropdown)', required: false, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi('<path d="M13 2L3 14h7l-1 8 11-14h-7z"></path>', '#7A3FB0') },
];
const LAND_FIELDS: FieldDef[] = [
  { id: 'land_area_rai', label: 'ขนาดที่ดิน (ไร่)', key: 'land_area_rai', typeName: 'ตัวเลขทศนิยม', required: true, system: true, iconBg: '#EEF4F3', iconColor: '#034956', icon: fi('<path d="M3 20h18M5 20V10l7-5 7 5v10"></path>', '#034956') },
  { id: 'zoning', label: 'ผังเมือง (โซนสี)', key: 'zoning', typeName: 'ตัวเลือก (dropdown)', required: true, system: true, iconBg: '#EEF4F3', iconColor: '#034956', icon: fi('<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"></path><path d="M9 3v15M15 6v15"></path>', '#034956') },
  { id: 'road_frontage_m', label: 'หน้ากว้างติดถนน (ม.)', key: 'road_frontage_m', typeName: 'ตัวเลข', required: false, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi('<path d="M4 19l6-14M20 19l-6-14M12 5v14"></path>', '#7A3FB0') },
  { id: 'filled_land', label: 'ถมดินแล้ว', key: 'filled_land', typeName: 'ใช่/ไม่ (boolean)', required: false, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi('<path d="M3 20h18M5 20l7-8 7 8"></path>', '#7A3FB0') },
];
const FIELDS_BY_SCOPE: Record<string, FieldDef[]> = { factory: INITIAL_FIELDS, warehouse: WAREHOUSE_FIELDS, land: LAND_FIELDS };
const SCOPES: { key: string; label: string }[] = [
  { key: 'factory', label: 'โรงงาน' },
  { key: 'warehouse', label: 'โกดัง' },
  { key: 'land', label: 'ที่ดิน' },
];
const ddOption = (active: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: active ? 700 : 600, cursor: 'pointer', color: active ? '#0D6C3B' : 'var(--text)', background: active ? 'rgba(13,108,59,.06)' : 'transparent' });

const fbCss = `
@media (max-width:1100px){ #fb-split{grid-template-columns:1fr !important;} #fb-preview{position:static !important;} }
@media (max-width:640px){ #fb-actions{flex-wrap:wrap !important;width:100% !important;row-gap:8px !important;} #fb-edit-grid{grid-template-columns:1fr !important;} }
.fb-save:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(13,108,59,.35);}
.fb-edit:hover{background:var(--border);}
.fb-type:hover{border-color:#7A3FB0;transform:translateY(-2px);}
`;

const switchStyle = (isOn: boolean): React.CSSProperties => ({ width: 36, height: 21, borderRadius: 9999, cursor: 'pointer', position: 'relative', transition: 'background .2s', background: isOn ? '#0D6C3B' : 'var(--border)', flexShrink: 0 });
const knobStyle = (isOn: boolean): React.CSSProperties => ({ position: 'absolute', top: '2.5px', left: isOn ? '17px' : '2.5px', width: 16, height: 16, borderRadius: 9999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' });

const editInput: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', outline: 'none' };
const editLabel: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: '11.5px', fontWeight: 700, color: 'var(--muted2)' };

export function FieldBuilderBody() {
  const [scope, setScope] = React.useState('factory');
  const [fieldsByScope, setFieldsByScope] = React.useState<Record<string, FieldDef[]>>(FIELDS_BY_SCOPE);
  const fields = fieldsByScope[scope];
  const setFields = React.useCallback(
    (updater: FieldDef[] | ((p: FieldDef[]) => FieldDef[])) =>
      setFieldsByScope((prev) => ({ ...prev, [scope]: typeof updater === 'function' ? (updater as (p: FieldDef[]) => FieldDef[])(prev[scope]) : updater })),
    [scope],
  );
  const [on, setOn] = React.useState<Record<string, boolean>>({ truck_parking: false });
  const [scopeOpen, setScopeOpen] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drag, setDrag] = React.useState<{ kind: 'field' | 'type'; value: string } | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [overAdd, setOverAdd] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const seqRef = React.useRef(1);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const clearDrag = () => { setDrag(null); setOverId(null); setOverAdd(false); };

  const makeField = (typeIdx: number): FieldDef => {
    const t = FIELD_TYPES[typeIdx] || FIELD_TYPES[0];
    const n = seqRef.current++;
    return { id: 'new_' + n, label: 'ฟิลด์ใหม่ (' + t.name + ')', key: t.keyBase + '_' + n, typeName: t.typeName, required: false, system: false, iconBg: '#F0ECF9', iconColor: '#7A3FB0', icon: fi(t.path, '#7A3FB0') };
  };

  const insertType = (typeIdx: number, atIndex: number) => setFields((prev) => { const cur = [...prev]; cur.splice(atIndex, 0, makeField(typeIdx)); return cur; });
  const appendType = (typeIdx: number) => setFields((prev) => [...prev, makeField(typeIdx)]);

  const reorder = (fromId: string, toId: string) => {
    setFields((prev) => {
      const cur = [...prev];
      const fromI = cur.findIndex((x) => x.id === fromId);
      if (fromI < 0) return prev;
      const toIOrig = cur.findIndex((x) => x.id === toId);
      const [moved] = cur.splice(fromI, 1);
      if (toId === '__end__' || toIOrig < 0) { cur.push(moved); return cur; }
      const dest = cur.findIndex((x) => x.id === toId);
      cur.splice(fromI < toIOrig ? dest + 1 : dest, 0, moved);
      return cur;
    });
  };

  const handleDrop = (raw: string, atIndex: number, toId: string) => {
    if (raw.startsWith('field:')) reorder(raw.slice(6), toId);
    else if (raw.startsWith('type:')) insertType(Number(raw.slice(5)), atIndex);
    clearDrag();
  };

  const updateField = (id: string, patch: Partial<FieldDef>) => setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const changeType = (id: string, idx: number) => setFields((prev) => prev.map((f) => {
    if (f.id !== id) return f;
    const t = FIELD_TYPES[idx];
    return { ...f, typeName: t.typeName, icon: fi(t.path, f.iconColor) };
  }));
  const deleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setOn((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setEditId((cur) => (cur === id ? null : cur));
  };
  const typeIdxOf = (f: FieldDef) => FIELD_TYPES.findIndex((t) => t.typeName === f.typeName);

  const scopeLabel = SCOPES.find((s) => s.key === scope)?.label ?? 'โรงงาน';
  const flash = (msg: string) => { setToast(msg); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2200); };
  const doSave = () => flash('บันทึกฟิลด์ของ "' + scopeLabel + '" แล้ว · ' + fields.length + ' ฟิลด์');
  const pickScope = (k: string) => { setScope(k); setScopeOpen(false); setEditId(null); clearDrag(); };

  const fbTitle = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>Field Builder <span style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: '#F0ECF9', color: '#7A3FB0', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center' }}>No-code</span></span>
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
            <div style={{ position: 'absolute', top: 46, left: 0, zIndex: 50, minWidth: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 13, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 }}>
              {SCOPES.map((s) => {
                const active = s.key === scope;
                return (
                  <div key={s.key} onClick={() => pickScope(s.key)} style={ddOption(active)}>
                    <span>ฟิลด์ของ {s.label}</span>
                    {active && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div className="fb-save" onClick={doSave} style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>
        บันทึก
      </div>
    </div>
  );

  return (
    <AdminShell active="cms" eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Field Builder' }]} />} title={fbTitle} actions={actions} css={fbCss}>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        สร้างฟิลด์ทรัพย์เองได้โดยไม่ต้องเขียนโค้ด — ลากเรียง, เลือกชนิดข้อมูล, ตั้งว่าบังคับ/แสดงบนเว็บ
      </p>

      <div id="fb-split" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* FIELD LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map((f, i) => {
            const isOn = on[f.id] !== false;
            const isOver = overId === f.id && !(drag?.kind === 'field' && drag.value === f.id);
            const isSrc = drag?.kind === 'field' && drag.value === f.id;
            const isEditing = editId === f.id;
            const curTypeIdx = typeIdxOf(f);
            return (
              <div
                key={f.id}
                ref={(el) => { cardRefs.current[f.id] = el; }}
                onDragOver={(e) => { e.preventDefault(); setOverId(f.id); }}
                onDragLeave={() => setOverId((cur) => (cur === f.id ? null : cur))}
                onDrop={(e) => { e.preventDefault(); handleDrop(e.dataTransfer.getData('text/plain'), i, f.id); }}
                style={{ background: isOver ? 'rgba(13,108,59,.05)' : 'var(--surface)', border: '1px solid ' + (isOver || isEditing ? '#0D6C3B' : 'var(--border)'), borderRadius: 14, padding: '14px 16px', opacity: isSrc ? 0.4 : 1, transition: 'border-color .15s,background .15s,opacity .15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', 'field:' + f.id);
                      e.dataTransfer.effectAllowed = 'move';
                      const el = cardRefs.current[f.id];
                      if (el) e.dataTransfer.setDragImage(el, 24, 24);
                      setDrag({ kind: 'field', value: f.id });
                    }}
                    onDragEnd={clearDrag}
                    title="ลากเพื่อจัดลำดับ"
                    style={{ color: 'var(--muted3)', cursor: 'grab', flexShrink: 0, display: 'flex' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></svg>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: f.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: f.iconColor }} dangerouslySetInnerHTML={f.icon} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{f.label}</span>
                      {f.required && (
                        <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: '#F9E4E1', color: '#C0392B', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>บังคับ</span>
                      )}
                      {f.system && (
                        <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: 'var(--bg)', color: 'var(--muted3)', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>ระบบ</span>
                      )}
                    </div>
                    <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ fontSize: 11, color: 'var(--muted2)' }}>{f.key}</code>
                      <span style={{ fontSize: 11, color: 'var(--muted3)' }}>· {f.typeName}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div onClick={() => setOn((prev) => ({ ...prev, [f.id]: !isOn }))} style={switchStyle(isOn)}>
                        <div style={knobStyle(isOn)} />
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--muted3)' }}>แสดงบนเว็บ</span>
                    </div>
                    <div className="fb-edit" onClick={() => setEditId((cur) => (cur === f.id ? null : f.id))} title="แก้ไขฟิลด์" style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isEditing ? '#0D6C3B' : 'var(--muted2)', background: isEditing ? '#E8F3EC' : 'transparent', cursor: 'pointer' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
                    </div>
                  </div>
                </div>

                {/* inline editor */}
                {isEditing && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div id="fb-edit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={editLabel}>ชื่อฟิลด์ (แสดงผล)</label>
                        <input value={f.label} onChange={(e) => updateField(f.id, { label: e.target.value })} placeholder="เช่น พื้นที่ใช้สอย" style={editInput} />
                      </div>
                      <div>
                        <label style={editLabel}>คีย์ (key)</label>
                        <input value={f.key} onChange={(e) => updateField(f.id, { key: e.target.value })} readOnly={f.system} placeholder="เช่น usable_area_sqm" style={{ ...editInput, fontFamily: "'JetBrains Mono',monospace", color: f.system ? 'var(--muted3)' : 'var(--text)', background: f.system ? 'var(--tint)' : 'var(--bg)', cursor: f.system ? 'not-allowed' : 'text' }} />
                        {f.system && <div style={{ marginTop: 4, fontSize: 10.5, color: 'var(--muted3)' }}>คีย์ระบบ · แก้ไขไม่ได้</div>}
                      </div>
                    </div>

                    <div>
                      <label style={editLabel}>ชนิดข้อมูล</label>
                      <select value={curTypeIdx} onChange={(e) => changeType(f.id, Number(e.target.value))} style={{ ...editInput, cursor: 'pointer' }}>
                        {curTypeIdx < 0 && <option value={-1} disabled>{f.typeName}</option>}
                        {FIELD_TYPES.map((t, idx) => (<option key={t.keyBase} value={idx}>{t.name} · {t.typeName}</option>))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div onClick={() => updateField(f.id, { required: !f.required })} style={switchStyle(f.required)}><div style={knobStyle(f.required)} /></div>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>บังคับกรอก</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div onClick={() => setOn((prev) => ({ ...prev, [f.id]: !isOn }))} style={switchStyle(isOn)}><div style={knobStyle(isOn)} /></div>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>แสดงบนเว็บ</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 2 }}>
                      {f.system ? (
                        <span style={{ fontSize: 11.5, color: 'var(--muted3)' }}>ฟิลด์ระบบ · ลบไม่ได้</span>
                      ) : (
                        <div onClick={() => deleteField(f.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 15px', borderRadius: 9999, border: '1.5px solid #C0392B', color: '#C0392B', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', background: 'transparent' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>ลบฟิลด์
                        </div>
                      )}
                      <div onClick={() => setEditId(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 20px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>เสร็จ
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {/* add field (click = add text field, drop target = append) */}
          <div
            onClick={() => appendType(0)}
            onDragOver={(e) => { e.preventDefault(); setOverAdd(true); }}
            onDragLeave={() => setOverAdd(false)}
            onDrop={(e) => { e.preventDefault(); handleDrop(e.dataTransfer.getData('text/plain'), fields.length, '__end__'); }}
            style={{ border: '1.5px dashed ' + (overAdd ? '#0D6C3B' : 'var(--border)'), borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: overAdd ? '#0D6C3B' : 'var(--muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: overAdd ? 'rgba(13,108,59,.05)' : 'var(--surface)', transition: 'border-color .15s,background .15s,color .15s' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
            เพิ่มฟิลด์ใหม่
          </div>
        </div>

        {/* FIELD TYPE PALETTE */}
        <div id="fb-preview" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>ชนิดฟิลด์</div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted2)', marginBottom: 14 }}>ลากลงในรายการซ้ายเพื่อเพิ่ม</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {FIELD_TYPES.map((t, idx) => (
                <div
                  key={t.name}
                  className="fb-type"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', 'type:' + idx); e.dataTransfer.effectAllowed = 'copy'; setDrag({ kind: 'type', value: String(idx) }); }}
                  onDragEnd={clearDrag}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', borderRadius: 12, border: '1px solid ' + (drag?.kind === 'type' && drag.value === String(idx) ? '#7A3FB0' : 'var(--border)'), background: 'var(--bg)', cursor: 'grab', transition: 'border-color .15s,transform .15s', opacity: drag?.kind === 'type' && drag.value === String(idx) ? 0.5 : 1 }}
                >
                  <div style={{ color: '#7A3FB0' }} dangerouslySetInnerHTML={ti(t.path)} />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text)' }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#F0ECF9', border: '1px solid #DCCFEC', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A3FB0" strokeWidth="1.9" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 2l2 5 5 .5-4 3.5 1 5-4-2.5-4 2.5 1-5-4-3.5 5-.5z" /></svg>
            <span style={{ fontSize: 12, color: '#7A3FB0', lineHeight: 1.55 }}>ฟิลด์ที่สร้างจะปรากฏใน tab &quot;Features&quot; ของหน้า Property อัตโนมัติ และค้นหา/กรองได้ถ้าเปิด &quot;แสดงบนเว็บ&quot; — ลูกค้าแต่ละ tenant ปรับฟิลด์ต่างกันได้เอง</span>
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
