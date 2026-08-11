/* Seed — dev bootstrap: org, users, geography, social channels, sample
   properties + leases whose public_codes match the old UI mocks. */
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SECTION_CATALOG, PAGE_KEYS } from '../src/lib/sectionCatalog';

const db = new PrismaClient();

const PROVINCES: [string, string, string][] = [
  ['กรุงเทพมหานคร', 'BKK', 'Bangkok'],
  ['สมุทรปราการ', 'SPK', 'Samut Prakan'],
  ['สมุทรสาคร', 'SKN', 'Samut Sakhon'],
  ['นนทบุรี', 'NBI', 'Nonthaburi'],
  ['ปทุมธานี', 'PTE', 'Pathum Thani'],
  ['พระนครศรีอยุธยา', 'AYA', 'Ayutthaya'],
  ['ฉะเชิงเทรา', 'CCO', 'Chachoengsao'],
  ['ชลบุรี', 'CBI', 'Chon Buri'],
  ['ระยอง', 'RYG', 'Rayong'],
];

async function main() {
  let org = await db.org.findFirst();
  if (!org) {
    org = await db.org.create({
      data: {
        name: 'JKP Property',
        notifyConfig: { enabled: true, months: [1, 3], includeExpired: true },
      },
    });
  }
  const orgId = org.id;

  const users: [string, string, string, string, string, string[]][] = [
    // email, password, name, role, scope, privileges
    ['owner@jkp.local', 'jkp12345', 'กิตติพงษ์ พรหมทอง', 'owner', 'all', ['pii', 'publish', 'price', 'deal_unlock', 'internal_note', 'export', 'audit']],
    ['manager@jkp.local', 'jkp12345', 'สุภาวดี ตั้งใจ', 'manager', 'all', ['pii', 'publish', 'price', 'internal_note']],
    ['agent@jkp.local', 'jkp12345', 'อนุชา แสงทอง', 'agent', 'own', ['pii', 'internal_note']],
  ];
  for (const [email, pw, name, role, scope, privileges] of users) {
    await db.user.upsert({
      where: { email },
      update: {},
      create: { orgId, email, passwordHash: await bcrypt.hash(pw, 10), name, role, scope, privileges },
    });
  }

  for (const [name, code, en] of PROVINCES) {
    const existing = await db.geoItem.findFirst({ where: { orgId, kind: 'province', name } });
    if (!existing) await db.geoItem.create({ data: { orgId, kind: 'province', name, code, meta: { en } } });
    else if (!existing.meta) await db.geoItem.update({ where: { id: existing.id }, data: { meta: { en } } });
  }

  const channels: [string, string][] = [
    ['ddproperty', 'DD Property'],
    ['facebook', 'Facebook'],
    ['instagram', 'Instagram'],
    ['proppit', 'PROPPIT'],
  ];
  for (let i = 0; i < channels.length; i++) {
    const [key, label] = channels[i];
    await db.socialChannel.upsert({
      where: { orgId_key: { orgId, key } },
      update: {},
      create: { orgId, key, label, sort: i },
    });
  }

  // sample properties matching the codes the old mock UI shows
  const props: [string, string, string, Record<string, unknown>][] = [
    ['JKP-SPK0042', 'warehouse', 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', {
      deal_type: 'เช่า', subdistrict: 'บางพลีใหญ่', district: 'บางพลี', province: 'สมุทรปราการ',
      building_area_total: 2700, price_rent: 405000, zoning_color: 'เม็ดมะปราง — คลังสินค้า',
    }],
    ['JKP0118', 'factory', 'โรงงาน ร.ง.4 บางนา 3,500 ตร.ม.', {
      deal_type: 'เช่า', province: 'กรุงเทพมหานคร', usable_area: 3500, price: 520000,
    }],
    ['JKP-CBI0007', 'warehouse', 'คลังสินค้าแหลมฉบัง 5,000 ตร.ม.', {
      deal_type: 'เช่า', district: 'ศรีราชา', province: 'ชลบุรี', building_area_total: 5000, price_rent: 750000,
    }],
  ];
  for (const [publicCode, typeKey, title, values] of props) {
    await db.property.upsert({
      where: { publicCode },
      update: {},
      create: { orgId, publicCode, typeKey, title, status: 'active', values: values as Prisma.InputJsonValue },
    });
  }
  // keep counters clear of the manually-seeded codes
  for (const prefix of ['JKP', 'JKP-SPK', 'JKP-CBI']) {
    await db.codeCounter.upsert({
      where: { orgId_prefix: { orgId, prefix } },
      update: {},
      create: { orgId, prefix, next: 200 },
    });
  }

  // leases: same book as the old leaseStore mock, with real end dates
  const day = 86400000;
  const leases: [string, string, string, number, number][] = [
    ['JKP-SPK0042', 'โกดังพร้อมสำนักงาน 2,700 ตร.ม.', 'บ. ไทยโลจิสติกส์', -6, 405000],
    ['JKP0118', 'โรงงาน ร.ง.4 บางนา 3,500 ตร.ม.', 'Sunrise Foods Ltd.', 12, 520000],
    ['JKP-CBI0007', 'คลังสินค้าแหลมฉบัง 5,000 ตร.ม.', 'Global Ware Inc.', 26, 750000],
    ['JKP-AYA0021', 'โกดังให้เช่า วังน้อย 1,300 ตร.ม.', 'Metro Pack Co.', 48, 195000],
    ['JKP-SPK0119', 'โกดังบางพลี 2,100 ตร.ม.', 'บ. เอเชีย โกลด์', 74, 315000],
    ['JKP-RYG0033', 'โรงงานระยอง 4,200 ตร.ม.', 'Nippon Steel TH', 96, 630000],
    ['JKP-CBI0044', 'คลังสินค้าศรีราชา 3,000 ตร.ม.', 'บ. ทรานส์ ไทย', 210, 450000],
  ];
  const haveLeases = await db.lease.count({ where: { orgId } });
  if (!haveLeases) {
    for (const [code, title, tenant, endsInDays, rent] of leases) {
      await db.lease.create({
        data: { orgId, code, title, tenant, endDate: new Date(Date.now() + endsInDays * day), rent },
      });
    }
  }

  // --- CMS content ---------------------------------------------------------
  const cms: [string, string, string, string, string][] = [
    // kind, slug, title, category, status
    ['pages', 'home', 'หน้าแรก (Home)', 'หน้าหลัก', 'published'],
    ['pages', 'about', 'เกี่ยวกับเรา', 'หน้าหลัก', 'published'],
    ['pages', 'contact', 'ติดต่อเรา', 'หน้าหลัก', 'published'],
    ['articles', 'why-port-location', 'ทำไมทำเลใกล้ท่าเรือจึงสำคัญต่อธุรกิจนำเข้า-ส่งออก', 'EEC & โลจิสติกส์', 'draft'],
    ['articles', 'choose-warehouse', 'เลือกโกดังอย่างไรให้เหมาะกับธุรกิจ', 'คู่มือผู้เช่า', 'published'],
    ['faq', 'rg4-license', 'ขอใบ ร.ง.4 ต้องเตรียมอะไรบ้าง', 'เอกสาร & ใบอนุญาต', 'published'],
    ['certs', 'treba', 'สมาชิก TREBA', 'การรับรอง', 'published'],
  ];
  for (const [kind, slug, title, category, status] of cms) {
    await db.cmsPage.upsert({
      where: { orgId_kind_slug: { orgId, kind, slug } },
      update: {},
      create: {
        orgId, kind, slug, title, category, status,
        content: { th: { title, body: `<p>${title}</p>`, done: true } } as Prisma.InputJsonValue,
      },
    });
  }

  /* --- Page sections -------------------------------------------------------
     One row per block the public pages actually render, straight from the
     catalogue so the seed cannot drift from what the editor offers. Content
     starts empty on purpose: every component carries a translated default,
     and a seeded Thai headline would quietly become the English page's copy
     the moment someone published. */
  for (const page of PAGE_KEYS) {
    const defs = SECTION_CATALOG[page];
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      await db.pageSection.upsert({
        where: { orgId_pageKey_key: { orgId, pageKey: page, key: d.key } },
        update: {},
        create: {
          orgId, pageKey: page, key: d.key, type: d.type, name: d.name, desc: d.desc,
          sort: i, enabled: true, content: {} as Prisma.InputJsonValue,
        },
      });
    }
  }

  await db.branding.upsert({ where: { orgId }, update: {}, create: { orgId } });
  await db.seoConfig.upsert({ where: { orgId }, update: {}, create: { orgId, subscribed: false } });

  // --- one open shortlist / visit / deal so the pipeline pages have a record -
  const seedProps = await db.property.findMany({ where: { orgId }, take: 2 });
  if (seedProps.length && !(await db.shortlist.count({ where: { orgId } }))) {
    await db.shortlist.create({
      data: {
        orgId, name: 'ตัวเลือกสำหรับลูกค้ารายแรก', token: 'demo-shortlist-token',
        items: { create: seedProps.map((p, i) => ({ propertyId: p.id, sort: i })) },
      },
    });
  }
  if (seedProps.length && !(await db.visit.count({ where: { orgId } }))) {
    await db.visit.create({
      data: {
        orgId, date: new Date(Date.now() + 3 * day),
        stops: { create: seedProps.map((p, i) => ({ propertyId: p.id, sort: i })) },
      },
    });
  }
  if (!(await db.deal.count({ where: { orgId } }))) {
    await db.deal.create({
      data: { orgId, title: 'เช่าโกดังบางพลี — บ. ไทยโลจิสติกส์', amount: 385000, propertyId: seedProps[0]?.id ?? null },
    });
  }

  console.log('Seeded org', orgId);
  console.log('Login: owner@jkp.local / jkp12345 (manager@…, agent@… same password)');
}

main().finally(() => db.$disconnect());
