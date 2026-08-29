#!/usr/bin/env bash
# สร้าง image บนเครื่องเอง แล้วสลับ container — สำหรับเครื่องที่ CI ไม่มี image ให้
#
#   JKP_ROOT=/website/<domain>/html/jkpprop ./build-and-restart.sh <git-sha>
#
# ทำไมไม่ดึงจาก registry เหมือนเครื่องเก่า
#
#   เครื่องใหม่เป็น arm64 ส่วน CI สร้างแค่ linux/amd64 — docker pull จึงตอบว่า
#   "no matching manifest for linux/arm64/v8" ทุกครั้ง จะให้ CI สร้าง arm64 ด้วย
#   ก็ต้องผ่าน QEMU เพราะรีโปเป็น private (ไม่มี arm runner ให้ใช้ฟรี) ซึ่งช้ากว่า
#   build ตรงนี้หลายเท่า
#
#   เหตุผลเดิมที่ห้าม build บนเซิร์ฟเวอร์คือเครื่องเก่ามีแรมว่าง 1.4 GB และ
#   `npm run build` เคยกินจนเหลือ 66 MB ทำให้ container ของเว็บอื่นค้างไปด้วย
#   เครื่องนี้มี 20 คอร์ แรม 121 GB — ข้อห้ามนั้นไม่ตรงกับสภาพเครื่องนี้แล้ว
#
# ซอร์สต้องถูกวางไว้ที่ $JKP_ROOT/web ให้ตรงกับ sha ที่สั่ง (deploy-arm.sh ทำให้)
set -euo pipefail

ROOT="${JKP_ROOT:-/website/jkppropertyagency.com/html/jkpprop}"
cd "$ROOT"
SHA="${1:?ต้องระบุ git sha}"
COMPOSE="docker compose -f ${JKP_COMPOSE:-docker-compose.behind-nginx.yml}"
APP="jkpprop-app:$SHA"
MIG="jkpprop-migrate:$SHA"

# build ซ้ำโดยไม่จำเป็นคือเสียเวลาเปล่า — ถ้าเคยสร้าง sha นี้แล้วก็ใช้ของเดิม
# (ทางลัดสำหรับ rollback ด้วย: ย้อนไป sha เก่าที่ยังมี image อยู่ ไม่ต้อง build ใหม่)
build_if_needed() {
  local tag="$1" file="$2"
  if docker image inspect "$tag" >/dev/null 2>&1; then
    echo "→ มี $tag อยู่แล้ว ข้าม build"
    return 0
  fi
  echo "→ build $tag"
  docker build -f "web/$file" -t "$tag" web
}

build_if_needed "$APP" Dockerfile
build_if_needed "$MIG" Dockerfile.migrate

# compose อ่านจาก .env — เก็บไว้ที่นี่เพื่อให้ restart เครื่องแล้วยังขึ้นรุ่นเดิม
grep -q '^APP_IMAGE=' .env && sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$APP|" .env || echo "APP_IMAGE=$APP" >> .env
grep -q '^MIGRATE_IMAGE=' .env && sed -i "s|^MIGRATE_IMAGE=.*|MIGRATE_IMAGE=$MIG|" .env || echo "MIGRATE_IMAGE=$MIG" >> .env

# แอปรันด้วย uid 1001 อะไรก็ตามที่คัดลอกไฟล์เข้า volume จากฝั่ง host อาจทิ้ง
# เจ้าของไว้เป็น uid อื่น แล้วอัปโหลดจะพังเงียบ ๆ ส่วนรูปเก่ายังเสิร์ฟได้ปกติ
VOL=$(docker volume inspect jkpprop_uploads --format '{{.Mountpoint}}' 2>/dev/null || true)
if [ -n "$VOL" ] && [ "$(stat -c %u "$VOL" 2>/dev/null || echo 1001)" != "1001" ]; then
  echo "→ คืนสิทธิ์ uploads ให้ uid 1001"
  chown -R 1001:1001 "$VOL" 2>/dev/null \
    || sudo -n chown -R 1001:1001 "$VOL" 2>/dev/null \
    || echo "  ⚠ คืนสิทธิ์ไม่ได้ — ถ้าอัปโหลดไฟล์ไม่ผ่านให้ดูตรงนี้ก่อน" >&2
fi

echo "→ migrate"
$COMPOSE run --rm migrate

echo "→ สลับ container ของ app"
$COMPOSE up -d --force-recreate app

running=$(docker inspect -f '{{.Config.Image}}' jkpprop-app-1 2>/dev/null || echo '')
if [ "$running" != "$APP" ]; then
  echo "✗ สลับ image ไม่สำเร็จ — ที่รันอยู่คือ ${running:-ไม่มี} ไม่ใช่ $APP" >&2
  exit 1
fi

# container บอกว่า healthy ด้วย healthcheck ของตัวเอง — อันนี้ถามแบบที่ผู้ใช้ถาม
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 "http://127.0.0.1:${APP_PORT:-3110}/api/branding" || true)
  if [ "$code" = "200" ]; then
    echo "✓ app ตอบ 200 แล้ว ($APP)"
    # เก็บ image ไว้ 3 รุ่นล่าสุดพอ — ไว้ rollback โดยไม่ต้อง build ใหม่
    docker images --filter 'reference=jkpprop-app' --filter 'reference=jkpprop-migrate' \
      --format '{{.Repository}}:{{.Tag}}\t{{.CreatedAt}}' \
      | grep -v ':latest' | sort -k2 -r | tail -n +7 | cut -f1 \
      | xargs -r docker rmi >/dev/null 2>&1 || true
    echo "  (เหลือดิสก์ว่าง $(df -h / | awk 'NR==2{print $4}'))"
    exit 0
  fi
  sleep 3
done

echo "✗ app ไม่ตอบภายใน 60 วินาที — ดู: $COMPOSE logs --tail 50 app" >&2
exit 1
