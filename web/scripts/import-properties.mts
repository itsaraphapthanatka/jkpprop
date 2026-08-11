/* Bulk-load properties (and their listing row) from a CSV.
 *
 *   npm run import:properties -- file.csv                 # validate only
 *   npm run import:properties -- file.csv --commit        # write
 *   npm run import:properties -- file.csv --type warehouse
 *
 * Validate-only is the default on purpose. This writes to whatever database
 * DATABASE_URL points at, an import is not a transaction the admin UI can
 * undo, and `public_code` is immutable once issued (FR-ADM-08) — a bad run
 * leaves permanent codes behind. Nothing is written unless every row passes,
 * so a typo on line 60 does not leave you with 59 half-imported properties.
 *
 * A row with `public_code` filled in updates that property; a blank one
 * creates a new property and the system issues the code.
 *
 * `.mts` on purpose: tsx compiles a plain `.ts` to CJS, which rejects the
 * top-level await this needs to query the database (same reason tests/api
 * are `.mts`).
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { db } from '../src/lib/server/db.ts';
import { audit } from '../src/lib/server/audit.ts';
import { nextPublicCode } from '../src/lib/server/publicCode.ts';
import { displayProvince } from '../src/lib/server/propertyDto.ts';
import { PROPERTY_TYPES } from '../src/lib/propertySchema.ts';
import type { Prisma } from '@prisma/client';
import { parseCsv } from './lib/csv.ts';
import { columnsFor, typeByKey, LISTING_STATUSES, PROPERTY_STATUSES, type Column } from './lib/importSchema.ts';

const argv = process.argv.slice(2);
const commit = argv.includes('--commit');
const file = argv.find((a) => !a.startsWith('--'));
const typeFlag = argv[argv.indexOf('--type') + 1];

if (!file) {
  console.error('ใช้: npm run import:properties -- <ไฟล์.csv> [--type <ประเภท>] [--commit]');
  process.exit(1);
}

/* ---- work out which property type this file describes ------------------- */
const fromName = basename(file).replace(/\.csv$/i, '').split(/[^a-z]/i)[0];
const typeKey = (argv.includes('--type') ? typeFlag : fromName) || '';
const type = typeByKey(typeKey);
if (!type) {
  console.error(`ระบุประเภททรัพย์ไม่ได้จากชื่อไฟล์ "${basename(file)}"`);
  console.error(`ใส่ --type <${PROPERTY_TYPES.map((t) => t.key).join('|')}>`);
  process.exit(1);
}

const rows = parseCsv(readFileSync(file, 'utf8'));
if (rows.length < 2) {
  console.error('ไฟล์ไม่มีข้อมูล (ต้องมีบรรทัดหัวตารางและอย่างน้อย 1 แถว)');
  process.exit(1);
}

/* ---- map the header to field keys, accepting Thai labels too ------------ */
const cols = columnsFor(type);
const byKey = new Map<string, Column>(cols.map((c) => [c.key, c]));
const byLabel = new Map<string, Column>(cols.map((c) => [c.label.trim(), c]));
const FIXED = new Set(['public_code', 'title', 'status', 'listing_status', 'typeKey']);

const header = rows[0].map((h) => h.trim());
const unknown: string[] = [];
const resolved = header.map((h) => {
  if (FIXED.has(h)) return { fixed: h } as const;
  const col = byKey.get(h) ?? byLabel.get(h);
  if (!col) { if (h) unknown.push(h); return null; }
  return { col } as const;
});

if (unknown.length) {
  console.error(`คอลัมน์ที่ไม่รู้จักสำหรับประเภท "${type.label}": ${unknown.join(', ')}`);
  console.error('ดูรายชื่อคอลัมน์ที่ถูกต้องได้จาก npm run import:template');
  process.exit(1);
}

/* ---- per-kind cell parsing ---------------------------------------------- */
type Problem = { line: number; column: string; message: string };
const problems: Problem[] = [];

const TRUE = new Set(['true', 'yes', 'y', '1', 'ใช่', 'มี']);
const FALSE = new Set(['false', 'no', 'n', '0', 'ไม่ใช่', 'ไม่มี', 'ไม่']);

function parseCell(col: Column, raw: string, line: number): unknown | undefined {
  const v = raw.trim();
  if (!v) {
    if (col.required) problems.push({ line, column: col.key, message: `${col.label} จำเป็นต้องกรอก` });
    return undefined;
  }

  switch (col.kind) {
    case 'number':
    case 'price': {
      const n = Number(v.replace(/[,\s฿]/g, ''));
      if (!Number.isFinite(n)) {
        problems.push({ line, column: col.key, message: `"${v}" ไม่ใช่ตัวเลข` });
        return undefined;
      }
      return n;
    }
    case 'boolean': {
      const low = v.toLowerCase();
      if (TRUE.has(low)) return true;
      if (FALSE.has(low)) return false;
      problems.push({ line, column: col.key, message: `"${v}" ต้องเป็น true/false หรือ ใช่/ไม่ใช่` });
      return undefined;
    }
    case 'date': {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
        problems.push({ line, column: col.key, message: `"${v}" ต้องเป็นวันที่แบบ YYYY-MM-DD` });
        return undefined;
      }
      return v;
    }
    case 'multiselect':
    case 'media': {
      const parts = v.split('|').map((p) => p.trim()).filter(Boolean);
      if (col.options?.length) {
        const bad = parts.filter((p) => !col.options!.includes(p));
        if (bad.length) {
          problems.push({ line, column: col.key, message: `ค่าที่ไม่อยู่ในรายการ: ${bad.join(', ')} — เลือกได้: ${col.options!.join(' | ')}` });
          return undefined;
        }
      }
      return parts;
    }
    case 'select':
    case 'dealtype': {
      if (col.options?.length && !col.options.includes(v)) {
        problems.push({ line, column: col.key, message: `"${v}" ไม่อยู่ในรายการ — เลือกได้: ${col.options.join(' | ')}` });
        return undefined;
      }
      return v;
    }
    default:
      return v;
  }
}

/* ---- build the rows ------------------------------------------------------ */
type Draft = {
  line: number;
  publicCode: string;
  title: string;
  status: string;
  listingStatus: string;
  values: Record<string, unknown>;
};

const drafts: Draft[] = [];
const seenCodes = new Set<string>();

for (let r = 1; r < rows.length; r++) {
  const line = r + 1; // 1-based, counting the header
  const cells = rows[r];
  const d: Draft = { line, publicCode: '', title: '', status: 'draft', listingStatus: '', values: {} };

  resolved.forEach((slot, i) => {
    if (!slot) return;
    const raw = (cells[i] ?? '').trim();

    if ('fixed' in slot) {
      if (slot.fixed === 'public_code') d.publicCode = raw;
      if (slot.fixed === 'title') d.title = raw;
      if (slot.fixed === 'status' && raw) d.status = raw;
      if (slot.fixed === 'listing_status') d.listingStatus = raw;
      return;
    }
    const parsed = parseCell(slot.col, raw, line);
    if (parsed !== undefined) d.values[slot.col.key] = parsed;
  });

  if (!d.title) problems.push({ line, column: 'title', message: 'ต้องมีชื่อทรัพย์' });
  if (!PROPERTY_STATUSES.includes(d.status)) {
    problems.push({ line, column: 'status', message: `"${d.status}" ต้องเป็น ${PROPERTY_STATUSES.join(' | ')}` });
  }
  if (d.listingStatus && !LISTING_STATUSES.includes(d.listingStatus)) {
    problems.push({ line, column: 'listing_status', message: `"${d.listingStatus}" ต้องเป็น ${LISTING_STATUSES.join(' | ')}` });
  }
  if (d.publicCode) {
    if (seenCodes.has(d.publicCode)) problems.push({ line, column: 'public_code', message: `รหัส ${d.publicCode} ซ้ำกับแถวก่อนหน้าในไฟล์เดียวกัน` });
    seenCodes.add(d.publicCode);
  }

  drafts.push(d);
}

/* ---- check the codes that claim to already exist ------------------------- */
const org = await db.org.findFirst({ orderBy: { createdAt: 'asc' } });
if (!org) {
  console.error('ไม่พบ org ในฐานข้อมูล — รัน seed ก่อน');
  process.exit(1);
}

const existing = new Map(
  (await db.property.findMany({
    where: { orgId: org.id, publicCode: { in: [...seenCodes] } },
    select: { id: true, publicCode: true, typeKey: true },
  })).map((p) => [p.publicCode, p]),
);

for (const d of drafts) {
  if (!d.publicCode) continue;
  const hit = existing.get(d.publicCode);
  if (!hit) {
    problems.push({ line: d.line, column: 'public_code', message: `ไม่พบทรัพย์รหัส ${d.publicCode} — เว้นว่างถ้าต้องการสร้างใหม่` });
  } else if (hit.typeKey !== type.key) {
    problems.push({ line: d.line, column: 'public_code', message: `${d.publicCode} เป็นประเภท ${hit.typeKey} ไม่ใช่ ${type.key}` });
  }
}

/* ---- report -------------------------------------------------------------- */
const creates = drafts.filter((d) => !d.publicCode).length;
const updates = drafts.length - creates;
const listings = drafts.filter((d) => d.listingStatus).length;

console.log(`ไฟล์      ${basename(file)}`);
console.log(`ประเภท    ${type.label} (${type.key})`);
console.log(`อ่านได้    ${drafts.length} แถว — สร้างใหม่ ${creates} · แก้ไข ${updates} · มีประกาศ ${listings}`);

if (problems.length) {
  console.error(`\n❌ พบปัญหา ${problems.length} จุด — ไม่มีการเขียนข้อมูลใด ๆ\n`);
  for (const p of problems.slice(0, 50)) {
    console.error(`  บรรทัด ${String(p.line).padStart(4)}  ${p.column.padEnd(18)} ${p.message}`);
  }
  if (problems.length > 50) console.error(`  … และอีก ${problems.length - 50} จุด`);
  process.exit(1);
}

console.log('\n✅ ตรวจผ่านทุกแถว');

if (!commit) {
  console.log('\nนี่คือการตรวจอย่างเดียว ยังไม่ได้เขียนข้อมูล');
  console.log('เขียนจริงด้วย: npm run import:properties -- ' + file + ' --commit');
  process.exit(0);
}

/* ---- write --------------------------------------------------------------- */
let created = 0;
let updated = 0;

for (const d of drafts) {
  if (d.publicCode) {
    const hit = existing.get(d.publicCode)!;
    const before = await db.property.findUnique({ where: { id: hit.id } });
    // public_code is never part of the update — it is immutable once issued
    const after = await db.property.update({
      where: { id: hit.id },
      data: { title: d.title, status: d.status, values: d.values as Prisma.InputJsonValue },
    });
    await audit({
      orgId: org.id, action: 'property.import_update', entity: 'property', entityId: hit.id,
      before: { title: before?.title, status: before?.status }, after: { title: after.title, status: after.status },
    });
    updated++;
    if (d.listingStatus) await upsertListing(hit.id, d.listingStatus);
  } else {
    const publicCode = await nextPublicCode(org.id, displayProvince(d.values));
    const p = await db.property.create({
      data: { orgId: org.id, publicCode, typeKey: type.key, title: d.title, status: d.status, values: d.values as Prisma.InputJsonValue },
    });
    await audit({
      orgId: org.id, action: 'property.import_create', entity: 'property', entityId: p.id,
      after: { publicCode, typeKey: type.key, title: d.title, status: d.status },
    });
    created++;
    if (d.listingStatus) await upsertListing(p.id, d.listingStatus);
  }
}

async function upsertListing(propertyId: string, status: string) {
  const found = await db.listing.findFirst({ where: { orgId: org!.id, propertyId } });
  const publishedAt = status === 'published' ? new Date() : null;
  if (found) {
    await db.listing.update({
      where: { id: found.id },
      data: { status, publishedAt: status === 'published' ? (found.publishedAt ?? publishedAt) : found.publishedAt },
    });
  } else {
    await db.listing.create({ data: { orgId: org!.id, propertyId, status, publishedAt } });
  }
}

console.log(`\nเขียนแล้ว — สร้างใหม่ ${created} · แก้ไข ${updated}`);
console.log('ตรวจผลได้ที่ /admin/properties');
await db.$disconnect();
