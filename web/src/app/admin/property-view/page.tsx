import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { db } from '@/lib/server/db';
import { currentUser } from '@/lib/server/auth';
import { stripInternal, displayArea, displayLocation } from '@/lib/server/propertyDto';
import { buildSpecs } from '@/lib/server/propertySpecs';
import { loadFieldOverride } from '@/lib/server/fieldOverride';
import { propertyType } from '@/lib/propertySchema';
import { DEFAULT_LOCALE } from '@/i18n/config';

export const metadata: Metadata = { title: 'Property View · JKP CMS', robots: { index: false } };

/* Read-only view of one property.
 *
 * Every figure on this page used to be a constant: JKP-SPK0042, 2,700 ตร.ม.,
 * 4 ไร่, a fixed feature list, three translations and a change history. The
 * row menu on /admin/properties has always passed ?code= — the page simply
 * never read it, so "ดูรายละเอียด" on any of the three properties opened the
 * same imaginary warehouse.
 *
 * Sections with nothing behind them (the change history) are gone rather than
 * invented; the audit log is the real answer there and it has its own screen.
 */

const si = (paths: React.ReactNode, color: string) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9">{paths}</svg>
);

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 };
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace" };

const STATUS_CHIP: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: '#E8F3EC', fg: '#0D6C3B', label: 'เผยแพร่' },
  draft: { bg: '#FBF3E1', fg: '#9A741C', label: 'ร่าง' },
  hidden: { bg: '#EFEDE8', fg: '#6B665E', label: 'ซ่อน' },
  archived: { bg: '#EFEDE8', fg: '#6B665E', label: 'เก็บเข้าคลัง' },
};

const pvCss = `
@media (max-width:1000px){ #pv-split{grid-template-columns:1fr !important;} }
@media (max-width:640px){ #pv-status{grid-template-columns:1fr !important;} }
`;

const nf = new Intl.NumberFormat('en-US');
const baht = (n: number) => '฿' + nf.format(n);

export default async function AdminPropertyViewPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await currentUser();
  if (!user) redirect('/admin/login?next=/admin/property-view');

  const sp = await searchParams;
  const raw = Array.isArray(sp.code) ? sp.code[0] : sp.code;
  const code = (raw ?? '').trim();

  const property = code
    ? await db.property.findFirst({ where: { orgId: user.orgId, publicCode: code } }).catch(() => null)
    : null;

  if (!property) {
    return (
      <AdminShell active="properties" eyebrow="ทรัพย์ / รายละเอียด" title="ไม่พบทรัพย์" css={pvCss}>
        <div style={{ ...card, textAlign: 'center', padding: '48px 22px' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
            {code ? `ไม่พบทรัพย์รหัส ${code}` : 'ไม่ได้ระบุว่าจะดูทรัพย์ไหน'}
          </div>
          <div style={{ marginTop: 6, fontSize: '12.5px', color: 'var(--muted)' }}>
            เปิดหน้านี้จากเมนู &ldquo;ดูรายละเอียด&rdquo; ของทรัพย์ในตาราง
          </div>
          <Link href="/admin/properties" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>← กลับไปรายการทรัพย์</Link>
        </div>
      </AdminShell>
    );
  }

  const values = stripInternal(property.typeKey, (property.values ?? {}) as Record<string, unknown>, user);
  const area = displayArea(values);
  const location = displayLocation(values);
  const schema = await loadFieldOverride(property.orgId, property.typeKey);
  const specs = buildSpecs(values, DEFAULT_LOCALE, schema, undefined, { code: property.publicCode, typeLabel: propertyType(property.typeKey).label });
  const chip = STATUS_CHIP[property.status] ?? { bg: 'var(--bg)', fg: 'var(--muted2)', label: property.status };

  const rent = Number(values.price_rent ?? NaN);
  const sale = Number(values.price_sale ?? values.price ?? NaN);
  const photos = Array.isArray(values.photos) ? (values.photos as string[]) : [];

  const listings = await db.listing.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  const statusCards = [
    { label: 'สถานะ', value: chip.label, iconBg: '#EEF4F3', icon: si(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, '#034956') },
    { label: 'พื้นที่รวม', value: area !== null ? `${nf.format(area)} ตร.ม.` : '—', iconBg: '#EEF4F3', icon: si(<><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 3v18" /></>, '#034956') },
    {
      label: Number.isFinite(rent) ? 'ค่าเช่า' : 'ราคาขาย',
      value: Number.isFinite(rent) ? `${baht(rent)}/ด.` : Number.isFinite(sale) ? baht(sale) : 'ยังไม่ระบุ',
      iconBg: '#E8F3EC',
      icon: si(<><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>, '#0D6C3B'),
    },
    { label: 'ประกาศที่ผูกอยู่', value: `${listings.length} รายการ`, iconBg: '#E8F3EC', icon: si(<><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" /></>, '#0D6C3B') },
  ];

  const eyebrow = (
    <>
      <Link href="/admin/properties" style={{ color: 'var(--muted2)' }}>Properties</Link> / รายละเอียด
    </>
  );
  const title = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {property.title || 'ไม่มีชื่อ'}
      <code style={{ ...mono, fontSize: 12, fontWeight: 700, color: '#0D6C3B', background: '#E8F3EC', padding: '2px 8px', borderRadius: 6 }}>{property.publicCode}</code>
      <code style={{ ...mono, fontSize: 12, fontWeight: 700, color: chip.fg, background: chip.bg, padding: '2px 8px', borderRadius: 6 }}>{chip.label}</code>
    </span>
  );
  const actions = (
    <Link
      href={`/admin/property-edit?code=${encodeURIComponent(property.publicCode)}`}
      style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700 }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>แก้ไขทรัพย์
    </Link>
  );

  return (
    <AdminShell
      active="properties"
      eyebrow={eyebrow as unknown as string}
      title={title as unknown as string}
      actions={actions}
      css={pvCss}
    >
      <div id="pv-status" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {statusCards.map((c) => (
          <div key={c.label} style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{c.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>{c.label}</div>
              <div style={{ marginTop: 2, fontSize: 15, fontWeight: 800, color: 'var(--text)', overflowWrap: 'anywhere' }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div id="pv-split" style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {photos.length > 0 && (
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: photos.length > 1 ? '2fr 1fr' : '1fr', gap: 2 }}>
                {photos.slice(0, 3).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`${property.title} รูปที่ ${i + 1}`} style={{ width: '100%', height: i === 0 ? 260 : 129, objectFit: 'cover', display: 'block' }} />
                ))}
              </div>
            </div>
          )}

          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>ข้อมูลทรัพย์</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>รหัสทรัพย์</span>
                <span style={{ ...mono, fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{property.publicCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>ประเภท</span>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{propertyType(property.typeKey).label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>ทำเล</span>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{location || '—'}</span>
              </div>
              {[...specs.quick, ...specs.rows].map((sp) => (
                <div key={sp.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{sp.label}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{sp.value}</span>
                </div>
              ))}
            </div>
          </div>

          {specs.features.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>จุดเด่น</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {specs.features.map((f) => (
                  <span key={f} style={{ height: 28, padding: '0 12px', borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'inline-flex', alignItems: 'center' }}>{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>ประกาศ</div>
            {listings.length === 0 && (
              <div style={{ fontSize: '12.5px', color: 'var(--muted3)', lineHeight: 1.7 }}>
                ยังไม่มีประกาศที่ผูกกับทรัพย์นี้
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {listings.map((l) => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg)' }}>
                  <span style={{ flex: 1, fontSize: '12.5px', color: 'var(--text)' }}>
                    {l.publishedAt ? `เผยแพร่ ${new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(l.publishedAt)}` : 'ยังไม่เผยแพร่'}
                  </span>
                  <span style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: l.status === 'published' ? '#E8F3EC' : '#FBF3E1', color: l.status === 'published' ? '#0D6C3B' : '#9A741C', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>{l.status}</span>
                </div>
              ))}
            </div>
            <Link href="/admin/listings" style={{ display: 'inline-block', marginTop: 12, fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)' }}>จัดการประกาศ →</Link>
          </div>

          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>ประวัติการแก้ไข</div>
            {/* A four-entry change log used to sit here with invented dates and
                editors. Every change is already written to the audit log, which
                has its own screen — pointing at it beats inventing one. */}
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.7 }}>
              อัปเดตล่าสุด {new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(property.updatedAt)}
            </div>
            <Link href="/admin/audit" style={{ display: 'inline-block', marginTop: 10, fontSize: '12.5px', fontWeight: 700, color: 'var(--accent)' }}>ดูประวัติทั้งหมดที่ Audit log →</Link>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
