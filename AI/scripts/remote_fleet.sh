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
# Duplicate guard (wrap-up-aware): a museum session is the repo's REMOTE
# DOORWAY — one should always exist. On start:
#   - museum session already live            → skip (doorway already there)
#   - only tech/default sessions live:
#       repo tree CLEAN  (wrapped up)        → START museum alongside (dual
#                                              session OK — wrap up completed
#                                              means no duplicate-work risk)
#       repo tree DIRTY  (mid-work)          → skip: finish with `wrap up`
#                                              first, then re-run start
#   - no session                             → start
# Operating model: claude-tech = runner; claude-museum = remote + interactive
# (interactive always ends with `wrap up`; mid-work handover = wrap up in the
# tech/default session, then pick up the museum session from the phone).
#
# ANCHOR RULE: the master AI repo's museum session is the fleet's remote
# doorway — the ONLY way to restart stopped sessions from the phone is to
# drive that session and type `remote start <repo…>` (it runs this script on
# the Mac and opens the iTerm tabs). So `stop` NEVER kills the anchor — not
# via `all`, not even by name — unless --include-anchor is passed explicitly.
# If the anchor ever dies anyway (reboot, crash), recovery needs one action
# ON the Mac: open a terminal there (or Screen Sharing/SSH) and run
# `remote_fleet.sh start AI` — then the phone has its doorway back.
#
# Usage:
#   scripts/remote_fleet.sh status                  # who is live where, which profile
#   scripts/remote_fleet.sh start [all|core|name…]  # open museum session per repo (iTerm tabs)
#   scripts/remote_fleet.sh stop  [all|name…]       # stop MUSEUM sessions only (never your
#                                                   #   interactive claude/claude-tech shells;
#                                                   #   never the master-AI anchor session)
#   scripts/remote_fleet.sh stop --last-start       # stop ONLY the sessions the most recent
#                                                   #   'start' run actually launched (undo a
#                                                   #   start without touching already-live
#                                                   #   sessions; anchor rule still applies)
# Options:
#   --dry-run         print what would happen, do nothing
#   --max N           cap sessions started in one run (default 12 — RAM guard)
#   --profile P       config-dir suffix to launch with (default museum)
#   --include-anchor  allow `stop` to kill the master-AI anchor session too
#   --last-start      (stop only) target the repos recorded by the last real
#                     'start' run — ~/.myai-remote-fleet-last-start, machine-
#                     local, overwritten by every non-dry-run 'start'
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

DRY_RUN=false; MAX=12; PROFILE="museum"; INCLUDE_ANCHOR=false; LAST_START=false
LAST_START_FILE="$HOME/.myai-remote-fleet-last-start"
TARGETS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --max) shift; MAX="${1:-12}" ;;
    --profile) shift; PROFILE="${1:-museum}" ;;
    --include-anchor) INCLUDE_ANCHOR=true ;;
    --last-start) LAST_START=true ;;
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

# tree_state <repo> → "clean" | "residue" | "DIRTY"
# DIRTY = real mid-work: modified TRACKED files that are not framework
# propagation (AI/, .claude/, hooks/, CLAUDE/GEMINI/AGENTS.md), not ephemeral
# state caches, and not nested-git-repo pointers (a parent shows "M <subrepo>"
# whenever the sub-repo's content moves — that's the sub-repo's business).
# residue = only untracked files / framework noise (wrapped, safe to coexist).
tree_state() {
  local p="$1" line st path real=0 any=0
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    any=1
    st="${line:0:2}"; path="${line:3}"; path="${path%\"}"; path="${path#\"}"
    case "$st" in "??"*) continue ;; esac
    case "$path" in
      AI/*|.claude/*|hooks/*|CLAUDE.md|GEMINI.md|AGENTS.md) continue ;;
    esac
    [ -e "$p/$path/.git" ] && continue
    real=1; break
  done <<EOF
$(git -C "$p" status --porcelain 2>/dev/null)
EOF
  if [ "$real" = 1 ]; then echo "DIRTY"; elif [ "$any" = 1 ]; then echo "residue"; else echo "clean"; fi
}

tree_clean() { # 0 when no REAL mid-work (clean or residue) — the dual-session gate
  [ "$(tree_state "$1")" != "DIRTY" ]
}

# is_anchor <repo> → 0 when repo is the master AI repo (the fleet's remote
# doorway). Detected by signature, not by this script's own location — the
# script propagates into every managed repo's AI/, but only the MASTER has
# update_all.sh + managed_repos.txt at its repo ROOT.
is_anchor() {
  [ -f "$1/scripts/update_all.sh" ] && [ -f "$1/config/managed_repos.txt" ]
}

# ── status ────────────────────────────────────────────────────────────────────
do_status() {
  local procs p matches line pid prof
  procs="$(claude_procs)"
  echo "REMOTE FLEET — live claude sessions per fleet repo (profile $PROFILE = phone-drivable)"
  printf '%-22s %-10s %-8s %s\n' "REPO" "STATUS" "TREE" "SESSIONS"
  fleet_paths | while IFS= read -r p; do
    tree="$(tree_state "$p")"
    matches="$(procs_for_repo "$p" "$procs")"
    if [ -z "$matches" ]; then
      printf '%-22s %-10s %-8s %s\n' "$(basename "$p")" "-" "$tree" "none"
    else
      printf '%-22s %-10s %-8s ' "$(basename "$p")" "LIVE" "$tree"
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
  local procs started=0 skipped=0 p name matches cmd script_lines="" started_paths=""
  procs="$(claude_procs)"
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    name="$(basename "$p")"
    matches="$(procs_for_repo "$p" "$procs")"
    if [ -n "$(printf '%s\n' "$matches" | awk -F'|' -v pr="$PROFILE" '$3 == pr')" ]; then
      echo "  ↷ $name — $PROFILE remote session already live (skipped)"
      skipped=$((skipped + 1)); continue
    fi
    if [ -n "$matches" ]; then
      if tree_clean "$p"; then
        echo "  ⇉ $name — interactive session live but repo is CLEAN (wrapped up) → starting $PROFILE remote doorway alongside. Don't drive both at once."
      else
        echo "  ✋ $name — interactive session MID-WORK (uncommitted changes) — finish with 'wrap up' there, then re-run start (skipped)"
        skipped=$((skipped + 1)); continue
      fi
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
    started_paths="${started_paths}${p}
"
  done <<EOF
$(resolve_targets)
EOF
  if ! $DRY_RUN && [ -n "$script_lines" ]; then
    osascript -e "$script_lines
end tell" >/dev/null
  fi
  # record what THIS run launched (machine-local) so 'stop --last-start' can
  # undo exactly this start without touching sessions that were already live.
  if ! $DRY_RUN; then
    {
      echo "# repos started by the last 'remote_fleet.sh start' run on $(hostname -s)"
      printf '%s' "$started_paths"
    } > "$LAST_START_FILE"
  fi
  echo
  echo "started: $started  skipped(already live): $skipped  (~$((started * 350)) MB new RAM)"
  [ "$started" -gt 0 ] && ! $DRY_RUN && echo "Each new session auto-enables Remote Control (museum settings) → check the phone's Code list."
  return 0
}

# ── stop ──────────────────────────────────────────────────────────────────────
# stop_targets → the repo paths 'stop' should act on: the recorded last-start
# set (--last-start) or the usual all|core|name resolution.
stop_targets() {
  if $LAST_START; then
    if [ ! -s "$LAST_START_FILE" ]; then
      echo "✗ --last-start: no record at $LAST_START_FILE (no 'start' has run on this machine yet)" >&2
      return 0
    fi
    grep -vE '^\s*(#|$)' "$LAST_START_FILE" || {
      echo "  (last 'start' run launched nothing — nothing to stop)" >&2
      true
    }
  else
    resolve_targets
  fi
}

do_stop() {
  local procs p name stopped=0 pid prof
  procs="$(claude_procs)"
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    name="$(basename "$p")"
    if is_anchor "$p" && ! $INCLUDE_ANCHOR; then
      echo "  ⚓ $name — ANCHOR doorway (master AI repo), never stopped: it's the only phone-reachable session that can 'remote start' the others back (override: --include-anchor)"
      continue
    fi
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
$(stop_targets)
EOF
  return 0
}

case "$ACTION" in
  status) do_status ;;
  start)  do_start ;;
  stop)   do_stop ;;
  -h|--help|help) awk 'NR==1{next} /^# =+$/{if(++seen==2) exit; next} {sub(/^# ?/,""); print}' "$0" ;;
  *) echo "unknown action: $ACTION (status|start|stop)" >&2; exit 2 ;;
esac
