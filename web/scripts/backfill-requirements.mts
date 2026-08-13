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
const db = new PrismaClient();

const leads = await db.lead.findMany({
  include: { requirements: { select: { id: true } } },
  orderBy: { createdAt: 'asc' },
});

let made = 0;
let skipped = 0;

for (const lead of leads) {
  if (lead.requirements.length) { skipped++; continue; }

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
  `\nlead ทั้งหมด ${leads.length} · มี requirement อยู่แล้ว ${skipped} · ` +
  (made
    ? `สร้างใหม่ ${made}${commit ? ' — เขียนแล้ว' : ' — ยังไม่เขียนอะไร (ใส่ --commit เพื่อเขียนจริง)'}`
    : 'ไม่มีอะไรต้องสร้าง'),
);

await db.$disconnect();
