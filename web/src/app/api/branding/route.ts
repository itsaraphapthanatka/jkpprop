/* Branding (§9 /admin/branding) — colours, font, radius, logo per tenant.
   GET is public-readable so the site can theme itself; PUT is owner+marketing. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';

const HEX = /^#[0-9a-fA-F]{6}$/;
const FONTS = ['noto', 'plex', 'inter'];
const RADII = ['sharp', 'sm', 'md', 'round'];

const DEFAULTS = {
  brandName: 'JKP Property',
  primary: '#034956', accent: '#034956', neon: '#2DFB91', pine: '#273c33',
  font: 'noto', radius: 'md', logo: null as string | null,
};

export const GET = handler(async () => {
  const org = await db.org.findFirst({ select: { id: true } });
  if (!org) return ok(DEFAULTS);
  const b = await db.branding.findUnique({ where: { orgId: org.id } });
  if (!b) return ok(DEFAULTS);
  return ok({
    brandName: b.brandName, primary: b.primary, accent: b.accent, neon: b.neon,
    pine: b.pine, font: b.font, radius: b.radius, logo: b.logo,
  });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing');

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  // reject malformed hex instead of storing a value that breaks darken()
  const colour = (k: string, fallback: string) => {
    const v = body[k];
    if (v === undefined) return fallback;
    const s = String(v);
    if (!HEX.test(s)) throw new ApiError('VALIDATION', `รหัสสี ${k} ต้องเป็นรูปแบบ #RRGGBB`, 400, { [k]: 'รูปแบบสีไม่ถูกต้อง' });
    return s;
  };

  const data = {
    brandName: String(body.brandName ?? DEFAULTS.brandName).slice(0, 120) || DEFAULTS.brandName,
    primary: colour('primary', DEFAULTS.primary),
    accent: colour('accent', DEFAULTS.accent),
    neon: colour('neon', DEFAULTS.neon),
    pine: colour('pine', DEFAULTS.pine),
    font: FONTS.includes(String(body.font)) ? String(body.font) : DEFAULTS.font,
    radius: RADII.includes(String(body.radius)) ? String(body.radius) : DEFAULTS.radius,
    logo: typeof body.logo === 'string' ? body.logo : null,
  };

  const before = await db.branding.findUnique({ where: { orgId: user.orgId } });
  const saved = await db.branding.upsert({
    where: { orgId: user.orgId },
    create: { orgId: user.orgId, ...data },
    update: data,
  });
  await audit({
    user, orgId: user.orgId, action: 'branding.save', entity: 'branding', entityId: user.orgId,
    before: before ? { primary: before.primary, font: before.font, radius: before.radius } : null,
    after: { primary: saved.primary, font: saved.font, radius: saved.radius },
  });
  return ok(data);
});
