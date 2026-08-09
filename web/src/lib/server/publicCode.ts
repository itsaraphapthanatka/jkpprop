/* ============================================================
   public_code generation (SPEC_PACK FR-ADM-08):
   - Bangkok:       JKP{n}
   - Other province JKP-{3-letter code}{n}
   n = 4-digit zero-padded, per-prefix counter, transaction-safe.
   Immutable after creation (FRONTEND_API_SPEC §8).
   ============================================================ */
import { db } from './db';

export const PROVINCE_CODES: Record<string, string> = {
  กรุงเทพมหานคร: 'BKK',
  กรุงเทพฯ: 'BKK',
  กรุงเทพ: 'BKK',
  สมุทรปราการ: 'SPK',
  สมุทรสาคร: 'SKN',
  นนทบุรี: 'NBI',
  ปทุมธานี: 'PTE',
  พระนครศรีอยุธยา: 'AYA',
  อยุธยา: 'AYA',
  ฉะเชิงเทรา: 'CCO',
  ชลบุรี: 'CBI',
  ระยอง: 'RYG',
  นครปฐม: 'NPT',
  ราชบุรี: 'RBR',
  สระบุรี: 'SRI',
  ปราจีนบุรี: 'PRI',
  นครราชสีมา: 'NMA',
  ขอนแก่น: 'KKN',
  เชียงใหม่: 'CMI',
  ภูเก็ต: 'PKT',
  สงขลา: 'SKA',
};

function provinceCode(provinceName: string | undefined): string | null {
  if (!provinceName) return null;
  const name = provinceName.trim();
  if (PROVINCE_CODES[name]) return PROVINCE_CODES[name];
  // partial match tolerates values like "จ.ชลบุรี" or "ชลบุรี (แหลมฉบัง)"
  for (const [th, code] of Object.entries(PROVINCE_CODES)) {
    if (name.includes(th)) return code;
  }
  return null;
}

/** Next public_code for a property in a province — transaction-safe counter. */
export async function nextPublicCode(orgId: string, provinceName?: string): Promise<string> {
  const code = provinceCode(provinceName);
  const prefix = !code || code === 'BKK' ? 'JKP' : `JKP-${code}`;
  // `next` stores the NEXT unused number; upsert returns the post-write row,
  // so the number we just consumed is always next - 1.
  const counter = await db.codeCounter.upsert({
    where: { orgId_prefix: { orgId, prefix } },
    create: { orgId, prefix, next: 2 },
    update: { next: { increment: 1 } },
  });
  const n = counter.next - 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
}
