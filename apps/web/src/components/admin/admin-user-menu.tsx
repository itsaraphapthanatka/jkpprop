'use client';

import { LogOut } from 'lucide-react';
import type { Role } from '@jkp/domain';

const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'ผู้ดูแลระบบสูงสุด',
  listing_manager: 'ผู้จัดการทรัพย์',
  sales_agent: 'ฝ่ายขาย',
  operations_coordinator: 'ประสานงานปฏิบัติการ',
  content_editor: 'บรรณาธิการเนื้อหา',
  translator: 'นักแปล',
};

export function AdminUserMenu({ name, role }: { name: string; role: Role }) {
  async function logout() {
    try {
      await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/admin/login';
    }
  }

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <div className="px-2">
        <p className="truncate text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-white/50">{ROLE_LABEL[role]}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-4" strokeWidth={1.7} aria-hidden />
        ออกจากระบบ
      </button>
    </div>
  );
}
