/* ข้อความบันทึกอัตโนมัติของ lead ที่เอาไปโชว์ได้จริง
 *
 * ตอนเลื่อนสถานะ lead ระบบเขียนบันทึกไว้เองพร้อมเหตุผลสำหรับ audit log ต่อท้าย
 * ซึ่งเป็นรหัสภายในล้วน ๆ
 *
 *   สถานะเปลี่ยนเป็น "ไม่สำเร็จ" · deal cmt0wopu8003dp501haasx0sn lost
 *   สถานะเปลี่ยนเป็น "นัดเข้าชมแล้ว" · visit cmt0vp1x20025p5018nwcyfle
 *
 * ตอนนี้ระบบไม่เขียนส่วนหลังแล้ว (lib/server/leadPipeline) แต่แถวเก่าที่บันทึก
 * ไว้ก่อนหน้ายังมีอยู่ในฐานข้อมูล ตัดตอนแสดงผลจึงอ่านได้ทั้งของเก่าและของใหม่
 * โดยไม่ต้องไปแก้ข้อมูลบน production
 */

/** รหัสของ Prisma (cuid) ที่หลุดมาอยู่ในข้อความ */
const AUDIT_TAIL = /\s·\s(deal|visit|shortlist|requirement|confirm|req)\s+c[a-z0-9]{20,}(\s+\w+)?$/i;

export const displayNoteText = (text: string): string =>
  text.startsWith('สถานะเปลี่ยนเป็น "') ? text.replace(AUDIT_TAIL, '') : text;
