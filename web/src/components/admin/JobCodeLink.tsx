'use client';

/* รหัสงานบนหัวเรื่อง — และที่ผูกใบงานเองเมื่อระบบชี้ให้ไม่ได้
 *
 * ลูกค้าแจ้ง 25 ส.ค. 2569 ว่า Requirement → Shortlist → Visit → Deal ต้องอ้าง
 * รหัสเดียวกัน แผนเข้าชมและดีลที่สร้างตั้งแต่ก่อนมีช่องเก็บจึงไม่มีรหัสติดตัว
 * ระบบเติมย้อนหลังให้ได้เฉพาะใบที่ชี้ได้แน่ ๆ (ทรัพย์ที่พาไปดูอยู่ใน shortlist
 * ของใบไหน) — บน production เหลือ 5 แผนกับ 2 ดีลที่ยังกำกวม เพราะลูกค้าราย
 * เดียวเปิดใบงานไว้หลายใบ
 *
 * เดาให้ก็ได้ แต่รหัสที่ผิดแย่กว่ารหัสที่ว่าง เพราะรหัสนี้มีไว้ใช้ตรวจงาน
 * จึงปล่อยว่างแล้วให้คนที่รู้มาชี้เอง — กดครั้งเดียวจบ
 */
import * as React from 'react';
import Link from 'next/link';
import { apiGet, apiPatch, ApiClientError } from '@/lib/apiClient';

type Req = { id: string; code: string; leadId: string; company?: string; leadName?: string; statusLabel?: string };

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };

/* ใบงานทั้งหมดถูกดึงครั้งเดียวต่อการโหลดหน้า — หน้าดีลมีทั้งหัวเรื่องและเนื้อหน้า
   ที่อาจถามพร้อมกัน */
let reqCache: Req[] | null = null;
let reqInflight: Promise<Req[]> | null = null;
const loadReqs = (): Promise<Req[]> => {
  if (reqCache) return Promise.resolve(reqCache);
  reqInflight ??= apiGet<{ items: Req[] }>('/api/requirements')
    .then((r) => (reqCache = r.items ?? []))
    .catch(() => [])
    .finally(() => { reqInflight = null; });
  return reqInflight;
};

export function JobCodeLink({
  code, requirementId, leadId, prefix = '', endpoint, onLinked,
}: {
  /** REQ-1018 · ว่าง = ยังไม่ได้ผูก */
  code: string;
  requirementId: string | null | undefined;
  /** ใช้กรองให้เหลือเฉพาะใบงานของลูกค้ารายนี้ */
  leadId: string | null | undefined;
  /** 'DEAL-' สำหรับหน้าดีล */
  prefix?: string;
  /** ปลายทางที่จะ PATCH เช่น /api/visits/<id> */
  endpoint: string;
  onLinked?: (requirementId: string, code: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [reqs, setReqs] = React.useState<Req[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');

  React.useEffect(() => { if (open) void loadReqs().then(setReqs); }, [open]);

  if (code && requirementId) {
    return (
      <Link data-job-code href={`/admin/requirements/${requirementId}`} title="เปิดใบงานต้นทาง" style={{ ...mono, fontSize: 12, fontWeight: 700, color: '#034956', background: '#EEF4F3', padding: '2px 8px', borderRadius: 6 }}>
        {prefix}{code}
      </Link>
    );
  }

  /* ใบงานของลูกค้ารายนี้ก่อน — ถ้าไม่รู้ว่าเป็นของใครก็เลือกจากทั้งหมดได้ */
  const choices = leadId ? reqs.filter((r) => r.leadId === leadId) : reqs;
  const link = (r: Req) => {
    if (saving) return;
    setSaving(true);
    setErr('');
    apiPatch(endpoint, { requirementId: r.id })
      .then(() => { setOpen(false); onLinked?.(r.id, r.code); })
      .catch((e) => setErr(e instanceof ApiClientError ? e.message : 'ผูกใบงานไม่สำเร็จ'))
      .finally(() => setSaving(false));
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <span
        data-job-code-empty
        onClick={() => setOpen((v) => !v)}
        title="แผน/ดีลนี้สร้างไว้ก่อนระบบเก็บรหัสงาน — เลือกใบงานต้นทางเพื่อให้ใช้รหัสเดียวกันทั้งสาย"
        style={{ ...mono, fontSize: 12, fontWeight: 700, color: '#9A741C', background: '#FBF3E1', padding: '2px 9px', borderRadius: 6, cursor: 'pointer', border: '1px dashed #EAD9A8' }}
      >
        ยังไม่ได้ผูกใบงาน
      </span>
      {open && (
        <span data-job-code-picker style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60, minWidth: 260, maxHeight: 300, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 14px 34px rgba(0,0,0,.14)', padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {err && <span style={{ fontSize: 12, color: '#C0392B', padding: '6px 10px' }}>{err}</span>}
          {!choices.length && <span style={{ fontSize: '12.5px', color: 'var(--muted)', padding: '8px 10px' }}>ลูกค้ารายนี้ยังไม่มีใบงาน</span>}
          {choices.map((r) => (
            <span key={r.id} onClick={() => link(r)} style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '7px 10px', borderRadius: 8, cursor: saving ? 'progress' : 'pointer', background: 'transparent' }}>
              <span style={{ ...mono, fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{prefix}{r.code}</span>
              <span style={{ fontSize: 11, color: 'var(--muted2)' }}>{[r.company || r.leadName, r.statusLabel].filter(Boolean).join(' · ')}</span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
