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

echo "→ ดึง $APP"
docker pull "$APP"
docker pull "$MIG"

# what compose reads; kept in .env so a rollback survives a re-run
grep -q '^APP_IMAGE=' .env && sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$APP|" .env || echo "APP_IMAGE=$APP" >> .env
grep -q '^MIGRATE_IMAGE=' .env && sed -i "s|^MIGRATE_IMAGE=.*|MIGRATE_IMAGE=$MIG|" .env || echo "MIGRATE_IMAGE=$MIG" >> .env

echo "→ migrate"
$COMPOSE run --rm migrate

echo "→ เปลี่ยน container ของ app"
$COMPOSE up -d --force-recreate app

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
