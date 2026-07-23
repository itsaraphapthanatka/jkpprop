'use client';

import { useState } from 'react';
import { AuthShell, authInputWrap, authInput, authLeadIcon, authLabel, authBtn } from './AuthShell';

/* Admin CMS forgot-password. Mock (no backend): submit → show a
   "reset link sent" success state. Layout provided by <AuthShell>. */

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email.trim()) return;
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 500);
  };

  const backToLogin = (
    <div style={{ marginTop: 26, textAlign: 'center' }}>
      <a href="/admin/login" className="auth-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13.5px', fontWeight: 600, color: 'var(--muted2)', transition: 'color .15s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></svg>
        กลับไปหน้าเข้าสู่ระบบ
      </a>
    </div>
  );

  if (sent) {
    return (
      <AuthShell>
        <div style={{ width: 56, height: 56, borderRadius: 9999, background: '#E8F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.2"><path d="M22 6l-10 7L2 6" /><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M8 13l3 2 5-4" /></svg>
        </div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>ตรวจสอบอีเมลของคุณ</h2>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
          เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ <b style={{ color: 'var(--text)' }}>{email}</b> แล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึงโฟลเดอร์สแปม)
        </p>

        <a href="/admin/login" className="auth-btn" style={{ ...authBtn, marginTop: 26, textDecoration: 'none' }}>กลับไปเข้าสู่ระบบ</a>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: '13.5px', color: 'var(--muted)' }}>
          ไม่ได้รับอีเมล?{' '}
          <span onClick={() => setSent(false)} className="auth-link" style={{ fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', transition: 'color .15s' }}>ส่งอีกครั้ง</span>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>ลืมรหัสผ่าน?</h2>
      <p style={{ margin: '6px 0 28px', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>กรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณ</p>

      <form onSubmit={submit}>
        <div style={{ marginBottom: 22 }}>
          <label style={authLabel} htmlFor="fp-email">อีเมล</label>
          <div style={authInputWrap}>
            <span style={authLeadIcon}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M22 6l-10 7L2 6" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg>
            </span>
            <input id="fp-email" className="auth-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@jkpproperty.co.th" style={authInput} />
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={loading} style={{ ...authBtn, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.85 : 1 }}>
          {loading ? 'กำลังส่ง…' : (<>ส่งลิงก์รีเซ็ตรหัสผ่าน<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg></>)}
        </button>
      </form>

      {backToLogin}
    </AuthShell>
  );
}
