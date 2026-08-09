'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell, authInputWrap, authInput, authLeadIcon, authLabel, authBtn } from './AuthShell';
import { apiPost, ApiClientError } from '@/lib/apiClient';
import { clearMeCache } from '@/lib/useMe';

/* Set your own password. Reached two ways:
   - voluntarily, from Settings
   - forced, right after signing in with a temporary password issued by an
     admin (?forced=1) — the account is unusable until this is done, which is
     what stops a handed-over password from becoming the permanent one. */

const lockIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export function ChangePassword() {
  const router = useRouter();
  const search = useSearchParams();
  const forced = search.get('forced') === '1';

  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [fields, setFields] = React.useState<Record<string, string>>({});
  const [done, setDone] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setFields({});
    try {
      await apiPost('/api/me/password', { currentPassword: current, newPassword: next, confirmPassword: confirm });
      clearMeCache(); // the mustChangePassword flag just changed
      setDone(true);
      window.setTimeout(() => router.push('/admin'), 1200);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFields(err.fields ?? {});
      } else {
        setError('เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่');
      }
      setSaving(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    autoComplete: string,
  ) => (
    <div style={{ marginBottom: 16 }}>
      <label style={authLabel} htmlFor={id}>{label}</label>
      <div style={authInputWrap}>
        <span style={authLeadIcon}>{lockIcon}</span>
        <input
          id={id}
          className="auth-input"
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          style={{ ...authInput, ...(fields[id] ? { borderColor: '#C0392B' } : {}) }}
        />
      </div>
      {fields[id] && <div style={{ marginTop: 5, fontSize: 11.5, color: '#C0392B' }}>{fields[id]}</div>}
    </div>
  );

  if (done) {
    return (
      <AuthShell>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 60, height: 60, margin: '0 auto', borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h2 style={{ margin: '16px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>เปลี่ยนรหัสผ่านแล้ว</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'var(--muted)' }}>อุปกรณ์อื่นที่เคยเข้าสู่ระบบด้วยรหัสเดิมถูกออกจากระบบทั้งหมด</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>
        {forced ? 'ตั้งรหัสผ่านของคุณเอง' : 'เปลี่ยนรหัสผ่าน'}
      </h2>
      <p style={{ margin: '6px 0 24px', fontSize: 14, color: 'var(--muted)' }}>
        {forced
          ? 'บัญชีนี้ยังใช้รหัสผ่านชั่วคราวที่ผู้ดูแลออกให้ — ตั้งรหัสของคุณเองก่อนจึงจะใช้งานระบบได้'
          : 'ตั้งรหัสผ่านใหม่ อย่างน้อย 8 ตัวอักษร'}
      </p>

      <form onSubmit={submit}>
        {field('currentPassword', forced ? 'รหัสผ่านชั่วคราว' : 'รหัสผ่านปัจจุบัน', current, setCurrent, 'current-password')}
        {field('newPassword', 'รหัสผ่านใหม่', next, setNext, 'new-password')}
        {field('confirmPassword', 'ยืนยันรหัสผ่านใหม่', confirm, setConfirm, 'new-password')}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>แสดงรหัสผ่าน</span>
        </label>

        {error && (
          <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '11px 13px', borderRadius: 11, marginBottom: 16, background: '#FBEDEA', border: '1px solid #E8C4BC' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="1.9" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            <span style={{ fontSize: 13, color: '#C0392B', lineHeight: 1.6 }}>{error}</span>
          </div>
        )}

        <button type="submit" className="auth-btn" disabled={saving} style={{ ...authBtn, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.85 : 1 }}>
          {saving ? 'กำลังบันทึก…' : 'บันทึกรหัสผ่านใหม่'}
        </button>
      </form>
    </AuthShell>
  );
}
