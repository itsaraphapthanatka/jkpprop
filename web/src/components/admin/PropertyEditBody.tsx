'use client';

import * as React from 'react';
import { DynamicFieldForm } from './DynamicFieldForm';
import { PROPERTY_TYPES, enabledPropertyTypes, propertyType } from '@/lib/propertySchema';

/* The property this mock form is editing (JKP-SPK0042) — its own type, which
   stays selectable even if that type is later disabled for new intake. */
const RECORD_TYPE = 'warehouse';

/* Property edit form — schema-driven. The "รายละเอียดทรัพย์" tab loads the
   field form for the selected property type (from the Field Builder schema in
   localStorage), so create + edit + Field Builder all stay in sync. The
   "การแปลภาษา" tab keeps the per-language title/description editor. */

type TabKey = 'main' | 'trans';

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--muted)' };

const inputBase: React.CSSProperties = { marginTop: 6, width: '100%', height: 46, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--surface)', outline: 'none' };

const flagTh = '<svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" fill="#012169"></rect><path d="M0 0L24 24M24 0L0 24" stroke="#fff" stroke-width="3"></path><path d="M12 0V24M0 12H24" stroke="#fff" stroke-width="5"></path><path d="M12 0V24M0 12H24" stroke="#C8102E" stroke-width="2.4"></path></svg>';
const flagZh = '<svg width="22" height="22" viewBox="0 0 24 24"><rect width="24" height="24" fill="#EE1C25"></rect><path d="M6 5l1 3 3-1-2 2.4 2 2.4-3-1-1 3-1-3-3 1 2-2.4-2-2.4 3 1z" fill="#FFDE00"></path></svg>';

// Mirrors the design's badge helper exactly: it is called with only 2 args
// (`bd('#E8F3EC','#0D6C3B')`), so the leading param absorbs the first arg and
// the badge renders background:#0D6C3B / color:undefined — reproduced faithfully.
const bd = (_label: string, bg: string, fg?: string): React.CSSProperties => ({ height: 22, padding: '0 10px', borderRadius: 9999, background: bg, color: fg, fontSize: '10.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center' });

const transLangs = [
  { name: 'English', code: 'EN', flag: { __html: flagTh }, badge: 'ครบ', badgeStyle: bd('#E8F3EC', '#0D6C3B'), title: 'Warehouse with office 2,700 sqm, Bangna', desc: 'Warehouse with built-in office in Bangphli, near Burapha Withi expressway.' },
  { name: '中文', code: 'ZH', flag: { __html: flagZh }, badge: 'ครบ', badgeStyle: bd('#E8F3EC', '#0D6C3B'), title: '带办公室的仓库 2,700平方米，邦纳', desc: '位于挽拍的带办公室仓库，靠近博览高速公路。' },
];

const tabDefs: [TabKey, string, boolean][] = [
  ['main', 'รายละเอียดทรัพย์', true],
  ['trans', 'การแปลภาษา', true],
];

export function PropertyEditBody() {
  const [tab, setTab] = React.useState<TabKey>('main');
  const [selType, setSelType] = React.useState(RECORD_TYPE);
  const [types, setTypes] = React.useState(PROPERTY_TYPES);
  // `offKeys` must start empty so the server render and the first client render
  // emit identical markup — reading the config during render would hydrate-mismatch.
  const [offKeys, setOffKeys] = React.useState<string[]>([]);
  // Unlike the create form, the initial type here belongs to the EXISTING record.
  // Turning a type off is an intake policy, not a statement that old records of
  // that type are gone — so keep the record's own type in the picker (badged
  // "ปิดอยู่") instead of silently re-typing the property to the first enabled one.
  React.useEffect(() => {
    const en = enabledPropertyTypes();
    const keep = en.some((t) => t.key === RECORD_TYPE) ? en : [...en, propertyType(RECORD_TYPE)];
    setTypes(keep);
    setOffKeys(keep.filter((t) => !en.some((e) => e.key === t.key)).map((t) => t.key));
  }, []);

  return (
    <div style={{ margin: '-24px -28px -60px' }}>
      {/* TAB BAR */}
      <div id="ed-tabbar" className="a-scroll" style={{ position: 'sticky', top: 69, zIndex: 40, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {tabDefs.map(([k, label, done]) => {
          const on = tab === k;
          return (
            <div key={k} onClick={() => setTab(k)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '16px 6px 14px', fontSize: '13.5px', fontWeight: on ? 700 : 600, color: on ? '#0D6C3B' : 'var(--muted2)', borderBottom: '2.5px solid ' + (on ? '#0D6C3B' : 'transparent'), cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {label}
              {done && <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#0D6C3B' }} />}
            </div>
          );
        })}
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 28px 80px' }}>
        {/* รายละเอียดทรัพย์ — schema-driven per property type */}
        {tab === 'main' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>ชื่อทรัพย์ (ไทย) *</label>
              <input defaultValue="โกดังพร้อมสำนักงาน 2,700 ตร.ม." style={{ ...inputBase, fontSize: 14, fontWeight: 600 }} />
            </div>

            {/* property-type selector — drives which field form is loaded */}
            <div>
              <label style={labelStyle}>ประเภททรัพย์ *</label>
              <div id="ed-type-picker" style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {types.map((pt) => {
                  const on = selType === pt.key;
                  const off = offKeys.includes(pt.key); // kept for this record, but closed for new intake
                  return (
                    <button
                      type="button"
                      key={pt.key}
                      onClick={() => setSelType(pt.key)}
                      aria-pressed={on}
                      title={off ? 'ประเภทนี้ถูกปิดรับใหม่ — ยังคงไว้เพราะเป็นประเภทของทรัพย์นี้' : undefined}
                      style={{ flex: '1 1 auto', minWidth: 120, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)' }}
                    >
                      <span style={{ display: 'flex', width: 16, height: 16 }} dangerouslySetInnerHTML={{ __html: pt.icon }} />
                      {pt.label}
                      {off && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted3)' }}>· ปิดอยู่</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ background: 'var(--tint)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" style={{ flexShrink: 0 }}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></svg>
              <span style={{ fontSize: '12.5px', color: 'var(--accent)' }}>รหัสทรัพย์: <code style={{ fontWeight: 700 }}>JKP-SPK0042</code> (แก้ไขไม่ได้ — สร้างจากจังหวัดตอนบันทึกครั้งแรก)</span>
            </div>

            {/* schema-driven fields for the selected type */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>รายละเอียด: {PROPERTY_TYPES.find((p) => p.key === selType)?.label}</div>
                <a href="/admin/field-builder" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>ปรับฟิลด์ที่ Field Builder →</a>
              </div>
              <DynamicFieldForm typeKey={selType} code="JKP-SPK0042" />
            </div>
          </div>
        )}

        {/* Translations */}
        {tab === 'trans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {transLangs.map((l) => (
              <div key={l.code} style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span dangerouslySetInnerHTML={l.flag} style={{ width: 22, height: 22, borderRadius: 5, overflow: 'hidden', display: 'flex' }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{l.name}</span>
                  </div>
                  <span style={l.badgeStyle}>{l.badge}</span>
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>ชื่อทรัพย์ ({l.code})</label>
                    <input defaultValue={l.title} style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>คำอธิบาย ({l.code})</label>
                    <textarea defaultValue={l.desc} style={{ marginTop: 6, width: '100%', height: 64, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', outline: 'none', resize: 'none' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
