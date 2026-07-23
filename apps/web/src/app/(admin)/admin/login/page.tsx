'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { AlertBanner, Button, TextInput } from '@jkp/ui';
import { ApiRequestError, fetchApi } from '@jkp/api-client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await fetchApi('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      window.location.href = '/admin';
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const fe = err.fieldErrors();
        setErrors({
          email: Boolean(fe.email),
          password: Boolean(fe.password),
          form: fe.email || fe.password ? undefined : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่',
        });
      } else {
        setErrors({ form: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
      }
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-surface-alt p-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface-card p-8 shadow-md">
        <div className="flex items-center gap-2 text-brand-700">
          <Building2 className="size-6" strokeWidth={1.7} aria-hidden />
          <span className="text-lg font-bold">JKP Admin</span>
        </div>
        <h1 className="mt-6 text-xl font-bold text-content-primary">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-content-secondary">ระบบหลังบ้าน JKP Property</p>

        {errors.form && (
          <AlertBanner variant="danger" className="mt-4">
            {errors.form}
          </AlertBanner>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <TextInput
            label="อีเมล"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email ? 'กรุณากรอกอีเมล' : undefined}
          />
          <TextInput
            label="รหัสผ่าน"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password ? 'กรุณากรอกรหัสผ่าน' : undefined}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </Button>
        </form>

        <p className="mt-4 text-xs text-content-muted">
          เดโม: กรอกอีเมลและรหัสผ่านใดก็ได้เพื่อเข้าสู่ระบบ (สิทธิ์ super admin)
        </p>
      </div>
    </div>
  );
}
