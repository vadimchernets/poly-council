#!/bin/bash
# Daily 17:05 ET: export and push to the separate poly-council repository.
set -e
cd "$(dirname "$0")/.."
/Users/vadymchernets/.local/bin/node scripts/export.mjs
[ -d .git ] || { echo "no separate repository (git init not done)"; exit 0; }
git add -A
git diff --cached --quiet || git commit -q -m "Daily update $(TZ=America/New_York date +%F)"
git push -q origin main
