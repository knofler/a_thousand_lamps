#!/usr/bin/env bash
# statusline.sh — unified Claude Code status line for the whole fleet.
#
# Shows the context the native footer does NOT — so you never scroll to find it:
#   • account profile + model  ( e.g. "claude-tech · Opus 4.8 (1M context)" )
#   • repo / dir name          ( e.g. "📁 ai_management" )
#
# NOTE: we deliberately do NOT print the permission mode — Claude Code's native
# footer already shows "⏵⏵ bypass permissions on (shift+tab to cycle)", so
# repeating it here is redundant noise.
#
# Wiring: registered via .claude/settings.json -> "statusLine". Claude Code
# pipes the session JSON on stdin (model.display_name, workspace.*). Profile
# comes from $CLAUDE_CONFIG_DIR (inherited env; default ~/.claude => "claude").
#
# NO `set -e` — a failed probe must never blank the status line (see SONA
# pattern "Always use set +e in Claude Code hook scripts"). Colours are
# colour-blind-safe (blue/orange/yellow/cyan — no red/green reliance) to match
# the forced dark-daltonized theme.

input="$(cat 2>/dev/null)"
have_jq=0; command -v jq >/dev/null 2>&1 && have_jq=1

field() { # field <jq-path> -> value or empty (never errors)
  [ "$have_jq" = 1 ] || return 0
  printf '%s' "$input" | jq -r "$1 // empty" 2>/dev/null
}

model="$(field '.model.display_name')";   [ -n "$model" ] || model="?"
cwd="$(field '.workspace.current_dir')";  [ -n "$cwd" ]   || cwd="$(field '.cwd')"
pdir="$(field '.workspace.project_dir')"; [ -n "$pdir" ]  || pdir="$cwd"

# repo/dir name: prefer git repo name from the payload, else dir basename
repo="$(field '.workspace.repo.name')"
[ -n "$repo" ] || repo="$(basename "${pdir:-$PWD}" 2>/dev/null)"
[ -n "$repo" ] || repo="?"

# account profile from CLAUDE_CONFIG_DIR (inherited env); default => "claude"
prof="${CLAUDE_CONFIG_DIR:-}"
if [ -n "$prof" ]; then prof="$(basename "$prof")"; prof="${prof#.}"; else prof="claude"; fi

esc=$'\033'
R="${esc}[0m"; B="${esc}[1m"; D="${esc}[2m"
BLUE="${esc}[38;5;39m"; YEL="${esc}[38;5;220m"; CYAN="${esc}[38;5;45m"

printf '%s' "${CYAN}${prof}${R} ${D}·${R} ${YEL}${model}${R}  ${BLUE}${B}📁 ${repo}${R}"
