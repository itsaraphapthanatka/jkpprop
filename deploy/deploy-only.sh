#!/usr/bin/env bash
# The only thing the deploy key is allowed to do.
#
# The key that GitHub holds can open a shell on a box that serves eighteen
# other people's production sites, so it does not get a shell: sshd is told to
# run this instead of whatever the client asked for, and this runs one script
# with one argument it has checked itself.
set -euo pipefail

cmd="${SSH_ORIGINAL_COMMAND:-}"
case "$cmd" in
  ''|deploy)  tag=latest ;;
  'deploy '*) tag="${cmd#deploy }" ;;
  *) echo "คีย์นี้รันได้แค่: deploy [git-sha]" >&2; exit 1 ;;
esac

# a tag is 'latest' or a hex sha, and nothing else — the string goes on to a
# docker pull, so it is not allowed to be creative
if ! printf '%s' "$tag" | grep -Eq '^(latest|[0-9a-f]{7,40})$'; then
  echo "tag ไม่ถูกรูปแบบ: $tag" >&2
  exit 1
fi

exec /srv/jkpprop/pull-and-restart.sh "$tag"
