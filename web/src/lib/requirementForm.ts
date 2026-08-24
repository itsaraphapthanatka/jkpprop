/* กติกาการแปลงช่องที่กรอก → ชุด req ที่ส่งเข้าระบบงานขาย
 *
 * ฟอร์ม "แจ้งความต้องการ" บนหน้าติดต่อ กับฟอร์ม "เพิ่ม Lead ใหม่" ในหลังบ้าน
 * ต้องเก็บข้อมูลชุดเดียวกัน (คุณกิตติพงษ์สั่ง 24 ส.ค. 2569) — เดิมหลังบ้านเขียน
 * ช่องไว้ตายตัวสามช่อง (พื้นที่ · ทำเล · งบ) จึงไม่มีที่กรอก ระบบไฟ · ร.ง.4 ·
 * ผังเมืองสี ที่ฟอร์มหน้าเว็บถามตามประเภททรัพย์ และป้ายชื่อช่องก็เขียนคนละแบบ
 * ทำให้ตัวอ่านความต้องการ (requirementFromForm) จับคู่ไม่ตรง
 *
 * ทั้งสองฝั่งเรียกที่นี่ที่เดียว จะได้ไม่มีวันเพี้ยนออกจากกันอีก — หน้าตาของ
 * ช่องกรอกยังเป็นของใครของมันได้ตามสไตล์ของหน้านั้น
 */
import type { FieldDef } from './propertySchema';

export type ReqItem = { k: string; v: string };

/** ค่าเริ่มต้นของฟอร์ม — ความต้องการตั้งไว้ที่ "เช่า" เหมือนหน้าเว็บ */
export const emptyReqValues = (): Record<string, unknown> => ({ deal_intent: 'เช่า' });

/** เปลี่ยนประเภททรัพย์แล้วล้างช่องเฉพาะประเภทเดิมทิ้ง แต่เก็บความต้องการไว้ */
export const resetReqValues = (prev: Record<string, unknown>): Record<string, unknown> =>
  ({ deal_intent: (prev.deal_intent as string) ?? 'เช่า' });

/** "เช่า" | "ซื้อ" — เก็บเป็นคอลัมน์ของ lead ไม่ใช่รายการใน req */
export const dealIntentOf = (values: Record<string, unknown>): string =>
  (values.deal_intent as string) || 'เช่า';

/**
 * ช่องที่กรอกไว้ → [{ k: ป้ายชื่อช่อง, v: ค่า }]
 * ป้ายชื่อคือสิ่งที่ requirementFromForm ใช้จับคู่ จึงต้องเป็นป้ายจาก schema
 * ตรง ๆ ห้ามพิมพ์เอง
 */
export function buildReqItems(fields: readonly FieldDef[], values: Record<string, unknown>): ReqItem[] {
  const req: ReqItem[] = [];
  for (const f of fields) {
    if (f.key === 'deal_intent') continue; // เก็บแยกเป็นคอลัมน์ของ lead
    const raw = values[f.key];
    if (raw === undefined || raw === '' || raw === false) continue;
    if (f.kind === 'boolean') { req.push({ k: f.label, v: 'ต้องการ' }); continue; }
    const v = String(raw).trim();
    if (!v || v === 'ไม่ระบุ') continue; // "ไม่ระบุ" ที่เลือกไว้ ถือว่าเท่ากับเว้นว่าง
    req.push({ k: f.label, v: f.unit ? `${v} ${f.unit}` : v });
  }
  return req;
}
