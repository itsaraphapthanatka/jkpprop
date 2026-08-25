/* รหัสงานหนึ่งชุด — ใช้ตัวเดียวกันตลอดสาย
 *
 * คุณกิตติพงษ์แจ้ง 25 ส.ค. 2569 ว่า Requirement → Shortlist → Visit → Deal
 * "ต้องเป็นรหัสตัวเดียวกัน เพื่อให้จบเป็นงาน ๆ ไป และง่ายต่อการตรวจ"
 *
 * เดิมแต่ละหน้าคิดรหัสของตัวเอง: หน้าแผนเข้าชมโชว์ 'FR-VIS-07' ซึ่งเป็นเลขข้อ
 * ในเอกสารสเปก ไม่ใช่รหัสงาน · หน้าดีลตัดท้าย id ของแถวมา 6 ตัวได้
 * 'DEAL-7RS13H' ที่ไม่ผูกกับอะไรเลย ทั้งสองอันจึงไม่มีทางตรงกับ REQ-1018
 *
 * ต้นทางของรหัสมีที่เดียวคือ Requirement.code แล้วขั้นถัดไปยืมไปใช้
 */

/** REQ-1018 → DEAL-REQ-1018 */
export const dealCode = (requirementCode?: string | null): string => {
  const c = (requirementCode ?? '').trim();
  return c ? `DEAL-${c}` : '';
};

/* ดีลที่เปิดขึ้นมาเองโดยไม่ผ่านใบงาน (ลูกค้าเดินเข้ามาปิดเลย) ไม่มีรหัสงานให้
   ยืม — ยังต้องเรียกมันด้วยอะไรสักอย่าง จึงถอยไปใช้ท้าย id เหมือนเดิม
   แต่หน้าจอจะบอกกำกับว่ายังไม่ได้ผูกใบงาน ไม่ปล่อยให้ดูเหมือนรหัสงานจริง */
export const looseDealCode = (dealId?: string | null): string =>
  dealId ? `DEAL-${String(dealId).slice(-6).toUpperCase()}` : '';

/** รหัสที่จะโชว์บนหน้าดีล + บอกว่าเป็นรหัสงานจริงหรือรหัสสำรอง */
export const dealCodeOf = (
  requirementCode?: string | null,
  dealId?: string | null,
): { code: string; linked: boolean } => {
  const linked = dealCode(requirementCode);
  return linked ? { code: linked, linked: true } : { code: looseDealCode(dealId), linked: false };
};
