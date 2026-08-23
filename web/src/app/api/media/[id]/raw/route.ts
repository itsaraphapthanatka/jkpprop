/* GET /api/media/:id/raw — the file the website shows.

   FR-ADM-09: this always returns the watermarked derivative. The untouched
   original is reachable only with ?original=1 by a signed-in user, so a
   public URL can never expose it.

   FR-ADM-09b: on top of the upload-time text stamp, the org's uploaded logo
   is composited here using the current /admin/branding setting. Doing it on
   read (rather than baking it at upload) is what lets an admin move the logo
   and have every existing photo follow. The result is cached under a key
   carrying the settings version, so it is composited once per version, and
   public URLs carry ?v= so browser caches turn over too. */
import { handler, ApiError } from '@/lib/server/api';
import { currentUser } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { getObject, putObject, originalKey, watermarkedKey, thumbKey, isThumbWidth, mediaIdFromSrc } from '@/lib/server/mediaStore';
import { applyImageWatermark, canWatermark } from '@/lib/server/watermark';
import { normalizeWatermark, type WatermarkConfig } from '@/lib/watermarkConfig';

export const runtime = 'nodejs';

type Wm = { cfg: WatermarkConfig; version: number };

const MEMO_TTL_MS = 60_000;

/* ห้ามจำค่านี้ไว้เด็ดขาด — เคยจำไว้ 60 วินาทีเพื่อประหยัดคิวรี แล้วกลายเป็น
   บั๊กที่ "แก้ที่หลังบ้านแล้วลายน้ำไม่เปลี่ยน":
     บันทึก → wmVersion เด้ง → URL กลายเป็น ?v=N+1 → เบราว์เซอร์ขอรูปใหม่
     → เซิร์ฟเวอร์ยังใช้ค่าเก่าที่จำไว้ ปั๊มด้วยตำแหน่ง/ขนาดเดิม
     → แล้วเก็บผลนั้นไว้ถาวรใต้คีย์ของ version ใหม่
   ค่าที่เพิ่งตั้งจึงไม่มีวันถูกใช้ จนกว่าจะกดบันทึกอีกครั้ง — ผู้ใช้เห็นช้าไป
   หนึ่งจังหวะเสมอ · เป็นคิวรีเดียวด้วย primary key ไม่ได้แพงพอให้เสี่ยงแบบนั้น */
async function watermarkFor(orgId: string): Promise<Wm | null> {
  const b = await db.branding.findUnique({ where: { orgId } });
  if (!b || !b.wmEnabled || !b.wmSrc) return null;
  const cfg = normalizeWatermark({
    enabled: b.wmEnabled, src: b.wmSrc, anchor: b.wmAnchor,
    scale: b.wmScale, opacity: b.wmOpacity, margin: b.wmMargin,
  });
  return cfg.enabled ? { cfg, version: b.wmVersion } : null;
}

/* ปั๊มลายน้ำเฉพาะรูปที่ถูกอ้างถึงใน values.photos ของประกาศ — รูปหน้าปกของ
   "คำถามพบบ่อย" "เกี่ยวกับเรา" รูปทีมงาน และรูปออฟฟิศ ไม่ใช่ของที่ต้องกัน
   คนเอาไปใช้ต่อ · ZIP ในหน้า Social Status ดึงจาก URL เดียวกับรูปประกาศ
   ลายน้ำจึงติดไปด้วยตามที่ต้องการ */
const listingPhotoMemo = new Map<string, { at: number; is: boolean }>();

async function isListingPhoto(orgId: string, assetId: string): Promise<boolean> {
  const hit = listingPhotoMemo.get(assetId);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.is;
  const n = await db.property.count({
    where: { orgId, values: { path: ['photos'], array_contains: `/api/media/${assetId}/raw` } },
  });
  const is = n > 0;
  listingPhotoMemo.set(assetId, { at: Date.now(), is });
  return is;
}

/** The logo's own bytes, from the media asset its src points at. */
async function logoBytes(src: string): Promise<Buffer | null> {
  const id = mediaIdFromSrc(src);
  if (!id) return null;
  const asset = await db.mediaAsset.findUnique({ where: { id }, select: { id: true, mime: true } });
  if (!asset) return null;
  // the logo's own untouched upload, so a text stamp never rides along
  return (await getObject(asset.id, asset.mime, originalKey(asset.id, asset.mime)))
    ?? (await getObject(asset.id, asset.mime));
}

export const GET = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);

  const wantsOriginal = new URL(req.url).searchParams.get('original') === '1';
  const versioned = !!new URL(req.url).searchParams.get('v');
  if (wantsOriginal && !(await currentUser())) {
    throw new ApiError('UNAUTHENTICATED', 'ต้องเข้าสู่ระบบเพื่อดูไฟล์ต้นฉบับ', 401);
  }

  const key = wantsOriginal ? originalKey(asset.id, asset.mime) : undefined;
  // assets uploaded before watermarking existed only have the public object
  let buf = (await getObject(asset.id, asset.mime, key)) ?? (wantsOriginal ? await getObject(asset.id, asset.mime) : null);
  if (!buf) throw new ApiError('NOT_FOUND', 'ไม่พบไฟล์นี้', 404);

  /* the logo stamp applies to the public copy only — never to an admin download,
     never to the logo asset itself (that would stamp the watermark on itself),
     and only to รูปของประกาศ (ดู isListingPhoto ข้างบน) */
  /* เคยยกเว้นให้คนที่เข้าสู่ระบบเห็นรูปไม่มีลายน้ำ เพื่อให้ทีมดูรูปจริงตอนทำงาน
     แต่ผลคือคนที่คอยตรวจว่าลายน้ำขึ้นหรือยัง (ซึ่งล็อกอินค้างอยู่เสมอ) ไม่เห็น
     ลายน้ำเลยสักครั้ง กลายเป็นว่าฟีเจอร์ดู "พัง" ทั้งที่ทำงานอยู่ — ตัดออก
     กติกาตอนนี้ตรงไปตรงมา: รูปของประกาศมีลายน้ำเสมอ รูปอื่นบนเว็บไม่มี
     ใครอยากได้ไฟล์ต้นฉบับสะอาดใช้ปุ่มดาวน์โหลดต้นฉบับ (?original=1) */
  const stampable = !wantsOriginal && canWatermark(asset.mime)
    && await isListingPhoto(asset.orgId, asset.id);
  if (stampable) {
    const wm = await watermarkFor(asset.orgId);
    if (wm && mediaIdFromSrc(wm.cfg.src ?? '') !== asset.id) {
      const cacheKey = watermarkedKey(asset.id, asset.mime, wm.version);
      const cached = await getObject(asset.id, asset.mime, cacheKey);
      if (cached) {
        buf = cached;
      } else {
        const logo = await logoBytes(wm.cfg.src as string);
        if (logo) {
          const stamped = await applyImageWatermark(buf, asset.mime, logo, wm.cfg);
          if (!stamped.equals(buf)) {
            buf = stamped;
            // best-effort cache — a storage hiccup must not fail the request
            await putObject(asset.id, asset.mime, stamped, cacheKey).catch(() => {});
          }
        }
      }
    }
  }

  /* A grid of 150px boxes was being filled with 1600px originals: opening
     /admin/media pulled 412 photos, 114 MB, twenty-six seconds. ?w= serves a
     resized copy of the same (watermarked) image, cached like the rest. */
  const wanted = Number(new URL(req.url).searchParams.get('w') ?? 0);
  if (!wantsOriginal && wanted && isThumbWidth(wanted) && canWatermark(asset.mime)) {
    /* รูปที่ไม่ใช่ของประกาศไม่มีลายน้ำ ต้องเก็บ cache คนละคีย์กัน ไม่งั้นรูปที่
       เคยปั๊มไว้ตอนก่อนหน้านี้จะถูกเสิร์ฟกลับมาเป็นตัวย่อ */
    const wm = stampable ? await watermarkFor(asset.orgId) : null;
    const key = thumbKey(asset.id, asset.mime, wanted, wm?.version ?? 0);
    const cached = await getObject(asset.id, asset.mime, key);
    if (cached) {
      buf = cached;
    } else {
      const sharp = (await import('sharp')).default;
      // withoutEnlargement: a small upload stays its own size rather than
      // being blown up into a bigger file than the original
      const small = await sharp(buf).resize({ width: wanted, withoutEnlargement: true })
        .jpeg({ quality: 72 }).toBuffer().catch(() => null);
      if (small) {
        buf = small;
        await putObject(asset.id, asset.mime, small, key).catch(() => {});
      }
    }
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(buf.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(buf.length),
      /* the original is per-user, so it must never land in a shared cache.
         public bytes are immutable *for a given ?v=* — the DTOs append the
         watermark version, so a settings change hands out a fresh URL.
         URL ที่ไม่มี ?v= (รูปหน้าเว็บทั่วไป เช่น หน้าปกของ "เกี่ยวกับเรา") ไม่มี
         ทางบอกเบราว์เซอร์ให้ทิ้งของเก่าได้เลยถ้าสัญญาว่า immutable ไว้หนึ่งปี —
         ซึ่งเป็นเหตุผลที่การเลิกปั๊มลายน้ำรูปพวกนี้ไม่มีผลกับคนที่เคยเปิดหน้าไว้
         จึงให้ไปถามเซิร์ฟเวอร์ก่อนทุกครั้งแทน */
      'Cache-Control': wantsOriginal
        ? 'private, no-store'
        : versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=300, must-revalidate',
    },
  });
});
