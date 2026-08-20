/* GET /api/requirements/:id/candidates — ทรัพย์ที่น่าจะตรงกับความต้องการนี้
 *
 * สไลด์ 35 · "รู้ความต้องการแล้วจะคัดของยังไง · จะติดต่อเจ้าของอย่างไร ·
 *             มีวิธีเพิ่มทรัพย์และค้นหาแบบแมนนวลได้อย่างไร"
 * สไลด์ 37 · "REQ เช็คอย่างไร · นำเบอร์เจ้าของมาจากไหน · จำเป็นต้องมีรูปเพราะ
 *             ใช้ระบบรัน code ไม่รู้รหัส"
 *
 * เดิมช่องบันทึกผลเช็คเป็นกล่องข้อความให้พิมพ์รหัสทรัพย์ ซึ่งคนคีย์ไม่มีทางรู้
 * ต้องเปิดอีกหน้าไปหาเอง เส้นนี้คืนรายการทรัพย์ที่เข้าเกณฑ์ พร้อมรูป ราคา
 * ขนาด สถานะว่าง และเบอร์ผู้ติดต่อ — ครบพอให้ยกหูโทรได้เลยจากหน้าเดียว
 *
 * เบอร์ผู้ติดต่อเป็นข้อมูลภายใน เส้นนี้ต้องล็อกอินและอยู่ใน org เดียวกันเสมอ
 */
import { ok, handler, ApiError } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { displayArea, displayProvince } from '@/lib/server/propertyDto';
import { propertyType } from '@/lib/propertySchema';

type Vals = Record<string, unknown>;
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export const GET = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const r = await db.requirement.findFirst({ where: { id, orgId: user.orgId } });
  if (!r) throw new ApiError('NOT_FOUND', 'ไม่พบ requirement นี้', 404);

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().toLowerCase();

  const rows = await db.property.findMany({
    where: { orgId: user.orgId, status: 'active' },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });
  const taken = new Set(
    (await db.listing.findMany({
      where: { propertyId: { in: rows.map((p) => p.id) }, status: 'unavailable' },
      select: { propertyId: true },
    })).map((l) => l.propertyId),
  );
  // ทรัพย์ที่เช็คไปแล้วในรายการนี้ ไม่ต้องเสนอซ้ำ
  const already = new Set(
    (await db.availabilityCheck.findMany({ where: { requirementId: id }, select: { propertyId: true } }))
      .map((c) => c.propertyId),
  );

  const wantProvinces = (Array.isArray(r.locations) ? r.locations : [])
    .map((l) => str((l as { name?: unknown })?.name))
    .filter(Boolean);

  const items = rows.map((p) => {
    const v = (p.values ?? {}) as Vals;
    const area = displayArea(v);
    const rent = num(v.price_rent);
    const sale = num(v.price_sale) ?? num(v.price);
    const price = r.dealIntent.includes('ขาย') ? sale ?? rent : rent ?? sale;
    const province = displayProvince(v);
    const photos = Array.isArray(v.photos) ? (v.photos as string[]) : [];

    /* ทำไมถึงเสนอ / ทำไมถึงไม่ตรง — บอกเป็นข้อ ๆ ให้คนตัดสินใจเอง ไม่ใช่
       ซ่อนของที่เกือบตรงทิ้งไปเงียบ ๆ */
    const misses: string[] = [];
    if (r.typeKey && p.typeKey !== r.typeKey) misses.push(`เป็น${propertyType(p.typeKey).label}`);
    if (r.areaMin && area !== null && area < r.areaMin) misses.push('เล็กกว่าที่ขอ');
    if (r.areaMax && area !== null && area > r.areaMax) misses.push('ใหญ่กว่าที่ขอ');
    if (r.budgetMax && price !== null && price > r.budgetMax) misses.push('เกินงบ');
    if (r.budgetMin && price !== null && price < r.budgetMin) misses.push('ต่ำกว่างบที่ตั้งไว้');
    if (wantProvinces.length && province && !wantProvinces.some((w) => province.includes(w) || w.includes(province))) {
      misses.push('คนละจังหวัดกับที่ขอ');
    }
    if (r.needsRor4 && v.factory_license !== 'ได้' && v.factory_license !== true) misses.push('ยังไม่ยืนยันเรื่อง ร.ง.4');

    return {
      id: p.id,
      code: p.publicCode,
      title: p.title,
      typeLabel: propertyType(p.typeKey).label,
      province,
      area,
      price,
      /* รูปแรกไว้ยืนยันว่าใช่ตัวที่คุยกัน — สไลด์ 37 บอกว่าคนทำงานหลายคน
         ดูรหัสอย่างเดียวไม่พอ */
      img: photos[0] ?? null,
      available: !taken.has(p.id),
      contactName: str(v.lessor_name),
      contactPhone: str(v.lessor_phone),
      contactCompany: str(v.lessor_company),
      alreadyChecked: already.has(p.id),
      misses,
      fit: misses.length === 0,
    };
  });

  const searched = q
    ? items.filter((i) => `${i.code} ${i.title} ${i.province}`.toLowerCase().includes(q))
    : items;

  /* ตรงเงื่อนไขก่อน · ว่างก่อน · ที่เช็คไปแล้วไปท้าย */
  const sorted = [...searched].sort(
    (a, b) => Number(a.alreadyChecked) - Number(b.alreadyChecked)
      || Number(b.fit) - Number(a.fit)
      || Number(b.available) - Number(a.available)
      || a.misses.length - b.misses.length,
  );

  return ok({ items: sorted.slice(0, 40), total: searched.length });
});
