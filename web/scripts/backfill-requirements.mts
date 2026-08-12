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
import { nextRequirementCode, requirementInput } from '../src/lib/server/requirements.ts';

const commit = process.argv.includes('--commit');
const db = new PrismaClient();

type ReqItem = { k: string; v: string };

/** "2,000 – 3,500 ตร.ม." → [2000, 3500] · "฿150,000 – 250,000/ด." → [150000, 250000] */
const range = (raw: string): [number | null, number | null] => {
  const nums = (raw.match(/[\d,]+/g) ?? []).map((n) => Number(n.replace(/,/g, ''))).filter(Number.isFinite);
  if (!nums.length) return [null, null];
  if (nums.length === 1) return [nums[0], null];
  return [Math.min(...nums), Math.max(...nums)];
};

const leads = await db.lead.findMany({
  include: { requirements: { select: { id: true } } },
  orderBy: { createdAt: 'asc' },
});

let made = 0;
let skipped = 0;

for (const lead of leads) {
  if (lead.requirements.length) { skipped++; continue; }

  const items: ReqItem[] = Array.isArray(lead.req)
    ? (lead.req as ReqItem[]).filter((r) => r && typeof r.k === 'string' && typeof r.v === 'string')
    : [];
  const find = (...keys: string[]) => {
    for (const k of keys) {
      const hit = items.find((r) => r.k.includes(k));
      if (hit) return hit.v;
    }
    return '';
  };

  const [areaMin, areaMax] = range(find('ขนาด', 'พื้นที่ใช้สอย'));
  const [budgetMin, budgetMax] = range(find('งบ', 'ราคา'));
  const locationsRaw = find('ทำเล', 'จังหวัด', 'พื้นที่ที่ต้องการ');

  const input = requirementInput({
    dealIntent: lead.dealIntent,
    typeKey: lead.typeKey,
    usage: find('ประเภทการใช้งาน', 'การใช้งาน'),
    areaMin, areaMax, budgetMin, budgetMax,
    needsRor4: /ร\.?ง\.?4/.test(find('ร.ง.4', 'ใบอนุญาต')) || /ใช่|ต้องการ/.test(find('ร.ง.4')),
    nearPort: /ท่าเรือ|สนามบิน/.test(locationsRaw + find('ใกล้')),
    note: lead.message,
    locations: locationsRaw.split(/[,·]/),
  });

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
