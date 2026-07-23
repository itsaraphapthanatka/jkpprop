'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell, authInputWrap, authInput, authLeadIcon, authLabel, authBtn } from './AuthShell';

/* Admin CMS login. Mock auth (no backend): submit → push /admin.
   Layout/brand chrome provided by the shared <AuthShell>. */

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    window.setTimeout(() => router.push('/admin'), 500);
  };

  return (
    <AuthShell>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>เข้าสู่ระบบ</h2>
      <p style={{ margin: '6px 0 28px', fontSize: 14, color: 'var(--muted)' }}>สำหรับผู้ดูแลระบบ JKP Property</p>

      <form onSubmit={submit}>
        {/* email */}
        <div style={{ marginBottom: 16 }}>
          <label style={authLabel} htmlFor="login-email">อีเมล</label>
          <div style={authInputWrap}>
            <span style={authLeadIcon}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M22 6l-10 7L2 6" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg>
            </span>
            <input id="login-email" className="auth-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@jkpproperty.co.th" style={authInput} />
          </div>
        </div>

        {/* password */}
        <div style={{ marginBottom: 16 }}>
          <label style={authLabel} htmlFor="login-password">รหัสผ่าน</label>
          <div style={authInputWrap}>
            <span style={authLeadIcon}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
            </span>
            <input id="login-password" className="auth-input" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...authInput, paddingRight: 44 }} />
            <button type="button" className="auth-eye" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} style={{ position: 'absolute', right: 8, width: 32, height: 32, borderRadius: 8, border: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted2)', transition: 'color .15s' }}>
              {showPw ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M17.9 17.9A10.4 10.4 0 0112 20C5 20 1 12 1 12a19 19 0 015.1-6M9.9 4.2A9.5 9.5 0 0112 4c7 0 11 8 11 8a19 19 0 01-2.2 3.2M1 1l22 22M9.9 9.9a3 3 0 004.2 4.2" /></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* remember + forgot */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
            <span onClick={() => setRemember((v) => !v)} style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (remember ? '#0D6C3B' : 'var(--border)'), background: remember ? '#0D6C3B' : 'transparent', transition: 'all .15s' }}>
              {remember && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>}
            </span>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
            <span style={{ fontSize: '13.5px', color: 'var(--muted)' }}>จดจำฉันไว้</span>
          </label>
          <a href="/admin/forgot-password" className="auth-link" style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--accent)', transition: 'color .15s' }}>ลืมรหัสผ่าน?</a>
        </div>

        {/* submit */}
        <button type="submit" className="auth-btn" disabled={loading} style={{ ...authBtn, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.85 : 1 }}>
          {loading ? 'กำลังเข้าสู่ระบบ…' : (<>เข้าสู่ระบบ<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg></>)}
        </button>
      </form>

      {/* demo hint */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8, padding: '11px 13px', borderRadius: 11, background: 'var(--tint)', border: '1px solid var(--border)' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>เดโม — ยังไม่เชื่อมต่อระบบยืนยันตัวตน กด “เข้าสู่ระบบ” เพื่อเข้าสู่แดชบอร์ดได้เลย</span>
      </div>

      {/* back to site */}
      <div style={{ marginTop: 26, textAlign: 'center' }}>
        <a href="/" className="auth-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13.5px', fontWeight: 600, color: 'var(--muted2)', transition: 'color .15s' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></svg>
          กลับสู่หน้าเว็บหลัก
        </a>
      </div>
    </AuthShell>
  );
}
