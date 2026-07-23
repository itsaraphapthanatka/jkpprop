'use client';

import * as React from 'react';

/* Ported verbatim from AdminPropertyEdit.dc.html <main> — the property
   edit form with a sticky tab bar (ข้อมูลหลัก / Specs / Features / Media /
   Translations), feature checkbox toggles, and an 820px centered form.
   Interactive: tab switching + feature on/off state (DCLogic Component). */

type TabKey = 'main' | 'specs' | 'features' | 'media' | 'trans';

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--muted)' };

const selectBox: React.CSSProperties = { marginTop: 6, height: 46, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)' };

const inputBase: React.CSSProperties = { marginTop: 6, width: '100%', height: 46, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--surface)', outline: 'none' };

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg>
);

type SpecDef = { label: string; kind: 'input' | 'select' | 'toggle'; value: string; full?: boolean };

const specDefs: SpecDef[] = [
  { label: 'พื้นที่ใช้สอย (ตร.ม.)', kind: 'input', value: '2,700' },
  { label: 'ขนาดที่ดิน (ไร่)', kind: 'input', value: '4' },
  { label: 'ความสูงใต้อาคาร (ม.)', kind: 'input', value: '9' },
  { label: 'รับน้ำหนักพื้น (ตัน/ตร.ม.)', kind: 'input', value: '3' },
  { label: 'ระบบไฟฟ้า', kind: 'select', value: '3 Phase 50/150A' },
  { label: 'เขตโซน', kind: 'select', value: 'เขตสีม่วง' },
  { label: 'ขอใบ ร.ง.4 ได้', kind: 'toggle', value: 'ขอใบอนุญาตโรงงานได้', full: true },
];

const featDefs = ['อาคารเดี่ยว', 'มีพื้นที่สำนักงานในตัว', 'พื้นที่ขนถ่ายแบบยกพื้น', 'เครนเหนือศีรษะ', 'พนักงานรักษาความปลอดภัย', 'บนถนนสายหลัก', 'ใกล้ท่าเรือ/สนามบิน', 'ห้องเย็น/ควบคุมอุณหภูมิ'];

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

const media: { id?: string; img?: boolean; src?: string; cover?: boolean; add?: boolean }[] = [
  { id: 'ed-m1', img: true, src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=70', cover: true },
  { id: 'ed-m2', img: true, src: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=70', cover: false },
  { id: 'ed-m3', img: true, src: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&q=70', cover: false },
  { id: 'ed-m4', img: true, src: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=70', cover: false },
  { add: true },
];

const tabDefs: [TabKey, string, boolean][] = [
  ['main', 'ข้อมูลหลัก', true],
  ['specs', 'Specs', true],
  ['features', 'Features', true],
  ['media', 'Media', true],
  ['trans', 'Translations', true],
];

export function PropertyEditBody() {
  const [tab, setTab] = React.useState<TabKey>('main');
  const [feat, setFeat] = React.useState<Record<string, boolean>>({ f0: true, f1: true, f4: true, f5: true });

  return (
    <div style={{ margin: '-24px -28px -60px' }}>
      {/* TAB BAR */}
      <div className="a-scroll" style={{ position: 'sticky', top: 69, zIndex: 40, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', display: 'flex', gap: 8, overflowX: 'auto' }}>
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
        {/* ข้อมูลหลัก */}
        {tab === 'main' && (
          <div id="ed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>ชื่อทรัพย์ (ไทย) *</label>
              <input defaultValue="โกดังพร้อมสำนักงาน 2,700 ตร.ม." style={{ ...inputBase, fontSize: 14, fontWeight: 600 }} />
            </div>
            <div>
              <label style={labelStyle}>ประเภททรัพย์ *</label>
              <div style={selectBox}>โกดัง<Chevron /></div>
            </div>
            <div>
              <label style={labelStyle}>จังหวัด *</label>
              <div style={selectBox}>สมุทรปราการ<Chevron /></div>
            </div>
            <div style={{ gridColumn: '1 / -1', background: 'var(--tint)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" /></svg>
              <span style={{ fontSize: '12.5px', color: 'var(--accent)' }}>รหัสทรัพย์: <code style={{ fontWeight: 700 }}>JKP-SPK0042</code> (แก้ไขไม่ได้ — สร้างจากจังหวัดตอนบันทึกครั้งแรก)</span>
            </div>
            <div>
              <label style={labelStyle}>พื้นที่รวม (ตร.ม.)</label>
              <input defaultValue="2,700" style={inputBase} />
            </div>
            <div>
              <label style={labelStyle}>ระดับการแสดงตำแหน่ง</label>
              <div style={selectBox}>ระดับตำบล<Chevron /></div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>คำอธิบายย่อ (ไทย)</label>
              <textarea defaultValue="โกดังพร้อมสำนักงาน ทำเลบางพลี ใกล้ทางด่วนบูรพาวิถี เหมาะกับธุรกิจโลจิสติกส์" style={{ marginTop: 6, width: '100%', height: 90, padding: '12px 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--surface)', outline: 'none', resize: 'none' }} />
            </div>
          </div>
        )}

        {/* Specs */}
        {tab === 'specs' && (
          <div id="ed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {specDefs.map((f) => (
              <div key={f.label} style={f.full ? { gridColumn: '1 / -1' } : undefined}>
                <label style={labelStyle}>{f.label}</label>
                {f.kind === 'input' && <input defaultValue={f.value} style={inputBase} />}
                {f.kind === 'select' && <div style={selectBox}>{f.value}<Chevron /></div>}
                {f.kind === 'toggle' && (
                  <div style={{ marginTop: 6, height: 46, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{f.value}</span>
                    <div style={{ width: 40, height: 23, borderRadius: 9999, background: '#0D6C3B', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '2.5px', left: 19, width: 18, height: 18, borderRadius: 9999, background: '#fff' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Features */}
        {tab === 'features' && (
          <div id="ed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {featDefs.map((label, i) => {
              const on = !!feat['f' + i];
              return (
                <div key={label} onClick={() => setFeat({ ...feat, ['f' + i]: !on })} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', borderRadius: 12, cursor: 'pointer', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.05)' : 'var(--surface)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? '#0D6C3B' : 'transparent' }}>
                    {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Media */}
        {tab === 'media' && (
          <div id="ed-media" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {media.map((m) => (
              m.add ? (
                <div key="add" style={{ aspectRatio: '1/1', border: '1.5px dashed var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--muted3)', cursor: 'pointer', background: 'var(--surface)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><path d="M12 5v14M5 12h14" /></svg>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>เพิ่มรูป</span>
                </div>
              ) : (
                <div key={m.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: 'var(--tint)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.src} alt="รูป" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  {m.cover && <span style={{ position: 'absolute', top: 6, left: 6, height: 18, padding: '0 7px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center' }}>ปก</span>}
                  <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 9999, background: 'rgba(2,14,8,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </div>
                </div>
              )
            ))}
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
