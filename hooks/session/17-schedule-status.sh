#!/usr/bin/env bash
# 17-schedule-status.sh — Session-start SCHEDULE banner: what the autonomous
# runner last did for THIS repo, what's queued next, and when the runner fires
# again. Times shown in Australia/Sydney.
#
# Data sources (all best-effort; hook is silent on total failure):
#   - gateway tasks_list (repo-scoped): last completed/reviewed task + next pending
#   - ~/.ai-cli-runner/logs: last headless CLI session for this repo
#   - launchd com.myai.cli-task-runner: standing runner presence + interval
# bash 3.2-safe. Always exits 0.
set +e

PORT="${MCP_PORT:-3100}"
URL="http://localhost:${PORT}/mcp"
RUNNER_LABEL="com.myai.cli-task-runner"
RUNNER_LOGS="$HOME/.ai-cli-runner/logs"

# ── repo name (task-store convention) ───────────────────────
ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
NAME=$(basename "$ROOT")
PARENT=$(basename "$(dirname "$ROOT")")
# task-store names that differ from folder basenames
case "$PARENT/$NAME" in
    azureApp/api)    NAME="azureApp-api" ;;
    azureApp/app)    NAME="azureApp-app" ;;
    azureApp/docker) NAME="azureApp-docker" ;;
esac
# master repo folder is "AI" but has no tasks of its own — still show fleet line
syd() { TZ=Australia/Sydney date -r "$1" "+%d %b %H:%M AEST" 2>/dev/null; }

tasks=$(curl -sf -m 4 -X POST "$URL" -H 'content-type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"id\":1,\"params\":{\"name\":\"tasks_list\",\"arguments\":{\"repo\":\"$NAME\",\"limit\":100}}}" 2>/dev/null \
    | /usr/bin/python3 -c '
import sys, json
try:
    data = json.loads(json.load(sys.stdin)["result"]["content"][0]["text"])
except Exception:
    sys.exit(0)
ts = data.get("tasks", [])
done = [t for t in ts if t["status"] in ("review", "done", "blocked") and t.get("updatedAt")]
done.sort(key=lambda t: t["updatedAt"], reverse=True)
pend = [t for t in ts if t["status"] == "pending"]
order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
pend.sort(key=lambda t: (0 if "quick win" in (t.get("notes") or "") else 1, order.get(t.get("priority"), 9)))
working = [t for t in ts if t["status"] == "working"]

def line(t, when=False):
    from datetime import datetime, timezone, timedelta
    out = "[%s] %s" % (t.get("priority", "?"), (t.get("title") or "")[:70])
    if when and t.get("updatedAt"):
        try:
            dt = datetime.fromisoformat(t["updatedAt"].replace("Z", "+00:00")).astimezone(timezone(timedelta(hours=10)))
            out += dt.strftime(" — %d %b %H:%M AEST")
        except Exception:
            pass
    return out

if working: print("NOW:  " + line(working[0]) + "  (agent working right now)")
if done:    print("LAST: " + line(done[0], when=True) + "  -> " + done[0]["status"])
if pend:
    more = "  (+%d more queued)" % (len(pend) - 1) if len(pend) > 1 else ""
    print("NEXT: " + line(pend[0]) + more)
if not (working or done or pend): print("EMPTY")
' 2>/dev/null)

[ -z "$tasks" ] && exit 0   # gateway down — stay silent

# ── runner status ───────────────────────────────────────────
runner_line="not installed on this machine"
if launchctl list "$RUNNER_LABEL" >/dev/null 2>&1; then
    last_log=$(ls -t "$RUNNER_LOGS" 2>/dev/null | head -1)
    if [ -n "$last_log" ]; then
        last_ts=$(stat -f %m "$RUNNER_LOGS/$last_log" 2>/dev/null)
        runner_line="installed (every 5h) — last session: $(syd "$last_ts") (${last_log%%.log})"
    else
        runner_line="installed (every 5h) — no sessions yet"
    fi
fi

echo "╔═ SCHEDULE [$NAME] ═══════════════════════════════════════"
if [ "$tasks" = "EMPTY" ]; then
    echo "║ no tasks in the fleet queue for this repo"
else
    echo "$tasks" | sed 's/^/║ /'
fi
echo "║ runner: $runner_line"
echo "╚═══════════════════════════════════════════════════════════"
exit 0
