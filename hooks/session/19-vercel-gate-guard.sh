#!/bin/bash
set +e
# 19-vercel-gate-guard.sh — fleet Vercel deploy-gate enforcement (anti-rogue).
#
# Every managed repo MUST build on `main` only (vercel.json: deploymentEnabled
# test/codeclot:false + an ignoreCommand build-only-main guard). Without it a
# repo deploys on every push to every branch; summed account-wide that blows the
# Vercel 100/day cap and blocks production. This hook catches a repo that has
# gone (or been born) rogue — a missing or weakened gate — and tells you to fix it.
#
# Master repo only (reads config/managed_repos.txt). Fast: local files, no fetch.
# Non-fatal: warns, never blocks the session.

REPO_ROOT="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)"
TRACK="$REPO_ROOT/config/managed_repos.txt"
[ -f "$TRACK" ] || exit 0   # not the master repo → no-op
command -v jq >/dev/null 2>&1 || exit 0

rogue=""
n=0
while IFS= read -r raw || [ -n "$raw" ]; do
  case "$raw" in ''|\#*) continue;; esac
  echo "$raw" | grep -qiE 'NEVER write outside|AI folder only|NEVER push' && continue
  line="${raw%%#*}"; d="$(eval echo "$(echo "$line" | xargs)")"
  [ -d "$d/.git" ] || continue
  git -C "$d" remote get-url origin >/dev/null 2>&1 || continue   # no remote → can't git-deploy
  vj="$d/vercel.json"
  if [ ! -f "$vj" ] || ! jq -e '.git.deploymentEnabled.test == false and (.ignoreCommand // "" | length > 0)' "$vj" >/dev/null 2>&1; then
    rogue="$rogue $(basename "$d")"
    n=$((n + 1))
  fi
done < "$TRACK"

if [ "$n" -gt 0 ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "  VERCEL GATE GUARD — $n repo(s) can deploy on every push (ROGUE):"
  echo "   $rogue"
  echo ""
  echo "  These have no build-only-main gate → they deploy Previews on every"
  echo "  branch push, summing toward the account-wide Vercel 100/day cap."
  echo "  FIX: ./scripts/rollout_ci_thrift.sh --apply   (then commit + push each)"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
else
  echo "Vercel Gate Guard: all managed repos build on main only (no rogue deployers)."
fi
exit 0
