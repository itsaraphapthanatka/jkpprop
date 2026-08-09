'use client';

import * as React from 'react';
import { AdminShell } from './AdminShell';

/* Browsable API reference, rendered from /api/openapi.json.

   Written against the admin design system rather than pulling in Swagger UI:
   the page has to sit inside AdminShell, and "ส่ง request" reuses the caller's
   existing session cookie — so a request fired here is subject to exactly the
   same RBAC as the real app, which is the point of trying it from in here. */

type Operation = {
  summary?: string;
  description?: string;
  tags?: string[];
  security?: unknown[];
  parameters?: { name: string; in: string; required?: boolean; description?: string }[];
  requestBody?: { content?: Record<string, { schema?: unknown }> };
  responses?: Record<string, { description?: string }>;
};
type Doc = {
  info: { title: string; version: string; description?: string };
  tags: { name: string; description?: string }[];
  paths: Record<string, Record<string, Operation>>;
};

const METHOD_COLOR: Record<string, { bg: string; fg: string }> = {
  get: { bg: '#EEF4F3', fg: '#034956' },
  post: { bg: '#E8F3EC', fg: '#0D6C3B' },
  put: { bg: '#FBF3E1', fg: '#9A741C' },
  patch: { bg: '#FBF3E1', fg: '#9A741C' },
  delete: { bg: '#F9E4E1', fg: '#C0392B' },
};

const mono = "'JetBrains Mono',monospace";

const docsCss = `
.op-row:hover{background:var(--tint);}
@media (max-width:900px){ #docs-split{grid-template-columns:1fr !important;} }
@media (max-width:640px){ #admin-main > main{ padding:16px 14px 44px !important; } }
`;

function MethodBadge({ method }: { method: string }) {
  const c = METHOD_COLOR[method] ?? { bg: 'var(--bg2,#F3F0EC)', fg: 'var(--muted)' };
  return (
    <span style={{ minWidth: 58, height: 22, padding: '0 8px', borderRadius: 6, background: c.bg, color: c.fg, fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono, flexShrink: 0 }}>
      {method.toUpperCase()}
    </span>
  );
}

export function ApiDocsBody() {
  const [doc, setDoc] = React.useState<Doc | null>(null);
  const [q, setQ] = React.useState('');
  const [openTag, setOpenTag] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<{ path: string; method: string } | null>(null);

  // "try it" state
  const [tryBody, setTryBody] = React.useState('');
  const [tryPath, setTryPath] = React.useState('');
  const [result, setResult] = React.useState<{ status: number; text: string } | null>(null);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/openapi.json')
      .then((r) => r.json())
      .then((d: Doc) => { setDoc(d); setOpenTag(d.tags[0]?.name ?? null); })
      .catch(() => setDoc(null));
  }, []);

  const operations = React.useMemo(() => {
    if (!doc) return [];
    const rows: { path: string; method: string; op: Operation }[] = [];
    for (const [path, ops] of Object.entries(doc.paths)) {
      for (const [method, op] of Object.entries(ops)) rows.push({ path, method, op });
    }
    return rows;
  }, [doc]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return operations;
    return operations.filter((r) =>
      r.path.toLowerCase().includes(needle)
      || r.method.includes(needle)
      || (r.op.summary ?? '').toLowerCase().includes(needle),
    );
  }, [operations, q]);

  const current = selected
    ? operations.find((r) => r.path === selected.path && r.method === selected.method)
    : null;

  // reset the request editor whenever a different operation is opened
  React.useEffect(() => {
    if (!current) return;
    setResult(null);
    setTryPath(current.path);
    const hasBody = !!current.op.requestBody;
    setTryBody(hasBody ? '{\n  \n}' : '');
  }, [current]);

  const send = async () => {
    if (!current || sending) return;
    setSending(true);
    setResult(null);
    try {
      const method = current.method.toUpperCase();
      const init: RequestInit = { method, credentials: 'same-origin' };
      if (!['GET', 'DELETE'].includes(method) && tryBody.trim()) {
        init.headers = { 'Content-Type': 'application/json' };
        init.body = tryBody;
      }
      const res = await fetch(tryPath, init);
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not JSON — show raw */ }
      setResult({ status: res.status, text: pretty.slice(0, 20000) });
    } catch (e) {
      setResult({ status: 0, text: e instanceof Error ? e.message : 'ส่ง request ไม่สำเร็จ' });
    } finally {
      setSending(false);
    }
  };

  const actions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 220 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา path หรือคำอธิบาย" style={{ border: 0, outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
      </div>
      <a href="/api/openapi.json" target="_blank" rel="noreferrer" style={{ height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>
        openapi.json
      </a>
    </div>
  );

  const byTag = (tag: string) => filtered.filter((r) => r.op.tags?.includes(tag));

  return (
    <AdminShell active="settings" eyebrow="ระบบ" title="API Reference" actions={actions} css={docsCss}>
      {!doc ? (
        <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: 'var(--muted3)' }}>กำลังโหลดเอกสาร…</div>
      ) : (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px', marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{doc.info.title} <span style={{ fontFamily: mono, fontSize: 12, color: 'var(--muted2)', fontWeight: 600 }}>v{doc.info.version}</span></div>
            <div style={{ marginTop: 8, fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{doc.info.description}</div>
            <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--muted3)' }}>{operations.length} operations · {Object.keys(doc.paths).length} paths</div>
          </div>

          <div id="docs-split" style={{ display: 'grid', gridTemplateColumns: '1fr 460px', gap: 20, alignItems: 'start' }}>
            {/* operation list, grouped by tag */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {doc.tags.map((tag) => {
                const rows = byTag(tag.name);
                if (!rows.length) return null;
                const open = openTag === tag.name || !!q.trim();
                return (
                  <div key={tag.name} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setOpenTag(open && !q.trim() ? null : tag.name)}
                      style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', border: 0, borderBottom: open ? '1px solid var(--border)' : 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                    >
                      <span style={{ width: 4, height: 15, borderRadius: 3, background: '#0D6C3B', flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{tag.name}</span>
                        {tag.description && <span style={{ marginLeft: 8, fontSize: 11.5, color: 'var(--muted3)' }}>{tag.description}</span>}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted3)', flexShrink: 0 }}>{rows.length}</span>
                    </button>
                    {open && rows.map((r) => {
                      const active = selected?.path === r.path && selected?.method === r.method;
                      return (
                        <div
                          key={r.method + r.path}
                          className="op-row"
                          onClick={() => setSelected({ path: r.path, method: r.method })}
                          style={{ padding: '11px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: active ? 'rgba(13,108,59,.06)' : undefined }}
                        >
                          <MethodBadge method={r.method} />
                          <code style={{ fontFamily: mono, fontSize: 12, color: 'var(--text)', flexShrink: 0 }}>{r.path}</code>
                          <span style={{ fontSize: 11.5, color: 'var(--muted2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.op.summary}</span>
                          {r.op.security?.length === 0 && (
                            <span style={{ marginLeft: 'auto', height: 18, padding: '0 7px', borderRadius: 9999, background: '#EEF4F3', color: '#034956', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>public</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {!filtered.length && (
                <div style={{ padding: 30, textAlign: 'center', fontSize: 13, color: 'var(--muted3)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>ไม่พบ endpoint ที่ตรงกับคำค้น</div>
              )}
            </div>

            {/* detail + try it */}
            <div style={{ position: 'sticky', top: 88, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              {!current ? (
                <div style={{ padding: '30px 6px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted3)', lineHeight: 1.7 }}>
                  เลือก endpoint ทางซ้ายเพื่อดูรายละเอียด<br />และทดลองส่ง request ด้วย session ปัจจุบัน
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                    <MethodBadge method={current.method} />
                    <code style={{ fontFamily: mono, fontSize: 12.5, fontWeight: 700, color: 'var(--text)', overflowWrap: 'anywhere' }}>{current.path}</code>
                  </div>
                  <div style={{ marginTop: 10, fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{current.op.summary}</div>
                  {current.op.description && (
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>{current.op.description}</div>
                  )}

                  {!!current.op.parameters?.length && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>พารามิเตอร์</div>
                      {current.op.parameters.map((p) => (
                        <div key={p.in + p.name} style={{ marginTop: 7, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <code style={{ fontFamily: mono, fontSize: 11.5, color: '#0D6C3B', fontWeight: 700, flexShrink: 0 }}>{p.name}</code>
                          <span style={{ fontSize: 10.5, color: 'var(--muted3)', flexShrink: 0 }}>{p.in}{p.required ? ' · จำเป็น' : ''}</span>
                          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{p.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!!current.op.responses && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>การตอบกลับ</div>
                      {Object.entries(current.op.responses).map(([code, r]) => (
                        <div key={code} style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                          <code style={{ fontFamily: mono, fontSize: 11.5, fontWeight: 700, color: code.startsWith('2') ? '#0D6C3B' : '#C0392B', flexShrink: 0 }}>{code}</code>
                          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{r.description}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* try it */}
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>ทดลองเรียก</div>
                    <input
                      value={tryPath}
                      onChange={(e) => setTryPath(e.target.value)}
                      spellCheck={false}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', fontFamily: mono, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
                    />
                    <div style={{ marginTop: 5, fontSize: 10.5, color: 'var(--muted3)' }}>แทนที่ {'{param}'} ด้วยค่าจริงก่อนส่ง</div>

                    {!!current.op.requestBody && (
                      <textarea
                        value={tryBody}
                        onChange={(e) => setTryBody(e.target.value)}
                        spellCheck={false}
                        style={{ marginTop: 10, width: '100%', height: 120, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontFamily: mono, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none', resize: 'vertical' }}
                      />
                    )}

                    <button
                      type="button"
                      onClick={send}
                      disabled={sending}
                      style={{ marginTop: 10, height: 40, width: '100%', borderRadius: 9999, border: 0, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.7 : 1, fontFamily: 'inherit' }}
                    >
                      {sending ? 'กำลังส่ง…' : 'ส่ง request'}
                    </button>
                    <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--muted3)', lineHeight: 1.6 }}>
                      ใช้ session ของคุณเอง — สิทธิ์ที่ได้จึงเท่ากับตอนใช้งานจริง และคำสั่งที่แก้ข้อมูลจะแก้ของจริง
                    </div>

                    {result && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ height: 20, padding: '0 8px', borderRadius: 6, background: result.status >= 200 && result.status < 300 ? '#E8F3EC' : '#F9E4E1', color: result.status >= 200 && result.status < 300 ? '#0D6C3B' : '#C0392B', fontFamily: mono, fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>
                            {result.status || 'ERR'}
                          </span>
                        </div>
                        <pre style={{ marginTop: 8, padding: 12, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', fontFamily: mono, fontSize: 11.5, lineHeight: 1.6, maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{result.text}</pre>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
