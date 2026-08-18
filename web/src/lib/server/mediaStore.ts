/* ============================================================
   Media storage — pluggable driver so deployment doesn't need a code change.

   - local (default): files under web/uploads/. Fine for dev and a single
     long-lived server; WRONG for serverless, where the filesystem is wiped
     on every deploy.
   - s3: any S3-compatible bucket (AWS, R2, MinIO, Spaces). Activated purely
     by env vars — see web/BACKEND.md.

   Callers only ever use put/get/remove, so switching drivers is an env change.
   ============================================================ */
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import path from 'path';

/* UPLOADS_DIR lets the deployment put the volume somewhere other than the app
   directory; unset, it is where it has always been. */
export const UPLOAD_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

export const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // "สูงสุด 10MB ต่อไฟล์" (Media UI)

export const objectKey = (id: string, mime: string) => `${id}.${EXT_BY_MIME[mime] ?? 'bin'}`;

/* FR-ADM-09 keeps the untouched file next to the watermarked one: `objectKey`
   is what the public sees, `originalKey` is what admins can still download. */
export const originalKey = (id: string, mime: string) => `${id}-original.${EXT_BY_MIME[mime] ?? 'bin'}`;

/* The logo watermark is composited lazily and cached under a key that carries
   the settings version, so changing where the logo sits produces a new
   derivative instead of needing a purge. */
export const watermarkedKey = (id: string, mime: string, version: number) =>
  `${id}-wm${version}.${EXT_BY_MIME[mime] ?? 'bin'}`;

/** Pulls the asset id out of a stored media src, for both URL shapes. */
export function mediaIdFromSrc(src: string): string | null {
  const api = /\/api\/media\/([^/?#]+)\/raw/.exec(src);
  if (api) return api[1];
  const file = /\/([^/?#]+)\.[a-z0-9]+(?:[?#]|$)/i.exec(src); // CDN: <base>/<id>.<ext>
  return file ? file[1] : null;
}

/* Thumbnails. Opening /admin/media pulled 412 full-size photos — 114 MB and
   26 seconds — to fill a grid of 150px boxes. The width is part of the key so
   one size cannot serve another, and the watermark version rides along so a
   settings change turns these over with everything else. */
export const THUMB_WIDTHS = [160, 320, 640] as const;
export type ThumbWidth = (typeof THUMB_WIDTHS)[number];
export const isThumbWidth = (n: number): n is ThumbWidth => (THUMB_WIDTHS as readonly number[]).includes(n);
export const thumbKey = (id: string, mime: string, width: number, version: number) =>
  `${id}-w${width}${version ? `v${version}` : ''}.${EXT_BY_MIME[mime] ?? 'bin'}`;

export const diskPathFor = (id: string, mime: string) => path.join(UPLOAD_DIR, objectKey(id, mime));

/* ---- S3 config (all four must be set to switch drivers) ---- */
const S3 = {
  bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION,
  accessKey: process.env.S3_ACCESS_KEY_ID,
  secretKey: process.env.S3_SECRET_ACCESS_KEY,
  // optional: R2/MinIO/Spaces need a custom host
  endpoint: process.env.S3_ENDPOINT,
  // optional: serve straight from a CDN instead of proxying through /raw
  publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
};

export const usingS3 = !!(S3.bucket && S3.region && S3.accessKey && S3.secretKey);

/** Public URL for an asset. With a CDN configured, skip the app entirely. */
export function publicUrlFor(id: string, mime: string): string {
  if (usingS3 && S3.publicBaseUrl) return `${S3.publicBaseUrl.replace(/\/$/, '')}/${objectKey(id, mime)}`;
  return `/api/media/${id}/raw`;
}

/* ---- SigV4, hand-rolled: one PUT/GET/DELETE is not worth the SDK weight ---- */
const sha256hex = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');

async function hmac(key: Buffer | string, data: string): Promise<Buffer> {
  const { createHmac } = await import('crypto');
  return createHmac('sha256', key).update(data).digest();
}

async function signedFetch(method: 'PUT' | 'GET' | 'DELETE', key: string, body?: Buffer, contentType?: string) {
  const host = S3.endpoint
    ? new URL(S3.endpoint).host
    : `${S3.bucket}.s3.${S3.region}.amazonaws.com`;
  const url = S3.endpoint
    ? `${S3.endpoint.replace(/\/$/, '')}/${S3.bucket}/${key}`
    : `https://${host}/${key}`;
  const canonicalUri = S3.endpoint ? `/${S3.bucket}/${key}` : `/${key}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256hex(body ?? '');

  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...(contentType ? { 'content-type': contentType } : {}),
  };
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers).sort().map((h) => `${h}:${headers[h]}\n`).join('');
  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');

  const scope = `${dateStamp}/${S3.region}/s3/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canonicalRequest)].join('\n');

  let signingKey = await hmac(`AWS4${S3.secretKey}`, dateStamp);
  signingKey = await hmac(signingKey, S3.region!);
  signingKey = await hmac(signingKey, 's3');
  signingKey = await hmac(signingKey, 'aws4_request');
  const signature = (await hmac(signingKey, toSign)).toString('hex');

  return fetch(url, {
    method,
    headers: {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${S3.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: body ? new Uint8Array(body) : undefined,
  });
}

export async function ensureUploadDir() {
  if (usingS3) return;
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/* Thrown when the storage itself refuses the write, as opposed to a bad
   upload. On the VPS the uploads volume once ended up owned by the host user
   while the container runs as uid 1001, so every upload failed with EACCES —
   and the admin only saw "อัปโหลดไม่สำเร็จ", which points at the file. */
export class StorageWriteError extends Error {
  constructor(readonly cause: unknown) {
    super('เซิร์ฟเวอร์เขียนไฟล์ลงที่เก็บไม่ได้ (สิทธิ์โฟลเดอร์ uploads) — แจ้งผู้ดูแลระบบ');
    this.name = 'StorageWriteError';
  }
}

export async function putObject(id: string, mime: string, body: Buffer, key = objectKey(id, mime)) {
  if (!usingS3) {
    try {
      await ensureUploadDir();
      await writeFile(path.join(UPLOAD_DIR, key), body);
    } catch (e) {
      if ((e as NodeJS.ErrnoException)?.code === 'EACCES' || (e as NodeJS.ErrnoException)?.code === 'EPERM') {
        throw new StorageWriteError(e);
      }
      throw e;
    }
    return;
  }
  const res = await signedFetch('PUT', key, body, mime);
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status} ${await res.text().catch(() => '')}`);
}

export async function getObject(id: string, mime: string, key = objectKey(id, mime)): Promise<Buffer | null> {
  if (!usingS3) return readFile(path.join(UPLOAD_DIR, key)).catch(() => null);
  const res = await signedFetch('GET', key);
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

export async function removeObject(id: string, mime: string, key = objectKey(id, mime)) {
  if (!usingS3) {
    await unlink(path.join(UPLOAD_DIR, key)).catch(() => { /* already gone */ });
    return;
  }
  await signedFetch('DELETE', key).catch(() => { /* already gone */ });
}
