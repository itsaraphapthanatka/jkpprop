/* Page sections (§9 /admin/page-builder + /admin/sections) — both screens
   read and write this one table, so a section edited in either place shows
   up in the other (the two mock shapes had drifted apart).

   GET  ?page=home|about|contact
   PUT  — upsert the whole section list for one page (order = array order) */
import { ok, handler, ApiError } from '@/lib/server/api';
import { refreshPublicPages } from '@/lib/server/publicCache';
import { requireUser, requireRole } from '@/lib/server/auth';
import { audit } from '@/lib/server/audit';
import { db } from '@/lib/server/db';
import { mergeSectionContent, type SectionContent as Content } from '@/lib/mergeSectionContent';
import type { Prisma } from '@prisma/client';

const PAGES = ['home', 'about', 'contact', 'faq'];

export const GET = handler(async (req: Request) => {
  const user = await requireUser();
  const page = new URL(req.url).searchParams.get('page') || '';

  const rows = await db.pageSection.findMany({
    where: { orgId: user.orgId, ...(PAGES.includes(page) ? { pageKey: page } : {}) },
    orderBy: [{ pageKey: 'asc' }, { sort: 'asc' }],
  });
  return ok({
    items: rows.map((s) => ({
      id: s.id,
      pageKey: s.pageKey,
      key: s.key,
      type: s.type,
      name: s.name,
      desc: s.desc,
      sort: s.sort,
      enabled: s.enabled,
      img: s.img,
      content: (s.content ?? {}) as Content,
    })),
  });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  requireRole(user, 'owner', 'marketing');

  const body = (await req.json().catch(() => null)) as
    | {
      page?: string;
      /** true = payload นี้คือรายการเต็มของหน้านั้น · บล็อกที่ไม่ได้ส่งมาจะถูกลบ */
      deleteMissing?: boolean;
      sections?: { key: string; type?: string; name?: string; desc?: string; enabled?: boolean; img?: string | null; content?: Content }[];
    }
    | null;
  const page = String(body?.page || '');
  if (!PAGES.includes(page)) throw new ApiError('VALIDATION', 'ไม่พบหน้าที่ระบุ', 400);
  const sections = Array.isArray(body?.sections) ? body!.sections! : [];
  if (!sections.length) throw new ApiError('VALIDATION', 'ไม่มี section ให้บันทึก', 400);

  const before = await db.pageSection.findMany({ where: { orgId: user.orgId, pageKey: page }, orderBy: { sort: 'asc' } });

  const storedByKey = new Map(before.map((r) => [r.key, (r.content ?? {}) as Content]));
  const sortByKey = new Map(before.map((r) => [r.key, r.sort]));

  /* ปลายทางนี้เคยตีความ payload ว่าเป็น "รายการเต็มของหน้านั้น" เสมอ — ลบทุก
     บล็อกที่ไม่ได้ส่งมา และเขียนทับลำดับด้วยดัชนีในอาร์เรย์
     หน้าจอทั้งสองที่ส่งรายการเต็มอยู่แล้วจึงไม่เคยมีปัญหา แต่ 26 ส.ค. 2569
     มีการยิงคำสั่งบันทึกที่มีบล็อกเดียว เพื่อแก้ค่าการแสดงรูปของบล็อกนั้น
     ผลคือหน้าแรกของ production เหลือบล็อกเดียวจากเก้าบล็อก รูปหัวเว็บ รูปบล็อก
     "เหตุผลที่ลูกค้าเลือกเรา" และรูปแถบท้ายหน้าหายไปพร้อมกัน — ตอบ 200 ตามปกติ
     ไม่มีอะไรบอกว่าเพิ่งลบอะไรไป

     การลบจึงต้องขอมาให้ชัด ค่าตั้งต้นคือแก้เฉพาะบล็อกที่ส่งมา */
  const replaceAll = body?.deleteMissing === true;

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const key = String(s.key || '').slice(0, 60);
    if (!key) continue;
    const data = {
      type: s.type === 'hero' ? 'hero' : 'section',
      name: String(s.name || key).slice(0, 120),
      desc: String(s.desc || '').slice(0, 300),
      /* ลำดับมาจากดัชนีในอาร์เรย์ได้ก็ต่อเมื่อ payload คือรายการเต็ม
         ถ้าส่งมาบางส่วน บล็อกเดิมต้องอยู่ที่เดิม ของใหม่ต่อท้าย */
      sort: replaceAll ? i : sortByKey.get(key) ?? (before.length + i),
      enabled: s.enabled !== false,
      img: s.img ?? null,
      content: mergeSectionContent(storedByKey.get(key) ?? {}, s.content ?? {}) as Prisma.InputJsonValue,
    };
    await db.pageSection.upsert({
      where: { orgId_pageKey_key: { orgId: user.orgId, pageKey: page, key } },
      create: { orgId: user.orgId, pageKey: page, key, ...data },
      update: data,
    });
  }

  // sections dropped from the payload are removed (the UI soft-deletes first)
  let removed = 0;
  if (replaceAll) {
    const keep = new Set(sections.map((s) => String(s.key)));
    removed = (await db.pageSection.deleteMany({ where: { orgId: user.orgId, pageKey: page, key: { notIn: [...keep] } } })).count;
  }

  await audit({
    user, orgId: user.orgId, action: 'sections.save', entity: 'pageSection', entityId: page,
    before: { count: before.length }, after: { count: sections.length, removed, replaceAll },
  });

  const rows = await db.pageSection.findMany({ where: { orgId: user.orgId, pageKey: page }, orderBy: { sort: 'asc' } });
  refreshPublicPages();
  return ok({ items: rows.map((s) => ({ id: s.id, key: s.key, sort: s.sort, enabled: s.enabled })) });
});
