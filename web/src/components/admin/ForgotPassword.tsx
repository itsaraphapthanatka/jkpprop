'use client';

import { useState } from 'react';
import { AuthShell, authInputWrap, authInput, authLeadIcon, authLabel, authBtn } from './AuthShell';
import Link from 'next/link';

/* Admin CMS forgot-password.
 *
 * หน้านี้เคยเป็นฉากเปล่า — กดส่งแล้วรอครึ่งวินาทีด้วย setTimeout แล้วขึ้นว่า
 * "เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ … แล้ว" โดยไม่เคยยิงไปที่เซิร์ฟเวอร์เลย
 * และไม่มี API อยู่จริงด้วยซ้ำ · คนที่ลืมรหัสผ่านจึงนั่งรอเมลที่ไม่มีวันมา
 * (คุณกิตติพงษ์แจ้ง 29 ส.ค. 2569 ว่าให้สิทธิ์ทีม Marketing แล้วแต่ไม่มีเมลส่งไป)
 */

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  /* ระบบอีเมลยังไม่ได้ตั้งค่า = ลิงก์ไม่ได้ถูกส่งจริง ต้องบอกตามตรง
     ไม่ใช่ขึ้นหน้า "ส่งแล้ว" เหมือนเดิม */
  const [noMail, setNoMail] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email.trim()) return;
    setLoading(true);
    try {
      const r = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = (await r.json().catch(() => null)) as { data?: { mailConfigured?: boolean } } | null;
      setNoMail(j?.data?.mailConfigured === false);
      setSent(true);
    } catch {
      /* ต่อเซิร์ฟเวอร์ไม่ได้ — อย่าขึ้นหน้า "ส่งแล้ว" เด็ดขาด */
      setNoMail(true);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = (
    <div style={{ marginTop: 26, textAlign: 'center' }}>
      <Link href="/admin/login" className="auth-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '13.5px', fontWeight: 600, color: 'var(--muted2)', transition: 'color .15s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></svg>
        กลับไปหน้าเข้าสู่ระบบ
      </Link>
    </div>
  );

  /* ระบบอีเมลยังไม่ได้ตั้งค่า — บอกทางออกที่ใช้ได้จริง แทนที่จะให้นั่งรอเมล
     ที่ไม่มีวันมา */
  if (sent && noMail) {
    return (
      <AuthShell>
        <div data-fp-nomail style={{ width: 56, height: 56, borderRadius: 9999, background: '#FBF3E1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9A741C" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></svg>
        </div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>ยังส่งอีเมลไม่ได้</h2>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
          ระบบส่งอีเมลของที่นี่ยังไม่ได้ตั้งค่า ลิงก์ตั้งรหัสผ่านใหม่จึง<b style={{ color: 'var(--text)' }}>ยังไม่ถูกส่งออกไป</b>
          <br /><br />กรุณาติดต่อเจ้าของระบบเพื่อขอรหัสผ่านชั่วคราว แล้วเข้าสู่ระบบเพื่อตั้งรหัสใหม่ด้วยตัวเอง
        </p>
        {backToLogin}
      </AuthShell>
    );
  }

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

        <Link href="/admin/login" className="auth-btn" style={{ ...authBtn, marginTop: 26, textDecoration: 'none' }}>กลับไปเข้าสู่ระบบ</Link>

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
