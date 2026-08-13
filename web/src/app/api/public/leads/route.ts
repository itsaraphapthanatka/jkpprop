/* POST /api/public/leads — 🔵 PUBLIC (§6.1): the requirement form on /contact.
   Rate-limited + honeypot; returns { ok: true } only — never internal data.
   Validation mirrors the form exactly (§8). */
import { ok, handler, ApiError, rateLimit, clientIp } from '@/lib/server/api';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import type { Prisma } from '@prisma/client';
import { nextRequirementCode, requirementFromForm } from '@/lib/server/requirements';

type ReqItem = { k: string; v: string };

export const POST = handler(async (req: Request) => {
  rateLimit(`lead:${clientIp(req)}`, 5, 60_000);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw new ApiError('VALIDATION', 'ข้อมูลไม่ถูกต้อง', 400);

  // honeypot: a hidden "website" input humans never fill — pretend success
  if (typeof body.website === 'string' && body.website.trim() !== '') return ok({ ok: true });

  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const respondentType = String(body.respondentType || '').trim();
  if (!name) throw new ApiError('VALIDATION', 'กรุณากรอกชื่อของคุณ', 400, { name: 'กรุณากรอกชื่อของคุณ' });
  if (!phone) throw new ApiError('VALIDATION', 'กรุณากรอกเบอร์โทรศัพท์ เพื่อให้ทีมงานติดต่อกลับได้', 400, { phone: 'กรุณากรอกเบอร์โทรศัพท์ เพื่อให้ทีมงานติดต่อกลับได้' });
  if (!respondentType) throw new ApiError('VALIDATION', 'กรุณาเลือกสถานะของผู้ตอบแบบสอบถาม', 400, { respondentType: 'กรุณาเลือกสถานะของผู้ตอบแบบสอบถาม' });

  const org = await db.org.findFirst({ select: { id: true } });
  if (!org) throw new ApiError('INTERNAL', 'ระบบยังไม่พร้อมใช้งาน', 500);

  const reqItems: ReqItem[] = Array.isArray(body.req)
    ? (body.req as ReqItem[]).filter((r) => r && typeof r.k === 'string' && typeof r.v === 'string').slice(0, 40)
    : [];

  const lead = await db.lead.create({
    data: {
      orgId: org.id,
      name: name.slice(0, 200),
      phone: phone.slice(0, 50),
      email: String(body.email || '').trim().slice(0, 200),
      company: String(body.company || '').trim().slice(0, 200) || null,
      respondentType: respondentType.slice(0, 100),
      message: String(body.message || '').trim().slice(0, 2000),
      typeKey: String(body.typeKey || 'warehouse').slice(0, 40),
      typeLabel: String(body.typeLabel || '').slice(0, 100),
      dealIntent: String(body.dealIntent || '').slice(0, 40),
      req: reqItems as unknown as Prisma.InputJsonValue,
      source: 'requirement form',
    },
  });

  /* Flow B starts here. The form's answers used to stop at `Lead.req` — an
     untyped list Ops could read but not work on. A Requirement is created
     alongside so the submission arrives in the queue with a code, a status and
     somewhere to record the availability checks. `req` is kept as the verbatim
     record of what was submitted. */
  let requirementCode = '';
  try {
    requirementCode = await nextRequirementCode(org.id);
    await db.requirement.create({
      data: {
        orgId: org.id,
        code: requirementCode,
        leadId: lead.id,
        /* the same parser the backfill script uses — this path used to copy
           over only the usage and the locations and silently drop the size,
           the budget, the licence answer and the move-in date */
        ...requirementFromForm(reqItems, lead),
      },
    });
  } catch {
    /* the customer's submission is already saved; a missing working copy is a
       problem for Ops to fix, not a reason to tell them the form failed */
  }

  await audit({
    user: null, orgId: org.id, action: 'lead.create', entity: 'lead', entityId: lead.id,
    after: { source: 'requirement form', typeKey: lead.typeKey, requirement: requirementCode },
    ip: clientIp(req),
  });

  return ok({ ok: true });
});
