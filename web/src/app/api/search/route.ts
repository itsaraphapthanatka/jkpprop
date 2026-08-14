/* GET /api/search?q= — the topbar search box.
 *
 * The box has been in the header since the port, with a ⌘K hint next to it,
 * and it was an unbound input: typing in it did nothing and the shortcut was
 * not listened for. This is what it always looked like it did — one query
 * across the records the team looks up by code or by name.
 *
 * Scope and privilege follow the same rules as the list screens: an agent on
 * scope 'own' searches their own rows, and a lead's phone/email are only
 * matched for a user who is allowed to see them (§12.2 #3) — otherwise a
 * masked field would be searchable and could be read back a digit at a time.
 */
import { ok, handler } from '@/lib/server/api';
import { requireUser, scopeWhere, hasPriv } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { displayLocation } from '@/lib/server/propertyDto';
import { STATUS_LABEL } from '@/lib/server/requirements';

export type SearchHit = {
  kind: 'property' | 'lead' | 'requirement' | 'deal';
  id: string;
  title: string;
  sub: string;
  code: string;
  href: string;
};

const PER_KIND = 5;

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const q = (new URL(req.url).searchParams.get('q') || '').trim();
  // one character matches half the database and helps nobody
  if (q.length < 2) return ok({ items: [], q });

  const like = { contains: q, mode: 'insensitive' as const };
  const pii = hasPriv(user, 'pii');

  const [props, leads, reqs, deals] = await Promise.all([
    db.property.findMany({
      where: {
        orgId: user.orgId, ...scopeWhere(user, 'ownerId'),
        OR: [{ publicCode: like }, { title: like }],
      },
      orderBy: { updatedAt: 'desc' }, take: PER_KIND,
    }),
    db.lead.findMany({
      where: {
        orgId: user.orgId, ...scopeWhere(user, 'assigneeId'),
        OR: [
          { name: like }, { company: like },
          ...(pii ? [{ phone: like }, { email: like }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' }, take: PER_KIND,
    }),
    db.requirement.findMany({
      where: { orgId: user.orgId, OR: [{ code: like }, { usage: like }] },
      orderBy: { createdAt: 'desc' }, take: PER_KIND,
      include: { lead: { select: { name: true, company: true } } },
    }),
    db.deal.findMany({
      where: { orgId: user.orgId, title: like },
      orderBy: { updatedAt: 'desc' }, take: PER_KIND,
    }),
  ]);

  const items: SearchHit[] = [
    ...props.map((p) => ({
      kind: 'property' as const, id: p.id, code: p.publicCode, title: p.title || p.publicCode,
      sub: [displayLocation((p.values ?? {}) as Record<string, unknown>), p.status === 'active' ? 'เผยแพร่' : 'ยังไม่เผยแพร่'].filter(Boolean).join(' · '),
      href: `/admin/property-view?code=${encodeURIComponent(p.publicCode)}`,
    })),
    ...leads.map((l) => ({
      kind: 'lead' as const, id: l.id, code: '', title: l.company || l.name,
      sub: [l.company ? l.name : '', l.status].filter(Boolean).join(' · '),
      href: '/admin/leads',
    })),
    ...reqs.map((r) => ({
      kind: 'requirement' as const, id: r.id, code: r.code,
      title: r.lead?.company || r.lead?.name || r.code,
      sub: [STATUS_LABEL[r.status] ?? r.status, r.usage].filter(Boolean).join(' · '),
      href: `/admin/requirements/${r.id}`,
    })),
    ...deals.map((d) => ({
      kind: 'deal' as const, id: d.id, code: '', title: d.title,
      sub: [d.status === 'won' ? 'ปิดแล้ว' : d.status === 'lost' ? 'ไม่สำเร็จ' : 'กำลังเจรจา', d.amount ? `฿${d.amount.toLocaleString('th-TH')}` : ''].filter(Boolean).join(' · '),
      href: `/admin/deals/${d.id}`,
    })),
  ];

  return ok({ items, q });
});
