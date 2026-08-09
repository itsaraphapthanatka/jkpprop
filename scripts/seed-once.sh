#!/usr/bin/env bash
# First-boot only: creates the org, the owner account, provinces, social
# channels and sample content.
#
# Safe to re-run (everything is an upsert) but pointless after the first time —
# and it will NOT reset or overwrite data you have entered since.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ seeding the database…"
docker compose run --rm --entrypoint sh migrate -c 'npx prisma db seed'

cat <<'MSG'

Seeded. Sign in at https://$DOMAIN/admin/login

  owner@jkp.local / jkp12345

CHANGE THAT PASSWORD IMMEDIATELY — it is published in this repository.
Settings → เปลี่ยนรหัสผ่าน, or /admin/change-password
MSG
