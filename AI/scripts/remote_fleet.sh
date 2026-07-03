#!/usr/bin/env bash
# =============================================================================
# remote_fleet.sh — one idle claude-museum session per repo = every repo
# remotely drivable from the phone (remoteControlAtStartup:true makes each
# session auto-appear in the mobile app's Code list).
#
# Idle sessions burn ZERO tokens (session hooks are shell-only; the model is
# only billed when a session is driven). Cost is RAM (~250-400 MB/session) —
# hence the cap and the duplicate guard.
#
# Duplicate guard: a repo that ALREADY has a live claude process (any profile,
# any cwd match — including tabs you opened by hand) is SKIPPED on start, so
# this never doubles up an agent on a repo.
#
# Usage:
#   scripts/remote_fleet.sh status                  # who is live where, which profile
#   scripts/remote_fleet.sh start [all|core|name…]  # open museum session per repo (iTerm tabs)
#   scripts/remote_fleet.sh stop  [all|name…]       # stop MUSEUM sessions only (never your
#                                                   #   interactive claude/claude-tech shells)
# Options:
#   --dry-run     print what would happen, do nothing
#   --max N       cap sessions started in one run (default 12 — RAM guard)
#   --profile P   config-dir suffix to launch with (default museum)
#
# Repo set: config/remote_fleet.txt (one path per line, ~ ok, # comments).
# `core` = master AI + agentFlow + connect (the product trio).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
MASTER_PATH="$(cd "$SCRIPT_DIR/.." && pwd)"
FLEET_FILE="$MASTER_PATH/config/remote_fleet.txt"
CORE_NAMES="AI agentFlow connect"

ACTION="${1:-status}"; shift 2>/dev/null || true

DRY_RUN=false; MAX=12; PROFILE="museum"
TARGETS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --max) shift; MAX="${1:-12}" ;;
    --profile) shift; PROFILE="${1:-museum}" ;;
    *) TARGETS+=("$1") ;;
  esac
  shift
done
[ ${#TARGETS[@]} -eq 0 ] && TARGETS=(all)

CONFIG_DIR="$HOME/.claude-$PROFILE"
[ -d "$CONFIG_DIR" ] || { echo "✗ profile config dir not found: $CONFIG_DIR" >&2; exit 1; }

# ── repo set ──────────────────────────────────────────────────────────────────
expand_tilde() { case "$1" in "~/"*) printf '%s' "$HOME/${1#\~/}" ;; *) printf '%s' "$1" ;; esac; }

fleet_paths() { # all configured fleet repo paths, expanded, existing git repos only
  [ -f "$FLEET_FILE" ] || { echo "✗ $FLEET_FILE missing" >&2; return 1; }
  grep -vE '^\s*(#|$)' "$FLEET_FILE" | while IFS= read -r line; do
    p="$(expand_tilde "$line")"
    [ -e "$p/.git" ] && printf '%s\n' "$p"
  done
}

# resolve TARGETS (all|core|names) → newline-separated paths
resolve_targets() {
  local want sel paths p name
  paths="$(fleet_paths)"
  for want in "${TARGETS[@]}"; do
    case "$want" in
      all)  printf '%s\n' "$paths" ;;
      core) for name in $CORE_NAMES; do
              printf '%s\n' "$paths" | while IFS= read -r p; do
                [ "$(basename "$p")" = "$name" ] && printf '%s\n' "$p"
              done
            done ;;
      *)    sel="$(printf '%s\n' "$paths" | while IFS= read -r p; do
                [ "$(basename "$p")" = "$want" ] && printf '%s\n' "$p"
              done)"
            if [ -n "$sel" ]; then printf '%s\n' "$sel"
            else echo "  !! unknown fleet repo: $want (see $FLEET_FILE)" >&2; fi ;;
    esac
  done | awk '!seen[$0]++'
}

# ── live-process discovery ────────────────────────────────────────────────────
# claude_procs → lines "pid|cwd|profile" for every running claude CLI process.
claude_procs() {
  local pid cwd prof
  ps -axo pid=,command= | awk '$2 ~ /(^|\/)claude$/ || $2 ~ /(^|\/)claude / {print $1}' | while read -r pid; do
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"
    [ -n "$cwd" ] || continue
    prof="$(ps eww "$pid" 2>/dev/null | grep -o 'CLAUDE_CONFIG_DIR=[^ ]*' | head -1 | sed 's|.*/\.claude-\{0,1\}||')"
    [ -n "$prof" ] || prof="default"
    printf '%s|%s|%s\n' "$pid" "$cwd" "$prof"
  done
}

procs_for_repo() { # $1=repo path, $2=all claude procs → matching lines
  printf '%s\n' "$2" | awk -F'|' -v repo="$1" '$2 == repo'
}

# ── status ────────────────────────────────────────────────────────────────────
do_status() {
  local procs p matches line pid prof
  procs="$(claude_procs)"
  echo "REMOTE FLEET — live claude sessions per fleet repo (profile $PROFILE = phone-drivable)"
  printf '%-22s %-10s %s\n' "REPO" "STATUS" "SESSIONS"
  fleet_paths | while IFS= read -r p; do
    matches="$(procs_for_repo "$p" "$procs")"
    if [ -z "$matches" ]; then
      printf '%-22s %-10s %s\n' "$(basename "$p")" "-" "none"
    else
      printf '%-22s %-10s ' "$(basename "$p")" "LIVE"
      printf '%s\n' "$matches" | while IFS='|' read -r pid _ prof; do
        printf '[%s pid %s] ' "$prof" "$pid"
      done
      echo
    fi
  done
  # sessions running OUTSIDE fleet repos (context, not managed)
  echo
  echo "(other live claude sessions: $(printf '%s\n' "$procs" | grep -c . || true) total across all dirs — 'start' only skips exact repo matches)"
}

# ── start ─────────────────────────────────────────────────────────────────────
do_start() {
  local procs started=0 skipped=0 p name cmd script_lines=""
  procs="$(claude_procs)"
  while IFS= read -r p; do
    name="$(basename "$p")"
    if [ -n "$(procs_for_repo "$p" "$procs")" ]; then
      echo "  ↷ $name — already has a live claude session (skipped, no duplicates)"
      skipped=$((skipped + 1)); continue
    fi
    if [ "$started" -ge "$MAX" ]; then
      echo "  !! cap reached (--max $MAX) — remaining repos skipped this run"
      break
    fi
    cmd="cd '$p' && CLAUDE_CONFIG_DIR='$CONFIG_DIR' exec claude"
    if $DRY_RUN; then
      echo "  ▶ would start [$PROFILE] $name — iTerm tab: $cmd"
    else
      if [ -z "$script_lines" ]; then
        script_lines="tell application \"iTerm\"
  activate
  set fleetWin to (create window with default profile)
  tell current session of fleetWin to write text \"$cmd\""
      else
        script_lines="$script_lines
  tell fleetWin
    create tab with default profile
    tell current session to write text \"$cmd\"
  end tell"
      fi
      echo "  ▶ starting [$PROFILE] $name"
    fi
    started=$((started + 1))
  done <<EOF
$(resolve_targets)
EOF
  if ! $DRY_RUN && [ -n "$script_lines" ]; then
    osascript -e "$script_lines
end tell" >/dev/null
  fi
  echo
  echo "started: $started  skipped(already live): $skipped  (~$((started * 350)) MB new RAM)"
  [ "$started" -gt 0 ] && ! $DRY_RUN && echo "Each new session auto-enables Remote Control (museum settings) → check the phone's Code list."
  return 0
}

# ── stop ──────────────────────────────────────────────────────────────────────
do_stop() {
  local procs p name stopped=0 pid prof
  procs="$(claude_procs)"
  while IFS= read -r p; do
    name="$(basename "$p")"
    procs_for_repo "$p" "$procs" | while IFS='|' read -r pid _ prof; do
      if [ "$prof" = "$PROFILE" ]; then
        if $DRY_RUN; then echo "  ■ would stop [$prof] $name (pid $pid)"
        else kill "$pid" 2>/dev/null && echo "  ■ stopped [$prof] $name (pid $pid)"; fi
      else
        echo "  ↷ $name pid $pid is [$prof] — left alone (only $PROFILE sessions are stopped)"
      fi
    done
    stopped=$((stopped + 1))
  done <<EOF
$(resolve_targets)
EOF
  return 0
}

case "$ACTION" in
  status) do_status ;;
  start)  do_start ;;
  stop)   do_stop ;;
  -h|--help|help) sed -n '2,27p' "$0" | sed 's/^# \{0,1\}//' ;;
  *) echo "unknown action: $ACTION (status|start|stop)" >&2; exit 2 ;;
esac
