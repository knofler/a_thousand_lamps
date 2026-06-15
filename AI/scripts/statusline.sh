#!/usr/bin/env bash
# statusline.sh — unified Claude Code status line for the whole fleet.
#
# ALWAYS shows three things the user asked to never have to scroll for:
#   1. permission mode  ( ">> BYPASS PERMISSIONS ON" when active )
#   2. account profile + model  ( e.g. "claude-tech · Fable 5" )
#   3. repo / dir name  ( e.g. "📁 ai_management" )
#
# Wiring: registered via .claude/settings.json -> "statusLine". Claude Code
# pipes the session JSON on stdin (model.display_name, workspace.*). Permission
# mode is NOT on stdin, so we read it from the project's committed settings
# (the zero-prompt policy default). Profile comes from $CLAUDE_CONFIG_DIR
# (inherited env; default ~/.claude => "claude").
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

# permission mode from the project's committed settings (zero-prompt policy)
mode="default"
if [ "$have_jq" = 1 ] && [ -f "${pdir}/.claude/settings.json" ]; then
  m="$(jq -r '.permissions.defaultMode // empty' "${pdir}/.claude/settings.json" 2>/dev/null)"
  [ -n "$m" ] && mode="$m"
fi

esc=$'\033'
R="${esc}[0m"; B="${esc}[1m"; D="${esc}[2m"
ORANGE="${esc}[38;5;208m"; BLUE="${esc}[38;5;39m"; YEL="${esc}[38;5;220m"; CYAN="${esc}[38;5;45m"

if [ "$mode" = "bypassPermissions" ]; then
  perm="${ORANGE}${B}>> BYPASS PERMISSIONS ON${R}"
elif [ "$mode" = "acceptEdits" ]; then
  perm="${YEL}${B}>> accept-edits${R}"
else
  perm="${D}perms:${mode}${R}"
fi

printf '%s' "${perm}  ${CYAN}${prof}${R} ${D}·${R} ${YEL}${model}${R}  ${BLUE}${B}📁 ${repo}${R}"
