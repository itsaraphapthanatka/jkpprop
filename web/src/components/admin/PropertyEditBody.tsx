'use client';

import { useRouter } from 'next/navigation';

import * as React from 'react';
import { AdminShell } from './AdminShell';
import { DynamicFieldForm } from './DynamicFieldForm';
import { PROPERTY_TYPES, enabledPropertyTypes, propertyType } from '@/lib/propertySchema';
import { useSchemaSync } from '@/lib/schemaSync';
import { apiGet, apiPatch, ApiClientError } from '@/lib/apiClient';
import Link from 'next/link';

/* Fallback type before the record loads (?code= missing → new-form preview);
   the record's own type stays selectable even if disabled for new intake. */
const RECORD_TYPE = 'warehouse';

type ApiProperty = {
  id: string;
  publicCode: string;
  typeKey: string;
  title: string;
  status: string;
  values: Record<string, unknown>;
  i18n?: Record<string, { title: string; description: string }>;
  /** ว่าง/ไม่ว่าง — นำเข้ามา 129 รายการว่าไม่ว่าง แต่ไม่มีที่ให้ทีมแก้กลับ */
  available?: boolean;
};

const editCss = `
@media (max-width:1100px){ #ed-tabbar{position:static !important;top:auto !important;} }
@media (max-width:640px){ #ed-grid{grid-template-columns:1fr !important;} #ed-media{grid-template-columns:repeat(2,1fr) !important;} }
`;

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

/* Both languages arrived pre-filled with a translation of one particular
   warehouse in Bangna, badged "ครบ", on every property in the system. The
   fields are the record's own now, and the badge says what is actually there. */
const transLangs: { key: 'en' | 'zh'; name: string; code: string; flag: { __html: string }; titlePh: string; descPh: string }[] = [
  { key: 'en', name: 'English', code: 'EN', flag: { __html: flagTh }, titlePh: 'Warehouse with office, Bangna', descPh: 'Describe the property in English…' },
  { key: 'zh', name: '中文', code: 'ZH', flag: { __html: flagZh }, titlePh: '带办公室的仓库，邦纳', descPh: '用中文描述该物业…' },
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

  /* the record being edited — loaded from ?code= via GET /api/properties/:code */
  const [record, setRecord] = React.useState<ApiProperty | null>(null);
  const [available, setAvailable] = React.useState(true);
  const [title, setTitle] = React.useState('');
  const [i18n, setI18n] = React.useState<Record<string, { title: string; description: string }>>({});
  const tr = (k: 'en' | 'zh') => i18n[k] ?? { title: '', description: '' };
  const setTr = (k: 'en' | 'zh', patch: Partial<{ title: string; description: string }>) =>
    setI18n((prev) => ({ ...prev, [k]: { ...(prev[k] ?? { title: '', description: '' }), ...patch } }));
  const valsRef = React.useRef<Record<string, unknown>>({});
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  React.useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;
    apiGet<ApiProperty>(`/api/properties/${encodeURIComponent(code)}`)
      .then((p) => {
        setRecord(p);
        setAvailable(p.available !== false);
        setSelType(p.typeKey);
        setTitle(p.title);
        setI18n((p.i18n ?? {}) as Record<string, { title: string; description: string }>);
        valsRef.current = p.values;
      })
      .catch((e) => setNotice({ kind: 'err', text: e instanceof ApiClientError ? e.message : 'โหลดข้อมูลทรัพย์ไม่สำเร็จ' }));
  }, []);

  const router = useRouter();

  const save = async () => {
    if (saving) return;
    if (!record) {
      setNotice({ kind: 'err', text: 'ไม่พบทรัพย์ที่แก้ไข — เปิดหน้านี้จากเมนู "แก้ไขทรัพย์" ในหน้า Properties' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await apiPatch(`/api/properties/${record.id}`, { title, values: valsRef.current, i18n, available });
      /* ลูกค้าแจ้งว่า "กดบันทึกแล้วไม่กลับไปหน้ารวม Property" — เดิมขึ้นแค่คำว่า
         บันทึกแล้วค้างอยู่หน้าเดิม คนแก้ทรัพย์ทีละหลายรายการต้องกดย้อนเองทุกครั้ง */
      setNotice({ kind: 'ok', text: 'บันทึกแล้ว — กำลังกลับไปหน้ารายการทรัพย์' });
      setTimeout(() => router.push('/admin/properties'), 700);
      return;
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่' });
    } finally {
      setSaving(false);
    }
  };

  // Unlike the create form, the initial type here belongs to the EXISTING record.
  // Turning a type off is an intake policy, not a statement that old records of
  // that type are gone — so keep the record's own type in the picker (badged
  // "ปิดอยู่") instead of silently re-typing the property to the first enabled one.
  const recType = record?.typeKey ?? RECORD_TYPE;
  const schemaV = useSchemaSync();
  React.useEffect(() => {
    const en = enabledPropertyTypes();
    const keep = en.some((t) => t.key === recType) ? en : [...en, propertyType(recType)];
    setTypes(keep);
    setOffKeys(keep.filter((t) => !en.some((e) => e.key === t.key)).map((t) => t.key));
  }, [schemaV, recType]);

  const actions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', rowGap: 8 }}>
      {notice && (
        <span role="alert" style={{ fontSize: '11.5px', fontWeight: 600, color: notice.kind === 'ok' ? '#0D6C3B' : '#C0392B', display: 'flex', alignItems: 'center', gap: 5 }}>
          {notice.kind === 'ok' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>}
          {notice.text}
        </span>
      )}
      <Link href="/admin/properties" style={{ height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center' }}>ยกเลิก</Link>
      <div onClick={save} className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>{saving ? 'กำลังบันทึก…' : 'บันทึก'}
      </div>
    </div>
  );

  return (
    <AdminShell active="properties" eyebrow={`Properties / ${record?.publicCode ?? '…'} / แก้ไข`} title="แก้ไขทรัพย์" actions={actions} css={editCss}>
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
            {/* ว่าง/ไม่ว่าง — ทีมกรอกมาในชีตแล้ว หน้าเว็บใช้ตัดสินว่าจะขึ้นป้าย
                "ไม่ว่าง" และเรียงไว้ท้ายรายการหรือไม่ */}
            <div>
              <label style={labelStyle}>สถานะการปล่อย</label>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                {([[true, 'ว่าง'], [false, 'ไม่ว่าง']] as [boolean, string][]).map(([v, label]) => (
                  <div
                    key={label}
                    onClick={() => setAvailable(v)}
                    data-avail={v ? 'yes' : 'no'}
                    data-on={available === v ? '1' : '0'}
                    style={{ height: 40, padding: '0 18px', borderRadius: 9999, cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, border: '1px solid ' + (available === v ? '#0D6C3B' : 'var(--border)'), background: available === v ? '#E8F3EC' : 'var(--surface)', color: available === v ? '#0D6C3B' : 'var(--muted)' }}
                  >
                    {label}
                  </div>
                ))}
              </div>
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
              <span style={{ fontSize: '12.5px', color: 'var(--accent)' }}>รหัสทรัพย์: <code style={{ fontWeight: 700 }}>{record?.publicCode ?? '—'}</code> (แก้ไขไม่ได้ — สร้างจากจังหวัดตอนบันทึกครั้งแรก)</span>
            </div>

            <div>
              <label style={labelStyle}>ชื่อทรัพย์ (ไทย) *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ชื่อทรัพย์" style={{ ...inputBase, fontSize: 14, fontWeight: 600 }} />
            </div>

            {/* schema-driven fields for the selected type — keyed by record id so
                the form remounts with the stored values once the record loads */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>รายละเอียด: {PROPERTY_TYPES.find((p) => p.key === selType)?.label}</div>
                <Link href="/admin/field-builder" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none' }}>ปรับฟิลด์ที่ Field Builder →</Link>
              </div>
              <DynamicFieldForm
                key={record?.id ?? 'new'}
                typeKey={selType}
                code={record?.publicCode}
                initialValues={record?.values}
                onValuesChange={(v) => { valsRef.current = v; }}
              />
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
                  {(() => {
                    const done = !!tr(l.key).title.trim();
                    return <span style={bd(done ? 'ครบ' : 'ยังไม่แปล', done ? '#E8F3EC' : '#FBF3E1', done ? '#0D6C3B' : '#9A741C')}>{done ? 'แปลแล้ว' : 'ยังไม่แปล'}</span>;
                  })()}
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>ชื่อทรัพย์ ({l.code})</label>
                    <input
                      data-trans={`${l.key}:title`}
                      value={tr(l.key).title}
                      onChange={(e) => setTr(l.key, { title: e.target.value })}
                      placeholder={l.titlePh}
                      style={{ marginTop: 6, width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>คำอธิบาย ({l.code})</label>
                    <textarea
                      data-trans={`${l.key}:description`}
                      value={tr(l.key).description}
                      onChange={(e) => setTr(l.key, { description: e.target.value })}
                      placeholder={l.descPh}
                      style={{ marginTop: 6, width: '100%', height: 96, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </AdminShell>
  );
}
