'use client';

import * as React from 'react';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';
import { apiGet, apiPost, ApiClientError } from '@/lib/apiClient';

/* Ported verbatim from AdminGeography.dc.html — interactive geography
   admin: a two-tab topbar (พื้นที่ 3 ระดับ / นิคมอุตสาหกรรม) that switches
   between a 3-level cascade (จังหวัด → อำเภอ → ตำบล) and an industrial-zones
   table with per-row status toggles. The topbar tabs + add button share the
   view state with the body, so the whole page (incl. AdminShell) lives here. */

type ProvData = { th: string; en: string; code: string; districts: string[] };
type Lvl = 'prov' | 'dist' | 'sub';

const PROV_DATA: ProvData[] = [
  { th: 'สมุทรปราการ', en: 'Samut Prakan', code: 'SPK', districts: ['บางพลี', 'บางเสาธง', 'เมืองสมุทรปราการ', 'พระประแดง'] },
  { th: 'ชลบุรี', en: 'Chonburi', code: 'CBI', districts: ['ศรีราชา', 'บางละมุง', 'เมืองชลบุรี', 'พานทอง'] },
  { th: 'ระยอง', en: 'Rayong', code: 'RYG', districts: ['นิคมพัฒนา', 'ปลวกแดง', 'บ้านค่าย'] },
  { th: 'พระนครศรีอยุธยา', en: 'Ayutthaya', code: 'AYA', districts: ['วังน้อย', 'อุทัย', 'บางปะอิน'] },
  { th: 'ปทุมธานี', en: 'Pathum Thani', code: 'PTE', districts: ['คลองหลวง', 'ลำลูกกา', 'ธัญบุรี'] },
  { th: 'ฉะเชิงเทรา', en: 'Chachoengsao', code: 'CCO', districts: ['บางปะกง', 'แปลงยาว', 'เมืองฉะเชิงเทรา'] },
];

const SUB_MAP: Record<string, string[]> = {
  'บางพลี': ['บางพลีใหญ่', 'บางแก้ว', 'ราชาเทวะ', 'หนองปรือ'],
  'ศรีราชา': ['สุรศักดิ์', 'ทุ่งสุขลา', 'บึง', 'หนองขาม'],
  'นิคมพัฒนา': ['มะขามคู่', 'นิคมพัฒนา', 'พนานิคม'],
  'วังน้อย': ['ลำตาเสา', 'บ่อตาโล่', 'ชะแมบ'],
  'คลองหลวง': ['คลองหนึ่ง', 'คลองสอง', 'คลองสาม'],
  'บางปะกง': ['บางปะกง', 'ท่าสะอ้าน', 'บางวัว'],
};

const ZONE_DATA: { name: string; type: string; province: string; count: string }[] = [
  { name: 'นิคมอุตสาหกรรมบางปู', type: 'นิคมฯ', province: 'สมุทรปราการ', count: '142' },
  { name: 'นิคมอุตสาหกรรมแหลมฉบัง', type: 'นิคมฯ + ท่าเรือ', province: 'ชลบุรี', count: '218' },
  { name: 'นิคมอุตสาหกรรมอมตะซิตี้', type: 'นิคมฯ', province: 'ระยอง', count: '186' },
  { name: 'เขตส่งเสริม EEC (มาบตาพุด)', type: 'เขตส่งเสริม', province: 'ระยอง', count: '94' },
  { name: 'นิคมอุตสาหกรรมนวนคร', type: 'นิคมฯ', province: 'ปทุมธานี', count: '128' },
  { name: 'สวนอุตสาหกรรมโรจนะ', type: 'สวนอุตสาหกรรม', province: 'อยุธยา', count: '156' },
];

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

export function GeographyBody() {
  const [view, setView] = React.useState<'geo' | 'zones'>('geo');
  const [prov, setProv] = React.useState(0);
  const [dist, setDist] = React.useState(0);
  const [zoneOn, setZoneOn] = React.useState<Record<string, boolean>>({ z0: true, z1: true, z2: true, z3: false, z4: true, z5: true });

  // editable data — starts from the porting-era constants (SSR-safe), then
  // replaced by GET /api/geography once mounted
  const [provinces, setProvinces] = React.useState<ProvData[]>(PROV_DATA);
  const [subMap, setSubMap] = React.useState<Record<string, string[]>>(SUB_MAP);
  const [zones, setZones] = React.useState(ZONE_DATA);
  const [saving, setSaving] = React.useState(false);
  const [addError, setAddError] = React.useState('');

  const reload = React.useCallback(async () => {
    try {
      const g = await apiGet<{ provinces: ProvData[]; subMap: Record<string, string[]>; zones: typeof ZONE_DATA }>('/api/geography');
      if (Array.isArray(g.provinces) && g.provinces.length) {
        setProvinces(g.provinces);
        setSubMap(g.subMap || {});
        setZones(Array.isArray(g.zones) ? g.zones : []);
        setProv((p) => (p < g.provinces.length ? p : 0));
        setDist(0);
      }
    } catch { /* keep local data (§2.2) */ }
  }, []);
  React.useEffect(() => { void reload(); }, [reload]);

  // add-area / add-zone modal
  const emptyForm = { th: '', en: '', code: '', zname: '', ztype: 'นิคมฯ', zprov: PROV_DATA[0].th, zcount: '' };
  const [addOpen, setAddOpen] = React.useState(false);
  const [level, setLevel] = React.useState<Lvl>('prov');
  const [form, setForm] = React.useState(emptyForm);
  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const curProvObj = provinces[prov];
  const distList = curProvObj.districts;
  const curDist = distList[dist];
  const subList = subMap[curDist] || ['(ยังไม่มีข้อมูลตำบล)'];
  const addLabel = view === 'geo' ? 'เพิ่มพื้นที่' : 'เพิ่มนิคม';

  const openAdd = () => { setForm({ ...emptyForm, zprov: provinces[0]?.th || '' }); setLevel('prov'); setAddOpen(true); };
  const geoValid = level === 'sub' ? !!curDist && !!form.th.trim() : !!form.th.trim();
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
            : { level: 'sub', th: form.th.trim(), parent: curDist || '' };
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
      <div id="geo-add-btn" onClick={openAdd} className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>{addLabel}
      </div>
    </div>
  );

  return (
    <AdminShell active="seo" eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Geography' }]} />} title="พื้นที่ & นิคมอุตสาหกรรม" actions={actions} css={geoCss}>
      {/* GEO CASCADE VIEW */}
      {view === 'geo' && (
        <>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            ลำดับชั้น 3 ระดับ: จังหวัด → อำเภอ → ตำบล · แต่ละระดับมี 3 ภาษา (TH/EN/ZH) · ใช้ cascade ในทุกฟอร์ม
          </p>
          <div id="geo-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
            {/* Provinces */}
            <div style={cardStyle}>
              <div style={cardHead}><span style={cardTitle}>จังหวัด</span><span style={cardCount}>{77 + (provinces.length - PROV_DATA.length)}</span></div>
              <div className="a-scroll" style={{ maxHeight: 560, overflowY: 'auto' }}>
                {provinces.map((p, i) => {
                  const active = i === prov;
                  return (
                    <div key={p.code} onClick={() => { setProv(i); setDist(0); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .15s', background: active ? 'var(--tint)' : 'transparent', borderLeft: '3px solid ' + (active ? '#0D6C3B' : 'transparent') }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.th}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted3)' }}>{p.en} · <code style={{ color: '#0D6C3B' }}>{p.code}</code></div>
                      </div>
                      {active && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Districts */}
            <div style={cardStyle}>
              <div style={cardHead}><span style={cardTitle}>อำเภอ · {curProvObj.th}</span><span style={cardCount}>{distList.length}</span></div>
              <div className="a-scroll" style={{ maxHeight: 560, overflowY: 'auto' }}>
                {distList.map((d, i) => {
                  const active = i === dist;
                  return (
                    <div key={d} onClick={() => setDist(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .15s', background: active ? 'var(--tint)' : 'transparent', borderLeft: '3px solid ' + (active ? '#0D6C3B' : 'transparent') }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted3)' }} />
                      </div>
                      {active && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Subdistricts */}
            <div style={cardStyle}>
              <div style={cardHead}><span style={cardTitle}>ตำบล · {curDist}</span><span style={cardCount}>{subList.length}</span></div>
              <div className="a-scroll" style={{ maxHeight: 560, overflowY: 'auto' }}>
                {subList.map((s, i) => (
                  <div key={s + i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted3)' }} />
                  </div>
                ))}
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
                {zones.map((z, i) => {
                  const key = 'z' + i;
                  const on = zoneOn[key] !== false;
                  return (
                    <tr key={key} className="geo-zone-row" style={{ borderTop: '1px solid var(--border)', transition: 'background .15s' }}>
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
                        <div onClick={() => setZoneOn({ ...zoneOn, [key]: !on })} style={{ width: 40, height: 23, borderRadius: 9999, cursor: 'pointer', position: 'relative', transition: 'background .2s', background: on ? '#0D6C3B' : 'var(--border)', display: 'inline-block' }}>
                          <div style={{ position: 'absolute', top: '2.5px', left: on ? '19px' : '2.5px', width: 18, height: 18, borderRadius: 9999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                      {level === 'dist' ? <span>เพิ่มอำเภอในจังหวัด: <b>{curProvObj.th}</b></span> : (curDist ? <span>เพิ่มตำบลในอำเภอ: <b>{curDist}</b></span> : <span>ยังไม่มีอำเภอให้เลือก — เพิ่มอำเภอก่อน</span>)}
                    </div>
                  )}
                  <div>
                    <label style={gLabel}>{level === 'prov' ? 'ชื่อจังหวัด (ไทย)' : level === 'dist' ? 'ชื่ออำเภอ (ไทย)' : 'ชื่อตำบล (ไทย)'} *</label>
                    <input value={form.th} onChange={(e) => setF('th', e.target.value)} placeholder={level === 'prov' ? 'เช่น สมุทรสาคร' : level === 'dist' ? 'เช่น กระทุ่มแบน' : 'เช่น ท่าทราย'} style={gInput} autoFocus />
                  </div>
                  {level === 'prov' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                      <div><label style={gLabel}>ชื่ออังกฤษ (EN)</label><input value={form.en} onChange={(e) => setF('en', e.target.value)} placeholder="e.g. Samut Sakhon" style={gInput} /></div>
                      <div><label style={gLabel}>รหัส (Code)</label><input value={form.code} onChange={(e) => setF('code', e.target.value)} placeholder="เช่น SKN" maxLength={4} style={{ ...gInput, textTransform: 'uppercase' }} /></div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div><label style={gLabel}>ชื่อนิคม / เขต *</label><input value={form.zname} onChange={(e) => setF('zname', e.target.value)} placeholder="เช่น นิคมอุตสาหกรรมบางปะอิน" style={gInput} autoFocus /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                    <div><label style={gLabel}>ประเภท</label><select value={form.ztype} onChange={(e) => setF('ztype', e.target.value)} style={gSelect}>{['นิคมฯ', 'นิคมฯ + ท่าเรือ', 'เขตส่งเสริม', 'สวนอุตสาหกรรม'].map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div><label style={gLabel}>จังหวัด</label><select value={form.zprov} onChange={(e) => setF('zprov', e.target.value)} style={gSelect}>{provinces.map((p) => <option key={p.code} value={p.th}>{p.th}</option>)}</select></div>
                  </div>
                  <div><label style={gLabel}>จำนวนทรัพย์</label><input value={form.zcount} onChange={(e) => setF('zcount', e.target.value)} placeholder="0" inputMode="numeric" style={gInput} /></div>
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
