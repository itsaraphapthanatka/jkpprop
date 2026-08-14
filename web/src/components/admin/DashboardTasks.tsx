'use client';

/* "งานของฉันวันนี้" on the dashboard.
 *
 * The box in front of each task was a bordered <div> — no handler, no state.
 * The list is of tasks that are NOT done, so the one thing the reader wants to
 * do with it is tick one off, and that was the one thing it could not do.
 */
import * as React from 'react';
import { apiPatch, ApiClientError } from '@/lib/apiClient';

export type DashTask = {
  id: string;
  leadId: string;
  title: string;
  lead: string;
  due: number | null;
  overdue: boolean;
};

export function DashboardTasks({ tasks }: { tasks: DashTask[] }) {
  const [done, setDone] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState('');
  const [err, setErr] = React.useState('');

  const open = tasks.filter((t) => !done.includes(t.id));

  const tick = async (t: DashTask) => {
    if (busy) return;
    setBusy(t.id);
    setErr('');
    // ticked at once — the row leaves the list, and comes back if the save fails
    setDone((d) => [...d, t.id]);
    try {
      await apiPatch(`/api/leads/${t.leadId}/tasks`, { taskId: t.id, done: true });
    } catch (e) {
      setDone((d) => d.filter((id) => id !== t.id));
      setErr(e instanceof ApiClientError ? e.message : 'ปิดงานไม่สำเร็จ — ลองใหม่อีกครั้ง');
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>งานของฉันวันนี้</div>
        <span id="dash-task-count" style={{ height: 22, padding: '0 9px', borderRadius: 9999, background: '#FDECC8', color: '#9A741C', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center' }}>{open.length} งาน</span>
      </div>

      {err && <div role="alert" style={{ marginBottom: 10, fontSize: '11.5px', color: '#C0392B', fontWeight: 600 }}>{err}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {open.length === 0 && (
          <div style={{ padding: '18px 12px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted3)', lineHeight: 1.7 }}>
            ไม่มีงานค้างวันนี้<br />
            <span style={{ fontSize: 11 }}>งานติดตามที่เพิ่มไว้ในหน้า Leads จะมาโผล่ตรงนี้</span>
          </div>
        )}
        {open.map((t) => (
          <label
            key={t.id}
            data-task={t.id}
            style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: 11, borderRadius: 12, background: 'var(--bg)', cursor: busy === t.id ? 'default' : 'pointer', opacity: busy === t.id ? 0.55 : 1, transition: 'opacity .15s' }}
          >
            <input
              type="checkbox"
              checked={false}
              onChange={() => void tick(t)}
              aria-label={`ปิดงาน ${t.title}`}
              style={{ position: 'absolute', opacity: 0, width: 18, height: 18, margin: 0, cursor: 'pointer' }}
            />
            <span style={{ width: 18, height: 18, borderRadius: 6, border: '1.5px solid ' + (t.overdue ? '#C0392B' : '#0D6C3B'), flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.title}</span>
              <span style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ height: 18, padding: '0 7px', borderRadius: 6, background: t.overdue ? '#F9E4E1' : '#E8F3EC', color: t.overdue ? '#C0392B' : '#0D6C3B', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center' }}>{t.overdue ? 'เลยกำหนด' : 'ปกติ'}</span>
                <span style={{ fontSize: 11, color: 'var(--muted3)' }}>{t.lead}{t.due ? ` · ${new Date(t.due).toLocaleDateString('th-TH')}` : ''}</span>
              </span>
            </span>
          </label>
        ))}
      </div>
    </>
  );
}
