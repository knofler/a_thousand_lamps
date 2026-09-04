#!/bin/bash
set +e
# Hook: GATEWAY freshness — "up" must also mean "current"
# Event: SessionStart
# Policy: the running gateway equals the built source, converged automatically.
#
# WHY (2026-08-29): "rebuilt the stale gateway image" recurs through
# state/AI_AGENT_HANDOFF.md as a MANUAL step an agent spotted and fixed by hand
# — 2026-08-26 (a 7-session STALE self-heal blocker), 2026-08-27, 2026-08-28.
# Nothing compared image age to source age, so a /health 200 from a two-day-old
# image was indistinguishable from a current one: MCP tools served stale code
# while the agent trusted them. The session this hook was written, the gateway
# was serving code ~10h behind runtime/src — including distill.ts, brain.ts and
# context-bundle.ts, i.e. exactly the brain/boot path the agent relies on.
#
# Rebuilds take minutes, so this NEVER blocks a session: gateway_ensure.sh is
# called with --apply --background, which detaches the rebuild under a lock and
# logs to $MYAI_HOME/logs/gateway-rebuild.log. Boot prints one line; the next
# boot finds a fresh image. Convergence with no human and no model in the loop.
#
# Set MYAI_NO_GATEWAY_REBUILD=1 to detect-and-report without rebuilding.

if [ -f /.dockerenv ] || [ -n "$MYAI_IN_CONTAINER" ]; then
  exit 0
fi

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
SCRIPT="$ROOT/scripts/gateway_ensure.sh"
[ -f "$SCRIPT" ] || SCRIPT="$ROOT/AI/scripts/gateway_ensure.sh"   # managed-repo layout
[ -x "$SCRIPT" ] || exit 0

# Only the repo that OWNS the compose stack should rebuild it. A managed repo
# has no runtime/ of its own and must never try.
[ -f "$ROOT/docker-compose.yml" ] || exit 0
grep -q '^  gateway:' "$ROOT/docker-compose.yml" 2>/dev/null || exit 0

if [ -n "${MYAI_NO_GATEWAY_REBUILD:-}" ]; then
  "$SCRIPT"
else
  "$SCRIPT" --apply --background
fi
exit 0
