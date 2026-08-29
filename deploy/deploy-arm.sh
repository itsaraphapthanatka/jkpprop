#!/usr/bin/env bash
# deploy ไปเครื่อง arm64 — รันจากเครื่องตัวเอง ที่รากของรีโป
#
#   deploy/deploy-arm.sh            # commit ปัจจุบัน
#   deploy/deploy-arm.sh <git-sha>  # ย้อนไปรุ่นเก่า
#
# ส่งซอร์สของ commit นั้นขึ้นไปตรง ๆ ด้วย git archive ไม่ใช่ rsync ของโฟลเดอร์
# ที่กำลังแก้อยู่ — สิ่งที่ build บนเซิร์ฟเวอร์จะได้ตรงกับสิ่งที่ push แน่นอน
# ไม่ใช่ "ของที่ค้างอยู่บนเครื่องคนที่ deploy ครั้งล่าสุด"
set -euo pipefail

HOST="${JKP_HOST:-ssh.appreview.cloud}"
ROOT="${JKP_ROOT:-/website/jkppropertyagency.com/html/jkpprop}"
SHA=$(git rev-parse "${1:-HEAD}")

# ต้องเป็น commit ที่ push แล้ว ไม่งั้นของบนเซิร์ฟเวอร์จะไม่มีใครตามรอยได้
if ! git branch -r --contains "$SHA" 2>/dev/null | grep -q .; then
  echo "✗ commit $SHA ยังไม่ได้ push — push ก่อน" >&2
  exit 1
fi

echo "→ ส่งซอร์สของ $SHA ขึ้นเครื่อง $HOST"
git archive --format=tar "$SHA" web \
  | ssh "$HOST" "rm -rf '$ROOT/web.new' && mkdir -p '$ROOT/web.new' && tar -x -C '$ROOT/web.new'"

ssh "$HOST" "cd '$ROOT' && rm -rf web.old && [ -d web ] && mv web web.old; mv web.new/web web && rmdir web.new"

echo "→ build และสลับ container"
scp -q deploy/build-and-restart.sh "$HOST:$ROOT/build-and-restart.sh"
ssh "$HOST" "chmod +x '$ROOT/build-and-restart.sh' && JKP_ROOT='$ROOT' '$ROOT/build-and-restart.sh' '$SHA'"
