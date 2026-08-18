'use client';

import * as React from 'react';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';
import { apiGet, apiPost, apiPatch, apiDelete, ApiClientError } from '@/lib/apiClient';

/* Ported verbatim from AdminGeography.dc.html — interactive geography
   admin: a two-tab topbar (พื้นที่ 3 ระดับ / นิคมอุตสาหกรรม) that switches
   between a 3-level cascade (จังหวัด → อำเภอ → ตำบล) and an industrial-zones
   table with per-row status toggles. The topbar tabs + add button share the
   view state with the body, so the whole page (incl. AdminShell) lives here. */

/* A node the page can act on: an id to send back, and how many properties
   actually sit in it. The page used to render names only, so nothing on it
   could be renamed, removed, or checked against the inventory. */
type GeoNode = { id: string; name: string; en: string; zh: string; count: number };
type ProvData = { id: string; th: string; en: string; zh: string; code: string; count: number; districts: GeoNode[] };
type ZoneData = { id: string; name: string; en: string; zh: string; type: string; province: string; count: number; active: boolean };
type Missing = { prov: { name: string; count: number }[]; dist: { name: string; count: number }[]; sub: { name: string; count: number }[] };
type Lvl = 'prov' | 'dist' | 'sub';

/* No demo tree here on purpose. This page shipped with six invented provinces,
   their districts, and six industrial estates carrying property counts
   ("แหลมฉบัง 218") that were typed into the mock and never came from anything.
   They only showed while the real tree was empty — which is exactly when
   somebody is deciding whether the page works. */

const TABS: { key: 'geo' | 'zones'; label: string }[] = [
  { key: 'geo', label: 'พื้นที่ 3 ระดับ' },
  { key: 'zones', label: 'นิคมอุตสาหกรรม' },
];

const geoCss = `
@media (max-width:1100px){ #geo-cols{grid-template-columns:1fr !important;} }
@media (max-width:640px){
  #admin-main > main{ padding:16px 14px 44px !important; }
  #geo-actions{flex-wrap:wrap !important;width:100% !important;row-gap:8px !important;}
  /* zones table → stacked cards */
  #geo-zone-scroll{ overflow-x:visible !important; }
  #geo-zone-table{ min-width:0 !important; }
  #geo-zone-table thead{ display:none; }
  #geo-zone-table tbody{ display:block; padding:10px; }
  #geo-zone-table tr{ display:block; border:1px solid var(--border) !important; border-radius:12px; padding:2px; margin-bottom:10px; }
  #geo-zone-table td{ display:flex !important; align-items:center; justify-content:space-between; gap:12px; padding:9px 12px !important; text-align:left !important; }
  #geo-zone-table td[data-label]::before{ content:attr(data-label); font-size:11px; font-weight:700; color:var(--muted2); }
  #geo-zone-table td:first-child{ border-bottom:1px solid var(--border); }
}
@media (max-width:480px){
  #geo-add-btn{ flex:1 1 100% !important; justify-content:center; }
}
.geo-zone-row:hover{background:var(--tint);}
`;

const cardStyle: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' };
const cardHead: React.CSSProperties = { padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const cardTitle: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: 'var(--text)' };
const cardCount: React.CSSProperties = { fontSize: 11, color: 'var(--muted3)' };
const th: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase' };
const thc: React.CSSProperties = { ...th, textAlign: 'center' };
const gLabel: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' };
const gInput: React.CSSProperties = { width: '100%', height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13.5px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };
const gSelect: React.CSSProperties = { ...gInput, cursor: 'pointer' };
const rowBtn: React.CSSProperties = { width: 26, height: 26, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 };
const pill = (n: number): React.CSSProperties => ({ height: 20, minWidth: 24, padding: '0 7px', borderRadius: 9999, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: n ? 'var(--tint)' : 'transparent', color: n ? '#0D6C3B' : 'var(--muted3)', border: '1px solid ' + (n ? 'transparent' : 'var(--border)') });
const EMPTY: React.CSSProperties = { padding: '22px 16px', fontSize: 12.5, color: 'var(--muted3)', lineHeight: 1.7 };
/* บรรทัดใต้ชื่อไทย บอกว่ามี EN/ZH แล้วหรือยัง — หน้านี้เคยบอกว่ามีสามภาษา
   ต่อระดับ โดยไม่มีอะไรให้ดูเลยว่าระดับไหนแปลแล้วบ้าง */
const langLine = (n: { en?: string; zh?: string }, fallback = '') => {
  const parts = [n.en?.trim() || '', n.zh?.trim() || ''].filter(Boolean);
  if (parts.length === 2) return parts.join(' · ');
  if (parts.length === 1) return <>{parts[0]} · <span style={{ color: '#C0392B' }}>{n.en?.trim() ? 'ยังไม่มี 中文' : 'ยังไม่มี EN'}</span></>;
  return <span style={{ color: '#C0392B' }}>{fallback ? 'ยังไม่มี EN / 中文' : 'ยังไม่มี EN / 中文'}</span>;
};
const PencilIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>;
const TrashIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>;

export function GeographyBody() {
  const [view, setView] = React.useState<'geo' | 'zones'>('geo');
  const [prov, setProv] = React.useState(0);
  const [dist, setDist] = React.useState(0);

  // the tree as the database has it — no stand-in while it loads, because a
  // stand-in is what made this page look finished when it was not
  const [provinces, setProvinces] = React.useState<ProvData[]>([]);
  const [subMap, setSubMap] = React.useState<Record<string, GeoNode[]>>({});
  const [zones, setZones] = React.useState<ZoneData[]>([]);
  const [missing, setMissing] = React.useState<Missing>({ prov: [], dist: [], sub: [] });
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [addError, setAddError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState('');

  const reload = React.useCallback(async () => {
    try {
      const g = await apiGet<{ provinces: ProvData[]; subMap: Record<string, GeoNode[]>; zones: ZoneData[]; missing: Missing }>('/api/geography');
      setProvinces(Array.isArray(g.provinces) ? g.provinces : []);
      setSubMap(g.subMap || {});
      setZones(Array.isArray(g.zones) ? g.zones : []);
      setMissing(g.missing ?? { prov: [], dist: [], sub: [] });
      setProv((p) => (p < (g.provinces?.length ?? 0) ? p : 0));
      setDist(0);
    } catch { /* keep what is on screen (§2.2) */ }
    finally { setLoaded(true); }
  }, []);
  React.useEffect(() => { void reload(); }, [reload]);

  /* Build the tree from the properties already in the system. The addresses
     are in there 393 times over; typing them again by hand is not a plan. */
  const importFromStock = async () => {
    if (busy) return;
    setBusy('import');
    setNotice('');
    try {
      const r = await apiPost<{ added: { prov: string[]; dist: string[]; sub: string[] }; skipped: string[] }>('/api/geography/import', {});
      const n = r.added.prov.length + r.added.dist.length + r.added.sub.length;
      await reload();
      setNotice(
        n
          ? `ดึงจากทรัพย์แล้ว — จังหวัด ${r.added.prov.length} · เขต/อำเภอ ${r.added.dist.length} · แขวง/ตำบล ${r.added.sub.length}` +
            (r.skipped.length ? ` · ข้าม ${r.skipped.length} รายการที่ยังไม่รู้ว่าอยู่ใต้พื้นที่ไหน` : '')
          : 'ไม่มีอะไรให้เพิ่ม — ทุกพื้นที่ที่ทรัพย์ใช้อยู่มีในระบบแล้ว',
      );
    } catch (e) {
      setNotice(e instanceof ApiClientError ? e.message : 'ดึงข้อมูลไม่สำเร็จ');
    } finally { setBusy(''); }
  };

  /* หน้านี้เขียนไว้เองว่า "แต่ละระดับมี 3 ภาษา (TH/EN/ZH)" แต่มีช่องอังกฤษ
     ช่องเดียว เฉพาะตอนเพิ่มจังหวัด และไม่มีอะไรอ่านค่านั้นเลย กล่องนี้คือที่ที่
     คำโฆษณานั้นกลายเป็นของจริง — แก้แล้วหน้า /en กับ /zh เปลี่ยนตาม */
  type EditTarget = { id: string; th: string; en: string; zh: string; code?: string; what: string };
  const [edit, setEdit] = React.useState<EditTarget | null>(null);

  const saveEdit = async () => {
    if (!edit || saving) return;
    setSaving(true);
    setNotice('');
    try {
      await apiPatch(`/api/geography/${edit.id}`, {
        th: edit.th.trim(), en: edit.en.trim(), zh: edit.zh.trim(),
        ...(edit.code !== undefined ? { code: edit.code.trim() } : {}),
      });
      await reload();
      setEdit(null);
      setNotice(`บันทึก "${edit.th.trim()}" แล้ว — ชื่อ EN/ZH นี้จะขึ้นบนหน้าเว็บภาษานั้นทันที`);
    } catch (e) {
      setNotice(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  const remove = async (node: { id: string; name: string; count?: number }, what: string) => {
    if (!window.confirm(`ลบ${what} "${node.name}" ?`)) return;
    setBusy(node.id);
    setNotice('');
    try {
      await apiDelete(`/api/geography/${node.id}`);
      await reload();
      setNotice(`ลบ "${node.name}" แล้ว`);
    } catch (e) {
      // ปฏิเสธเพราะมีของอยู่ข้างใน — บอกไปตรง ๆ ว่าติดอะไร
      setNotice(e instanceof ApiClientError ? e.message : 'ลบไม่สำเร็จ');
    } finally { setBusy(''); }
  };

  const toggleZone = async (z: ZoneData) => {
    setBusy(z.id);
    try {
      await apiPatch(`/api/geography/${z.id}`, { active: !z.active });
      setZones((list) => list.map((x) => (x.id === z.id ? { ...x, active: !x.active } : x)));
    } catch (e) {
      setNotice(e instanceof ApiClientError ? e.message : 'บันทึกสถานะไม่สำเร็จ');
    } finally { setBusy(''); }
  };

  // add-area / add-zone modal
  const emptyForm = { th: '', en: '', zh: '', code: '', zname: '', ztype: 'นิคมฯ', zprov: '', zcount: '' };
  const [addOpen, setAddOpen] = React.useState(false);
  const [level, setLevel] = React.useState<Lvl>('prov');
  const [form, setForm] = React.useState(emptyForm);
  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // an empty tree is a real state now, so every derived value tolerates it
  const curProvObj = provinces[prov] as ProvData | undefined;
  const distList = curProvObj?.districts ?? [];
  const curDist = distList[dist] as GeoNode | undefined;
  const subList = (curDist ? subMap[curDist.name] : undefined) ?? [];
  const addLabel = view === 'geo' ? 'เพิ่มพื้นที่' : 'เพิ่มนิคม';

  const openAdd = () => { setForm({ ...emptyForm, zprov: provinces[0]?.th || '' }); setLevel('prov'); setAddOpen(true); };
  const geoValid = level === 'prov' ? !!form.th.trim()
    : level === 'dist' ? !!curProvObj && !!form.th.trim()
      : !!curDist && !!form.th.trim();
  const canSubmit = view === 'zones' ? !!form.zname.trim() : geoValid;
  // persist via POST /api/geography, then re-pull the tree (pending + error
  // state per FRONTEND_API_SPEC §2.3)
  const submitAdd = async () => {
    if (saving) return;
    const payload =
      view === 'zones'
        ? { level: 'zone', th: form.zname.trim(), type: form.ztype, parent: form.zprov }
        : level === 'prov'
          ? { level: 'prov', th: form.th.trim(), en: form.en.trim(), code: (form.code.trim() || form.th.trim().slice(0, 3)).toUpperCase() }
          : level === 'dist'
            ? { level: 'dist', th: form.th.trim(), parent: provinces[prov]?.th || '' }
            : { level: 'sub', th: form.th.trim(), parent: curDist?.name || '' };
    if (!payload.th) return;
    setSaving(true);
    setAddError('');
    try {
      await apiPost('/api/geography', payload);
      await reload();
      setAddOpen(false);
      setForm(emptyForm);
    } catch (e) {
      setAddError(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  const actions = (
    <div id="geo-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, padding: 4, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {TABS.map((t) => {
          const on = view === t.key;
          return (
            <div key={t.key} onClick={() => setView(t.key)} style={{ height: 32, padding: '0 16px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', background: on ? '#273c33' : 'transparent', color: on ? '#fff' : 'var(--muted)' }}>{t.label}</div>
          );
        })}
      </div>
      {view === 'geo' && (
        <button type="button" id="geo-import-btn" onClick={() => void importFromStock()} disabled={busy === 'import'}
          title="สร้างจังหวัด/เขต/แขวง จากที่อยู่ของทรัพย์ที่บันทึกไว้แล้ว"
          style={{ height: 40, padding: '0 16px', borderRadius: 9999, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: busy === 'import' ? 'default' : 'pointer', whiteSpace: 'nowrap', opacity: busy === 'import' ? 0.6 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></svg>
          {busy === 'import' ? 'กำลังดึง…' : 'ดึงจากทรัพย์ที่มีอยู่'}
        </button>
      )}
      <div id="geo-add-btn" onClick={openAdd} className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>{addLabel}
      </div>
    </div>
  );

  return (
    <AdminShell active="seo" eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Geography' }]} />} title="พื้นที่ & นิคมอุตสาหกรรม" actions={actions} css={geoCss}>
      {notice && (
        <div id="geo-notice" role="status" style={{ margin: '0 0 14px', padding: '11px 14px', borderRadius: 12, background: 'var(--tint)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>
          {notice}
        </div>
      )}

      {/* GEO CASCADE VIEW */}
      {view === 'geo' && (
        <>
          {/* Places the inventory uses that the tree has never heard of. This
              is the difference between a form and a page worth opening: it
              says what is wrong right now, with the count that proves it. */}
          {loaded && (missing.prov.length + missing.dist.length + missing.sub.length > 0) && (
            <div id="geo-missing" style={{ margin: '0 0 16px', padding: '13px 15px', borderRadius: 12, border: '1px solid rgba(192,57,43,.25)', background: 'rgba(192,57,43,.06)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#C0392B', marginBottom: 6 }}>
                ทรัพย์ใช้พื้นที่ที่ยังไม่มีในระบบ — จังหวัด {missing.prov.length} · เขต/อำเภอ {missing.dist.length} · แขวง/ตำบล {missing.sub.length}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[...missing.prov, ...missing.dist, ...missing.sub].slice(0, 24).map((m) => (
                  <span key={m.name} style={{ height: 22, padding: '0 9px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {m.name}<b style={{ color: 'var(--muted3)' }}>{m.count}</b>
                  </span>
                ))}
                {missing.prov.length + missing.dist.length + missing.sub.length > 24 && (
                  <span style={{ fontSize: 11, color: 'var(--muted3)', alignSelf: 'center' }}>และอีก {missing.prov.length + missing.dist.length + missing.sub.length - 24} รายการ</span>
                )}
              </div>
              <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--muted2)' }}>กด “ดึงจากทรัพย์ที่มีอยู่” เพื่อเพิ่มทั้งหมดนี้เข้าระบบ</div>
            </div>
          )}
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            ลำดับชั้น 3 ระดับ: จังหวัด → เขต/อำเภอ → แขวง/ตำบล · แต่ละระดับตั้งชื่อได้ 3 ภาษา (TH/EN/中文) และชื่อที่ตั้งไว้ขึ้นบนหน้าเว็บภาษานั้นจริง · รายการนี้เป็นตัวช่วยเติมในฟอร์มทรัพย์
          </p>
          <div id="geo-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
            {/* Provinces */}
            <div style={cardStyle}>
              <div style={cardHead}><span style={cardTitle}>จังหวัด</span><span style={cardCount}>{provinces.length}</span></div>
              <div className="a-scroll" style={{ maxHeight: 560, overflowY: 'auto' }}>
                {provinces.map((p, i) => {
                  const active = i === prov;
                  return (
                    <div key={p.id} data-geo-prov={p.th} onClick={() => { setProv(i); setDist(0); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .15s', background: active ? 'var(--tint)' : 'transparent', borderLeft: '3px solid ' + (active ? '#0D6C3B' : 'transparent') }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.th}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted3)' }}>{langLine(p, p.th)}{p.code ? <> · <code style={{ color: '#0D6C3B' }}>{p.code}</code></> : null}</div>
                      </div>
                      <span title={`ทรัพย์ในจังหวัดนี้ ${p.count} รายการ`} style={pill(p.count)}>{p.count}</span>
                      <button type="button" title="แก้ชื่อ" data-geo-edit={p.th} onClick={(e) => { e.stopPropagation(); setEdit({ id: p.id, th: p.th, en: p.en, zh: p.zh, code: p.code, what: 'จังหวัด' }); }} style={rowBtn}><PencilIcon /></button>
                      <button type="button" title="ลบ" data-geo-del={p.th} onClick={(e) => { e.stopPropagation(); void remove({ id: p.id, name: p.th, count: p.count }, 'จังหวัด'); }} style={{ ...rowBtn, color: '#C0392B' }}><TrashIcon /></button>
                    </div>
                  );
                })}
                {loaded && !provinces.length && (
                  <div style={EMPTY}>
                    ยังไม่มีจังหวัดในระบบ<br />
                    กด <b>ดึงจากทรัพย์ที่มีอยู่</b> เพื่อสร้างจากที่อยู่ของทรัพย์ที่บันทึกไว้แล้ว หรือกด <b>เพิ่มพื้นที่</b> เพื่อกรอกเอง
                  </div>
                )}
              </div>
            </div>
            {/* Districts */}
            <div style={cardStyle}>
              <div style={cardHead}><span style={cardTitle}>เขต / อำเภอ{curProvObj ? ` · ${curProvObj.th}` : ''}</span><span style={cardCount}>{distList.length}</span></div>
              <div className="a-scroll" style={{ maxHeight: 560, overflowY: 'auto' }}>
                {distList.map((d, i) => {
                  const active = i === dist;
                  return (
                    <div key={d.id} data-geo-dist={d.name} onClick={() => setDist(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .15s', background: active ? 'var(--tint)' : 'transparent', borderLeft: '3px solid ' + (active ? '#0D6C3B' : 'transparent') }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted3)' }}>{langLine(d)}</div>
                      </div>
                      <span title={`ทรัพย์ในเขต/อำเภอนี้ ${d.count} รายการ`} style={pill(d.count)}>{d.count}</span>
                      <button type="button" title="แก้ชื่อ" onClick={(e) => { e.stopPropagation(); setEdit({ id: d.id, th: d.name, en: d.en, zh: d.zh, what: 'เขต/อำเภอ' }); }} style={rowBtn}><PencilIcon /></button>
                      <button type="button" title="ลบ" onClick={(e) => { e.stopPropagation(); void remove(d, 'เขต/อำเภอ'); }} style={{ ...rowBtn, color: '#C0392B' }}><TrashIcon /></button>
                    </div>
                  );
                })}
                {loaded && !!provinces.length && !distList.length && (
                  <div style={EMPTY}>ยังไม่มีเขต/อำเภอใน <b>{curProvObj?.th}</b></div>
                )}
              </div>
            </div>
            {/* Subdistricts */}
            <div style={cardStyle}>
              <div style={cardHead}><span style={cardTitle}>แขวง / ตำบล{curDist ? ` · ${curDist.name}` : ''}</span><span style={cardCount}>{subList.length}</span></div>
              <div className="a-scroll" style={{ maxHeight: 560, overflowY: 'auto' }}>
                {subList.map((sd) => (
                  <div key={sd.id} data-geo-sub={sd.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sd.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted3)' }}>{langLine(sd)}</div>
                    </div>
                    <span title={`ทรัพย์ในแขวง/ตำบลนี้ ${sd.count} รายการ`} style={pill(sd.count)}>{sd.count}</span>
                    <button type="button" title="แก้ชื่อ" onClick={() => setEdit({ id: sd.id, th: sd.name, en: sd.en, zh: sd.zh, what: 'แขวง/ตำบล' })} style={rowBtn}><PencilIcon /></button>
                    <button type="button" title="ลบ" onClick={() => void remove(sd, 'แขวง/ตำบล')} style={{ ...rowBtn, color: '#C0392B' }}><TrashIcon /></button>
                  </div>
                ))}
                {loaded && !!distList.length && !subList.length && (
                  <div style={EMPTY}>ยังไม่มีแขวง/ตำบลใน <b>{curDist?.name}</b></div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ZONES VIEW */}
      {view === 'zones' && (
        <div style={cardStyle}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', flex: 1 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input placeholder="ค้นหานิคม" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: '12.5px', color: 'var(--text)', flex: 1, minWidth: 0 }} />
            </div>
          </div>
          <div id="geo-zone-scroll" style={{ overflowX: 'auto' }} className="a-scroll">
            <table id="geo-zone-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={th}>นิคมอุตสาหกรรม</th>
                  <th style={th}>ประเภท</th>
                  <th style={th}>จังหวัด</th>
                  <th style={thc}>ทรัพย์</th>
                  <th style={thc}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => {
                  const on = z.active;
                  return (
                    <tr key={z.id} data-geo-zone={z.name} className="geo-zone-row" style={{ borderTop: '1px solid var(--border)', transition: 'background .15s' }}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 21h20" /><path d="M4 21V10l5 3V10l5 3V10l5 3v8" /></svg>
                          </div>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{z.name}</span>
                        </div>
                      </td>
                      <td data-label="ประเภท" style={{ padding: '13px 16px' }}>
                        <span style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text)', display: 'inline-flex', alignItems: 'center' }}>{z.type}</span>
                      </td>
                      <td data-label="จังหวัด" style={{ padding: '13px 16px', fontSize: '12.5px', color: 'var(--muted)' }}>{z.province}</td>
                      <td data-label="ทรัพย์" style={{ padding: '13px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{z.count}</td>
                      <td data-label="สถานะ" style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <div role="switch" aria-checked={on} title={on ? 'เปิดใช้อยู่' : 'ปิดอยู่'} onClick={() => void toggleZone(z)} style={{ width: 40, height: 23, borderRadius: 9999, cursor: 'pointer', position: 'relative', transition: 'background .2s', background: on ? '#0D6C3B' : 'var(--border)', display: 'inline-block' }}>
                          <div style={{ position: 'absolute', top: '2.5px', left: on ? '19px' : '2.5px', width: 18, height: 18, borderRadius: 9999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loaded && !zones.length && (
              <div style={EMPTY}>ยังไม่มีนิคม/เขตส่งเสริมในระบบ — กด <b>เพิ่มนิคม</b> ที่มุมขวาบน</div>
            )}
          </div>
        </div>
      )}

      {/* EDIT MODAL — ชื่อสามภาษาต่อหนึ่งพื้นที่ */}
      {edit && (
        <div id="geo-edit-overlay" onClick={() => setEdit(null)} style={{ position: 'fixed', inset: 0, zIndex: 810, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>แก้ไข{edit.what}</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 2 }}>ชื่อ EN / 中文 ที่ใส่ตรงนี้ จะขึ้นบนหน้าเว็บภาษานั้นแทนคำแปลอัตโนมัติ</div>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={gLabel}>ชื่อไทย *</label>
                <input data-geo-edit-th value={edit.th} onChange={(e) => setEdit({ ...edit, th: e.target.value })} style={gInput} autoFocus />
              </div>
              <div>
                <label style={gLabel}>English</label>
                <input data-geo-edit-en value={edit.en} onChange={(e) => setEdit({ ...edit, en: e.target.value })} placeholder="e.g. Bang Phli" style={gInput} />
              </div>
              <div>
                <label style={gLabel}>中文</label>
                <input data-geo-edit-zh value={edit.zh} onChange={(e) => setEdit({ ...edit, zh: e.target.value })} placeholder="เช่น 北榄 · เว้นว่างได้ ระบบจะใช้ชื่อโรมันแทน" style={gInput} />
              </div>
              {edit.code !== undefined && (
                <div>
                  <label style={gLabel}>รหัสจังหวัด (ใช้ในรหัสทรัพย์)</label>
                  <input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value })} maxLength={4} style={{ ...gInput, textTransform: 'uppercase' }} />
                </div>
              )}
              <div style={{ fontSize: 11.5, color: 'var(--muted3)', lineHeight: 1.6 }}>
                เปลี่ยนชื่อไทยไม่ได้ไปแก้ที่อยู่ของทรัพย์ที่บันทึกไว้แล้ว — ทรัพย์เก่ายังเก็บชื่อเดิมของมันเอง
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setEdit(null)} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</button>
              <button type="button" id="geo-edit-save" onClick={() => void saveEdit()} disabled={saving || !edit.th.trim()}
                style={{ height: 44, padding: '0 26px', borderRadius: 9999, border: 0, background: edit.th.trim() && !saving ? '#0D6C3B' : 'var(--border)', color: edit.th.trim() && !saving ? '#fff' : 'var(--muted3)', fontFamily: 'inherit', fontSize: '13.5px', fontWeight: 700, cursor: edit.th.trim() && !saving ? 'pointer' : 'default' }}>
                {saving ? 'กำลังบันทึก…' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD AREA / ZONE MODAL — centered popup */}
      {addOpen && (
        <div onClick={() => setAddOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{view === 'zones' ? 'เพิ่มนิคมอุตสาหกรรม' : 'เพิ่มพื้นที่'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 2 }}>{view === 'zones' ? 'เพิ่มนิคม / เขตส่งเสริมใหม่' : 'เลือกระดับแล้วกรอกชื่อ (รองรับ cascade)'}</div>
              </div>
              <div onClick={() => setAddOpen(false)} style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </div>
            </div>
            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {view === 'geo' ? (
                <>
                  <div>
                    <label style={gLabel}>ระดับพื้นที่</label>
                    <div style={{ display: 'flex', gap: 6, background: 'var(--bg)', padding: 4, borderRadius: 12 }}>
                      {([['prov', 'จังหวัด'], ['dist', 'อำเภอ'], ['sub', 'ตำบล']] as [Lvl, string][]).map(([k, l]) => (
                        <div key={k} onClick={() => setLevel(k)} style={{ flex: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', background: level === k ? '#273c33' : 'transparent', color: level === k ? '#fff' : 'var(--muted)' }}>{l}</div>
                      ))}
                    </div>
                  </div>
                  {level !== 'prov' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderRadius: 11, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                      {level === 'dist' ? (curProvObj ? <span>เพิ่มเขต/อำเภอในจังหวัด: <b>{curProvObj.th}</b></span> : <span>ยังไม่มีจังหวัดให้เลือก — เพิ่มจังหวัดก่อน</span>) : (curDist ? <span>เพิ่มแขวง/ตำบลในเขต/อำเภอ: <b>{curDist.name}</b></span> : <span>ยังไม่มีเขต/อำเภอให้เลือก — เพิ่มก่อน</span>)}
                    </div>
                  )}
                  <div>
                    <label style={gLabel}>{level === 'prov' ? 'ชื่อจังหวัด (ไทย)' : level === 'dist' ? 'ชื่ออำเภอ (ไทย)' : 'ชื่อตำบล (ไทย)'} *</label>
                    <input value={form.th} onChange={(e) => setF('th', e.target.value)} placeholder={level === 'prov' ? 'เช่น สมุทรสาคร' : level === 'dist' ? 'เช่น กระทุ่มแบน' : 'เช่น ท่าทราย'} style={gInput} autoFocus />
                  </div>
                  {/* ทุกระดับใส่ได้ครบสามภาษา ตามที่หัวหน้าเพจเขียนไว้ตั้งแต่แรก */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                    <div><label style={gLabel}>English</label><input value={form.en} onChange={(e) => setF('en', e.target.value)} placeholder="e.g. Samut Sakhon" style={gInput} /></div>
                    <div><label style={gLabel}>中文</label><input value={form.zh} onChange={(e) => setF('zh', e.target.value)} placeholder="เว้นว่างได้" style={gInput} /></div>
                    {level === 'prov' && (
                      <div><label style={gLabel}>รหัส (Code)</label><input value={form.code} onChange={(e) => setF('code', e.target.value)} placeholder="เช่น SKN" maxLength={4} style={{ ...gInput, textTransform: 'uppercase' }} /></div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div><label style={gLabel}>ชื่อนิคม / เขต *</label><input value={form.zname} onChange={(e) => setF('zname', e.target.value)} placeholder="เช่น นิคมอุตสาหกรรมบางปะอิน" style={gInput} autoFocus /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                    <div><label style={gLabel}>ประเภท</label><select value={form.ztype} onChange={(e) => setF('ztype', e.target.value)} style={gSelect}>{['นิคมฯ', 'นิคมฯ + ท่าเรือ', 'เขตส่งเสริม', 'สวนอุตสาหกรรม'].map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div><label style={gLabel}>จังหวัด</label><select value={form.zprov} onChange={(e) => setF('zprov', e.target.value)} style={gSelect}>{provinces.map((p) => <option key={p.id} value={p.th}>{p.th}</option>)}</select></div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted3)', lineHeight: 1.6 }}>
                    จำนวนทรัพย์นับจากทรัพย์ที่เผยแพร่อยู่ในจังหวัดนั้นให้เอง — ช่องกรอกเลขเองถูกเอาออก เพราะตัวเลขที่พิมพ์เข้าไปไม่ได้ผูกกับอะไร
                  </div>
                </>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <div onClick={() => setAddOpen(false)} style={{ height: 44, padding: '0 22px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div onClick={submitAdd} style={{ height: 44, padding: '0 26px', borderRadius: 9999, background: canSubmit && !saving ? '#0D6C3B' : 'var(--border)', color: canSubmit && !saving ? '#fff' : 'var(--muted3)', display: 'flex', alignItems: 'center', gap: 7, fontSize: '13.5px', fontWeight: 700, cursor: canSubmit && !saving ? 'pointer' : 'default' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>{saving ? 'กำลังบันทึก…' : view === 'zones' ? 'เพิ่มนิคม' : 'เพิ่มพื้นที่'}
              </div>
              {addError && <div role="alert" style={{ marginTop: 10, fontSize: 12.5, color: '#C0392B', width: '100%' }}>{addError}</div>}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
