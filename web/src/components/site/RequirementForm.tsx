'use client';

import * as React from 'react';
import { PROPERTY_TYPES, requirementFields, enabledPropertyTypes, type FieldDef } from '@/lib/propertySchema';
import { addLead, newLeadId, type ReqItem } from '@/lib/leadStore';

/* Public requirement-intake form (Contact page). Visitor picks a property
   type, fills the CURATED essential fields for that type, and submits — a
   lead (with the requirement summary) is written to the lead store and shows
   up in Admin → Leads. Only necessary fields per type, per the schema. */

const inputStyle: React.CSSProperties = { width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '13.5px', color: 'var(--text)', outline: 'none', background: 'var(--bg)', fontFamily: 'inherit' };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' };
const reqMark = <span style={{ color: '#C0392B' }}> *</span>;
const isFull = (f: FieldDef) => ['dealtype', 'boolean', 'multiselect'].includes(f.kind);

export function RequirementForm() {
  const [typeKey, setTypeKey] = React.useState('warehouse');
  // start from all types (SSR-safe), then narrow to the agency's enabled types on the client
  const [types, setTypes] = React.useState(PROPERTY_TYPES);
  React.useEffect(() => {
    const en = enabledPropertyTypes();
    setTypes(en);
    setTypeKey((k) => (en.some((t) => t.key === k) ? k : en[0].key));
  }, []);
  const [values, setValues] = React.useState<Record<string, unknown>>({ deal_intent: 'เช่า' });
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);

  const fields = requirementFields(typeKey);
  const setV = (k: string, v: unknown) => setValues((p) => ({ ...p, [k]: v }));

  // reset per-type answers but PRESERVE the universal rent/buy intent
  const pickType = (k: string) => { setTypeKey(k); setValues((p) => ({ deal_intent: (p.deal_intent as string) ?? 'เช่า' })); };

  const lbl = (f: FieldDef) => (<label style={labelStyle}>{f.label}{f.unit ? ` (${f.unit})` : ''}{f.required ? reqMark : null}</label>);

  const renderField = (f: FieldDef) => {
    switch (f.kind) {
      case 'dealtype':
        return (
          <div>
            {lbl(f)}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(f.options || []).map((opt) => {
                const on = (values[f.key] ?? (f.options || [])[0]) === opt;
                return <div key={opt} onClick={() => setV(f.key, opt)} style={{ flex: '1 1 auto', minWidth: 100, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--bg)', color: on ? '#0D6C3B' : 'var(--text)' }}>{opt}</div>;
              })}
            </div>
          </div>
        );
      case 'select':
        return (<div>{lbl(f)}<select value={(values[f.key] as string) ?? ''} onChange={(e) => setV(f.key, e.target.value)} style={selectStyle}><option value="">เลือก…</option>{(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select></div>);
      case 'boolean':
        return (
          <div>
            {lbl(f)}
            <div onClick={() => setV(f.key, !values[f.key])} style={{ height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{values[f.key] ? 'ต้องการ' : 'ไม่ระบุ'}</span>
              <div style={{ width: 40, height: 23, borderRadius: 9999, background: values[f.key] ? '#0D6C3B' : 'var(--border)', position: 'relative', transition: 'background .2s' }}><div style={{ position: 'absolute', top: '2.5px', left: values[f.key] ? '19px' : '2.5px', width: 18, height: 18, borderRadius: 9999, background: '#fff', transition: 'left .2s' }} /></div>
            </div>
          </div>
        );
      case 'number':
        return (<div>{lbl(f)}<input value={(values[f.key] as string) ?? ''} onChange={(e) => setV(f.key, e.target.value)} inputMode="numeric" placeholder="0" style={inputStyle} /></div>);
      default: // text
        return (<div>{lbl(f)}<input value={(values[f.key] as string) ?? ''} onChange={(e) => setV(f.key, e.target.value)} placeholder={f.placeholder || ''} style={inputStyle} /></div>);
    }
  };

  const buildReq = (): { req: ReqItem[]; dealIntent: string } => {
    const dealIntent = (values.deal_intent as string) || 'เช่า';
    const req: ReqItem[] = [];
    fields.forEach((f) => {
      if (f.key === 'deal_intent') return; // captured separately
      const raw = values[f.key];
      if (raw === undefined || raw === '' || raw === false) return;
      if (f.kind === 'boolean') { req.push({ k: f.label, v: 'ต้องการ' }); return; }
      const v = String(raw).trim();
      if (!v || v === 'ไม่ระบุ') return; // treat an explicit "not specified" like a blank
      req.push({ k: f.label, v: f.unit ? `${v} ${f.unit}` : v });
    });
    return { req, dealIntent };
  };

  const submit = () => {
    if (!name.trim()) { setError('กรุณากรอกชื่อของคุณ'); return; }
    if (!phone.trim() && !email.trim()) { setError('กรุณากรอกเบอร์โทรหรืออีเมลอย่างน้อย 1 ช่องเพื่อให้เราติดต่อกลับ'); return; }
    setError('');
    const t = PROPERTY_TYPES.find((p) => p.key === typeKey);
    const { req, dealIntent } = buildReq();
    const createdAt = Date.now();
    addLead({
      id: newLeadId(createdAt),
      createdAt,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      message: message.trim(),
      typeKey,
      typeLabel: t?.label || typeKey,
      dealIntent,
      req,
      source: 'requirement form',
    });
    setSubmitted(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSubmitted(false);
      setName(''); setPhone(''); setEmail(''); setMessage('');
      setValues({ deal_intent: 'เช่า' });
    }, 3000);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, padding: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>ส่งความต้องการแล้ว</div>
        <div style={{ fontSize: '13.5px', color: 'var(--muted)', maxWidth: 320 }}>ทีมงาน JKP Property ได้รับข้อมูลของคุณแล้ว และจะติดต่อกลับโดยเร็วที่สุด</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>แจ้งความต้องการ</div>
      <div style={{ fontSize: '12.5px', color: 'var(--muted2)', marginTop: 3, marginBottom: 16 }}>เลือกประเภททรัพย์ที่สนใจ แล้วกรอกเฉพาะรายละเอียดที่จำเป็น — ทีมงานจะติดต่อกลับ</div>

      {/* contact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        <div style={{ minWidth: 0 }}><label style={labelStyle}>ชื่อของคุณ{reqMark}</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="กรอกชื่อของคุณ" style={inputStyle} /></div>
        <div style={{ minWidth: 0 }}><label style={labelStyle}>เบอร์โทรศัพท์</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" style={inputStyle} /></div>
      </div>
      <div style={{ marginTop: 12 }}><label style={labelStyle}>อีเมล</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" style={inputStyle} /></div>

      {/* property-type picker */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>ประเภททรัพย์ที่ต้องการ{reqMark}</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {types.map((pt) => {
            const on = typeKey === pt.key;
            return (
              <div key={pt.key} onClick={() => pickType(pt.key)} style={{ flex: '1 1 auto', minWidth: 108, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--bg)', color: on ? '#0D6C3B' : 'var(--text)' }}>
                <span style={{ display: 'flex', width: 16, height: 16 }} dangerouslySetInnerHTML={{ __html: pt.icon }} />
                {pt.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* per-type essential fields */}
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
        {fields.map((f) => (
          <div key={f.key} style={{ gridColumn: isFull(f) ? '1 / -1' : undefined, minWidth: 0 }}>{renderField(f)}</div>
        ))}
      </div>

      {/* message */}
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>รายละเอียดเพิ่มเติม</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="บอกเราเกี่ยวกับความต้องการของคุณเพิ่มเติม…" style={{ width: '100%', height: 110, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '13.5px', color: 'var(--text)', outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'var(--bg)' }} />
      </div>

      {error && <div style={{ marginTop: 12, fontSize: 12.5, color: '#C0392B', background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.25)', borderRadius: 10, padding: '9px 12px' }}>{error}</div>}

      <div onClick={submit} className="c-submit" style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, padding: '0 30px', borderRadius: 9999, background: '#04140C', color: '#2DFB91', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'transform .2s,box-shadow .2s' }}>
        ส่งความต้องการ
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </div>
    </div>
  );
}
