'use client';

import * as React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

/* Ported verbatim from AdminGeography.dc.html — interactive geography
   admin: a two-tab topbar (พื้นที่ 3 ระดับ / นิคมอุตสาหกรรม) that switches
   between a 3-level cascade (จังหวัด → อำเภอ → ตำบล) and an industrial-zones
   table with per-row status toggles. The topbar tabs + add button share the
   view state with the body, so the whole page (incl. AdminShell) lives here. */

type ProvData = { th: string; en: string; code: string; districts: string[] };

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
.geo-zone-row:hover{background:var(--tint);}
`;

const cardStyle: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' };
const cardHead: React.CSSProperties = { padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const cardTitle: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: 'var(--text)' };
const cardCount: React.CSSProperties = { fontSize: 11, color: 'var(--muted3)' };
const th: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase' };
const thc: React.CSSProperties = { ...th, textAlign: 'center' };

export function GeographyBody() {
  const [view, setView] = React.useState<'geo' | 'zones'>('geo');
  const [prov, setProv] = React.useState(0);
  const [dist, setDist] = React.useState(0);
  const [zoneOn, setZoneOn] = React.useState<Record<string, boolean>>({ z0: true, z1: true, z2: true, z3: false, z4: true, z5: true });

  const curProvObj = PROV_DATA[prov];
  const distList = curProvObj.districts;
  const curDist = distList[dist];
  const subList = SUB_MAP[curDist] || ['(ยังไม่มีข้อมูลตำบล)'];
  const addLabel = view === 'geo' ? 'เพิ่มพื้นที่' : 'เพิ่มนิคม';

  const actions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, padding: 4, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {TABS.map((t) => {
          const on = view === t.key;
          return (
            <div key={t.key} onClick={() => setView(t.key)} style={{ height: 32, padding: '0 16px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', background: on ? '#273c33' : 'transparent', color: on ? '#fff' : 'var(--muted)' }}>{t.label}</div>
          );
        })}
      </div>
      <div onClick={() => {}} className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>{addLabel}
      </div>
    </div>
  );

  return (
    <AdminShell active="seo" eyebrow="Settings / Geography" title="พื้นที่ & นิคมอุตสาหกรรม" actions={actions} css={geoCss}>
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
              <div style={cardHead}><span style={cardTitle}>จังหวัด</span><span style={cardCount}>77</span></div>
              <div className="a-scroll" style={{ maxHeight: 560, overflowY: 'auto' }}>
                {PROV_DATA.map((p, i) => {
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
          <div style={{ overflowX: 'auto' }} className="a-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
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
                {ZONE_DATA.map((z, i) => {
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
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text)', display: 'inline-flex', alignItems: 'center' }}>{z.type}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '12.5px', color: 'var(--muted)' }}>{z.province}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'var(--text)' }}>{z.count}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
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
    </AdminShell>
  );
}
