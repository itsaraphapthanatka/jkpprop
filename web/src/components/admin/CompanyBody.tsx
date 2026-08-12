'use client';

import * as React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiGet, apiPut, ApiClientError } from '@/lib/apiClient';

/* One form for the details that identify the company.
 *
 * They were scattered across a component, the dictionary and one page's props
 * before this, and had already drifted apart: the About and FAQ footers gave
 * out a mailbox on a domain the company does not own and a phone number that
 * does not ring, because only the Contact page passed the real ones in. */

type Tr = { th: string; en: string; zh: string };
type Phone = { number: string; label: string };
type Profile = {
  legalName: string; address: Tr; shortLocation: Tr;
  phones: Phone[]; salesEmail: string; generalEmail: string;
  hoursDays: Tr; hoursValue: string;
};

const LANGS: { key: keyof Tr; label: string }[] = [
  { key: 'th', label: 'ไทย' }, { key: 'en', label: 'EN' }, { key: 'zh', label: '中文' },
];

const EMPTY_TR: Tr = { th: '', en: '', zh: '' };
const BLANK: Profile = {
  legalName: '', address: { ...EMPTY_TR }, shortLocation: { ...EMPTY_TR },
  phones: [], salesEmail: '', generalEmail: '', hoursDays: { ...EMPTY_TR }, hoursValue: '',
};

const label: React.CSSProperties = { display: 'block', marginTop: 16, fontSize: 12, fontWeight: 700, color: 'var(--muted)' };
const input: React.CSSProperties = { marginTop: 6, width: '100%', height: 42, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', fontSize: 13, background: 'var(--bg)', outline: 'none', fontFamily: 'inherit' };
const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 22px' };

const asTr = (v: unknown): Tr => {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<Tr>;
  return { th: o.th ?? '', en: o.en ?? '', zh: o.zh ?? '' };
};

export function CompanyBody() {
  const [p, setP] = React.useState<Profile>(BLANK);
  const [lang, setLang] = React.useState<keyof Tr>('th');
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [loadError, setLoadError] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    apiGet<Partial<Profile>>('/api/company')
      .then((r) => {
        if (!alive) return;
        setP({
          legalName: r.legalName ?? '',
          address: asTr(r.address), shortLocation: asTr(r.shortLocation),
          phones: Array.isArray(r.phones) ? r.phones : [],
          salesEmail: r.salesEmail ?? '', generalEmail: r.generalEmail ?? '',
          hoursDays: asTr(r.hoursDays), hoursValue: r.hoursValue ?? '',
        });
      })
      .catch((e) => alive && setLoadError(e instanceof ApiClientError ? e.message : 'โหลดข้อมูลไม่สำเร็จ'));
    return () => { alive = false; };
  }, []);

  const setTr = (field: 'address' | 'shortLocation' | 'hoursDays', v: string) =>
    setP((s) => ({ ...s, [field]: { ...s[field], [lang]: v } }));

  const setPhone = (i: number, key: keyof Phone, v: string) =>
    setP((s) => ({ ...s, phones: s.phones.map((ph, n) => (n === i ? { ...ph, [key]: v } : ph)) }));

  const save = async () => {
    if (saving) return;
    setSaving(true); setNotice('');
    try {
      await apiPut('/api/company', p);
      setNotice('บันทึกแล้ว');
      window.setTimeout(() => setNotice(''), 1800);
    } catch (e) {
      setNotice(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ');
    } finally { setSaving(false); }
  };

  const actions = (
    <div onClick={save} className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>
      {saving ? 'กำลังบันทึก…' : notice || 'บันทึก'}
    </div>
  );

  return (
    <AdminShell active="settings" eyebrow="Settings / ข้อมูลบริษัท" title="ข้อมูลบริษัท" actions={actions}>
      {loadError && (
        <div role="alert" style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: '#FDECEA', border: '1px solid #F5C2BE', color: '#8C1D18', fontSize: 13 }}>{loadError}</div>
      )}

      <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: '13px 16px', borderRadius: 12, background: 'var(--tint)', color: 'var(--accent)', fontSize: 12, lineHeight: 1.6 }}>
          ข้อมูลชุดนี้ใช้ทั้งหน้าติดต่อเรา ท้ายทุกหน้า และหน้าแรก — แก้ที่นี่ที่เดียว
          {' '}เว้นว่างไว้จะใช้ค่าตั้งต้นเดิมของเว็บ
        </div>

        <div style={card}>
          <label htmlFor="c-legal" style={{ ...label, marginTop: 0 }}>ชื่อบริษัทตามที่จดทะเบียน</label>
          <input id="c-legal" style={input} value={p.legalName} onChange={(e) => setP((s) => ({ ...s, legalName: e.target.value }))} placeholder="JKP PROPERTY CO., LTD." />

          <div style={{ marginTop: 18, display: 'flex', gap: 6 }}>
            {LANGS.map((l) => (
              <div key={l.key} onClick={() => setLang(l.key)} style={{ flex: 1, height: 34, borderRadius: 9, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, border: '1.5px solid ' + (lang === l.key ? '#0D6C3B' : 'var(--border)'), background: lang === l.key ? '#0D6C3B' : 'transparent', color: lang === l.key ? '#fff' : 'var(--text)' }}>
                {l.label}
                {(p.address[l.key] || p.shortLocation[l.key]) && (
                  <span style={{ width: 5, height: 5, borderRadius: 9999, background: lang === l.key ? '#2DFB91' : '#0D6C3B' }} />
                )}
              </div>
            ))}
          </div>

          <label htmlFor="c-addr" style={label}>ที่อยู่เต็ม</label>
          <textarea id="c-addr" value={p.address[lang]} onChange={(e) => setTr('address', e.target.value)}
            style={{ ...input, height: 70, padding: '12px 14px', resize: 'none' }}
            placeholder="41/6 หมู่ 7 ถ.บางนาตราด กม. 16.5 ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ 10540" />

          <label htmlFor="c-short" style={label}>ที่อยู่แบบสั้น (ใช้ท้ายหน้า)</label>
          <input id="c-short" style={input} value={p.shortLocation[lang]} onChange={(e) => setTr('shortLocation', e.target.value)} placeholder="สมุทรปราการ, ประเทศไทย" />
        </div>

        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>เบอร์โทรศัพท์</span>
            <span style={{ fontSize: 11, color: 'var(--muted3)' }}>{p.phones.length}/6</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--muted2)' }}>ป้ายกำกับบอกว่าสายนั้นรับภาษาอะไร · ใช้ร่วมกันทุกภาษา</div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {p.phones.map((ph, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <input aria-label={`เบอร์ที่ ${i + 1}`} style={{ ...input, marginTop: 0, flex: 1 }} value={ph.number} onChange={(e) => setPhone(i, 'number', e.target.value)} placeholder="+66 80-830-4005" />
                <input aria-label={`ป้ายกำกับเบอร์ที่ ${i + 1}`} style={{ ...input, marginTop: 0, width: 160 }} value={ph.label} onChange={(e) => setPhone(i, 'label', e.target.value)} placeholder="English / ไทย" />
                <button type="button" aria-label="ลบเบอร์นี้" onClick={() => setP((s) => ({ ...s, phones: s.phones.filter((_, n) => n !== i) }))}
                  style={{ width: 42, height: 42, borderRadius: 11, border: '1px solid var(--border)', background: 'var(--surface)', color: '#B4231F', cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
          {p.phones.length < 6 && (
            <div onClick={() => setP((s) => ({ ...s, phones: [...s.phones, { number: '', label: '' }] }))}
              style={{ marginTop: 10, height: 40, borderRadius: 11, border: '1.5px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}>+ เพิ่มเบอร์</div>
          )}
        </div>

        <div style={card}>
          <label htmlFor="c-sales" style={{ ...label, marginTop: 0 }}>อีเมลฝ่ายขาย</label>
          <input id="c-sales" type="email" style={input} value={p.salesEmail} onChange={(e) => setP((s) => ({ ...s, salesEmail: e.target.value }))} placeholder="sales@example.com" />

          <label htmlFor="c-general" style={label}>อีเมลทั่วไป</label>
          <input id="c-general" type="email" style={input} value={p.generalEmail} onChange={(e) => setP((s) => ({ ...s, generalEmail: e.target.value }))} placeholder="info@example.com" />
        </div>

        <div style={card}>
          <label htmlFor="c-days" style={{ ...label, marginTop: 0 }}>วันทำการ ({LANGS.find((l) => l.key === lang)?.label})</label>
          <input id="c-days" style={input} value={p.hoursDays[lang]} onChange={(e) => setTr('hoursDays', e.target.value)} placeholder="จันทร์ - ศุกร์:" />

          <label htmlFor="c-hours" style={label}>เวลาทำการ</label>
          <input id="c-hours" style={input} value={p.hoursValue} onChange={(e) => setP((s) => ({ ...s, hoursValue: e.target.value }))} placeholder="9:00 - 18:00 น." />
        </div>
      </div>
    </AdminShell>
  );
}
