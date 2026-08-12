'use client';

import * as React from 'react';
import { PROPERTY_TYPES, requirementFields, enabledPropertyTypes, type FieldDef } from '@/lib/propertySchema';
import { addLead, newLeadId, type ReqItem } from '@/lib/leadStore';
import { useSchemaSync } from '@/lib/schemaSync';
import { apiPost, ApiClientError } from '@/lib/apiClient';
import { useI18n } from '@/i18n/useDict';
import { enumLabel } from '@/i18n/enums';

/* Public requirement-intake form (Contact page). Visitor picks a property
   type, fills the CURATED essential fields for that type, and submits — a
   lead (with the requirement summary) is written to the lead store and shows
   up in Admin → Leads. Only necessary fields per type, per the schema. */

const inputStyle: React.CSSProperties = { width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '13.5px', color: 'var(--text)', outline: 'none', background: 'var(--bg)', fontFamily: 'inherit' };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)' };
const reqMark = <span style={{ color: '#C0392B' }}> *</span>;
const isFull = (f: FieldDef) => ['dealtype', 'boolean', 'multiselect'].includes(f.kind);

/* Asked for EVERY property type — who is filling this in (ported from the
   JKP "แบบสอบถามความต้องการใช้โกดังและโรงงาน" intake form). */


export function RequirementForm() {
  const { d, locale } = useI18n();
  const RESPONDENT_OPTS = [d.requirement.agent, d.requirement.customer];
  const [typeKey, setTypeKey] = React.useState('warehouse');
  // start from all types (SSR-safe), then narrow to the agency's enabled types on the client
  const [types, setTypes] = React.useState(PROPERTY_TYPES);
  // public page → only pulls the (public) type config, not the authed schema
  const schemaV = useSchemaSync({ publicOnly: true });
  React.useEffect(() => {
    const en = enabledPropertyTypes();
    setTypes(en);
    setTypeKey((k) => (en.some((t) => t.key === k) ? k : en[0].key));
  }, [schemaV]);
  const [values, setValues] = React.useState<Record<string, unknown>>({ deal_intent: 'เช่า' });
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [respondent, setRespondent] = React.useState(''); // required, asked for every type
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [website, setWebsite] = React.useState(''); // honeypot — never shown
  const timer = React.useRef<number | undefined>(undefined);

  const fields = requirementFields(typeKey);
  const setV = (k: string, v: unknown) => setValues((p) => ({ ...p, [k]: v }));
  // drop a stale validation message as soon as the user acts on it
  const clearErr = () => setError((e) => (e ? '' : e));

  // reset per-type answers but PRESERVE the universal rent/buy intent
  const pickType = (k: string) => { setTypeKey(k); setValues((p) => ({ deal_intent: (p.deal_intent as string) ?? 'เช่า' })); };

  const lbl = (f: FieldDef) => (<label style={labelStyle}>{enumLabel(f.label, locale)}{f.unit ? ` (${f.unit})` : ''}{f.required ? reqMark : null}</label>);

  const renderField = (f: FieldDef) => {
    switch (f.kind) {
      case 'dealtype':
        return (
          <div>
            {lbl(f)}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(f.options || []).map((opt) => {
                const on = (values[f.key] ?? (f.options || [])[0]) === opt;
                return <button type="button" key={opt} onClick={() => setV(f.key, opt)} aria-pressed={on} style={{ flex: '1 1 auto', minWidth: 100, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? 'var(--deep)' : 'var(--border)'), background: on ? 'rgba(var(--deep-rgb),.06)' : 'var(--bg)', color: on ? 'var(--deep)' : 'var(--text)' }}>{opt}</button>;
              })}
            </div>
          </div>
        );
      case 'select':
        return (<div>{lbl(f)}<select value={(values[f.key] as string) ?? ''} onChange={(e) => setV(f.key, e.target.value)} style={selectStyle}><option value="">{d.requirement.choose}</option>{(f.options || []).map((o) => <option key={o} value={o}>{enumLabel(o, locale)}</option>)}</select></div>);
      case 'boolean':
        return (
          <div>
            {lbl(f)}
            <button type="button" role="switch" aria-checked={!!values[f.key]} aria-label={enumLabel(f.label, locale)} onClick={() => setV(f.key, !values[f.key])} style={{ width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{values[f.key] ? d.requirement.wanted : d.requirement.notSpecified}</span>
              <div style={{ width: 40, height: 23, borderRadius: 9999, background: values[f.key] ? 'var(--deep)' : 'var(--border)', position: 'relative', transition: 'background .2s' }}><div style={{ position: 'absolute', top: '2.5px', left: values[f.key] ? '19px' : '2.5px', width: 18, height: 18, borderRadius: 9999, background: '#fff', transition: 'left .2s' }} /></div>
            </button>
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

  const submit = async () => {
    if (sending) return;
    if (!name.trim()) { setError(d.form.errName); return; }
    if (!phone.trim()) { setError(d.form.errPhone); return; }
    if (!respondent) { setError(d.form.errRespondent); return; }
    setError('');
    const t = PROPERTY_TYPES.find((p) => p.key === typeKey);
    const { req, dealIntent } = buildReq();
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      company: company.trim(),
      respondentType: respondent,
      message: message.trim(),
      typeKey,
      typeLabel: t?.label || typeKey,
      dealIntent,
      req,
      website, // honeypot — hidden field, humans leave it blank
    };
    setSending(true);
    try {
      await apiPost('/api/public/leads', payload);
    } catch (e) {
      // server rejected (validation / rate limit) → surface the Thai message;
      // network failure → keep the lead locally so it is never lost (§2.2)
      if (e instanceof ApiClientError && e.status > 0) {
        setError(e.message);
        setSending(false);
        return;
      }
      const createdAt = Date.now();
      addLead({ id: newLeadId(createdAt), createdAt, ...payload, source: 'requirement form' });
    }
    setSending(false);
    setSubmitted(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSubmitted(false);
      setName(''); setPhone(''); setEmail(''); setCompany(''); setRespondent(''); setMessage('');
      setValues({ deal_intent: 'เช่า' });
    }, 3000);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, padding: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--deep)" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{d.requirement.sent}</div>
        <div style={{ fontSize: '13.5px', color: 'var(--muted)', maxWidth: 320 }}>{d.form.successBody}</div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{d.requirement.heading}</div>
      <div style={{ fontSize: '12.5px', color: 'var(--muted2)', marginTop: 3, marginBottom: 16 }}>{d.requirement.sub}</div>

      {/* contact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        <div style={{ minWidth: 0 }}><label style={labelStyle}>{d.form.name}{reqMark}</label><input value={name} onChange={(e) => { setName(e.target.value); clearErr(); }} placeholder={d.requirement.namePh} style={inputStyle} /></div>
        <div style={{ minWidth: 0 }}><label style={labelStyle}>{d.form.phone}{reqMark}</label><input value={phone} onChange={(e) => { setPhone(e.target.value); clearErr(); }} type="tel" inputMode="tel" autoComplete="tel" placeholder="08x-xxx-xxxx" style={inputStyle} /></div>
      </div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        <div style={{ minWidth: 0 }}><label style={labelStyle}>{d.form.email}</label><input value={email} onChange={(e) => { setEmail(e.target.value); clearErr(); }} placeholder="name@email.com" style={inputStyle} /></div>
        <div style={{ minWidth: 0 }}><label style={labelStyle}>{d.requirement.company}</label><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={d.requirement.companyPh} style={inputStyle} /></div>
      </div>

      {/* respondent status — asked for every property type */}
      <div style={{ marginTop: 16 }} role="radiogroup" aria-label={d.requirement.respondentStatus}>
        <label style={labelStyle}>{d.requirement.respondentStatus}{reqMark}</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RESPONDENT_OPTS.map((opt) => {
            const on = respondent === opt;
            return (
              <button type="button" key={opt} onClick={() => { setRespondent(opt); clearErr(); }} aria-pressed={on} style={{ flex: '1 1 auto', minWidth: 150, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? 'var(--deep)' : 'var(--border)'), background: on ? 'rgba(var(--deep-rgb),.06)' : 'var(--bg)', color: on ? 'var(--deep)' : 'var(--text)' }}>
                <span style={{ width: 16, height: 16, borderRadius: 9999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (on ? 'var(--deep)' : 'var(--muted3)') }}>
                  {on && <span style={{ width: 8, height: 8, borderRadius: 9999, background: 'var(--deep)' }} />}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* property-type picker */}
      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>ประเภททรัพย์ที่ต้องการ{reqMark}</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {types.map((pt) => {
            const on = typeKey === pt.key;
            return (
              <button type="button" key={pt.key} onClick={() => pickType(pt.key)} aria-pressed={on} style={{ flex: '1 1 auto', minWidth: 108, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? 'var(--deep)' : 'var(--border)'), background: on ? 'rgba(var(--deep-rgb),.06)' : 'var(--bg)', color: on ? 'var(--deep)' : 'var(--text)' }}>
                <span style={{ display: 'flex', width: 16, height: 16 }} dangerouslySetInnerHTML={{ __html: pt.icon }} />
                {enumLabel(pt.label, locale)}
              </button>
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
        <label style={labelStyle}>{d.requirement.details}</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={d.requirement.detailsPh} style={{ width: '100%', height: 110, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '13.5px', color: 'var(--text)', outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'var(--bg)' }} />
      </div>

      {error && <div style={{ marginTop: 12, fontSize: 12.5, color: '#C0392B', background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.25)', borderRadius: 10, padding: '9px 12px' }}>{error}</div>}

      {/* honeypot — visually hidden; bots that fill it are silently dropped */}
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />

      <button type="submit" className="c-submit" disabled={sending} style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, padding: '0 30px', borderRadius: 9999, border: 0, background: '#04140C', color: 'var(--neon)', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.75 : 1, transition: 'transform .2s,box-shadow .2s' }}>
        {sending ? d.form.sending : d.form.submit}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </form>
  );
}
