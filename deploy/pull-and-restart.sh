#!/usr/bin/env bash
# Bring the VPS up to a published image. Run it on the VPS:
#
#   /srv/jkpprop/pull-and-restart.sh            # latest
#   /srv/jkpprop/pull-and-restart.sh <git-sha>  # a specific build, to roll back
#
# This replaces `docker build` on the box. That build took the machine's free
# memory from 1.4 GB to 66 MB and wiped its page cache, which stalled the
# eighteen other production containers here until it was rebooted by hand.
# Pulling a finished image costs a download and nothing else.
set -euo pipefail

cd /srv/jkpprop
TAG="${1:-latest}"
OWNER="${GHCR_OWNER:-itsaraphapthanatka}"
COMPOSE="docker compose -f docker-compose.behind-nginx.yml"

APP="ghcr.io/${OWNER}/jkpprop-app:${TAG}"
MIG="ghcr.io/${OWNER}/jkpprop-migrate:${TAG}"

# The package is private, so a read-only token has to be on the box. Made at
# github.com/settings/tokens with `read:packages` and nothing else.
if [ -f .ghcr-token ]; then
  chmod 600 .ghcr-token
  docker login ghcr.io -u "$OWNER" --password-stdin < .ghcr-token >/dev/null
else
  cat >&2 <<'MSG'
✗ ไม่พบ /srv/jkpprop/.ghcr-token

  image เป็น package ส่วนตัว ต้องมี token อ่านอย่างเดียววางไว้ก่อน:
    1. สร้างที่ https://github.com/settings/tokens  (classic → ติ๊ก read:packages อย่างเดียว)
    2. บนเครื่องนี้:
         printf '%s' 'ghp_xxxxx' > /srv/jkpprop/.ghcr-token && chmod 600 /srv/jkpprop/.ghcr-token
    3. รันสคริปต์นี้ใหม่
MSG
  exit 2
fi

# ดึงซ้ำได้ ไม่ใช่ยอมแพ้ครั้งเดียว
#
# 20 ส.ค. 2026: image ของ app ดึงมาได้ แต่ตัว migrate ดึงไม่ผ่าน สคริปต์ที่ตั้ง
# `set -e` ไว้จึงหยุดตรงนั้น ยังไม่ทันแก้ .env และไม่ทันสลับ container เซิร์ฟเวอร์
# เลยรันเวอร์ชันเก่าต่อไปเงียบ ๆ อีกสามชั่วโมงกว่าจะมีคนสังเกต
# (งานที่ GitHub ขึ้นสีแดงไว้ แต่ไม่มีใครเปิดดู)
pull_retry() {
  local ref="$1" i
  for i in 1 2 3; do
    if docker pull "$ref"; then return 0; fi
    echo "  ดึงไม่สำเร็จ (ครั้งที่ $i/3) — รอ 15 วินาทีแล้วลองใหม่" >&2
    sleep 15
  done
  echo "✗ ดึง $ref ไม่สำเร็จหลังลอง 3 ครั้ง" >&2
  return 1
}

echo "→ ดึง $APP"
pull_retry "$APP"
pull_retry "$MIG"

# what compose reads; kept in .env so a rollback survives a re-run
grep -q '^APP_IMAGE=' .env && sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$APP|" .env || echo "APP_IMAGE=$APP" >> .env
grep -q '^MIGRATE_IMAGE=' .env && sed -i "s|^MIGRATE_IMAGE=.*|MIGRATE_IMAGE=$MIG|" .env || echo "MIGRATE_IMAGE=$MIG" >> .env

# The app runs as uid 1001 (nextjs). Anything that copies files into the
# uploads volume from the host — the photo import did — can leave the directory
# owned by the host user instead, and then every upload fails with EACCES while
# the photos already there keep serving, so nothing looks wrong until an admin
# tries to add a file. One stat per deploy is cheaper than finding that twice.
VOL=$(docker volume inspect jkpprop_uploads --format '{{.Mountpoint}}' 2>/dev/null || true)
if [ -n "$VOL" ] && [ "$(stat -c %u "$VOL")" != "1001" ]; then
  echo "→ คืนสิทธิ์โฟลเดอร์ uploads ให้ uid 1001 (เดิมเป็นของ uid $(stat -c %u "$VOL"))"
  chown -R 1001:1001 "$VOL"
fi

echo "→ migrate"
$COMPOSE run --rm migrate

echo "→ เปลี่ยน container ของ app"
$COMPOSE up -d --force-recreate app

# ต้องเป็นรุ่นที่สั่งจริง ๆ ไม่ใช่รุ่นเดิมที่ยังรันอยู่
running=$(docker inspect -f '{{.Config.Image}}' jkpprop-app-1 2>/dev/null || echo '')
if [ "$running" != "$APP" ]; then
  echo "✗ สลับ image ไม่สำเร็จ — ที่รันอยู่คือ ${running:-ไม่มี} ไม่ใช่ $APP" >&2
  exit 1
fi

# Prove it is actually serving before saying so. The container reports healthy
# on its own healthcheck; this asks the way a visitor would.
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 10 "http://127.0.0.1:${APP_PORT:-3110}/api/branding" || true)
  if [ "$code" = "200" ]; then
    echo "✓ app ตอบ 200 แล้ว ($APP)"
    # Every deploy pulls a fresh pair of images (~2.8 GB) and the old ones stay
    # behind. Four deploys in an afternoon took this disk from 85% to 99%, on a
    # box that also holds eighteen other sites' data. Rolling back re-pulls from
    # the registry, so nothing here is needed to keep a copy.
    docker images --format '{{.Repository}}:{{.Tag}}' \
      | grep '/jkpprop-' | grep -v ":${TAG}$" | grep -v ':latest$' \
      | xargs -r docker rmi >/dev/null 2>&1 || true
    echo "  (ลบ image รุ่นเก่าออกแล้ว เหลือ $(df -h / | awk 'NR==2{print $4}') ว่าง)"
    exit 0
  fi
  sleep 3
done

echo "✗ app ไม่ตอบภายใน 60 วินาที — ดู: docker compose -f docker-compose.behind-nginx.yml logs --tail 50 app" >&2
exit 1
