/* Give every existing lead the Requirement it should always have had.
 *
 *   npm run requirements:backfill              # show what would be created
 *   npm run requirements:backfill -- --commit
 *
 * Leads created before this table existed carry their criteria in `Lead.req`,
 * an untyped list of {k,v} pairs the form happened to send. Without this the
 * Requirements queue would open empty even though the enquiries are sitting
 * right there in the CRM.
 *
 * Leads that already have a requirement are skipped, so it is safe to re-run.
 */
import { PrismaClient } from '@prisma/client';
import { nextRequirementCode, requirementFromForm, type ReqItem } from '../src/lib/server/requirements.ts';

const commit = process.argv.includes('--commit');
/* Requirements created before the intake parser was fixed have blanks where
   the form did send a size or a budget. This re-reads Lead.req into them —
   only into fields that are still empty, so anything Ops typed by hand wins. */
const reparse = process.argv.includes('--reparse');
const db = new PrismaClient();

const leads = await db.lead.findMany({
  include: { requirements: true },
  orderBy: { createdAt: 'asc' },
});

let made = 0;
let skipped = 0;

let refilled = 0;

for (const lead of leads) {
  if (lead.requirements.length) {
    if (!reparse) { skipped++; continue; }

    const parsed = requirementFromForm((lead.req ?? []) as ReqItem[], lead);
    for (const r of lead.requirements) {
      const gaps: Record<string, unknown> = {};
      if (r.areaMin === null && parsed.areaMin !== null) { gaps.areaMin = parsed.areaMin; gaps.areaMax = parsed.areaMax; }
      if (r.budgetMin === null && parsed.budgetMin !== null) { gaps.budgetMin = parsed.budgetMin; gaps.budgetMax = parsed.budgetMax; }
      if (!r.usage && parsed.usage) gaps.usage = parsed.usage;
      if (!r.needsRor4 && parsed.needsRor4) gaps.needsRor4 = true;
      if (!r.moveIn && parsed.moveIn) gaps.moveIn = parsed.moveIn;
      const locs = Array.isArray(r.locations) ? r.locations : [];
      if (!locs.length && (parsed.locations as unknown[])?.length) gaps.locations = parsed.locations;

      if (!Object.keys(gaps).length) { skipped++; continue; }
      console.log(`~ ${r.code.padEnd(9)} เติม ${Object.keys(gaps).join(', ')}`);
      refilled++;
      if (commit) await db.requirement.update({ where: { id: r.id }, data: gaps });
    }
    continue;
  }

  /* One parser, shared with the live intake — this script used to have its
     own copy, and for a while it was the more complete of the two. */
  const input = requirementFromForm((lead.req ?? []) as ReqItem[], lead);

  /* A lead already past the requirement stage was clearly confirmed at some
     point — don't drop it back into the "รอตรวจสอบ" queue. */
  const past = ['requirements_confirmed', 'shortlisted', 'visit_scheduled', 'negotiating', 'won'];
  const status = past.includes(lead.status) ? 'confirmed' : 'submitted';

  const label = `${lead.company || lead.name} · ${input.areaMin ?? '?'}–${input.areaMax ?? '?'} ตร.ม.`;
  console.log(`+ ${status.padEnd(9)} ${label}`);
  made++;

  if (commit) {
    const code = await nextRequirementCode(lead.orgId);
    await db.requirement.create({
      data: {
        orgId: lead.orgId,
        code,
        leadId: lead.id,
        status,
        ...(status === 'confirmed' ? { confirmedAt: lead.updatedAt } : {}),
        ...input,
      },
    });
  }
}

console.log(
  `\nlead ทั้งหมด ${leads.length} · ไม่ต้องแตะ ${skipped} · ` +
  (reparse ? `เติมช่องที่ว่าง ${refilled} · ` : '') +
  (made
    ? `สร้างใหม่ ${made}${commit ? ' — เขียนแล้ว' : ' — ยังไม่เขียนอะไร (ใส่ --commit เพื่อเขียนจริง)'}`
    : 'ไม่มีอะไรต้องสร้าง'),
);

await db.$disconnect();
