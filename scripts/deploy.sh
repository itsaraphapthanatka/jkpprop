#!/usr/bin/env bash
# Pull, rebuild, migrate, restart. Run on the VPS:
#
#   /srv/jkpprop/scripts/deploy.sh
#
# Migrations run in their own container and must succeed before the new app
# container starts, so a bad migration stops the deploy instead of leaving a
# new build pointed at an old schema.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ fetching"
git pull --ff-only

echo "→ building"
docker compose build app migrate

echo "→ migrating"
docker compose up --no-deps --exit-code-from migrate migrate

echo "→ restarting the app"
docker compose up -d --no-deps app

echo "→ waiting for it to report healthy"
for i in $(seq 1 30); do
  status=$(docker compose ps --format json app | grep -o '"Health":"[a-z]*"' | cut -d'"' -f4 || true)
  [ "$status" = "healthy" ] && { echo "healthy"; break; }
  [ "$i" = "30" ] && { echo "did not become healthy — last 40 log lines:"; docker compose logs --tail 40 app; exit 1; }
  sleep 2
done

# images from previous builds pile up fast on a small VPS disk
docker image prune -f >/dev/null
echo "→ done"
