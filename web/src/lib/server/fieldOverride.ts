/* What the Field Builder says about one property type.
 *
 * The setting is per organisation and lives in the FieldOverride table. The
 * admin form has read it since the Field Builder shipped; the public detail
 * page did not, so a field switched off stayed on the website and a field the
 * team added never reached it. Both pages read it here now.
 */
import { db } from './db';
import type { FieldDef } from '@/lib/propertySchema';

export type Override = {
  disabled: string[];
  extra: FieldDef[];
  /* ชื่อ/หน่วย ที่ทีมแก้ทับฟิลด์มาตรฐาน — ต้องส่งถึงหน้าเว็บด้วย ไม่งั้นแก้ชื่อ
     ในหลังบ้านแล้วตารางหน้าทรัพย์ยังขึ้นชื่อเดิม */
  edits: Record<string, { label?: string; en?: string; zh?: string; unit?: string }>;
};
const EMPTY: Override = { disabled: [], extra: [], edits: {} };

export async function loadFieldOverride(orgId: string, typeKey: string): Promise<Override> {
  try {
    const row = await db.fieldOverride.findUnique({ where: { orgId_typeKey: { orgId, typeKey } } });
    if (!row) return EMPTY;
    return {
      disabled: Array.isArray(row.disabled) ? row.disabled.map(String) : [],
      extra: Array.isArray(row.extra) ? (row.extra as unknown as FieldDef[]) : [],
      edits: row.edits && typeof row.edits === 'object' ? (row.edits as Override['edits']) : {},
    };
  } catch {
    /* the page is worth more than the customisation: fall back to the plain
       schema rather than failing to render the property at all */
    return EMPTY;
  }
}

/** Drop the values of fields the org switched off, before anything public. */
export function stripDisabled<T extends Record<string, unknown>>(values: T, disabled: string[]): T {
  if (!disabled.length) return values;
  const out = { ...values };
  for (const k of disabled) delete out[k];
  return out;
}
