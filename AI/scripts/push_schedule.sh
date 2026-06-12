#!/usr/bin/env bash
# push_schedule.sh — ingest a repo's committed schedule artifact into the local
# gateway (the "master runner" on THIS Mac). The cross-device bridge:
#   • Mobile/cloud `schedule plan` can't reach localhost:3100 — it just commits
#     AI/plan/schedule.json and merges to main.
#   • A CLI `agent mode -a` on any Mac runs this to register that schedule with
#     the gateway: plan_set (→ dashboard /plan) + schedule_task for each task.
# Idempotent: records the ingested artifact's git blob hash in
# AI/state/.schedule-ingested and skips if unchanged.
#
# Artifact format — AI/plan/schedule.json (master: plan/schedule.json):
#   { "repo":"name", "startDate":"YYYY-MM-DD",
#     "days":[{"day":1,"focus":"...","status":"enabled"}, ...],
#     "tasks":[{"title":"...","priority":"P1","agent":"...","category":"...","day":1}, ...] }
#
# Usage: ./AI/scripts/push_schedule.sh            # this repo
#        ./AI/scripts/push_schedule.sh --force    # re-ingest even if unchanged
# Env: GATEWAY_MCP (default http://localhost:3100/mcp)
set -euo pipefail
GATEWAY_MCP=${GATEWAY_MCP:-http://localhost:3100/mcp}
FORCE=false; [ "${1:-}" = "--force" ] && FORCE=true

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")"
AI_DIR="$ROOT/AI"; [ -d "$AI_DIR" ] || AI_DIR="$ROOT"
ART="$AI_DIR/plan/schedule.json"
SENTINEL="$AI_DIR/state/.schedule-ingested"
[ -f "$ART" ] || { echo "no schedule artifact at $ART — nothing to ingest"; exit 0; }

# Skip if already ingested (same content) unless --force.
HASH="$(git -C "$ROOT" hash-object "$ART" 2>/dev/null || shasum "$ART" | cut -d' ' -f1)"
if [ "$FORCE" != true ] && [ -f "$SENTINEL" ] && grep -q "$HASH" "$SENTINEL" 2>/dev/null; then
    echo "schedule.json unchanged (already ingested) — skip"; exit 0
fi

if ! curl -sf -o /dev/null "${GATEWAY_MCP%/mcp}/health" 2>/dev/null; then
    echo "✗ gateway not reachable at $GATEWAY_MCP — cannot push schedule (run on the gateway Mac)"; exit 0
fi

SCHED_SCRIPT="$(dirname "$0")/schedule_task.sh"
GATEWAY_MCP="$GATEWAY_MCP" ART="$ART" SCHED="$SCHED_SCRIPT" /usr/bin/python3 - <<'PY'
import json, os, subprocess, urllib.request
MCP=os.environ["GATEWAY_MCP"]; art=os.environ["ART"]; sched=os.environ["SCHED"]
d=json.load(open(art))
repo=d["repo"]
def call(n,a):
    b=json.dumps({"jsonrpc":"2.0","method":"tools/call","id":1,"params":{"name":n,"arguments":a}}).encode()
    return urllib.request.urlopen(urllib.request.Request(MCP,data=b,headers={"content-type":"application/json"}),timeout=30).read()
# 1) plan_set (dashboard /plan view)
if d.get("days"):
    call("plan_set",{"repo":repo,"startDate":d.get("startDate"),"replace":True,"days":d["days"]})
    print(f"  plan_set: {len(d['days'])} days for {repo}")
# 2) schedule_task each work item (the runner queue)
n=0
for t in d.get("tasks",[]):
    cmd=[sched,"--repo",repo,"--title",t["title"],"--priority",t.get("priority","P2"),
         "--model",t.get("model","claude-fable-5")]
    if t.get("agent"): cmd+=["--agent",t["agent"]]
    notes=f"[{t.get('category','')}] day {t.get('day','?')} | from schedule.json"
    if t.get("desc"): cmd+=["--desc",t["desc"]]
    cmd+=["--notes",notes]
    subprocess.run(cmd,check=False,capture_output=True)
    n+=1
print(f"  scheduled {n} tasks for {repo}")
PY

mkdir -p "$(dirname "$SENTINEL")"
echo "$HASH  $(date -u +%FT%TZ)" > "$SENTINEL"
echo "✓ schedule ingested into gateway for $(basename "$ROOT") → dashboard /plan + /schedule"
