/* Company contact details.
   GET is public — the footers and the contact page render from it.
   PUT is owner+marketing, same as the other content surfaces. */
import { ok, handler, ApiError } from '@/lib/server/api';
import { refreshPublicPages } from '@/lib/server/publicCache';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import type { Prisma } from '@prisma/client';

const LOCALES = ['th', 'en', 'zh'] as const;
const MAX = 400;

type Tr = Record<string, string>;

const text = (v: unknown, max = MAX) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** keep only the three locales, as trimmed strings */
const trBlock = (v: unknown): Tr => {
  const src = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const out: Tr = {};
  for (const l of LOCALES) out[l] = text(src[l]);
  return out;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s<>"']+$/i;
const SOCIALS = ['lineUrl', 'facebookUrl', 'whatsappUrl', 'instagramUrl'] as const;
/* not a URL, so it is not validated as one */
const PLAIN = ['wechatId'] as const;

export const GET = handler(async () => {
  const row = await db.companyProfile.findFirst();
  return ok(row ?? {});
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing');

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  const salesEmail = text(body.salesEmail, 200);
  const generalEmail = text(body.generalEmail, 200);
  const fields: Record<string, string> = {};
  if (salesEmail && !EMAIL.test(salesEmail)) fields.salesEmail = 'อีเมลไม่ถูกต้อง';
  if (generalEmail && !EMAIL.test(generalEmail)) fields.generalEmail = 'อีเมลไม่ถูกต้อง';
  /* A phone with no number is a row somebody started and abandoned; it would
     render as an empty pill on the contact page. */
  const phones = (Array.isArray(body.phones) ? body.phones : [])
    .map((p) => ({ number: text((p as Record<string, unknown>)?.number, 40), label: text((p as Record<string, unknown>)?.label, 40) }))
    .filter((p) => p.number)
    .slice(0, 6);

  const socials: Record<string, string> = {};
  for (const k of SOCIALS) {
    const v = text(body[k], 300);
    if (v && !URL_RE.test(v)) fields[k] = 'ต้องขึ้นต้นด้วย https:// เท่านั้น';
    socials[k] = v;
  }
  if (Object.keys(fields).length) throw new ApiError('VALIDATION', 'ตรวจสอบข้อมูลอีกครั้ง', 400, fields);

  const data = {
    ...socials,
    ...Object.fromEntries(PLAIN.map((k) => [k, text(body[k], 100)])),
    legalName: text(body.legalName, 200),
    address: trBlock(body.address) as Prisma.InputJsonValue,
    shortLocation: trBlock(body.shortLocation) as Prisma.InputJsonValue,
    phones: phones as unknown as Prisma.InputJsonValue,
    salesEmail,
    generalEmail,
    hoursDays: trBlock(body.hoursDays) as Prisma.InputJsonValue,
    hoursValue: text(body.hoursValue, 80),
  };

  const before = await db.companyProfile.findUnique({ where: { orgId: user.orgId } });
  const saved = await db.companyProfile.upsert({
    where: { orgId: user.orgId },
    create: { orgId: user.orgId, ...data },
    update: data,
  });
  await audit({ user, orgId: user.orgId, action: 'company.save', entity: 'companyProfile', entityId: user.orgId, before, after: saved });
  refreshPublicPages();
  return ok(saved);
});
