/* รูปร่างของ "แผนเข้าชม" ที่ส่งออกไปให้หน้าจอ — ที่เดียว
 *
 * เดิมมีอยู่ในไฟล์ route ของรายการอย่างเดียว หน้ารายละเอียดจึงไม่มีทางขอแผน
 * ทีละใบได้ ต้องขอทั้งรายการมาแล้วค้นหาตัวเองในนั้น — และรายการถูกตัดไว้ที่
 * 200 แถว แผนที่หลุดอันดับจึงเปิดไม่ได้เลย หน้าจอขึ้นว่า "ยังไม่มีแผนเข้าชม"
 * ทั้งที่ข้อมูลอยู่ครบในฐานข้อมูล
 */
import { db } from './db';
import { displayLocation } from './propertyDto';

type VisitRow = {
  id: string; orgId: string; leadId: string | null; requirementId: string | null;
  date: Date; status: string; note: string | null; gateConfirmed: boolean;
  stops: { id: string; propertyId: string; result: string | null }[];
};

export const VISIT_INCLUDE = { stops: { orderBy: { sort: 'asc' as const } } };

/** แปลงแถวจากฐานข้อมูลเป็นสิ่งที่หน้าจอใช้ — ใช้ร่วมกันทั้งรายการและรายละเอียด */
export async function visitDtos(orgId: string, rows: VisitRow[]) {
  const propIds = [...new Set(rows.flatMap((v) => v.stops.map((s) => s.propertyId)))];
  const leadIds = [...new Set(rows.map((v) => v.leadId).filter(Boolean) as string[])];
  const reqIds = [...new Set(rows.map((v) => v.requirementId).filter(Boolean) as string[])];

  const [props, leadRows, reqRows] = await Promise.all([
    propIds.length
      ? db.property.findMany({ where: { id: { in: propIds } }, select: { id: true, publicCode: true, title: true, values: true } })
      : Promise.resolve([]),
    /* สไลด์ 41 · "ชื่อลูกค้าหรือบริษัทอยู่ตรงไหน · รู้ได้อย่างไรว่าทำแผนลูกค้า
       เจ้าไหน" — แผนเข้าชมรู้ว่าเป็นของ lead ไหน แต่ไม่เคยส่งชื่อออกมา */
    leadIds.length
      ? db.lead.findMany({ where: { id: { in: leadIds } }, select: { id: true, name: true, company: true, phone: true } })
      : Promise.resolve([]),
    /* ใบงานที่แผนนี้ผูกไว้จริง — เดิมโค้ดตรงนี้หยิบใบล่าสุดของลูกค้ารายนั้นมา
       เพราะแผนเข้าชมไม่มีช่องเก็บ ผลคือลูกค้าที่เปิดหลายใบ (REQ-1009/1010/1011
       ของเจ้าเดียวกัน มีอยู่จริงในระบบ) จะได้รหัสของใบที่ไม่เกี่ยวกับทริปนี้
       ตอนนี้ประทับตอนสร้าง แล้วอ่านค่าที่ประทับไว้ */
    reqIds.length
      ? db.requirement.findMany({ where: { orgId, id: { in: reqIds } }, select: { id: true, code: true } })
      : Promise.resolve([]),
  ]);

  const byId = new Map(props.map((p) => [p.id, p]));
  const leadById = new Map(leadRows.map((l) => [l.id, l]));
  const reqById = new Map(reqRows.map((r) => [r.id, r]));

  return rows.map((v) => ({
    id: v.id,
    leadId: v.leadId,
    customer: v.leadId ? (leadById.get(v.leadId)?.company || leadById.get(v.leadId)?.name || '') : '',
    customerContact: v.leadId ? (leadById.get(v.leadId)?.name ?? '') : '',
    customerPhone: v.leadId ? (leadById.get(v.leadId)?.phone ?? '') : '',
    requirementId: v.requirementId,
    /* รหัสงานที่ทั้งสายต้องพูดตรงกัน — REQ-1018 */
    requirementCode: v.requirementId ? reqById.get(v.requirementId)?.code ?? '' : '',
    date: v.date.getTime(),
    status: v.status,
    /* ด่านยืนยันเกณฑ์ถูกเก็บลงฐานข้อมูลตั้งแต่แรก แต่ไม่เคยส่งกลับมา หน้าจอ
       จึงขึ้นว่า "ยังไม่ยืนยัน" ใหม่ทุกครั้งที่โหลด — ทีมต้องกดยืนยันซ้ำ
       ทุกรอบ และปุ่มที่ล็อกตามด่านนี้ (เด็ค Web 2026 ข้อ 21) ก็จะไม่มีวันปลด */
    gateConfirmed: v.gateConfirmed,
    note: v.note,
    /* the stop's own id: without it the screen could show outcomes but had
       no way to save one, so it invented the whole list instead */
    /* สไลด์ 41 · "ปุ่มหาย — ไปที่ประกาศ · โทรศัพท์ · โลเคชั่น" และ "ต้องมี
       รูปภาพเพื่อยืนยัน" — แต่ละจุดแวะมีแค่รหัสกับชื่อทำเล คนที่ออกไปพา
       ลูกค้าดูจึงเปิดประกาศไม่ได้ โทรหาเจ้าของไม่ได้ และนำทางไม่ได้
       (หน้านี้ต้องล็อกอิน เบอร์เจ้าของจึงส่งมาได้) */
    stops: v.stops.map((s) => {
      const prop = byId.get(s.propertyId);
      const vals = (prop?.values ?? {}) as Record<string, unknown>;
      const photos = Array.isArray(vals.photos) ? (vals.photos as string[]) : [];
      const pin = vals.location_map as { lat?: unknown; lng?: unknown } | undefined;
      return {
        id: s.id,
        code: prop?.publicCode ?? '',
        title: prop?.title ?? '',
        location: displayLocation(vals),
        result: s.result,
        img: photos[0] ?? null,
        contactName: String(vals.lessor_name ?? ''),
        contactPhone: String(vals.lessor_phone ?? ''),
        mapUrl: typeof pin?.lat === 'number' && typeof pin?.lng === 'number'
          ? `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`
          : displayLocation(vals)
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayLocation(vals))}`
            : '',
      };
    }),
  }));
}
