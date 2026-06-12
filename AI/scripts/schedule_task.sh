#!/usr/bin/env bash
# schedule_task.sh — the STANDARD way to schedule autonomous work in ANY repo.
#
# Pushes a task into the myAI gateway task queue (http://localhost:3100/mcp).
# The launchd CLI task runner (every few hours, free Fable window, claude-tech,
# subscription-billed) pulls the highest-priority pending task and works it on a
# `test` branch, then flips it to "Needs Review" for a human `ship it`.
#
# This is the ONE correct mechanism. Do NOT create gateway *cron schedules* for
# per-repo work (those bill API tokens and are disabled fleet-wide) — create a
# TASK and let the runner schedule it by priority.
#
# Usage:
#   ./AI/scripts/schedule_task.sh --title "Add rate limiting to /api/foo" \
#        [--repo <name>] [--priority P0|P1|P2|P3] [--agent <specialist>] \
#        [--model <model-id>] [--desc "..."] [--notes "..."]
#   ./AI/scripts/schedule_task.sh --list           # show this repo's queued tasks
#   ./AI/scripts/schedule_task.sh --list-all        # show the whole queue (limit 500)
#
# Defaults: repo = git repo basename; priority = P2; model = free-window model
# (claude-fable-5 until 2026-06-22, else agent-tier default); source = manual.
#
# Env: GATEWAY_MCP (default http://localhost:3100/mcp), FABLE_FREE_UNTIL (YYYYMMDD).
set -euo pipefail

GATEWAY_MCP=${GATEWAY_MCP:-http://localhost:3100/mcp}
DASH=${DASH_URL:-http://localhost:3210}
FABLE_FREE_UNTIL=${FABLE_FREE_UNTIL:-20260622}

REPO=""; TITLE=""; DESC=""; PRIORITY="P2"; AGENT=""; MODEL=""; NOTES=""; ACTION="create"
while [ $# -gt 0 ]; do
  case "$1" in
    --repo)      shift; REPO="${1:?}";;
    --title)     shift; TITLE="${1:?}";;
    --desc|--description) shift; DESC="${1:?}";;
    --priority)  shift; PRIORITY="${1:?}";;
    --agent)     shift; AGENT="${1:?}";;
    --model)     shift; MODEL="${1:?}";;
    --notes)     shift; NOTES="${1:?}";;
    --list)      ACTION="list";;
    --list-all)  ACTION="list-all";;
    -h|--help)   grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0;;
    *) echo "unknown arg: $1" >&2; exit 2;;
  esac; shift
done

# Resolve repo name from git toplevel if not given.
if [ -z "$REPO" ]; then
  if git rev-parse --show-toplevel >/dev/null 2>&1; then
    REPO="$(basename "$(git rev-parse --show-toplevel)")"
  else
    REPO="$(basename "$PWD")"
  fi
fi

# Gateway reachability check (clear message; don't fall over silently).
if ! curl -sf -o /dev/null "${GATEWAY_MCP%/mcp}/health" 2>/dev/null; then
  echo "✗ Gateway not reachable at $GATEWAY_MCP" >&2
  echo "  Start it (in the master AI repo): docker compose up -d  → then retry." >&2
  exit 1
fi

mcp_call() { # $1 tool, $2 args-json
  curl -sf -X POST "$GATEWAY_MCP" -H 'content-type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"id\":1,\"params\":{\"name\":\"$1\",\"arguments\":$2}}"
}

if [ "$ACTION" = "list" ] || [ "$ACTION" = "list-all" ]; then
  if [ "$ACTION" = "list" ]; then ARGS="{\"repo\":\"$REPO\",\"limit\":200}"; HDR="Queued tasks for '$REPO'";
  else ARGS='{"limit":500}'; HDR="Full queue"; fi
  echo "== $HDR =="
  mcp_call tasks_list "$ARGS" | python3 -c "
import sys,json
d=json.load(sys.stdin); t=json.loads(d['result']['content'][0]['text'])
t=t if isinstance(t,list) else t.get('tasks',[])
op=[x for x in t if x.get('status')!='done']
for x in sorted(op,key=lambda r:(r.get('priority','P9'),r.get('repo',''))):
    print(f\"  [{x.get('status'):8}] {x.get('priority')} {x.get('repo'):16} {x.get('title','')[:60]} (model={x.get('recommendedModel') or 'tier-default'})\")
print(f'  -- {len(op)} open --')
"
  echo "Dashboard: $DASH/tasks   ·   $DASH/schedule"
  exit 0
fi

[ -n "$TITLE" ] || { echo "✗ --title is required" >&2; exit 2; }

# Default model: free-window Fable until the window closes, else tier-default (empty).
if [ -z "$MODEL" ]; then
  TODAY="$(date +%Y%m%d)"
  if [ "$TODAY" -lt "$FABLE_FREE_UNTIL" ]; then MODEL="claude-fable-5"; fi
fi

ARGS=$(python3 -c "
import json,sys
a={'repo':sys.argv[1],'title':sys.argv[2],'priority':sys.argv[4],'source':'manual'}
if sys.argv[3]: a['description']=sys.argv[3]
if sys.argv[5]: a['assignedAgent']=sys.argv[5]
if sys.argv[6]: a['recommendedModel']=sys.argv[6]
if sys.argv[7]: a['notes']=sys.argv[7]
print(json.dumps(a))
" "$REPO" "$TITLE" "$DESC" "$PRIORITY" "$AGENT" "$MODEL" "$NOTES")

mcp_call tasks_create "$ARGS" | python3 -c "
import sys,json
d=json.load(sys.stdin); r=json.loads(d['result']['content'][0]['text'])
print(f\"✓ Scheduled: {r.get('taskId')}\")
print(f\"  repo={r.get('repo')}  priority={r.get('priority')}  model={r.get('recommendedModel') or 'tier-default'}  agent={r.get('assignedAgent') or '-'}\")
print(f\"  title: {r.get('title')}\")
"
echo "The CLI runner will work it by priority on the free window. Check: $DASH/tasks  ·  $DASH/schedule"
