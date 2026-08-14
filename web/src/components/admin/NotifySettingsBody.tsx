'use client';

import * as React from 'react';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';
import { buildAlerts, loadNotifyConfig, saveNotifyConfig, fetchLeaseData, DEFAULT_NOTIFY, MILESTONE_MONTHS, type Lease, type LeaseAlert, type NotifyConfig } from '@/lib/leaseStore';
import { apiGet, apiPut, apiPost, apiPatch, apiDelete, ApiClientError } from '@/lib/apiClient';

/* Settings → การแจ้งเตือน: choose how far ahead of a lease's end date the
   system should raise a bell notification (1 / 2 / 3 เดือน), with a live
   preview of exactly which leases the current setting would surface. */

const nsCss = `
#ns-split > div{ min-width:0; }
@media (max-width:1000px){ #ns-split{grid-template-columns:1fr !important;} #ns-preview{position:static !important;} }
@media (max-width:640px){ #admin-main > main{ padding:16px 14px 44px !important; } }
@media (max-width:480px){ #ns-save{flex:1 1 100% !important;justify-content:center;} }
.ns-save:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(13,108,59,.35);}
`;

const leaseBtn: React.CSSProperties = { height: 32, padding: '0 12px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 };
const nsLabel: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--muted)' };
const nsInput: React.CSSProperties = { height: 38, padding: '0 11px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12.5px', fontFamily: 'inherit', outline: 'none', fontWeight: 600 };

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 };
const switchStyle = (on: boolean): React.CSSProperties => ({ width: 40, height: 23, borderRadius: 9999, position: 'relative', transition: 'background .2s', background: on ? '#0D6C3B' : 'var(--border)', flexShrink: 0, border: 0, padding: 0, cursor: 'pointer' });
const knob = (on: boolean): React.CSSProperties => ({ position: 'absolute', top: '2.5px', left: on ? '19px' : '2.5px', width: 18, height: 18, borderRadius: 9999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' });

const LEVEL: Record<string, { bg: string; fg: string; label: string }> = {
  expired: { bg: '#F9E4E1', fg: '#C0392B', label: 'หมดสัญญาแล้ว' },
  urgent: { bg: '#FBF3E1', fg: '#9A741C', label: 'ใกล้หมดมาก' },
  warn: { bg: '#EEF4F3', fg: '#034956', label: 'ใกล้หมดสัญญา' },
};

export function NotifySettingsBody() {
  const [cfg, setCfg] = React.useState<NotifyConfig>(DEFAULT_NOTIFY);
  const [alerts, setAlerts] = React.useState<LeaseAlert[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = React.useState(false);

  const [leases, setLeases] = React.useState<Lease[]>([]);
  React.useEffect(() => {
    const c = loadNotifyConfig();
    setCfg(c);
    setReady(true);
    // then reconcile with the server (org thresholds + real lease book)
    void fetchLeaseData().then(({ leases: ls, cfg: remote }) => { setLeases(ls); setCfg(remote); });
  }, []);
  // live preview follows the edits, before they are saved
  React.useEffect(() => { if (ready) setAlerts(buildAlerts(cfg, leases)); }, [cfg, ready, leases]);

  /* The lease book itself. It could only be written by the installer's seed —
     no create route, no screen — so the bell had nothing true to say and no
     way to be told anything. */
  const blank = { id: '', code: '', tenant: '', startDate: '', endDate: '', rent: '' };
  const [form, setForm] = React.useState<typeof blank | null>(null);
  const [codes, setCodes] = React.useState<{ publicCode: string; title: string }[]>([]);
  const [leaseSaving, setLeaseSaving] = React.useState(false);
  const [formErr, setFormErr] = React.useState('');
  const setF = (k: keyof typeof blank, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const reloadLeases = React.useCallback(async () => {
    const { leases: ls, cfg: remote } = await fetchLeaseData();
    setLeases(ls);
    setCfg(remote);
  }, []);

  React.useEffect(() => {
    apiGet<{ items: { publicCode: string; title: string }[] }>('/api/properties')
      .then((r) => setCodes(r.items ?? []))
      .catch(() => setCodes([]));
  }, []);

  const openNew = () => { setFormErr(''); setForm({ ...blank }); };
  const openEdit = (l: Lease) => {
    setFormErr('');
    setForm({
      id: l.id, code: l.code, tenant: l.tenant,
      startDate: l.startDate ?? '',
      endDate: l.endDate ?? '',
      rent: String(l.rent ?? ''),
    });
  };

  const saveLease = async () => {
    if (!form || leaseSaving) return;
    setLeaseSaving(true);
    setFormErr('');
    try {
      const payload = { code: form.code, tenant: form.tenant, startDate: form.startDate || null, endDate: form.endDate, rent: Number(form.rent || 0) };
      if (form.id) await apiPatch(`/api/leases/${form.id}`, payload);
      else await apiPost('/api/leases', payload);
      setForm(null);
      await reloadLeases();
      flash(form.id ? 'แก้ไขสัญญาแล้ว' : 'บันทึกสัญญาแล้ว');
    } catch (e) {
      setFormErr(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setLeaseSaving(false);
    }
  };

  const closeLease = async (l: Lease) => {
    if (!window.confirm(`ปิดสัญญา ${l.code} · ${l.tenant}?\nจะไม่แจ้งเตือนสัญญานี้อีก`)) return;
    try {
      await apiPatch(`/api/leases/${l.id}`, { status: 'closed' });
      await reloadLeases();
      flash('ปิดสัญญาแล้ว');
    } catch (e) { window.alert(e instanceof ApiClientError ? e.message : 'ปิดสัญญาไม่สำเร็จ'); }
  };

  const removeLease = async (l: Lease) => {
    if (!window.confirm(`ลบสัญญา ${l.code} · ${l.tenant} ออกจากระบบ?`)) return;
    try {
      await apiDelete(`/api/leases/${l.id}`);
      await reloadLeases();
      flash('ลบสัญญาแล้ว');
    } catch (e) { window.alert(e instanceof ApiClientError ? e.message : 'ลบไม่สำเร็จ'); }
  };

  const flash = (m: string) => { setToast(m); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 2400); };

  const toggleMonth = (m: number) => {
    setCfg((c) => {
      const has = c.months.includes(m);
      const months = has ? c.months.filter((x) => x !== m) : [...c.months, m].sort((a, b) => a - b);
      if (!months.length && !c.includeExpired) { flash('ต้องเลือกอย่างน้อย 1 ช่วงเวลา'); return c; }
      return { ...c, months };
    });
    setDirty(true);
  };
  const setEnabled = (v: boolean) => { setCfg((c) => ({ ...c, enabled: v })); setDirty(true); };
  const setExpired = (v: boolean) => {
    setCfg((c) => {
      if (!v && !c.months.length) { flash('ต้องเลือกอย่างน้อย 1 ช่วงเวลา'); return c; }
      return { ...c, includeExpired: v };
    });
    setDirty(true);
  };
  // PUT the org thresholds (readIds stay per-user); localStorage stays as cache
  const [saving, setSaving] = React.useState(false);
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await apiPut('/api/notify-config', { enabled: cfg.enabled, months: cfg.months, includeExpired: cfg.includeExpired });
      saveNotifyConfig(cfg);
      setDirty(false);
      flash(`บันทึกแล้ว · แจ้งเตือน ${alerts.length} สัญญา`);
    } catch (e) {
      flash(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  const actions = (
    <button type="button" id="ns-save" className="ns-save" onClick={save} style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: dirty ? '#0D6C3B' : '#273c33', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap', border: 0, fontFamily: 'inherit', transition: 'transform .2s,box-shadow .2s' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M20 6L9 17l-5-5" /></svg>{dirty ? 'บันทึก *' : 'บันทึก'}
    </button>
  );

  return (
    <AdminShell
      active="settings"
      eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'การแจ้งเตือน' }]} />}
      title="การแจ้งเตือนสัญญาเช่า"
      actions={actions}
      css={nsCss}
    >
      <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
        เลือกว่าจะให้ระบบเตือนล่วงหน้ากี่เดือนก่อนสัญญาหมด — การแจ้งเตือนจะไปโผล่ที่<b>กระดิ่งด้านบน</b>ของหน้าแอดมิน
      </p>

      <div id="ns-split" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* ---- settings ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)' }}>เปิดการแจ้งเตือนสัญญาใกล้หมด</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted2)', marginTop: 2 }}>ปิดแล้วกระดิ่งจะไม่ขึ้นแจ้งเตือนเรื่องสัญญา</div>
              </div>
              <button type="button" id="ns-enable" role="switch" aria-checked={cfg.enabled} aria-label="เปิดการแจ้งเตือนสัญญาใกล้หมด" onClick={() => setEnabled(!cfg.enabled)} style={switchStyle(cfg.enabled)}><span style={knob(cfg.enabled)} /></button>
            </div>
          </div>

          <div style={{ ...card, opacity: cfg.enabled ? 1 : 0.55 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)' }}>แจ้งเตือนก่อนหมดสัญญา</div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted2)', margin: '2px 0 14px' }}>เลือกได้มากกว่า 1 ช่วง — ระบบจะเตือนเมื่อสัญญาเข้าใกล้ช่วงที่เลือก</div>
            <div id="ns-months" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {MILESTONE_MONTHS.map((m) => {
                const on = cfg.months.includes(m);
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => cfg.enabled && toggleMonth(m)}
                    aria-pressed={on}
                    style={{ flex: '1 1 auto', minWidth: 110, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, fontSize: '13.5px', fontWeight: 700, cursor: cfg.enabled ? 'pointer' : 'not-allowed', fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--bg)', color: on ? '#0D6C3B' : 'var(--text)' }}
                  >
                    <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--muted3)'), background: on ? '#0D6C3B' : 'transparent' }}>
                      {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>}
                    </span>
                    {m} เดือน
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>แจ้งเตือนสัญญาที่เลยกำหนดแล้วด้วย</div>
                <div style={{ fontSize: 11, color: 'var(--muted3)', marginTop: 2 }}>สัญญาที่ผ่านวันสิ้นสุดแต่ยังไม่ต่อ / ไม่ปิด</div>
              </div>
              <button type="button" id="ns-expired" role="switch" aria-checked={cfg.includeExpired} aria-label="แจ้งเตือนสัญญาที่เลยกำหนดแล้ว" onClick={() => cfg.enabled && setExpired(!cfg.includeExpired)} style={switchStyle(cfg.includeExpired)}><span style={knob(cfg.includeExpired)} /></button>
            </div>
          </div>

          {/* ---- the lease book ---- */}
          <div id="ns-leases" style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)' }}>สัญญาเช่าที่ยังใช้งาน</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>กระดิ่งเตือนจากรายการนี้ — ไม่มีสัญญาก็ไม่มีอะไรให้เตือน</div>
              </div>
              <button type="button" id="ns-lease-add" onClick={openNew} style={{ height: 34, padding: '0 14px', borderRadius: 9999, border: 0, background: '#0D6C3B', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6"><path d="M12 5v14M5 12h14" /></svg>เพิ่มสัญญา
              </button>
            </div>

            {leases.length === 0 && !form && (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted2)', lineHeight: 1.8 }}>
                ยังไม่มีสัญญาเช่าในระบบ<br />
                <span style={{ color: 'var(--muted3)' }}>ปิดดีลเช่าแล้วระบบจะบันทึกให้เอง หรือกด &ldquo;เพิ่มสัญญา&rdquo; เพื่อใส่สัญญาที่มีอยู่แล้ว</span>
              </div>
            )}

            {leases.map((l) => (
              <div key={l.id} data-lease={l.id} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{l.title || l.code}</div>
                  <div style={{ marginTop: 2, fontSize: 11, color: 'var(--muted)' }}>
                    <code style={{ color: '#0D6C3B', fontWeight: 700 }}>{l.code}</code> · {l.tenant} · ฿{l.rent.toLocaleString('th-TH')}/ด. ·{' '}
                    {l.endsInDays < 0 ? `เกินกำหนด ${Math.abs(l.endsInDays)} วัน` : `เหลือ ${l.endsInDays} วัน`}
                  </div>
                </div>
                <button type="button" onClick={() => openEdit(l)} style={leaseBtn} title="แก้ไขสัญญา">แก้ไข</button>
                <button type="button" onClick={() => void closeLease(l)} style={leaseBtn} title="ปิดสัญญา — เลิกแจ้งเตือน">ปิดสัญญา</button>
                <button type="button" onClick={() => void removeLease(l)} style={{ ...leaseBtn, color: '#C0392B', borderColor: '#E8C4BC' }} title="ลบสัญญา">ลบ</button>
              </div>
            ))}

            {form && (
              <div id="ns-lease-form" style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
                <label style={nsLabel}>ทรัพย์ *
                  <select data-lease-code value={form.code} onChange={(e) => setF('code', e.target.value)} style={nsInput}>
                    <option value="">เลือกทรัพย์</option>
                    {codes.map((c) => <option key={c.publicCode} value={c.publicCode}>{c.publicCode} · {c.title}</option>)}
                  </select>
                </label>
                <label style={nsLabel}>ผู้เช่า *
                  <input data-lease-tenant value={form.tenant} onChange={(e) => setF('tenant', e.target.value)} placeholder="ชื่อบริษัทผู้เช่า" style={nsInput} />
                </label>
                <label style={nsLabel}>เริ่มสัญญา
                  <input type="date" value={form.startDate} onChange={(e) => setF('startDate', e.target.value)} style={nsInput} />
                </label>
                <label style={nsLabel}>สิ้นสุดสัญญา *
                  <input data-lease-end type="date" value={form.endDate} onChange={(e) => setF('endDate', e.target.value)} style={nsInput} />
                </label>
                <label style={nsLabel}>ค่าเช่า (บาท/เดือน)
                  <input data-lease-rent value={form.rent} onChange={(e) => setF('rent', e.target.value)} inputMode="numeric" placeholder="0" style={nsInput} />
                </label>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {formErr && <span role="alert" style={{ fontSize: '11.5px', color: '#C0392B', fontWeight: 600, marginRight: 'auto' }}>{formErr}</span>}
                  <button type="button" onClick={() => setForm(null)} style={{ ...leaseBtn, marginLeft: formErr ? 0 : 'auto' }}>ยกเลิก</button>
                  <button type="button" id="ns-lease-save" onClick={() => void saveLease()} style={{ height: 34, padding: '0 16px', borderRadius: 9999, border: 0, background: '#0D6C3B', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: leaseSaving ? 'default' : 'pointer', opacity: leaseSaving ? .7 : 1, fontFamily: 'inherit' }}>{leaseSaving ? 'กำลังบันทึก…' : 'บันทึกสัญญา'}</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: '#F0ECF9', border: '1px solid #DCCFEC', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A3FB0" strokeWidth="1.9" style={{ flexShrink: 0, marginTop: 1 }}><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
            <span style={{ fontSize: 12, color: '#7A3FB0', lineHeight: 1.55 }}>
              ตอนนี้เข้าเกณฑ์ <b>{alerts.length}</b> สัญญา จากทั้งหมด <b>{leases.length}</b> สัญญาที่ยังใช้งาน · กด <b>บันทึก</b> แล้วกระดิ่งด้านบนจะอัปเดตทันที
            </span>
          </div>
        </div>

        {/* ---- live preview ---- */}
        <div id="ns-preview" style={{ position: 'sticky', top: 88 }}>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>ตัวอย่างการแจ้งเตือน</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>สิ่งที่จะเห็นในกระดิ่ง</div>
            </div>
            <div id="ns-preview-list" className="a-scroll" style={{ maxHeight: 460, overflowY: 'auto' }}>
              {!cfg.enabled ? (
                <div style={{ padding: '26px 18px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted2)' }}>ปิดการแจ้งเตือนอยู่</div>
              ) : alerts.length === 0 ? (
                <div style={{ padding: '26px 18px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted2)' }}>ยังไม่มีสัญญาที่เข้าเกณฑ์</div>
              ) : (
                alerts.map((a) => {
                  const lv = LEVEL[a.level];
                  return (
                    <div key={a.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: lv.bg, color: lv.fg, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>{lv.label}</span>
                        <code style={{ fontSize: 11, fontWeight: 700, color: '#0D6C3B' }}>{a.lease.code}</code>
                        {a.milestone && <span style={{ fontSize: 10, color: 'var(--muted3)' }}>· เกณฑ์ {a.milestone} เดือน</span>}
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.45 }}>{a.lease.title}</div>
                      <div style={{ marginTop: 2, fontSize: 11.5, color: 'var(--muted)' }}>
                        {a.lease.tenant} · {a.daysLeft < 0 ? `เกินกำหนด ${Math.abs(a.daysLeft)} วัน` : `เหลือ ${a.daysLeft} วัน`} (สิ้นสุด {a.endDateLabel})
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 900, background: '#0A0E0C', color: '#fff', padding: '12px 20px', borderRadius: 9999, fontSize: 13, fontWeight: 700, boxShadow: '0 12px 30px rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', gap: 9, maxWidth: 'calc(100vw - 32px)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2.6" style={{ flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
          {toast}
        </div>
      )}
    </AdminShell>
  );
}
