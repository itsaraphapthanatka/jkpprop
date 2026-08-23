/* ลำดับเมนูที่ทีมจัดไว้ อ่านจากฝั่งเซิร์ฟเวอร์เพื่อส่งให้แถบบนสุดทั้งสี่ชุด
   อ่านไม่ได้ = คืนลำดับตั้งต้น ไม่ใช่เมนูว่าง — เมนูหายทั้งเว็บเพราะคิวรีพลาด
   เป็นราคาที่แพงเกินไปสำหรับการตั้งค่าเล็ก ๆ แบบนี้ */
import { db } from './db';

export async function loadNavOrder(orgId?: string): Promise<string[]> {
  try {
    const org = orgId
      ? await db.org.findUnique({ where: { id: orgId }, select: { navOrder: true } })
      : await db.org.findFirst({ select: { navOrder: true } });
    return org?.navOrder ?? [];
  } catch {
    return [];
  }
}
